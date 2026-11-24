import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_OUTPUT_PATH = 'artifacts/governance/font-sizes-inventory-latest.json'
export const DEFAULT_SCALE_SOURCE = 'styles/main.scss'

/**
 * 字阶 token 的事实源：`styles/main.scss` 的 `--m-font-size-*` 声明。
 * 脚本不复制字阶取值，避免与样式表双写后漂移。
 */
export const SCALE_TOKEN_PATTERN = /--m-font-size-([\w-]+)\s*:\s*([^;\r\n}]+)/gu

const STYLE_TOKEN_PATTERN = /--m-font-size-[\w-]+/u
const FONT_SIZE_PATTERN = /font-size\s*:\s*([^;}\r\n]+)/gu
const SCSS_VARIABLE_PATTERN = /^\$[\w-]+$/u
const SOURCE_FILE_EXTENSIONS = new Set(['.scss', '.css', '.vue'])

/** 扫描面：只含样式与组件样式块；`packages/` 与 `docs/` 不参与（前者发独立包，后者是文档示例）。 */
export const DEFAULT_SCAN_ROOTS = [
    'app.vue',
    'components',
    'error.vue',
    'layouts',
    'modules',
    'pages',
    'styles',
]

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            output: DEFAULT_OUTPUT_PATH,
            scale: DEFAULT_SCALE_SOURCE,
        },
        values: {
            '--output': { key: 'output' },
            '--scale': { key: 'scale' },
        },
    })
}

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

export function toPosixPath(targetPath, projectRoot = repoRoot) {
    const relativePath = path.relative(projectRoot, targetPath).replaceAll('\\', '/')

    return relativePath || '.'
}

async function collectSourceFiles(targetPath) {
    if (!(await pathExists(targetPath))) {
        return []
    }

    const stats = await stat(targetPath)

    if (stats.isFile()) {
        return SOURCE_FILE_EXTENSIONS.has(path.extname(targetPath)) ? [targetPath] : []
    }

    const entries = await readdir(targetPath, { withFileTypes: true })
    const files = []

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        const absolutePath = path.join(targetPath, entry.name)

        if (entry.isDirectory()) {
            files.push(...await collectSourceFiles(absolutePath))
            continue
        }

        if (entry.isFile() && SOURCE_FILE_EXTENSIONS.has(path.extname(entry.name))) {
            files.push(absolutePath)
        }
    }

    return files
}

function computeLineNumber(content, index) {
    return content.slice(0, index).split('\n').length
}

const LINE_COMMENT_PREFIX_PATTERN = /^[ \t]*$/u
/** 引号前出现这些字符才视为字符串字面量开头（属性赋值 `=`、函数参数 `(` 等）。 */
const STRING_OPENERS = new Set(['=', '(', ':', ',', '[', '{', ';'])

function previousSignificantChar(content, index) {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        const char = content[cursor]

        if (char === '\n' || !/\s/u.test(char)) {
            return char
        }
    }

    return ''
}

/**
 * 扫描前屏蔽注释（块注释与整行行注释），保留字符长度以维持行号。
 *
 * 只屏蔽「整行行注释」，避免误伤 `url(https://…)` 这类含 `//` 的取值。
 *
 * 扫描时跟踪字符串字面量：Vue 模板的 `accept` 属性会把 MIME 通配写法（`image` 斜杠星号、
 * 纯通配等）写进属性字符串，其中的「斜杠 + 星号」不算注释起点；字符串外的块注释
 * （含紧贴标识符的注释）仍照常屏蔽。
 */
export function stripComments(content) {
    const stripped = content.split('')
    let quote = ''

    const blankOut = (from, to) => {
        for (let cursor = from; cursor < to; cursor += 1) {
            if (stripped[cursor] !== '\n') {
                stripped[cursor] = ' '
            }
        }
    }

    for (let index = 0; index < content.length; index += 1) {
        const char = content[index]

        if (quote) {
            if (char === '\n') {
                quote = ''
                continue
            }

            if (char === '\\') {
                index += 1
                continue
            }

            if (char === quote) {
                quote = ''
            }

            continue
        }

        if (char === '/' && content[index + 1] === '*') {
            const end = content.indexOf('*/', index + 2)

            if (end === -1) {
                continue
            }

            blankOut(index, end + 2)
            index = end + 1
            continue
        }

        if (char === '/' && content[index + 1] === '/' && LINE_COMMENT_PREFIX_PATTERN.test(content.slice(0, index).split('\n').pop() ?? '')) {
            const end = content.indexOf('\n', index)
            const stop = end === -1 ? content.length : end

            blankOut(index, stop)
            index = stop - 1
            continue
        }

        if (char === '"' || char === '\'') {
            const previous = previousSignificantChar(content, index)

            if (previous === '' || previous === '\n' || STRING_OPENERS.has(previous)) {
                quote = char
            }
        }
    }

    return stripped.join('')
}

