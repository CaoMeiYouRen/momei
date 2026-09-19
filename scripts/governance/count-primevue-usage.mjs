#!/usr/bin/env node

/**
 * PrimeVue 用量取数（迁移基线）。
 *
 * 用途：为 PrimeVue → caomei-ui 迁移提供**可重复执行**的现状基线，替代一次性人工统计。
 * 迁移方案 §3.4 要求「开工前在同一 commit 上重新取数」，该脚本即该动作的事实源入口。
 *
 * 口径：
 * - 组件开标签：`.vue` 内 `<Component` 计数，组件名取自 `data/primevue-components.json`；
 *   `(` 前一字须非标识符（排除 TS 泛型如 `ref<Tag[]>`），标签名后须为非标识符字符（含行尾）。
 * - 图标：`pi pi-[a-z0-9-]+`。
 * - token：`--p-[a-z0-9-]+`，其中 `var(--p-*)` 为实际引用口径。
 * - 排除目录：node_modules / .nuxt / .output / coverage / artifacts / logs / research-output /
 *   docs / test-results / playwright-report / .git / .github / dist / public。
 *
 * 用法：
 *   node scripts/governance/count-primevue-usage.mjs --output=artifacts/governance/primevue-usage-latest.json
 *   node scripts/governance/count-primevue-usage.mjs --write-components   # 升级 primevue 主版本后重新生成组件名清单
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const projectRoot = path.resolve(__dirname, '..', '..')
export const componentListPath = path.join(__dirname, 'data', 'primevue-components.json')

const EXCLUDED_DIRS = new Set([
    '.git',
    '.github',
    '.nuxt',
    '.output',
    'artifacts',
    'coverage',
    'dist',
    'docs',
    'logs',
    'node_modules',
    'playwright-report',
    'public',
    'research-output',
    'test-results',
])

const SCANNED_EXTENSIONS = new Set(['.css', '.scss', '.ts', '.vue'])

const TOKEN_PATTERN = /--p-[a-z0-9-]+/gu
const TOKEN_VAR_PATTERN = /var\(--p-[a-z0-9-]+\)/gu
const ICON_PATTERN = /pi pi-[a-z0-9-]+/gu
const PRIME_CLASS_PATTERN = /(?<![\w-])p-[a-z][a-z0-9-]*/gu
const PRIME_CLASS_SELECTOR_PATTERN = /\.p-[a-z][a-z0-9-]*/gu
const DEEP_PATTERN = /:deep\(/gu
const GLOBAL_PATTERN = /:global\(/gu
const BODY_SLOT_PATTERN = /#body\b/gu
const SLOT_PROPS_PATTERN = /\bslotProps\b/gu
const TOGGLE_PATTERN = /\.toggle\(/gu

/** 递归收集待扫描文件（返回相对 projectRoot 的 POSIX 路径）。 */
export async function collectFiles(rootDir = projectRoot) {
    const results = []

    async function walk(currentDir) {
        const entries = await readdir(currentDir, { withFileTypes: true })

        for (const entry of entries) {
            const absolutePath = path.join(currentDir, entry.name)
            const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join('/')

            if (entry.isDirectory()) {
                if (EXCLUDED_DIRS.has(entry.name)) {
                    continue
                }

                await walk(absolutePath)
                continue
            }

            if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) {
                results.push(relativePath)
            }
        }
    }

    await walk(rootDir)

    return results.sort()
}

/** 按正则统计命中总数与去重值。 */
export function countMatches(content, pattern) {
    const matches = content.match(pattern)

    if (!matches) {
        return { total: 0, unique: new Set() }
    }

    return {
        total: matches.length,
        unique: new Set(matches),
    }
}

/**
 * 统计 `.vue` 内的 PrimeVue 组件开标签。
 *
 * 使用 `(?<![\w$])<Name(?=[\s/>]|$)` 双重守卫：前一字非标识符（排除 TS 泛型与对象属性），
 * 后一字为空白 / `/` / `>` 或行尾（排除 `<DatatableX>` 这类更长名字的前缀误命中）。
 */
export function countComponentTags(content, componentNames) {
    const counts = new Map()

    for (const name of componentNames) {
        const pattern = new RegExp(`(?<![\\w$])<${name}(?=[\\s/>]|$)`, 'gu')
        const matches = content.match(pattern)

        if (matches) {
            counts.set(name, matches.length)
        }
    }

    return counts
}

function increment(map, key, delta = 1) {
    map.set(key, (map.get(key) ?? 0) + delta)
}

function topEntries(map, limit) {
    return [...map.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }))
}

