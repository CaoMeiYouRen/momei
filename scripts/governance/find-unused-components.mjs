import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_OUTPUT_PATH = 'artifacts/governance/unused-components-latest.json'
export const DEFAULT_ALLOWLIST_PATH = 'scripts/governance/data/unused-components-allowlist.json'

/**
 * 组件定义面：只扫 `components/**\/*.vue`。`components/*.test.ts` 是测试文件，不算定义。
 */
export const DEFAULT_COMPONENT_ROOT = 'components'

/**
 * 引用面：应用代码与测试。`docs/` 与 `artifacts/` 只做叙述与产物，出现组件名不代表被引用，
 * 若纳入会掩盖真实零引用；`scripts/` 只做治理扫描，同样不计入引用面。
 */
export const DEFAULT_REFERENCE_ROOTS = [
    'app.vue',
    'app.config.ts',
    'error.vue',
    'nuxt.config.ts',
    'components',
    'composables',
    'i18n',
    'layouts',
    'middleware',
    'modules',
    'pages',
    'plugins',
    'server',
    'stores',
    'tests',
    'types',
    'utils',
]

export const REFERENCE_FILE_EXTENSIONS = new Set(['.vue', '.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.tsx', '.jsx'])
export const COMPONENT_FILE_EXTENSIONS = new Set(['.vue'])

/** 生成物与依赖目录不参与扫描。 */
const SKIPPED_DIRECTORY_NAMES = new Set(['.nuxt', '.output', 'dist', 'node_modules', 'coverage'])

const PASCAL_TOKEN_PATTERN = /[A-Z][A-Za-z0-9]*/gu
const CAMEL_TOKEN_PATTERN = /[a-z][A-Za-z0-9]*/gu
const KEBAB_TOKEN_PATTERN = /[a-z0-9]+(?:-[a-z0-9]+)+/gu

/**
 * @typedef {object} UnusedComponentAllowlistEntry
 * @property {string} [component] 精确组件路径
 * @property {string} [pattern] 通配模式（`*` 匹配单层、`**` 匹配多层）
 * @property {string|null} [reason] 登记理由
 */

/**
 * @typedef {object} UnusedComponentReference
 * @property {string} filePath
 * @property {'name'|'path'} kind
 */

/**
 * @typedef {object} UnusedComponentRecord
 * @property {string} component
 * @property {string|null} pascalName
 * @property {string|null} kebabName
 */

/**
 * @typedef {object} UnusedComponentReport
 * @property {string} generatedAt
 * @property {string[]} scanRoots
 * @property {number} scannedComponentCount
 * @property {number} unusedCount
 * @property {number} allowlistedCount
 * @property {number} unregisteredCount
 * @property {(UnusedComponentRecord & {references: {appCount: number, testCount: number, totalCount: number, sample: string[]}})[]} unregistered
 * @property {(UnusedComponentRecord & {matchedRule: string|null, reason: string|null})[]} allowlisted
 * @property {number} referenceCoverage
 * @property {string|null} [allowlistPath]
 * @property {number} [sourceFileCount]
 */

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            mode: 'report',
            output: DEFAULT_OUTPUT_PATH,
            allowlist: DEFAULT_ALLOWLIST_PATH,
            components: DEFAULT_COMPONENT_ROOT,
        },
        values: {
            '--mode': {
                key: 'mode',
                allowedValues: ['report', 'error'],
                invalidMessage: (value) => `[unused-components] 不支持的模式: ${value}，请使用 report 或 error`,
            },
            '--output': { key: 'output' },
            '--allowlist': { key: 'allowlist' },
            '--components': { key: 'components' },
        },
    })
}

export function toPosixPath(targetPath, projectRoot = repoRoot) {
    const relativePath = path.relative(projectRoot, targetPath).replaceAll('\\', '/')

    return relativePath || '.'
}

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

function shouldSkipEntry(entryName) {
    return SKIPPED_DIRECTORY_NAMES.has(entryName)
}

