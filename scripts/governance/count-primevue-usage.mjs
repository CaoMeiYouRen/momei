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
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
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
// `p-queue` 等 npm 包名与 PrimeVue class 同形，扫描时排除（当前仅 `p-queue` 为真实依赖，
// 若后续引入 `p-limit` 等同形包需同步排除）。
export const PRIME_CLASS_PATTERN = /(?<![\w-])p-(?!queue\b)[a-z][a-z0-9-]*/gu
export const PRIME_CLASS_SELECTOR_PATTERN = /\.p-[a-z][a-z0-9-]*/gu

/**
 * 剥离注释后再扫描 class / 选择器。
 *
 * 注释里回填「迁移前为 `p-dialog`」这类说明是正常文档行为，不应算残留；
 * 与 `tests/modules/overlay-family-residual-guard.test.ts` 的剥离口径一致（HTML / 块 / 整行 `//`）。
 */
export function stripCommentsForClassScan(content) {
    return stripHtmlComments(content)
        .replace(/\/\*[\s\S]*?\*\//gu, '')
        .replace(/^\s*\/\/.*$/gmu, '')
}
const DEEP_PATTERN = /:deep\(/gu
const GLOBAL_PATTERN = /:global\(/gu
const BODY_SLOT_PATTERN = /#body\b/gu
const SLOT_PROPS_PATTERN = /\bslotProps\b/gu
const TOGGLE_PATTERN = /\.toggle\(/gu
const TOAST_PATTERN = /\buseToast\s*\(/gu
const CONFIRM_PATTERN = /\buseConfirm\s*\(/gu
const TOOLTIP_PATTERN = /v-tooltip(?=[.:=\s>])/gu
const CAOMEI_IMPORT_PATTERN = /import\s*\{[^}]*\}\s*from\s*['"]caomei-ui['"]/gu
const PRIMEVUE_IMPORT_PATTERN = /from\s*['"]primevue(?:\/[^'"]*)?['"]/u

/**
 * 浮层族（第六十九阶段条目 2 的迁移边界）。
 *
 * 该常量把「浮层族」从散落在 todo / 迁移方案里的口径收拢为可执行分组：
 * 组件标签（含 momei 自有共享壳 `ConfirmDeleteDialog`）、服务层与指令。
 * 组件名同时用于 `countComponentTags`；`ConfirmDeleteDialog` 不在 PrimeVue 组件名清单内，
 * 但它是浮层族的共享壳，必须计入迁移面。
 */
export const OVERLAY_FAMILY = {
    components: ['Dialog', 'Drawer', 'Popover', 'DropdownMenu', 'Menu', 'ConfirmDialog', 'ConfirmDeleteDialog'],
    primeVueComponents: ['Dialog', 'Drawer', 'Popover', 'DropdownMenu', 'Menu', 'ConfirmDialog'],
    appComponents: ['ConfirmDeleteDialog'],
    composables: ['useToast', 'useConfirm'],
    directives: ['v-tooltip'],
}

/** 生产文件口径（浮层族并集按此统计：排除单测 / E2E 与 `tests/` 目录）。 */
export function isProductionFile(relativePath) {
    return !relativePath.startsWith('tests/')
        && !relativePath.endsWith('.test.ts')
        && !relativePath.endsWith('.test.js')
        && !relativePath.endsWith('.spec.ts')
        && !relativePath.endsWith('.spec.js')
}

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
 * 去除 HTML 注释，并保证输出不再残留注释分隔符。
 *
 * 单次 `replace(/<!--[\s\S]*?--!?>/g, '')` 可能因嵌套 / 不完整注释重新拼出 `<!--`，
 * 属 CodeQL js/incomplete-multi-character-sanitization（CWE-20/80/116）场景。
 * 先循环移除完整注释，再循环移除残余分隔符 token，直到稳定。
 */
export function stripHtmlComments(input) {
    let output = input
    let previous

    do {
        previous = output
        output = output.replace(/<!--[\s\S]*?--!?>/gu, '')
    } while (output !== previous)

    do {
        previous = output
        output = output.replace(/<!--|--!?>/gu, '')
    } while (output !== previous)

    return output
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

/**
 * 判定 composable 的导入来源：`caomei-ui` 显式导入 / `primevue` 显式导入 / 自动导入。
 *
 * 迁移期这三态分别代表「已迁移」「显式引入 PrimeVue」「依赖 PrimeVue 自动导入」；
 * 浮层族收尾要求前两态之外的 `auto` 归零，且 `primevue` 仅可能出现在测试桩或过渡组件中。
 */
export function resolveComposableOrigin(content, name) {
    const caomeiImportBlocks = content.match(CAOMEI_IMPORT_PATTERN) ?? []
    const namedBinding = new RegExp(`\\b${name}\\b`, 'u')

    if (caomeiImportBlocks.some((block) => namedBinding.test(block))) {
        return 'caomei-ui'
    }

    const primeVueImport = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"]primevue`, 'u')
    if (primeVueImport.test(content)) {
        return 'primevue'
    }

    return 'auto'
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

    const overlayTagCounts = new Map()
    const overlayTagFiles = new Map()
    const overlayServiceCalls = new Map()
    const overlayServiceFiles = new Map()
    const overlayServiceOrigins = new Map()
    const overlayTooltipFiles = new Set()
    const overlayToggleFiles = new Set()
    const overlayProductionFiles = new Set()
    const overlayTestFiles = new Set()
    const overlayFileParts = new Map()
    let overlayTooltipTotal = 0
    let overlayToggleTotal = 0

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

        const isProduction = isProductionFile(relativePath)
        const overlayParts = new Set()
        const overlayTags = isVue ? countComponentTags(content, OVERLAY_FAMILY.components) : new Map()
        const serviceHits = []
        // 指令只存在于模板；注释里的同名提及不是调用点，回填「已迁完」注释时不应改变归零口径。
        // 剥离类别与 `tests/modules/overlay-family-residual-guard.test.ts` 的 `stripComments` 相同（HTML / 块 / 整行 `//`）；HTML 注释在本文件按不动点循环处理（CodeQL #46 为 test-only observe）。
        // HTML 注释闭合符同时接受 `-->` 与 HTML5 的 `--!>`；完整注释与残余分隔符都由 `stripHtmlComments` 循环清除。
        const directiveSource = stripHtmlComments(content)
            .replace(/\/\*[\s\S]*?\*\//gu, '')
            .replace(/^\s*\/\/.*$/gmu, '')
        const tooltipStat = countMatches(directiveSource, TOOLTIP_PATTERN)
        const toggleStat = countMatches(content, TOGGLE_PATTERN)

        for (const [name] of overlayTags) {
            overlayParts.add(name)
        }

        for (const [name, pattern] of [['useToast', TOAST_PATTERN], ['useConfirm', CONFIRM_PATTERN]]) {
            const stat = countMatches(content, pattern)

            if (stat.total > 0) {
                serviceHits.push({ name, total: stat.total })
                overlayParts.add(name)
            }
        }

        if (tooltipStat.total > 0) {
            overlayParts.add('v-tooltip')
        }

        if (toggleStat.total > 0) {
            overlayParts.add('.toggle()')
        }

        if (overlayParts.size > 0) {
            if (isProduction) {
                for (const [name, count] of overlayTags) {
                    increment(overlayTagCounts, name, count)

                    if (!overlayTagFiles.has(name)) {
                        overlayTagFiles.set(name, new Set())
                    }

                    overlayTagFiles.get(name).add(relativePath)
                }

                for (const { name, total } of serviceHits) {
                    increment(overlayServiceCalls, name, total)

                    if (!overlayServiceFiles.has(name)) {
                        overlayServiceFiles.set(name, new Set())
                    }

                    overlayServiceFiles.get(name).add(relativePath)

                    const origin = resolveComposableOrigin(content, name)
                    if (!overlayServiceOrigins.has(origin)) {
                        overlayServiceOrigins.set(origin, new Map())
                    }

                    increment(overlayServiceOrigins.get(origin), name, total)
                }

                if (tooltipStat.total > 0) {
                    overlayTooltipTotal += tooltipStat.total
                    overlayTooltipFiles.add(relativePath)
                }

                if (toggleStat.total > 0) {
                    overlayToggleTotal += toggleStat.total
                    overlayToggleFiles.add(relativePath)
                }

                overlayProductionFiles.add(relativePath)
                overlayFileParts.set(relativePath, overlayParts)
            } else {
                overlayTestFiles.add(relativePath)
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

        // 生产口径：PrimeVue 卸载后 `p-*` class 的残留判定与零残留守卫同口径，
        // 单测里的旧类名 fixture（计数脚本自身输入）不计入统计。
        const classScanSource = isProduction ? stripCommentsForClassScan(content) : ''
        const primeClassStat = isProduction ? countMatches(classScanSource, PRIME_CLASS_PATTERN) : { total: 0, unique: [] }
        if (primeClassStat.total > 0) {
            primeClassTotal += primeClassStat.total
            primeClassFiles.add(relativePath)
            for (const className of primeClassStat.unique) {
                increment(primeClassCounts, className)
            }
        }

        if (isProduction && (isStyle || isVue)) {
            const selectorStat = countMatches(classScanSource, PRIME_CLASS_SELECTOR_PATTERN)
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

    const overlayTagFileUnion = new Set([...overlayTagFiles.values()].flatMap((files) => [...files]))
    const overlayTagTotal = [...overlayTagCounts.values()].reduce((total, count) => total + count, 0)

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
        overlayFamily: {
            components: OVERLAY_FAMILY,
            tags: {
                total: overlayTagTotal,
                files: overlayTagFileUnion.size,
                byComponent: [...overlayTagCounts.entries()]
                    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
                    .map(([name, count]) => ({ name, count, files: overlayTagFiles.get(name)?.size ?? 0 })),
            },
            services: {
                byName: [...overlayServiceCalls.entries()]
                    .sort((left, right) => left[0].localeCompare(right[0]))
                    .map(([name, count]) => ({ name, count, files: overlayServiceFiles.get(name)?.size ?? 0 })),
                origins: [...overlayServiceOrigins.entries()]
                    .sort((left, right) => left[0].localeCompare(right[0]))
                    .map(([origin, byName]) => ({
                        origin,
                        total: [...byName.values()].reduce((total, count) => total + count, 0),
                        byName: [...byName.entries()]
                            .sort((left, right) => left[0].localeCompare(right[0]))
                            .map(([name, count]) => ({ name, count })),
                    })),
            },
            directives: {
                tooltip: { total: overlayTooltipTotal, files: overlayTooltipFiles.size },
            },
            anchors: {
                toggleCalls: overlayToggleTotal,
                files: overlayToggleFiles.size,
            },
            productionFiles: overlayProductionFiles.size,
            testFiles: overlayTestFiles.size,
            fileParts: [...overlayFileParts.entries()]
                .map(([file, parts]) => ({ file, parts: [...parts].sort() }))
                .sort((left, right) => right.parts.length - left.parts.length || left.file.localeCompare(right.file)),
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
        `| PrimeVue class \`p-*\` 处数（生产口径，剥离注释） | ${report.primeVueClasses.total} |`,
        `| PrimeVue class 文件数（生产口径） | ${report.primeVueClasses.files} |`,
        `| \`.p-*\` 选择器处数（生产口径） | ${report.primeVueClasses.selectorTotal} |`,
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
        '## 浮层族（第六十九阶段条目 2 口径）',
        '',
        '| 成员 | 开标签 / 调用 | 文件数 |',
        '| :--- | ---: | ---: |',
        ...report.overlayFamily.tags.byComponent.map(
            (entry) => `| \`<${entry.name}>\` | ${entry.count} | ${entry.files} |`,
        ),
        `| **组件标签小计** | **${report.overlayFamily.tags.total}** | **${report.overlayFamily.tags.files}** |`,
        ...report.overlayFamily.services.byName.map(
            (entry) => `| \`${entry.name}()\` | ${entry.count} | ${entry.files} |`,
        ),
        `| \`v-tooltip\` | ${report.overlayFamily.directives.tooltip.total} | ${report.overlayFamily.directives.tooltip.files} |`,
        `| \`.toggle()\` | ${report.overlayFamily.anchors.toggleCalls} | ${report.overlayFamily.anchors.files} |`,
        `| **生产文件并集** | - | **${report.overlayFamily.productionFiles}** |`,
        `| 测试文件（不计入并集） | - | ${report.overlayFamily.testFiles} |`,
        '',
        '### 服务层导入来源',
        '',
        ...report.overlayFamily.services.origins.map(
            (entry) => `- \`${entry.origin}\`: ${entry.total}（${entry.byName.map((item) => `${item.name} ${item.count}`).join(' / ')}）`,
        ),
        '',
        '### Top 浮层族文件',
        '',
        '| 文件 | 命中项 |',
        '| :--- | :--- |',
        ...report.overlayFamily.fileParts.slice(0, 30).map(
            (entry) => `| \`${entry.file}\` | ${entry.parts.join(', ')} |`,
        ),
        '',
    ]

    return lines.join('\n')
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

    const { output } = parseCliOptions(argv, {
        defaults: { output: 'artifacts/governance/primevue-usage-latest.json' },
        values: { '--output': { key: 'output' } },
    })

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
    logger.info(
        `[primevue-usage] 浮层族：标签 ${report.overlayFamily.tags.total} 处 / ${report.overlayFamily.tags.files} 文件；生产文件并集 ${report.overlayFamily.productionFiles}`,
    )
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