/** 生成报告。 */
export async function buildReport(options = {}) {
    const root = options.projectRoot ?? projectRoot
    const files = await collectFiles(root)
    const componentList = JSON.parse(await readFile(options.componentListPath ?? componentListPath, 'utf8'))
    const componentNames = componentList.components ?? []

    const componentTags = new Map()
    const componentTagFiles = new Set()
    const iconFiles = new Set()
    const tokenFiles = new Set()
    const primeClassFiles = new Set()
    const primeClassCounts = new Map()
    const selectorStyleFiles = new Set()
    const selectorVueFiles = new Set()

    let componentTagsTotal = 0
    let iconTotal = 0
    let tokenTotal = 0
    let tokenVarTotal = 0
    let primeClassTotal = 0
    let primeClassSelectorTotal = 0
    let deepTotal = 0
    let globalTotal = 0
    let columnTagsTotal = 0
    let bodySlotTotal = 0
    let slotPropsTotal = 0
    let toggleTotal = 0

    const icons = new Set()
    const tokens = new Set()
    let vuemockFiles = 0
    const composableUsage = new Map()
    const composableUsageFiles = new Map()
    let e2eAssertionFiles = 0
    let e2eAssertionTotal = 0

    for (const relativePath of files) {
        const content = await readFile(path.join(root, relativePath), 'utf8')
        const isVue = relativePath.endsWith('.vue')
        const isStyle = relativePath.endsWith('.scss') || relativePath.endsWith('.css')

        if (isVue) {
            const tags = countComponentTags(content, componentNames)

            for (const [name, count] of tags) {
                increment(componentTags, name, count)
                componentTagsTotal += count
                componentTagFiles.add(relativePath)
            }
        }

        const iconStat = countMatches(content, ICON_PATTERN)
        if (iconStat.total > 0) {
            iconTotal += iconStat.total
            iconFiles.add(relativePath)
            for (const icon of iconStat.unique) {
                icons.add(icon)
            }
        }

        const tokenStat = countMatches(content, TOKEN_PATTERN)
        if (tokenStat.total > 0) {
            tokenTotal += tokenStat.total
            tokenFiles.add(relativePath)
            for (const token of tokenStat.unique) {
                tokens.add(token)
            }
        }

        tokenVarTotal += countMatches(content, TOKEN_VAR_PATTERN).total

        const primeClassStat = countMatches(content, PRIME_CLASS_PATTERN)
        if (primeClassStat.total > 0) {
            primeClassTotal += primeClassStat.total
            primeClassFiles.add(relativePath)
            for (const className of primeClassStat.unique) {
                increment(primeClassCounts, className)
            }
        }

        if (isStyle || isVue) {
            const selectorStat = countMatches(content, PRIME_CLASS_SELECTOR_PATTERN)
            if (selectorStat.total > 0) {
                primeClassSelectorTotal += selectorStat.total
                if (isStyle) {
                    selectorStyleFiles.add(relativePath)
                } else {
                    selectorVueFiles.add(relativePath)
                }
            }
        }

        deepTotal += countMatches(content, DEEP_PATTERN).total
        globalTotal += countMatches(content, GLOBAL_PATTERN).total

        if (isVue) {
            columnTagsTotal += countMatches(content, /(?<![\w$])<Column(?=[\s/>]|$)/gu).total
            bodySlotTotal += countMatches(content, BODY_SLOT_PATTERN).total
            slotPropsTotal += countMatches(content, SLOT_PROPS_PATTERN).total
        }

        toggleTotal += countMatches(content, TOGGLE_PATTERN).total

        if (/vi\.mock\(\s*['"]primevue\//u.test(content)) {
            vuemockFiles += 1
        }

        for (const composableName of ['useToast', 'useConfirm', 'useDialog']) {
            const usagePattern = new RegExp(`\\b${composableName}\\s*\\(`, 'gu')
            const usageStat = countMatches(content, usagePattern)

            if (usageStat.total > 0) {
                increment(composableUsage, composableName, usageStat.total)
                increment(composableUsageFiles, composableName)
            }
        }

        if (relativePath.includes('tests/e2e/')) {
            const assertionStat = countMatches(content, /\.p-[a-z][a-z0-9-]*/gu)
            if (assertionStat.total > 0) {
                e2eAssertionFiles += 1
                e2eAssertionTotal += assertionStat.total
            }
        }
    }

    const tokenPrefixes = new Map()
    for (const token of tokens) {
        const prefix = token.replace(/^--p-/u, '').split('-')[0]
        increment(tokenPrefixes, prefix)
    }

    return {
        generatedFrom: {
            componentList: {
                source: componentList.source,
                version: componentList.version,
                count: componentNames.length,
            },
            fileCount: files.length,
        },
        components: {
            kinds: componentTags.size,
            openTags: componentTagsTotal,
            files: componentTagFiles.size,
            top: topEntries(componentTags, 10),
        },
        icons: {
            total: iconTotal,
            files: iconFiles.size,
            unique: icons.size,
        },
        tokens: {
            total: tokenTotal,
            varReferences: tokenVarTotal,
            unique: tokens.size,
            files: tokenFiles.size,
            topPrefixes: topEntries(tokenPrefixes, 6),
        },
        primeVueClasses: {
            total: primeClassTotal,
            files: primeClassFiles.size,
            top: topEntries(primeClassCounts, 8),
            selectorTotal: primeClassSelectorTotal,
            selectorStyleFiles: selectorStyleFiles.size,
            selectorVueFiles: selectorVueFiles.size,
        },
        styleCoupling: {
            deepSelectors: deepTotal,
            globalSelectors: globalTotal,
        },
        dataTable: {
            columnTags: columnTagsTotal,
            bodySlots: bodySlotTotal,
            slotProps: slotPropsTotal,
        },
        commandApis: {
            anchorToggleCalls: toggleTotal,
            usage: [...composableUsage.entries()]
                .sort((left, right) => left[0].localeCompare(right[0]))
                .map(([name, count]) => ({ name, count, files: composableUsageFiles.get(name) ?? 0 })),
        },
        testCoupling: {
            vitestPrimeVueMockFiles: vuemockFiles,
            e2ePrimeClassAssertionFiles: e2eAssertionFiles,
            e2ePrimeClassAssertions: e2eAssertionTotal,
        },
    }
}

function renderMarkdown(report, outputRelativePath) {
    const lines = [
        '# PrimeVue 用量基线（自动生成）',
        '',
        `- 生成来源: \`${outputRelativePath}\` 的读取依据为 \`node scripts/governance/count-primevue-usage.mjs\``,
        `- 组件名清单: ${report.generatedFrom.componentList.source}@${report.generatedFrom.componentList.version}（${report.generatedFrom.componentList.count} 项）`,
        `- 扫描文件数: ${report.generatedFrom.fileCount}`,
        '',
        '## 迁移面',
        '',
        '| 指标 | 数值 |',
        '| :--- | ---: |',
        `| 组件种类 | ${report.components.kinds} |`,
        `| 组件开标签 | ${report.components.openTags} |`,
        `| 组件涉及文件 | ${report.components.files} |`,
        `| 图标 \`pi pi-*\` 处数 | ${report.icons.total} |`,
        `| 图标文件数 | ${report.icons.files} |`,
        `| 图标唯一数 | ${report.icons.unique} |`,
        `| token \`--p-*\` 处数 | ${report.tokens.total} |`,
        `| token \`var()\` 引用数 | ${report.tokens.varReferences} |`,
        `| token 唯一数 | ${report.tokens.unique} |`,
        `| token 文件数 | ${report.tokens.files} |`,
        `| PrimeVue class \`p-*\` 处数 | ${report.primeVueClasses.total} |`,
        `| PrimeVue class 文件数 | ${report.primeVueClasses.files} |`,
        `| \`.p-*\` 选择器处数 | ${report.primeVueClasses.selectorTotal} |`,
        `| 含 \`.p-*\` 选择器文件数（SCSS/CSS） | ${report.primeVueClasses.selectorStyleFiles} |`,
        `| 含 \`.p-*\` 选择器文件数（.vue） | ${report.primeVueClasses.selectorVueFiles} |`,
        `| \`:deep()\` 处数 | ${report.styleCoupling.deepSelectors} |`,
        `| \`:global()\` 处数 | ${report.styleCoupling.globalSelectors} |`,
        `| \`<Column>\` 处数 | ${report.dataTable.columnTags} |`,
        `| \`#body\` 处数 | ${report.dataTable.bodySlots} |`,
        `| \`slotProps\` 处数 | ${report.dataTable.slotProps} |`,
        `| \`.toggle()\` 锚点处数 | ${report.commandApis.anchorToggleCalls} |`,
        ...report.commandApis.usage.map(
            (entry) => `| \`${entry.name}\` 使用处数 / 文件数 | ${entry.count} / ${entry.files} |`,
        ),
        `| vitest PrimeVue mock 文件数 | ${report.testCoupling.vitestPrimeVueMockFiles} |`,
        `| E2E \`p-*\` 断言文件数 | ${report.testCoupling.e2ePrimeClassAssertionFiles} |`,
        `| E2E \`p-*\` 断言处数 | ${report.testCoupling.e2ePrimeClassAssertions} |`,
        '',
        '## Top 组件',
        '',
        ...report.components.top.map((entry) => `- ${entry.name}: ${entry.count}`),
        '',
        '## Top token 前缀',
        '',
        ...report.tokens.topPrefixes.map((entry) => `- ${entry.name}: ${entry.count}`),
        '',
        '## Top PrimeVue class',
        '',
        ...report.primeVueClasses.top.map((entry) => `- ${entry.name}: ${entry.count}`),
        '',
    ]

    return lines.join('\n')
}

/**
 * 解析 `@primevue/metadata`。
 *
 * 该包是 `@primevue/nuxt-module` 的传递依赖，在 pnpm 严格 node_modules 下通常不可直接 import，
 * 因此失败时回退到 `.pnpm` 目录定位，保证组件名清单可复现再生成。
 */
export async function resolvePrimeVueMetadata(root = projectRoot) {
    try {
        return await import('@primevue/metadata')
    } catch {
        const pnpmDir = path.join(root, 'node_modules', '.pnpm')
        const entries = await readdir(pnpmDir)
        const matchedDir = entries.find((entry) => entry.startsWith('@primevue+metadata@'))

        if (!matchedDir) {
            throw new Error('未能解析 @primevue/metadata，请确认 primevue 依赖已安装后再试')
        }

        const modulePath = path.join(pnpmDir, matchedDir, 'node_modules', '@primevue', 'metadata', 'index.mjs')

        return await import(pathToFileURL(modulePath).href)
    }
}

/**
 * 重新生成 `data/primevue-components.json`。
 *
 * 触发时机：升级 primevue 主版本后（组件清单会随版本变化）。
 * 用法：`pnpm governance:count:primevue-usage:components`。
 */
export async function writeComponentList(options = {}) {
    const root = options.projectRoot ?? projectRoot
    const targetPath = options.componentListPath ?? componentListPath
    const metadata = await resolvePrimeVueMetadata(root)
    const names = (metadata.components ?? []).map((component) => component.name).sort()
    const primeVueManifestPath = path.join(root, 'node_modules', 'primevue', 'package.json')
    const version = await readFile(primeVueManifestPath, 'utf8')
        .then((raw) => JSON.parse(raw).version)
        .catch(() => 'unknown')

    const payload = {
        source: '@primevue/metadata',
        version,
        description: 'PrimeVue 组件名清单，供 count-primevue-usage.mjs 识别组件开标签；升级 primevue 主版本后需重新生成（见 npm 入口 governance:count:primevue-usage:components）。',
        count: names.length,
        components: names,
    }

    await writeFile(targetPath, `${JSON.stringify(payload, null, 4)}\n`, 'utf8')

    return { count: names.length, targetPath, version }
}

export function resolvePaths(outputPath) {
    const absoluteOutputPath = path.isAbsolute(outputPath)
        ? outputPath
        : path.join(projectRoot, outputPath)

    return {
        absoluteOutputPath,
        markdownPath: absoluteOutputPath.replace(/\.json$/u, '.md'),
        relativeOutputPath: path.relative(projectRoot, absoluteOutputPath).split(path.sep).join('/'),
    }
}

export async function main(options = {}) {
    const argv = options.argv ?? process.argv
    const logger = options.logger ?? console

    const { output, writeComponents } = parseCliOptions(argv, {
        defaults: { output: 'artifacts/governance/primevue-usage-latest.json' },
        flags: { '--write-components': { key: 'writeComponents' } },
        values: { '--output': { key: 'output' } },
    })

    if (writeComponents) {
        const result = await writeComponentList()
        logger.info(
            `[primevue-usage] 组件名清单已重新生成: ${path.relative(projectRoot, result.targetPath).split(path.sep).join('/')}`
            + `（${result.count} 项，primevue@${result.version}）`,
        )
        return
    }

    if (!output) {
        throw new Error('缺少 --output 参数')
    }

    const report = await buildReport()
    const { absoluteOutputPath, markdownPath, relativeOutputPath } = resolvePaths(output)

    await mkdir(path.dirname(absoluteOutputPath), { recursive: true })
    await writeFile(absoluteOutputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    await writeFile(markdownPath, `${renderMarkdown(report, relativeOutputPath)}\n`, 'utf8')

    logger.info(`[primevue-usage] JSON: ${relativeOutputPath}`)
    logger.info(`[primevue-usage] Markdown: ${path.relative(projectRoot, markdownPath).split(path.sep).join('/')}`)
    logger.info(
        `[primevue-usage] 组件 ${report.components.kinds} 类 / ${report.components.openTags} 处；图标 ${report.icons.total} 处；token ${report.tokens.total} 处`,
    )
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
