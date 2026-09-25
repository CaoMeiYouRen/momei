import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const KB = 1024

/**
 * Nuxt 客户端 manifest 的实际产物路径。
 *
 * Nitro 会把它输出到 `virtual/` 目录；历史代码读取的 `chunks/build/client.precomputed.mjs` 已不存在，
 * 导致依赖它的路由 chunk 排除逻辑长期静默失效（catch 吞掉异常）。
 */
export const CLIENT_MANIFEST_RELATIVE_PATH = '.output/server/chunks/virtual/precomputed.mjs'

/**
 * 从 Nuxt 客户端 manifest 解析「入口启动载荷」的 JS 文件集合。
 *
 * 语义：`entrypoints` 登记的入口模块 + 该入口 `dependencies[entry].preload` 中被声明为 JS 的依赖，
 * 即访客启动应用时浏览器必须拉取的 JS。CSS 不计入（由 `keyCssGzipBytes` 单独度量）。
 *
 * 必须优先使用 manifest 而非文件名约定：Nuxt 产物入口名为 hash（如 `lYDoQxs6.js`），
 * 任何 `entry|app|index` 前缀匹配都会落空并退回不可靠的代理口径。
 *
 * @param {object} manifest 客户端 manifest（`precomputed.mjs` 的 default 导出）。
 * @returns {{ files: string[], strategy: string }} 去重后的入口 JS 文件名与所用口径标识。
 */
export function collectEntryPayloadFilesFromManifest(manifest) {
    const entryKeys = Array.isArray(manifest?.entrypoints) ? manifest.entrypoints : []
    const files = new Set()

    for (const entryKey of entryKeys) {
        const entryModule = manifest?.modules?.[entryKey]
        if (typeof entryModule?.file === 'string' && entryModule.file.endsWith('.js')) {
            files.add(entryModule.file)
        }

        const preload = manifest?.dependencies?.[entryKey]?.preload ?? {}
        for (const dependency of Object.values(preload)) {
            const file = dependency?.file
            if (typeof file === 'string' && file.endsWith('.js')) {
                files.add(file)
            }
        }
    }

    return {
        files: [...files].toSorted(),
        strategy: files.size > 0 ? 'manifest-entry-preload' : 'unavailable',
    }
}

/**
 * 包体预算（gzip 口径）。
 *
 * `keyCssGzipBytes` 曾于 PrimeVue → caomei-ui 迁移并存期临时放开至 85KB：`caomei-ui@0.1.0` 的
 * `styles.css` 是单一全量文件（167KB 原始 / 约 25.8KB gzip），无法按组件裁剪，叠加后实测
 * 59,795 → 75,110 字节。该增长属迁移方案「双库并存期」风险的预期代价。
 *
 * **配额已于 `caomei-ui@0.2.0` 重锚批次回落至 `70 * KB`**：0.2.0 移除单体 `styles.css`，改为
 * 基础层 `theme.css`（gzip ~1KB）+ 逐模块组件样式（未消费则由打包器 tree-shaking 丢弃、消费则随
 * 消费方 chunk 归属）。0.2.0 重锚时点零组件消费，实测 `keyCss` 回落至 60,684 字节（59.26KB），
 * 仅比迁移前 59,795 字节多出基础层约 0.87KB。当前消费面（B2 试点 5 族）的组件样式落路由 chunk，
 * 入口 CSS 只含基础层与全局 token 桥接；入口 / 全局壳消费组件时其样式计入 `keyCss`。0.2.0 与
 * 0.3.0 基础层字节一致，升级本身对指标贡献 0；现行 60,896 字节为 M3 桥接后既达值（较 M1b 期的
 * +212 系入口 CSS 侧净增量）。B4 卸载 PrimeVue 后只需确认未反弹。
 *
 * 依据与验收口径见 `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md`
 * 的「包体对比」章节（含并存期配额小节）。
 */