async function collectFiles(targetPath, extensions, projectRoot = repoRoot) {
    if (!(await pathExists(targetPath))) {
        return []
    }

    try {
        const stats = await stat(targetPath)

        if (stats.isFile()) {
            return extensions.has(path.extname(targetPath)) && !shouldSkipEntry(path.basename(targetPath))
                ? [targetPath]
                : []
        }
    } catch {
        return []
    }

    const entries = await readdir(targetPath, { withFileTypes: true })
    const files = []

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        if (shouldSkipEntry(entry.name)) {
            continue
        }

        const absolutePath = path.join(targetPath, entry.name)

        if (entry.isDirectory()) {
            files.push(...await collectFiles(absolutePath, extensions, projectRoot))
            continue
        }

        if (entry.isFile() && extensions.has(path.extname(entry.name))) {
            files.push(absolutePath)
        }
    }

    return files
}

function toPascalCase(word) {
    return word
        .split(/[^A-Za-z0-9]+/u)
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join('')
}

/**
 * 由组件文件路径推导可被解析到的引用名。
 *
 * Nuxt 默认按目录前缀命名，`components/admin/posts/foo-bar.vue` 既能以
 * `<AdminPostsFooBar />` 使用，也能被显式导入后以 `<FooBar />` 使用；
 * `.client` / `.server` / `.global` 等点号后缀不参与命名。
 */
export function componentNameCandidates(relativePath) {
    const normalized = relativePath.replaceAll('\\', '/')
    const withoutExtension = normalized.replace(/\.vue$/u, '')
    const segments = withoutExtension.split('/').filter(Boolean)
    const componentSegments = segments[0] === DEFAULT_COMPONENT_ROOT ? segments.slice(1) : segments

    if (componentSegments.length === 0) {
        return null
    }

    const nameSegments = componentSegments.map((segment, index) => {
        const withoutSuffix = index === componentSegments.length - 1 ? segment.replace(/(\.[^.]+)+$/u, '') : segment

        return withoutSuffix.toLowerCase()
    })

    const pascalName = nameSegments.map(toPascalCase).join('')

    if (!pascalName) {
        return null
    }

    const shortSegment = nameSegments[nameSegments.length - 1]
    const shortPascalName = toPascalCase(shortSegment)

    return {
        kebabName: nameSegments.join('-'),
        pascalName,
        shortKebabName: shortSegment,
        shortPascalName,
    }
}

/**
 * 把源码里的候选引用归一为两类 token，供与组件名做集合相交。
 *
 * - PascalCase token 以「小写化」参与匹配，可覆盖 `PascalCase` / `camelCase` 两种写法；
 * - kebab-case token 直接匹配模板标签与 CSS 类名（同名前缀视为引用，宁可漏报不可误报）。
 */
export function collectReferenceTokens(content) {
    const pascalTokens = new Set()
    const kebabTokens = new Set()

    for (const match of content.matchAll(PASCAL_TOKEN_PATTERN)) {
        pascalTokens.add(match[0].toLowerCase())
    }

    for (const match of content.matchAll(CAMEL_TOKEN_PATTERN)) {
        pascalTokens.add(match[0].toLowerCase())
    }

    for (const match of content.matchAll(KEBAB_TOKEN_PATTERN)) {
        kebabTokens.add(match[0])
    }

    return { kebabTokens, pascalTokens }
}

/**
 * @param {Map<string, any[]>} index
 * @param {string} key
 * @param {any} entry
 */
function registerName(index, key, entry) {
    if (!key) {
        return
    }

    const bucket = index.get(key)

    if (bucket) {
        bucket.push(entry)

        return
    }

    index.set(key, [entry])
}

/**
 * 构建「可解析名 → 组件」索引；短名与 `Lazy` 前缀写法都会命中同一组件，
 * 避免显式导入后使用短名或 `<LazyFoo />` 时被误判为零引用。
 */
/**
 * @param {{filePath: string}[]} components
 */
export function buildComponentIndex(components) {
    const pascalIndex = new Map()
    const kebabIndex = new Map()

    for (const component of components) {
        const candidates = componentNameCandidates(component.filePath)

        if (!candidates) {
            continue
        }

        const entry = { component, ...candidates }

        for (const name of new Set([candidates.pascalName, candidates.shortPascalName, `Lazy${candidates.pascalName}`, `Lazy${candidates.shortPascalName}`])) {
            registerName(pascalIndex, name.toLowerCase(), entry)
        }

        for (const name of new Set([candidates.kebabName, candidates.shortKebabName, `lazy-${candidates.kebabName}`, `lazy-${candidates.shortKebabName}`])) {
            registerName(kebabIndex, name, entry)
        }
    }

    return { kebabIndex, pascalIndex }
}