function normalizeValue(rawValue) {
    return rawValue.trim().replaceAll(/\s+/gu, ' ')
}

/**
 * 解析字阶定义：返回「token 名 → 取值」与出现顺序，供报告展示阶梯。
 */
export function collectFontSizeScale(content) {
    const entries = []

    for (const match of content.matchAll(SCALE_TOKEN_PATTERN)) {
        const name = String(match[1] ?? '')
        const value = normalizeValue(String(match[2] ?? ''))

        if (!name || entries.some((entry) => entry.name === name)) {
            continue
        }

        entries.push({ name, token: `--m-font-size-${name}`, value })
    }

    return entries
}

/**
 * 抽取单个文件的 `font-size` 声明并标注分类：
 *
 * - `token`：已使用 `var(--m-font-size-*)`；
 * - `scale`：取值与字阶某一档完全一致（可等价替换）；
 * - `scss-variable`：取值为 `$font-size-*` 等 SCSS 变量；
 * - `off-scale`：非字阶取值，替换会改变渲染，需另案归一。
 */
export function extractFontSizeDeclarations(content, filePath, scale = [], projectRoot = repoRoot) {
    const scaleValues = new Map(scale.map((entry) => [entry.value, entry.token]))
    const declarations = []
    const scannableContent = stripComments(content)

    for (const match of scannableContent.matchAll(FONT_SIZE_PATTERN)) {
        const rawValue = String(match[1] ?? '')
        const value = normalizeValue(rawValue)
        const hasToken = STYLE_TOKEN_PATTERN.test(value)
        const token = scaleValues.get(value) ?? null

        let category = 'off-scale'

        if (hasToken) {
            category = 'token'
        } else if (token) {
            category = 'scale'
        } else if (SCSS_VARIABLE_PATTERN.test(value)) {
            category = 'scss-variable'
        }

        declarations.push({
            category,
            filePath: toPosixPath(filePath, projectRoot),
            line: computeLineNumber(content, match.index ?? 0),
            token,
            value,
        })
    }

    return declarations
}

function countBy(items, keyFn) {
    const buckets = new Map()

    for (const item of items) {
        const key = keyFn(item)
        buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }

    return [...buckets.entries()]
        .map(([key, count]) => ({ count, key }))
        .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
}

export function buildFontSizeInventory(declarations, scale = []) {
    const files = countBy(declarations, (item) => item.filePath).map((bucket) => ({
        declarationCount: bucket.count,
        filePath: bucket.key,
    }))
    const total = declarations.length
    const tokenDeclarations = declarations.filter((item) => item.category === 'token')
    const scaleDeclarations = declarations.filter((item) => item.category === 'scale')

    return {
        scale,
        summary: {
            declarationCount: total,
            distinctValueCount: new Set(declarations.map((item) => item.value)).size,
            fileCount: files.length,
            tokenDeclarationCount: tokenDeclarations.length,
            tokenCoverage: total === 0 ? 0 : Number(((tokenDeclarations.length / total) * 100).toFixed(2)),
            scaleDeclarationCount: scaleDeclarations.length,
            replaceableCount: tokenDeclarations.length + scaleDeclarations.length,
            replaceableCoverage: total === 0 ? 0 : Number((((tokenDeclarations.length + scaleDeclarations.length) / total) * 100).toFixed(2)),
        },
        categories: countBy(declarations, (item) => item.category).map((bucket) => ({
            category: bucket.key,
            count: bucket.count,
        })),
        valueBuckets: countBy(declarations, (item) => item.value).map((bucket) => ({
            count: bucket.count,
            value: bucket.key,
        })),
        directoryBuckets: countBy(declarations, (item) => path.posix.dirname(item.filePath)).map((bucket) => ({
            count: bucket.count,
            directory: bucket.key,
        })),
        files,
        offScaleValues: countBy(declarations.filter((item) => item.category === 'off-scale'), (item) => item.value)
            .map((bucket) => ({ count: bucket.count, value: bucket.key })),
    }
}