const BUDGETS = {
    // 入口启动载荷（manifest entrypoints + preload 的 JS，去重后）实测 336,333 B ≈ 328.5KB；
    // 原 260KB 从未真正生效（旧度量对象错误、检查恒真），故按实测重新定标并留约 10% 余量。
    coreEntryJsGzipBytes: 360 * KB,
    maxAsyncChunkJsGzipBytes: 130 * KB,
    keyCssGzipBytes: 70 * KB,
    prIncrementJsGzipBytes: 20 * KB,
}

function parseArgs(argv) {
    return parseCliOptions(argv, {
        defaults: {
            baseline: '.github/perf/bundle-baseline.json',
            mode: 'warn',
            output: '.lighthouseci/bundle-budget-report.json',
        },
        values: {
            '--baseline': { key: 'baseline' },
            '--mode': {
                key: 'mode',
                allowedValues: ['warn', 'error'],
                invalidMessage: (value) => `Unsupported mode: ${value}`,
            },
            '--output': { key: 'output' },
        },
    })
}

async function collectFiles(dir) {
    const result = []
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            result.push(...await collectFiles(fullPath))
            continue
        }
        if (!entry.isFile()) {
            continue
        }
        if (entry.name.endsWith('.map')) {
            continue
        }
        if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
            result.push(fullPath)
        }
    }
    return result
}

async function getGzipSize(filePath) {
    const content = await fs.readFile(filePath)
    return gzipSync(content, { level: 9 }).byteLength
}

function rel(filePath) {
    return filePath.replaceAll('\\', '/')
}

function toKBString(bytes) {
    return `${(bytes / KB).toFixed(2)}KB`
}

function isEntryLikeFile(filePath) {
    const name = path.basename(filePath)
    return /^(entry|app|index)\..+\.js$/i.test(name)
}

function isVendorChunk(filePath) {
    const name = path.basename(filePath)
    return /^vendor-[^.]+\..+\.js$/i.test(name)
}

function isRuntimeShellChunk(content) {
    return [
        'window.useNuxtApp||=',
        'builds/meta/${yn().app.buildId}.json',
        'versions:{get nuxt()',
    ].some((marker) => content.includes(marker))
}


/**
 * 读取并解析 Nuxt 客户端 manifest，返回入口启动载荷的 JS 文件名。
 *
 * manifest 缺失或结构不符时返回空集合（strategy 为 `unavailable`），交由调用方标记 skipped，
 * 绝不退化为无意义的代理口径。
 */
async function resolveManifestEntryPayload() {
    try {
        const manifestUrl = pathToFileURL(path.resolve(CLIENT_MANIFEST_RELATIVE_PATH)).href
        const manifest = (await import(manifestUrl)).default

        return collectEntryPayloadFilesFromManifest(manifest)
    } catch {
        return { files: [], strategy: 'unavailable' }
    }
}