function isTestFile(relativePath) {
    return /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(relativePath) || relativePath.startsWith('tests/')
}

/**
 * 零引用判定：组件的任一候选名（或组件文件路径）在自身文件之外被引用即为「已引用」。
 */
/**
 * @param {{ components: {filePath: string}[], sources: {content: string, filePath: string, tokens: {kebabTokens: Set<string>, pascalTokens: Set<string>}}[], projectRoot?: string }} options
 * @returns {Map<string, UnusedComponentReference[]>}
 */
export function findComponentReferences({ components, sources, projectRoot = repoRoot }) {
    const { kebabIndex, pascalIndex } = buildComponentIndex(components)
    const references = new Map()

    for (const component of components) {
        references.set(component.filePath, [])
    }

    for (const source of sources) {
        const sourcePath = source.filePath
        const tokens = source.tokens
        const touched = new Set()

        for (const token of tokens.pascalTokens) {
            for (const entry of pascalIndex.get(token) ?? []) {
                touched.add(`${entry.component.filePath}\u0000${sourcePath}`)
            }
        }

        for (const token of tokens.kebabTokens) {
            for (const entry of kebabIndex.get(token) ?? []) {
                touched.add(`${entry.component.filePath}\u0000${sourcePath}`)
            }
        }

        for (const component of components) {
            if (sourcePath === component.filePath) {
                continue
            }

            if (source.content.includes(component.filePath)) {
                const bucket = references.get(component.filePath)

                if (!bucket.some((item) => item.filePath === sourcePath)) {
                    bucket.push({ filePath: sourcePath, kind: 'path' })
                }
            }
        }

        for (const key of touched) {
            const [componentPath, referencePath] = key.split('\u0000')

            if (componentPath === referencePath) {
                continue
            }

            const bucket = references.get(componentPath)

            if (!bucket.some((item) => item.filePath === referencePath)) {
                bucket.push({ filePath: referencePath, kind: 'name' })
            }
        }
    }

    return references
}

/**
 * @param {string} componentPath
 * @param {UnusedComponentAllowlistEntry|string|null|undefined} entry
 */
export function matchesAllowlistEntry(componentPath, entry) {
    if (!entry) {
        return false
    }

    if (typeof entry === 'string') {
        return entry === componentPath
    }

    if (entry.component === componentPath) {
        return true
    }

    if (!entry.pattern) {
        return false
    }

    const pattern = String(entry.pattern)
        .replaceAll('.', '\\.')
        .replaceAll('**', '\u0000')
        .replaceAll('*', '[^/]*')
        .replaceAll('\u0000', '.*')

    return new RegExp(`^${pattern}$`, 'u').test(componentPath)
}

/**
 * @param {(UnusedComponentAllowlistEntry|string|null)[]|{entries?: (UnusedComponentAllowlistEntry|string|null)[]}|null|undefined} rawAllowlist
 * @returns {UnusedComponentAllowlistEntry[]}
 */
export function normalizeAllowlist(rawAllowlist) {
    if (!rawAllowlist) {
        return []
    }

    const entries = Array.isArray(rawAllowlist) ? rawAllowlist : rawAllowlist.entries

    if (!Array.isArray(entries)) {
        return []
    }

    return entries
        .map((entry) => {
            if (typeof entry === 'string') {
                return { component: entry, reason: null }
            }

            if (!entry || typeof entry !== 'object') {
                return null
            }

            return {
                component: entry.component ?? null,
                pattern: entry.pattern ?? null,
                reason: entry.reason ?? null,
            }
        })
        .filter((entry) => entry && (entry.component || entry.pattern))
}

/**
 * @param {UnusedComponentReference[]} referenceList
 * @param {string} projectRoot
 */
function describeReferences(referenceList, projectRoot = repoRoot) {
    const appReferences = referenceList.filter((item) => !isTestFile(toPosixPath(item.filePath, projectRoot)))
    const testReferences = referenceList.filter((item) => isTestFile(toPosixPath(item.filePath, projectRoot)))

    return {
        appCount: appReferences.length,
        testCount: testReferences.length,
        totalCount: referenceList.length,
        sample: referenceList.slice(0, 5).map((item) => toPosixPath(item.filePath, projectRoot)),
    }
}

