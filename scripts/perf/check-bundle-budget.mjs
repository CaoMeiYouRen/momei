import { promises as fs } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { parseCliOptions } from '../shared/cli.mjs'

const KB = 1024

const BUDGETS = {
    coreEntryJsGzipBytes: 260 * KB,
    maxAsyncChunkJsGzipBytes: 120 * KB,
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

function extractImportedJsFiles(content) {
    const imports = new Set()
    const patterns = [
        /from["']\.\/([^"']+\.js)["']/g,
        /import\(["']\.\/([^"']+\.js)["']/g,
        /import["']\.\/([^"']+\.js)["']/g,
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

    const proxyCandidates = [...jsWithSize].sort((a, b) => a.gzipBytes - b.gzipBytes).slice(0, 3)
    const entryFiles = entryCandidates.length > 0 ? entryCandidates : proxyCandidates
    const entryFileSet = new Set(entryFiles.map((item) => item.file))

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

    const coreEntryJsGzipBytes = entryFiles.reduce((sum, item) => sum + item.gzipBytes, 0)

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
        if (typeof baseline?.metrics?.coreEntryJsGzipBytes === 'number') {
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
            passed: coreEntryJsGzipBytes <= BUDGETS.coreEntryJsGzipBytes,
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

    const failedChecks = checks.filter((check) => !check.passed)

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
                strategy: entryCandidates.length > 0 ? 'entry-app-index' : 'proxy-smallest-3-js',
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
                entryProxyFiles: entryFiles.map((item) => rel(path.relative(process.cwd(), item.file))),
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
    console.info(`- coreEntryJs: ${toKBString(coreEntryJsGzipBytes)} / ${toKBString(BUDGETS.coreEntryJsGzipBytes)}`)
    console.info(`- maxAsyncChunkJs: ${toKBString(maxAsyncChunkJs.gzipBytes)} / ${toKBString(BUDGETS.maxAsyncChunkJsGzipBytes)} (${rel(path.relative(process.cwd(), maxAsyncChunkJs.file))})`)
    console.info(`- keyCss: ${toKBString(keyCss.gzipBytes)} / ${toKBString(BUDGETS.keyCssGzipBytes)} (${rel(path.relative(process.cwd(), keyCss.file))})`)
    if (prIncrementJsGzipBytes !== null) {
        console.info(`- prIncrementJs: ${toKBString(prIncrementJsGzipBytes)} / ${toKBString(BUDGETS.prIncrementJsGzipBytes)}`)
    } else {
        console.info(`- prIncrementJs: baseline missing (${args.baseline}), skip in MVP phase`)
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
}

main().catch((error) => {
    console.error(`[bundle-budget] ${error.message}`)
    process.exit(1)
})