function extractImportedJsFiles(content) {
    const imports = new Set()
    const patterns = [
        /from["'`]\.\/([^"'`]+\.js)["'`]/g,
        /import\(["'`]\.\/([^"'`]+\.js)["'`]/g,
        /import["'`]\.\/([^"'`]+\.js)["'`]/g,
    ]

    for (const pattern of patterns) {
        for (const match of content.matchAll(pattern)) {
            const importedFile = match[1]
            if (importedFile) {
                imports.add(importedFile)
            }
        }
    }

    return imports
}

function extractRouteChunkUsage(content) {
    const usage = new Map()
    const routeChunkPattern = /path:"([^"]+)"[^]*?import\("\.\/([^"]+\.js)"\)/g

    for (const match of content.matchAll(routeChunkPattern)) {
        const routePath = match[1]
        const chunkName = match[2]
        if (!routePath || !chunkName) {
            continue
        }

        const existing = usage.get(chunkName) ?? new Set()
        existing.add(routePath)
        usage.set(chunkName, existing)
    }

    return usage
}

function extractPrecomputedRouteChunkUsage(content) {
    const usage = new Map()
    const routeChunkPattern = /file:"([^"]+\.js)",name:"[^"]*",src:"(pages\/[^"]+\.vue)",isDynamicEntry:true/g

    for (const match of content.matchAll(routeChunkPattern)) {
        const chunkName = match[1]
        const sourcePath = match[2]
        if (!chunkName || !sourcePath) {
            continue
        }

        const routeOwner = sourcePath.startsWith('pages/admin/') ? '/admin' : '/public'
        const existing = usage.get(chunkName) ?? new Set()
        existing.add(routeOwner)
        usage.set(chunkName, existing)
    }

    return usage
}

function isAdminRoutePath(routePath) {
    return /^\/(?:[a-z]{2}-[A-Z]{2}\/)?admin(?:\/|$)/.test(routePath)
}

async function main() {
    const args = parseArgs(process.argv)
    const assetsDir = path.resolve('.output/public/_nuxt')

    try {
        await fs.access(assetsDir)
    } catch {
        throw new Error('Cannot find .output/public/_nuxt, please run `pnpm run build` first.')
    }

    const files = await collectFiles(assetsDir)
    const jsFiles = files.filter((f) => f.endsWith('.js'))
    const cssFiles = files.filter((f) => f.endsWith('.css'))

    const jsWithSize = await Promise.all(jsFiles.map(async (file) => {
        const content = await fs.readFile(file, 'utf8')

        return {
            file,
            content,
            gzipBytes: gzipSync(Buffer.from(content), { level: 9 }).byteLength,
        }
    }))

    const cssWithSize = await Promise.all(cssFiles.map(async (file) => ({
        file,
        gzipBytes: await getGzipSize(file),
    })))

    const entryCandidates = jsWithSize.filter((item) => isEntryLikeFile(item.file))

    const fileByName = new Map(jsWithSize.map((item) => [path.basename(item.file), item]))
    const importerMap = new Map(jsWithSize.map((item) => [item.file, new Set()]))
    const importGraph = new Map(jsWithSize.map((item) => [item.file, new Set()]))

    for (const item of jsWithSize) {
        for (const importedFileName of extractImportedJsFiles(item.content)) {
            const imported = fileByName.get(importedFileName)
            if (!imported) {
                continue
            }

            importGraph.get(item.file)?.add(imported.file)
            importerMap.get(imported.file)?.add(item.file)
        }
    }

    const runtimeShellFiles = new Set(jsWithSize
        .filter((item) => isRuntimeShellChunk(item.content))
        .map((item) => item.file))

    /*
     * 入口启动载荷的口径优先级：
     * 1. Nuxt 客户端 manifest 的 `entrypoints` + `preload`（权威：反映浏览器实际拉取内容）；
     * 2. 兜底：`entry|app|index` 命名产物（非 Nuxt 产物约定时可用）；
     * 3. 均不可用时置空，由上层把该检查标记为 skipped。
     *
     * 历史缺陷：此处曾回退为「gzip 体积最小的 3 个 chunk」，实测只量到 3 个 70 字节的运行时垫片，
     * 使 260KB 预算恒真。任何代理口径都必须能代表真实下载量，否则应显式不可用。
     */
    const manifestEntry = await resolveManifestEntryPayload()
    const manifestEntryItems = manifestEntry.files
        .map((fileName) => fileByName.get(fileName))
        .filter(Boolean)

    let entryFiles = []
    let entryStrategy = 'unavailable'
    if (manifestEntryItems.length > 0) {
        entryFiles = manifestEntryItems
        entryStrategy = manifestEntry.strategy
    } else if (entryCandidates.length > 0) {
        // 兜底口径：仅计入口命名产物本身（不含其导入闭包），范围窄于 manifest 口径。
        // 因此 `strategy` 必须随报告一同输出，供使用者判断该次数值的口径；不要把两者当作同一 metric 比较。
        entryFiles = entryCandidates
        entryStrategy = 'entry-app-index'
    }

    const entryFileSet = new Set(entryFiles.map((item) => item.file))

    const routeChunkUsage = new Map()
    for (const runtimeShellFile of runtimeShellFiles) {
        const runtimeShell = jsWithSize.find((item) => item.file === runtimeShellFile)
        if (!runtimeShell) {
            continue
        }

        for (const [chunkName, routePaths] of extractRouteChunkUsage(runtimeShell.content)) {
            const chunk = fileByName.get(chunkName)
            if (!chunk) {
                continue
            }

            const existing = routeChunkUsage.get(chunk.file) ?? new Set()
            routePaths.forEach((routePath) => existing.add(routePath))
            routeChunkUsage.set(chunk.file, existing)
        }
    }

    try {
        const clientPrecomputed = await fs.readFile(path.resolve(CLIENT_MANIFEST_RELATIVE_PATH), 'utf8')
        for (const [chunkName, routePaths] of extractPrecomputedRouteChunkUsage(clientPrecomputed)) {
            const chunk = fileByName.get(chunkName)
            if (!chunk) {
                continue
            }

            const existing = routeChunkUsage.get(chunk.file) ?? new Set()
            routePaths.forEach((routePath) => existing.add(routePath))
            routeChunkUsage.set(chunk.file, existing)
        }
    } catch {
        // 客户端 manifest 由 Nuxt 构建生成；缺失时回退为仅用运行时外壳推断路由归属。
    }

    const adminOnlyRouteChunks = new Set([...routeChunkUsage.entries()]
        .filter(([, routePaths]) => routePaths.size > 0 && [...routePaths].every((routePath) => isAdminRoutePath(routePath)))
        .map(([file]) => file))

    const routeOwners = new Map([...routeChunkUsage.entries()].map(([file, routePaths]) => [file, new Set(routePaths)]))
    let routeOwnersChanged = true
    while (routeOwnersChanged) {
        routeOwnersChanged = false

        for (const [importerFile, importedFiles] of importGraph.entries()) {
            const importerRoutes = routeOwners.get(importerFile)
            if (!importerRoutes || importerRoutes.size === 0) {
                continue
            }

            for (const importedFile of importedFiles) {
                const importedRoutes = routeOwners.get(importedFile) ?? new Set()
                const previousSize = importedRoutes.size
                importerRoutes.forEach((routePath) => importedRoutes.add(routePath))
                if (importedRoutes.size !== previousSize) {
                    routeOwners.set(importedFile, importedRoutes)
                    routeOwnersChanged = true
                }
            }
        }
    }

    const adminOnlyRelatedChunks = new Set([...routeOwners.entries()]
        .filter(([, routePaths]) => routePaths.size > 0 && [...routePaths].every((routePath) => isAdminRoutePath(routePath)))
        .map(([file]) => file))

    adminOnlyRouteChunks.forEach((file) => adminOnlyRelatedChunks.add(file))

    let adminImportClosureChanged = true
    while (adminImportClosureChanged) {
        adminImportClosureChanged = false

        for (const item of jsWithSize) {
            if (adminOnlyRelatedChunks.has(item.file)) {
                continue
            }

            const importers = importerMap.get(item.file)
            if (!importers || importers.size === 0) {
                continue
            }

            if ([...importers].every((importerFile) => adminOnlyRelatedChunks.has(importerFile) || adminOnlyRouteChunks.has(importerFile))) {
                adminOnlyRelatedChunks.add(item.file)
                adminImportClosureChanged = true
            }
        }
    }

    const sharedChunkFiles = new Set(jsWithSize
        .filter((item) => !entryFileSet.has(item.file) && !runtimeShellFiles.has(item.file) && !adminOnlyRelatedChunks.has(item.file) && (importerMap.get(item.file)?.size ?? 0) > 1)
        .map((item) => item.file))

    const coreEntryJsGzipBytes = entryFiles.length > 0
        ? entryFiles.reduce((sum, item) => sum + item.gzipBytes, 0)
        : null

    const asyncChunkCandidates = jsWithSize.filter((item) => !entryFileSet.has(item.file)
        && !isVendorChunk(item.file)
        && !runtimeShellFiles.has(item.file)
        && !sharedChunkFiles.has(item.file)
        && !adminOnlyRouteChunks.has(item.file)
        && !adminOnlyRelatedChunks.has(item.file))
    const maxAsyncChunkJs = asyncChunkCandidates.length > 0
        ? asyncChunkCandidates.reduce(
            (max, item) => item.gzipBytes > max.gzipBytes ? item : max,
            { file: '', gzipBytes: 0 },
        )
        : { file: '', gzipBytes: 0 }

    const keyCssCandidates = cssWithSize.filter((item) => /^(entry|app|index)\..+\.css$/i.exec(path.basename(item.file)))
    const keyCss = (keyCssCandidates.length > 0 ? keyCssCandidates : cssWithSize).reduce(
        (max, item) => item.gzipBytes > max.gzipBytes ? item : max,
        { file: '', gzipBytes: 0 },
    )

    let prIncrementJsGzipBytes = null
    let baselineUsed = false
    let baselineMessage = 'Baseline file not found, only collect current metrics in MVP phase.'

    try {
        const baselineContent = await fs.readFile(path.resolve(args.baseline), 'utf8')
        const baseline = JSON.parse(baselineContent)
        if (typeof baseline?.metrics?.coreEntryJsGzipBytes === 'number' && coreEntryJsGzipBytes !== null) {
            prIncrementJsGzipBytes = coreEntryJsGzipBytes - baseline.metrics.coreEntryJsGzipBytes
            baselineUsed = true
            baselineMessage = 'Baseline file loaded successfully.'
        }
    } catch {
        // MVP阶段允许没有baseline
    }

    const checks = [
        {
            key: 'coreEntryJsGzipBytes',
            expected: BUDGETS.coreEntryJsGzipBytes,
            actual: coreEntryJsGzipBytes,
            passed: coreEntryJsGzipBytes === null ? null : coreEntryJsGzipBytes <= BUDGETS.coreEntryJsGzipBytes,
            skipped: coreEntryJsGzipBytes === null,
            skipReason: coreEntryJsGzipBytes === null
                ? '未能识别入口启动载荷（客户端 manifest 不可用，且无 entry/app/index 命名产物）'
                : undefined,
        },
        {
            key: 'maxAsyncChunkJsGzipBytes',
            expected: BUDGETS.maxAsyncChunkJsGzipBytes,
            actual: maxAsyncChunkJs.gzipBytes,
            passed: maxAsyncChunkJs.gzipBytes <= BUDGETS.maxAsyncChunkJsGzipBytes,
            file: rel(path.relative(process.cwd(), maxAsyncChunkJs.file)),
        },
        {
            key: 'keyCssGzipBytes',
            expected: BUDGETS.keyCssGzipBytes,
            actual: keyCss.gzipBytes,
            passed: keyCss.gzipBytes <= BUDGETS.keyCssGzipBytes,
            file: rel(path.relative(process.cwd(), keyCss.file)),
        },
    ]

    if (prIncrementJsGzipBytes !== null) {
        checks.push({
            key: 'prIncrementJsGzipBytes',
            expected: BUDGETS.prIncrementJsGzipBytes,
            actual: prIncrementJsGzipBytes,
            passed: prIncrementJsGzipBytes <= BUDGETS.prIncrementJsGzipBytes,
        })
    }

    const failedChecks = checks.filter((check) => check.passed === false)
    const skippedChecks = checks.filter((check) => check.skipped === true)

    const report = {
        mode: args.mode,
        timestamp: new Date().toISOString(),
        baseline: {
            path: args.baseline,
            used: baselineUsed,
            message: baselineMessage,
        },
        budgets: BUDGETS,
        metrics: {
            coreEntryJsGzipBytes,
            maxAsyncChunkJsGzipBytes: maxAsyncChunkJs.gzipBytes,
            keyCssGzipBytes: keyCss.gzipBytes,
            prIncrementJsGzipBytes,
            entryCalculation: {
                strategy: entryStrategy,
                files: entryFiles.map((item) => ({
                    file: rel(path.relative(process.cwd(), item.file)),
                    gzipBytes: item.gzipBytes,
                })),
            },
            largestJsChunk: {
                file: rel(path.relative(process.cwd(), maxAsyncChunkJs.file)),
                gzipBytes: maxAsyncChunkJs.gzipBytes,
            },
            asyncChunkCalculation: {
                excludedVendorChunks: true,
                excludedRuntimeShellChunks: [...runtimeShellFiles].map((file) => rel(path.relative(process.cwd(), file))),
                excludedSharedChunks: [...sharedChunkFiles].map((file) => rel(path.relative(process.cwd(), file))),
                excludedAdminOnlyRouteChunks: [...adminOnlyRouteChunks].map((file) => rel(path.relative(process.cwd(), file))),
                excludedAdminOnlyRelatedChunks: [...adminOnlyRelatedChunks]
                    .filter((file) => !adminOnlyRouteChunks.has(file))
                    .map((file) => rel(path.relative(process.cwd(), file))),
                candidates: asyncChunkCandidates.length,
                entryPayloadFiles: entryFiles.map((item) => rel(path.relative(process.cwd(), item.file))),
            },
            largestKeyCss: {
                file: rel(path.relative(process.cwd(), keyCss.file)),
                gzipBytes: keyCss.gzipBytes,
            },
        },
        checks,
    }

    await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true })
    await fs.writeFile(path.resolve(args.output), JSON.stringify(report, null, 2), 'utf8')

    console.info('Bundle Budget Report (MVP):')
    console.info(coreEntryJsGzipBytes === null
        ? '- coreEntryJs: skipped (未能识别入口 chunk)'
        : `- coreEntryJs: ${toKBString(coreEntryJsGzipBytes)} / ${toKBString(BUDGETS.coreEntryJsGzipBytes)}`)
    console.info(`- maxAsyncChunkJs: ${toKBString(maxAsyncChunkJs.gzipBytes)} / ${toKBString(BUDGETS.maxAsyncChunkJsGzipBytes)} (${rel(path.relative(process.cwd(), maxAsyncChunkJs.file))})`)
    console.info(`- keyCss: ${toKBString(keyCss.gzipBytes)} / ${toKBString(BUDGETS.keyCssGzipBytes)} (${rel(path.relative(process.cwd(), keyCss.file))})`)
    if (prIncrementJsGzipBytes !== null) {
        console.info(`- prIncrementJs: ${toKBString(prIncrementJsGzipBytes)} / ${toKBString(BUDGETS.prIncrementJsGzipBytes)}`)
    } else if (coreEntryJsGzipBytes === null) {
        console.info('- prIncrementJs: skipped (入口启动载荷不可用)')
    } else {
        console.info(`- prIncrementJs: baseline missing (${args.baseline}), skip in MVP phase`)
    }

    if (skippedChecks.length > 0) {
        console.info('\nBudget checks skipped:')
        skippedChecks.forEach((check) => {
            console.info(`- ${check.key}: ${check.skipReason}`)
        })
    }

    if (failedChecks.length > 0) {
        console.warn('\nBudget checks with over-limit:')
        failedChecks.forEach((check) => {
            console.warn(`- ${check.key}: ${toKBString(check.actual)} > ${toKBString(check.expected)}`)
        })
        if (args.mode === 'error') {
            process.exit(1)
        }
    }

    /*
     * `mode=error`（`test:perf:budget:strict`，被阶段收口与发版前检查调用）下，
     * 「预算已登记但无法度量」必须计为失败：否则一旦产物结构或标记文案变化使入口识别失效，
     * 核心入口预算会在最需要守线的场景被静默放过。
     */
    if (skippedChecks.length > 0 && args.mode === 'error') {
        console.error('\nBudget checks could not be measured (treated as failure because mode=error):')
        skippedChecks.forEach((check) => {
            console.error(`- ${check.key}: ${check.skipReason}`)
        })
        process.exit(1)
    }

    /*
     * 非权威口径警示：兜底 `entry-app-index` 只计入口命名产物本身、不含其导入闭包，数值偏小。
     * 在 error 模式（阶段收口 / 发版前检查）下必须显式警示，避免以偏小口径「假通过」。
     */
    if (entryStrategy !== 'manifest-entry-preload' && args.mode === 'error') {
        console.error(`\n[bundle-budget] coreEntryJs 使用了非权威口径 \`${entryStrategy}\`，数值可能偏小，请核对产物结构。`)
    }
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(`[bundle-budget] ${error.message}`)
        process.exit(1)
    })
}