/**
 * @param {{ allowlist?: UnusedComponentAllowlistEntry[]|null, components: {filePath: string}[], projectRoot?: string, references: Map<string, UnusedComponentReference[]>, scanRoots: string[] }} options
 * @returns {UnusedComponentReport}
 */
export function buildUnusedComponentReport({ allowlist = [], components, projectRoot = repoRoot, references, scanRoots }) {
    const allowlistEntries = normalizeAllowlist(allowlist)
    const unregistered = []
    const allowlisted = []

    for (const component of components) {
        const referenceList = references.get(component.filePath) ?? []

        if (referenceList.length > 0) {
            continue
        }

        const candidates = componentNameCandidates(component.filePath)
        const matched = allowlistEntries.find((entry) => matchesAllowlistEntry(component.filePath, entry))
        const record = {
            component: component.filePath,
            pascalName: candidates?.pascalName ?? null,
            kebabName: candidates?.kebabName ?? null,
        }

        if (matched) {
            allowlisted.push({ ...record, matchedRule: matched.component ?? matched.pattern, reason: matched.reason })
            continue
        }

        unregistered.push({ ...record, references: describeReferences(referenceList, projectRoot) })
    }

    unregistered.sort((left, right) => left.component.localeCompare(right.component))
    allowlisted.sort((left, right) => left.component.localeCompare(right.component))

    return {
        generatedAt: new Date().toISOString(),
        scanRoots,
        scannedComponentCount: components.length,
        unusedCount: unregistered.length + allowlisted.length,
        allowlistedCount: allowlisted.length,
        unregisteredCount: unregistered.length,
        unregistered,
        allowlisted,
        referenceCoverage: components.length === 0
            ? 0
            : Number((((components.length - unregistered.length - allowlisted.length) / components.length) * 100).toFixed(2)),
    }
}

async function loadAllowlist(allowlistPath, projectRoot) {
    const resolvedPath = path.isAbsolute(allowlistPath) ? allowlistPath : path.join(projectRoot, allowlistPath)

    if (!(await pathExists(resolvedPath))) {
        return { entries: [], path: toPosixPath(resolvedPath, projectRoot) }
    }

    const content = await readFile(resolvedPath, 'utf8')

    return {
        entries: normalizeAllowlist(JSON.parse(content)),
        path: toPosixPath(resolvedPath, projectRoot),
    }
}

export async function collectComponentFiles(projectRoot = repoRoot, componentRoot = DEFAULT_COMPONENT_ROOT, referenceRoots = DEFAULT_REFERENCE_ROOTS) {
    const componentBase = path.isAbsolute(componentRoot) ? componentRoot : path.join(projectRoot, componentRoot)
    const componentFiles = (await collectFiles(componentBase, COMPONENT_FILE_EXTENSIONS, projectRoot))
        .map((absolutePath) => ({ filePath: toPosixPath(absolutePath, projectRoot), absolutePath }))

    const sourceFiles = (await Promise.all(referenceRoots.map((root) => collectFiles(
        path.isAbsolute(root) ? root : path.join(projectRoot, root),
        REFERENCE_FILE_EXTENSIONS,
        projectRoot,
    ))))
        .flat()
        .map((absolutePath) => toPosixPath(absolutePath, projectRoot))

    return { componentFiles, sourceFiles: [...new Set(sourceFiles)].sort() }
}

/**
 * @param {{ allowlist?: UnusedComponentAllowlistEntry[], allowlistPath?: string, componentRoot?: string, projectRoot?: string, referenceRoots?: string[] }} options
 * @returns {Promise<UnusedComponentReport>}
 */
