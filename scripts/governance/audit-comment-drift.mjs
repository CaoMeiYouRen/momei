import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_OUTPUT_PATH = 'artifacts/governance/comment-drift-latest.json'
export const DEFAULT_SCAN_ROOTS = [
    'app.vue',
    'components',
    'composables',
    'error.vue',
    'layouts',
    'lib',
    'middleware',
    'pages',
    'plugins',
    'server',
    'types',
    'utils',
]
export const REVIEW_STATUS_OPTIONS = ['可复用', '保留局部实现', '待观察']

const SOURCE_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue'])
const TODO_COMMENT_PATTERN = /\b(?:TODO|FIXME|HACK|XXX)\b|临时|后续补|待补|待完善/iu
const DRIFT_HINT_PATTERN = /\b(?:return|returns?|set|sets?|throw|delete|remove|null|undefined|true|false)\b|返回|设置|删除|移除/iu

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            output: DEFAULT_OUTPUT_PATH,
            roots: [...DEFAULT_SCAN_ROOTS],
        },
        values: {
            '--output': { key: 'output' },
            '--root': {
                key: 'roots',
                parse: (value) => value.split(',').map((item) => item.trim()).filter(Boolean),
                collect: (current = [], next = []) => [...current, ...next],
            },
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

function toPosixPath(targetPath, projectRoot = repoRoot) {
    const relativePath = path.relative(projectRoot, targetPath).replaceAll('\\', '/')

    return relativePath || '.'
}

async function collectSourceFiles(targetPath) {
    if (!(await pathExists(targetPath))) {
        return []
    }

    try {
        const entries = await readdir(targetPath, { withFileTypes: true })
        const files = []

        for (const entry of entries) {
            const absolutePath = path.join(targetPath, entry.name)

            if (entry.isDirectory()) {
                files.push(...await collectSourceFiles(absolutePath))
                continue
            }

            if (entry.isFile() && SOURCE_FILE_EXTENSIONS.has(path.extname(entry.name))) {
                files.push(absolutePath)
            }
        }

        return files.sort()
    } catch {
        if (!SOURCE_FILE_EXTENSIONS.has(path.extname(targetPath))) {
            return []
        }

        return [targetPath]
    }
}

function unique(values) {
    return [...new Set(values)].sort()
}

function computeLineNumber(content, index) {
    return content.slice(0, index).split('\n').length
}

function tokenize(value) {
    return value
        .toLowerCase()
        .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
        .split(/[^\p{L}\p{N}_]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length > 1)
}

function normalizeCommentText(rawText) {
    return rawText
        .replace(/^\/\//u, '')
        .replace(/^\/\*/u, '')
        .replace(/\*\/$/u, '')
        .split(/\r?\n/u)
        .map((line) => line.replace(/^\s*\*?/u, '').trim())
        .join(' ')
        .replace(/\s+/gu, ' ')
        .trim()
}

export function isTodoLikeComment(text) {
    return TODO_COMMENT_PATTERN.test(text)
}

export function isRestatementComment(text, nextCodeLine) {
    const commentTokens = unique(tokenize(text))
    const codeTokens = new Set(tokenize(nextCodeLine))

    if (commentTokens.length < 2 || commentTokens.length > 8 || codeTokens.size === 0) {
        return false
    }

    return commentTokens.every((token) => codeTokens.has(token))
}

export function isDriftCandidateComment(text, nextCodeLine) {
    if (!DRIFT_HINT_PATTERN.test(text) || !nextCodeLine.trim()) {
        return false
    }

    const commentTokens = unique(tokenize(text))
    const codeTokens = new Set(tokenize(nextCodeLine))

    if (commentTokens.length === 0 || codeTokens.size === 0) {
        return false
    }

    const overlapCount = commentTokens.filter((token) => codeTokens.has(token)).length

    return overlapCount / commentTokens.length < 0.34
}

function findNextCodeLine(lines, commentLine) {
    for (let index = commentLine; index < lines.length; index += 1) {
        const currentLine = lines[index]?.trim() ?? ''

        if (!currentLine || currentLine.startsWith('//') || currentLine.startsWith('/*') || currentLine.startsWith('*')) {
            continue
        }

        return currentLine
    }

    return ''
}

function hasLeadingComment(lines, startLine) {
    let index = startLine - 2

    while (index >= 0 && !(lines[index]?.trim() ?? '')) {
        index -= 1
    }

    if (index < 0) {
        return false
    }

    return /^(?:\/\/|\/\*|\*|\*\/)/u.test(lines[index]?.trim() ?? '')
}

function calculateComplexityScore(body) {
    return (body.match(/\bif\b|\bfor\b|\bwhile\b|\bswitch\b|\bcatch\b|\bcase\b|&&|\|\|/gu) ?? []).length
}

function findMatchingBrace(content, openBraceIndex) {
    let depth = 0

    for (let index = openBraceIndex; index < content.length; index += 1) {
        if (content[index] === '{') {
            depth += 1
            continue
        }

        if (content[index] === '}') {
            depth -= 1

            if (depth === 0) {
                return index
            }
        }
    }

    return -1
}

export function extractExportedFunctionCandidates(content, filePath) {
    const lines = content.split(/\r?\n/u)
    const matches = [
        ...content.matchAll(/(^|\n)\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gu),
        ...content.matchAll(/(^|\n)\s*export\s+const\s+([A-Za-z_$][\w$]*)(?:\s*:\s*[^=\n]+)?\s*=\s*(?:async\s*)?(?:function\b|(?:<[^=\n]+>\s*)?\([^=;\n]*\)\s*=>)/gu),
    ]

    return matches.flatMap((match) => {
        const name = match[2]
        const startIndex = match.index ?? 0
        const openBraceIndex = content.indexOf('{', startIndex)

        if (!name || openBraceIndex < 0) {
            return []
        }

        const closeBraceIndex = findMatchingBrace(content, openBraceIndex)

        if (closeBraceIndex < 0) {
            return []
        }

        const startLine = computeLineNumber(content, startIndex)
        const endLine = computeLineNumber(content, closeBraceIndex)
        const body = content.slice(openBraceIndex, closeBraceIndex + 1)
        const complexityScore = calculateComplexityScore(body)
        const lineSpan = endLine - startLine + 1

        if (hasLeadingComment(lines, startLine) || (complexityScore < 3 && lineSpan < 25)) {
            return []
        }

        return [{
            complexityScore,
            endLine,
            filePath,
            lineSpan,
            name,
            reviewStatus: '待观察',
            startLine,
        }]
    })
}

function extractCommentEntries(content, filePath) {
    const lines = content.split(/\r?\n/u)
    const entries = []

    for (const match of content.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\//gu)) {
        const rawText = match[0]
        const line = computeLineNumber(content, match.index ?? 0)
        const text = normalizeCommentText(rawText)

        if (!text) {
            continue
        }

        const nextCodeLine = findNextCodeLine(lines, line)
        const baseEntry = {
            filePath,
            line,
            nextCodeLine,
            reviewStatus: '待观察',
            text,
        }

        entries.push(baseEntry)
    }

    return entries
}

function buildCategoryBuckets(report) {
    const buckets = new Map()
    const register = (items, field) => {
        for (const item of items) {
            const directory = path.posix.dirname(item.filePath)
            const current = buckets.get(directory) ?? {
                directory,
                driftComments: 0,
                highComplexityMissingComments: 0,
                restatementComments: 0,
                todoComments: 0,
            }

            current[field] += 1
            buckets.set(directory, current)
        }
    }

    register(report.highComplexityMissingComments, 'highComplexityMissingComments')
    register(report.todoComments, 'todoComments')
    register(report.restatementComments, 'restatementComments')
    register(report.driftComments, 'driftComments')

    return [...buckets.values()].sort((left, right) => {
        const leftTotal = left.highComplexityMissingComments + left.todoComments + left.restatementComments + left.driftComments
        const rightTotal = right.highComplexityMissingComments + right.todoComments + right.restatementComments + right.driftComments

        if (rightTotal !== leftTotal) {
            return rightTotal - leftTotal
        }

        return left.directory.localeCompare(right.directory)
    })
}

export async function collectCommentDriftReport(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const roots = (options.roots ?? DEFAULT_SCAN_ROOTS)
        .map((rootPath) => (path.isAbsolute(rootPath) ? rootPath : path.join(projectRoot, rootPath)))
    const files = unique((await Promise.all(roots.map((rootPath) => collectSourceFiles(rootPath)))).flat())
    const highComplexityMissingComments = []
    const todoComments = []
    const restatementComments = []
    const driftComments = []

    for (const absoluteFilePath of files) {
        const filePath = toPosixPath(absoluteFilePath, projectRoot)
        const content = await readFile(absoluteFilePath, 'utf8')

        highComplexityMissingComments.push(...extractExportedFunctionCandidates(content, filePath))

        for (const entry of extractCommentEntries(content, filePath)) {
            if (isTodoLikeComment(entry.text)) {
                todoComments.push(entry)
            }

            if (isRestatementComment(entry.text, entry.nextCodeLine)) {
                restatementComments.push(entry)
            }

            if (isDriftCandidateComment(entry.text, entry.nextCodeLine)) {
                driftComments.push(entry)
            }
        }
    }

    const report = {
        driftComments,
        generatedAt: new Date().toISOString(),
        highComplexityMissingComments,
        restatementComments,
        reviewStatusOptions: [...REVIEW_STATUS_OPTIONS],
        roots: roots.map((rootPath) => toPosixPath(rootPath, projectRoot)),
        summary: {
            driftComments: driftComments.length,
            highComplexityMissingComments: highComplexityMissingComments.length,
            restatementComments: restatementComments.length,
            scannedFiles: files.length,
            todoComments: todoComments.length,
        },
        todoComments,
    }

    return {
        ...report,
        directoryBuckets: buildCategoryBuckets(report),
    }
}

export function renderMarkdownReport(report, artifactPath = null) {
    const lines = [
        '# Governance Baseline — comment-drift',
        '',
        `- 生成时间: ${report.generatedAt}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        '',
        '## Summary',
        '',
        `- 扫描文件数: ${report.summary.scannedFiles}`,
        `- 高复杂度导出函数缺注释候选: ${report.summary.highComplexityMissingComments}`,
        `- TODO / 临时口吻注释候选: ${report.summary.todoComments}`,
        `- 疑似逐行复述注释候选: ${report.summary.restatementComments}`,
        `- 疑似漂移注释候选: ${report.summary.driftComments}`,
        '',
    ].filter(Boolean)

    const sections = [
        ['High Complexity Missing Comments', report.highComplexityMissingComments, (item) => `${item.filePath}:${item.startLine}-${item.endLine} ${item.name} (complexity=${item.complexityScore}, lines=${item.lineSpan}, 状态: ${item.reviewStatus})`],
        ['Todo Comments', report.todoComments, (item) => `${item.filePath}:${item.line} ${item.text} (状态: ${item.reviewStatus})`],
        ['Restatement Comments', report.restatementComments, (item) => `${item.filePath}:${item.line} ${item.text} (状态: ${item.reviewStatus})`],
        ['Drift Comments', report.driftComments, (item) => `${item.filePath}:${item.line} ${item.text} (状态: ${item.reviewStatus})`],
    ]

    for (const [title, items, renderItem] of sections) {
        lines.push(`## ${title}`)
        lines.push('')

        if (items.length === 0) {
            lines.push('- 无')
        } else {
            for (const item of items.slice(0, 20)) {
                lines.push(`- ${renderItem(item)}`)
            }
        }

        lines.push('')
    }

    lines.push('## Directory Buckets')
    lines.push('')

    if (report.directoryBuckets.length === 0) {
        lines.push('- 无')
    } else {
        for (const bucket of report.directoryBuckets.slice(0, 20)) {
            lines.push(`- ${bucket.directory}: missing=${bucket.highComplexityMissingComments}, todo=${bucket.todoComments}, restatement=${bucket.restatementComments}, drift=${bucket.driftComments}`)
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

    return {
        jsonPath: resolvedOutputPath,
        markdownPath,
    }
}

export async function main(argv = process.argv) {
    const { output, roots } = parseArgs(argv)
    const report = await collectCommentDriftReport({ roots })
    const artifacts = await writeArtifacts(report, output)

    console.info('Comment drift audit completed.')
    console.info(`- 高复杂度导出函数缺注释候选: ${report.summary.highComplexityMissingComments}`)
    console.info(`- TODO / 临时口吻注释候选: ${report.summary.todoComments}`)
    console.info(`- 疑似逐行复述注释候选: ${report.summary.restatementComments}`)
    console.info(`- 疑似漂移注释候选: ${report.summary.driftComments}`)
    console.info(`- JSON: ${toPosixPath(artifacts.jsonPath)}`)
    console.info(`- Markdown: ${toPosixPath(artifacts.markdownPath)}`)

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