export async function collectFontSizeInventory(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const scanRoots = options.scanRoots ?? DEFAULT_SCAN_ROOTS
    const scalePath = path.isAbsolute(options.scale ?? DEFAULT_SCALE_SOURCE)
        ? (options.scale ?? DEFAULT_SCALE_SOURCE)
        : path.join(projectRoot, options.scale ?? DEFAULT_SCALE_SOURCE)
    const scaleContent = await readFile(scalePath, 'utf8')
    const scale = collectFontSizeScale(scaleContent)
    const sourceFiles = (await Promise.all(scanRoots.map((rootPath) => collectSourceFiles(path.join(projectRoot, rootPath)))))
        .flat()
        .sort()
    const declarations = []

    for (const filePath of sourceFiles) {
        const content = await readFile(filePath, 'utf8')

        declarations.push(...extractFontSizeDeclarations(content, filePath, scale))
    }

    return {
        generatedAt: new Date().toISOString(),
        scalePath: toPosixPath(scalePath, projectRoot),
        scanRoots,
        scannedFileCount: sourceFiles.length,
        ...buildFontSizeInventory(declarations, scale),
    }
}

export function renderMarkdownReport(report, artifactPath) {
    const lines = [
        '# Font Size Inventory',
        '',
        `- 生成时间: ${report.generatedAt}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        `- 扫描面: ${report.scanRoots.join(', ')}（${report.scannedFileCount} 个样式 / 组件文件）`,
        `- 字阶事实源: ${report.scalePath}`,
        '',
        '## Summary',
        '',
        `- font-size 声明数: ${report.summary.declarationCount}`,
        `- 唯一取值数: ${report.summary.distinctValueCount}`,
        `- 命中文件数: ${report.summary.fileCount}`,
        `- 已 token 化: ${report.summary.tokenDeclarationCount}（${report.summary.tokenCoverage}%）`,
        `- 字阶口径内可等价替换: ${report.summary.scaleDeclarationCount}`,
        '',
        '## 分类',
        '',
        '| category | count |',
        '|:---|:---|',
    ].filter(Boolean)

    for (const bucket of report.categories) {
        lines.push(`| ${bucket.category} | ${bucket.count} |`)
    }

    lines.push('', '## 字阶', '', '| token | value |', '|:---|:---|')

    for (const entry of report.scale) {
        lines.push(`| ${entry.token} | ${entry.value} |`)
    }

    lines.push('', '## 取值分桶 Top 20', '', '| value | count |', '|:---|:---|')

    for (const bucket of report.valueBuckets.slice(0, 20)) {
        lines.push(`| \`${bucket.value}\` | ${bucket.count} |`)
    }

    lines.push('', '## 目录分桶', '', '| directory | count |', '|:---|:---|')

    for (const bucket of report.directoryBuckets.slice(0, 20)) {
        lines.push(`| ${bucket.directory} | ${bucket.count} |`)
    }

    lines.push('', '## 非字阶取值（需另案归一）', '', '| value | count |', '|:---|:---|')

    if (report.offScaleValues.length === 0) {
        lines.push('| - | 0 |')
    }

    for (const bucket of report.offScaleValues.slice(0, 30)) {
        lines.push(`| \`${bucket.value}\` | ${bucket.count} |`)
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
    const { output, scale } = parseArgs(argv)
    const report = await collectFontSizeInventory({ scale })
    const artifacts = await writeArtifacts(report, output)

    console.info('Font size inventory completed.')
    console.info(`- font-size 声明数: ${report.summary.declarationCount}`)
    console.info(`- 已 token 化: ${report.summary.tokenDeclarationCount}（${report.summary.tokenCoverage}%）`)
    console.info(`- 可等价替换: ${report.summary.scaleDeclarationCount}`)
    console.info(`- JSON: ${toPosixPath(artifacts.jsonPath)}`)
    console.info(`- Markdown: ${toPosixPath(artifacts.markdownPath)}`)

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