export async function collectUnusedComponents(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const componentRoot = options.componentRoot ?? DEFAULT_COMPONENT_ROOT
    const referenceRoots = options.referenceRoots ?? DEFAULT_REFERENCE_ROOTS
    const { componentFiles, sourceFiles } = await collectComponentFiles(projectRoot, componentRoot, referenceRoots)
    const sources = []

    for (const filePath of sourceFiles) {
        const content = await readFile(path.join(projectRoot, filePath), 'utf8')

        sources.push({ content, filePath, tokens: collectReferenceTokens(content) })
    }

    const components = componentFiles.map((file) => ({ filePath: file.filePath }))
    const references = findComponentReferences({ components, projectRoot, sources })
    const allowlistSource = options.allowlist ?? (await loadAllowlist(options.allowlistPath ?? DEFAULT_ALLOWLIST_PATH, projectRoot))
    // 数组自带 `entries()` 方法，不能用 `allowlist.entries ?? allowlist` 判断：
    // 直接传入数组时会取到函数并被 normalizeAllowlist 丢弃，导致显式 allowlist 失效。
    const allowlistEntries = Array.isArray(allowlistSource) ? allowlistSource : (allowlistSource.entries ?? [])

    return {
        allowlistPath: Array.isArray(allowlistSource) ? null : (allowlistSource.path ?? null),
        sourceFileCount: sourceFiles.length,
        ...buildUnusedComponentReport({
            allowlist: allowlistEntries,
            components,
            projectRoot,
            references,
            scanRoots: referenceRoots,
        }),
    }
}

/**
 * @param {UnusedComponentReport} report
 * @param {string|null} artifactPath
 */
export function renderMarkdownReport(report, artifactPath) {
    const lines = [
        '# 零引用组件扫描',
        '',
        `- 生成时间: ${report.generatedAt}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        `- 组件定义数: ${report.scannedComponentCount}（引用面 ${report.sourceFileCount} 个文件）`,
        `- 零引用未登记: ${report.unregisteredCount}`,
        `- 零引用已登记: ${report.allowlistedCount}`,
        `- allowlist: ${report.allowlistPath ?? '（未提供）'}`,
        '',
        '## 未登记零引用组件',
        '',
    ].filter(Boolean)

    if (report.unregistered.length === 0) {
        lines.push('无。', '')
    } else {
        lines.push('| component | PascalCase | kebab-case |', '|:---|:---|:---|')

        for (const item of report.unregistered) {
            lines.push(`| \`${item.component}\` | \`${item.pascalName ?? '-'}\` | \`${item.kebabName ?? '-'}\` |`)
        }

        lines.push('')
    }

    lines.push('## 已登记零引用组件', '')

    if (report.allowlisted.length === 0) {
        lines.push('无。')
    } else {
        lines.push('| component | 命中规则 | 理由 |', '|:---|:---|:---|')

        for (const item of report.allowlisted) {
            lines.push(`| \`${item.component}\` | \`${item.matchedRule ?? '-'}\` | ${item.reason ?? '（未填写）'} |`)
        }
    }

    return lines.join('\n').trimEnd()
}

function resolveMarkdownPath(outputPath) {
    return outputPath.endsWith('.json') ? outputPath.replace(/\.json$/u, '.md') : `${outputPath}.md`
}

async function writeArtifacts(report, outputPath, projectRoot = repoRoot) {
    const resolvedOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(projectRoot, outputPath)
    const markdownPath = resolveMarkdownPath(resolvedOutputPath)

    await mkdir(path.dirname(resolvedOutputPath), { recursive: true })
    await writeFile(resolvedOutputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    await writeFile(markdownPath, `${renderMarkdownReport(report, toPosixPath(markdownPath, projectRoot))}\n`, 'utf8')

    return { jsonPath: resolvedOutputPath, markdownPath }
}

export async function main(argv = process.argv) {
    const { allowlist, components, mode, output } = parseArgs(argv)
    const report = await collectUnusedComponents({ allowlistPath: allowlist, componentRoot: components })
    const artifacts = await writeArtifacts(report, output)

    console.info('Unused component scan completed.')
    console.info(`- 组件定义数: ${report.scannedComponentCount}`)
    console.info(`- 零引用未登记: ${report.unregisteredCount}`)
    console.info(`- 零引用已登记: ${report.allowlistedCount}`)
    console.info(`- JSON: ${toPosixPath(artifacts.jsonPath)}`)
    console.info(`- Markdown: ${toPosixPath(artifacts.markdownPath)}`)

    if (report.unregisteredCount > 0) {
        for (const item of report.unregistered) {
            console.info(`  - ${item.component}（${item.kebabName ?? item.pascalName ?? '?'}）`)
        }
    }

    if (mode === 'error' && report.unregisteredCount > 0) {
        process.exitCode = 1
    }

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
