import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
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
const NEAR_NAME_STOPWORDS = new Set([
    'build',
    'check',
    'collect',
    'compute',
    'create',
    'ensure',
    'fetch',
    'find',
    'format',
    'generate',
    'get',
    'load',
    'make',
    'map',
    'normalize',
    'parse',
    'prepare',
    'resolve',
    'set',
    'update',
    'validate',
    'with',
    'from',
    'to',
    'by',
])

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            output: null,
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

function uniqueFiles(items) {
    return unique(items.map((item) => item.filePath))
}

function computeLineNumber(content, index) {
    return content.slice(0, index).split('\n').length
}

function splitNameTokens(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
        .split(/[^A-Za-z0-9]+/u)
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean)
}

function stemToken(token) {
    if (token.endsWith('ies') && token.length > 4) {
        return `${token.slice(0, -3)}y`
    }

    if (token.endsWith('ing') && token.length > 5) {
        return token.slice(0, -3)
    }

    if (token.endsWith('ed') && token.length > 4) {
        return token.slice(0, -2)
    }

    if (token.endsWith('es') && token.length > 4) {
        return token.slice(0, -2)
    }

    if (token.endsWith('s') && token.length > 3) {
        return token.slice(0, -1)
    }

    return token
}

export function buildNearNameSignature(name) {
    const tokens = splitNameTokens(name)
        .map(stemToken)
        .filter((token) => !NEAR_NAME_STOPWORDS.has(token))
    const meaningfulTokens = unique(tokens)

    if (meaningfulTokens.length < 2) {
        return null
    }

    return meaningfulTokens.join(':')
}

export function extractDeclarations(content, filePath) {
    const declarations = {
        functions: [],
        types: [],
    }
    const matchers = [
        {
            kind: 'function',
            regex: /(^|\n)\s*(export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gu,
            target: 'functions',
        },
        {
            kind: 'function-variable',
            regex: /(^|\n)\s*(export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)(?:\s*:\s*[^=\n]+)?\s*=\s*(?:async\s*)?(?:function\b|(?:<[^=\n]+>\s*)?\([^=;\n]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/gu,
            target: 'functions',
        },
        {
            kind: 'type',
            regex: /(^|\n)\s*(export\s+)?type\s+([A-Za-z_$][\w$]*)\b/gu,
            target: 'types',
        },
        {
            kind: 'interface',
            regex: /(^|\n)\s*(export\s+)?interface\s+([A-Za-z_$][\w$]*)\b/gu,
            target: 'types',
        },
    ]

    for (const matcher of matchers) {
        for (const match of content.matchAll(matcher.regex)) {
            declarations[matcher.target].push({
                exported: Boolean(match[2]),
                filePath,
                kind: matcher.kind,
                line: computeLineNumber(content, match.index ?? 0),
                name: match[3],
            })
        }
    }

    return declarations
}

function sortOccurrences(items) {
    return [...items].sort((left, right) => {
        if (left.filePath !== right.filePath) {
            return left.filePath.localeCompare(right.filePath)
        }

        return left.line - right.line
    })
}

function buildLocationBuckets(items) {
    const directoryBuckets = new Map()
    const fileBuckets = new Map()

    for (const item of items) {
        const directory = path.posix.dirname(item.filePath)

        directoryBuckets.set(directory, (directoryBuckets.get(directory) ?? 0) + 1)
        fileBuckets.set(item.filePath, (fileBuckets.get(item.filePath) ?? 0) + 1)
    }

    return {
        directoryBuckets: [...directoryBuckets.entries()]
            .map(([directory, count]) => ({ count, directory }))
            .sort((left, right) => right.count - left.count || left.directory.localeCompare(right.directory)),
        fileBuckets: [...fileBuckets.entries()]
            .map(([currentFilePath, count]) => ({ count, filePath: currentFilePath }))
            .sort((left, right) => right.count - left.count || left.filePath.localeCompare(right.filePath)),
    }
}

function buildNamedGroups(items) {
    const groups = new Map()

    for (const item of items) {
        const current = groups.get(item.name) ?? []

        current.push(item)
        groups.set(item.name, current)
    }

    return [...groups.entries()]
        .map(([name, occurrences]) => ({ name, occurrences: sortOccurrences(occurrences) }))
        .filter((group) => uniqueFiles(group.occurrences).length > 1)
        .map((group) => ({
            ...buildLocationBuckets(group.occurrences),
            fileCount: uniqueFiles(group.occurrences).length,
            name: group.name,
            occurrenceCount: group.occurrences.length,
            occurrences: group.occurrences,
            reviewStatus: '待观察',
        }))
        .sort((left, right) => {
            if (right.occurrenceCount !== left.occurrenceCount) {
                return right.occurrenceCount - left.occurrenceCount
            }

            return left.name.localeCompare(right.name)
        })
}

function buildNearNameGroups(items) {
    const groups = new Map()

    for (const item of items) {
        const signature = buildNearNameSignature(item.name)

        if (!signature) {
            continue
        }

        const current = groups.get(signature) ?? []

        current.push(item)
        groups.set(signature, current)
    }

    return [...groups.entries()]
        .map(([signature, occurrences]) => ({ signature, occurrences: sortOccurrences(occurrences) }))
        .filter((group) => unique(group.occurrences.map((item) => item.name)).length > 1)
        .filter((group) => uniqueFiles(group.occurrences).length > 1)
        .map((group) => ({
            ...buildLocationBuckets(group.occurrences),
            fileCount: uniqueFiles(group.occurrences).length,
            names: unique(group.occurrences.map((item) => item.name)),
            occurrenceCount: group.occurrences.length,
            occurrences: group.occurrences,
            reviewStatus: '待观察',
            signature: group.signature,
        }))
        .sort((left, right) => {
            if (right.occurrenceCount !== left.occurrenceCount) {
                return right.occurrenceCount - left.occurrenceCount
            }

            return left.signature.localeCompare(right.signature)
        })
}

function buildGlobalBuckets({ nearNameFunctions, sameNameFunctions, sameNameTypes }) {
    const directoryBuckets = new Map()
    const fileBuckets = new Map()
    const resolveBucketField = (field) => {
        if (field === 'sameNameFunctions') {
            return 'sameNameFunctions'
        }

        if (field === 'sameNameTypes') {
            return 'sameNameTypes'
        }

        return 'nearNameFunctions'
    }
    const registerDirectory = (directory, field) => {
        const current = directoryBuckets.get(directory) ?? {
            directory,
            nearNameFunctions: 0,
            sameNameFunctions: 0,
            sameNameTypes: 0,
        }

        current[resolveBucketField(field)] += 1
        directoryBuckets.set(directory, current)
    }
    const registerFile = (filePath, field) => {
        const current = fileBuckets.get(filePath) ?? {
            filePath,
            nearNameFunctions: 0,
            sameNameFunctions: 0,
            sameNameTypes: 0,
        }

        current[resolveBucketField(field)] += 1
        fileBuckets.set(filePath, current)
    }
    const registerGroup = (groups, field) => {
        for (const group of groups) {
            for (const directory of unique(group.occurrences.map((item) => path.posix.dirname(item.filePath)))) {
                registerDirectory(directory, field)
            }

            for (const currentFilePath of unique(group.occurrences.map((item) => item.filePath))) {
                registerFile(currentFilePath, field)
            }
        }
    }

    registerGroup(sameNameFunctions, 'sameNameFunctions')
    registerGroup(sameNameTypes, 'sameNameTypes')
    registerGroup(nearNameFunctions, 'nearNameFunctions')

    return {
        directoryBuckets: [...directoryBuckets.values()].sort((left, right) => {
            const leftTotal = left.sameNameFunctions + left.sameNameTypes + left.nearNameFunctions
            const rightTotal = right.sameNameFunctions + right.sameNameTypes + right.nearNameFunctions

            if (rightTotal !== leftTotal) {
                return rightTotal - leftTotal
            }

            return left.directory.localeCompare(right.directory)
        }),
        fileBuckets: [...fileBuckets.values()].sort((left, right) => {
            const leftTotal = left.sameNameFunctions + left.sameNameTypes + left.nearNameFunctions
            const rightTotal = right.sameNameFunctions + right.sameNameTypes + right.nearNameFunctions

            if (rightTotal !== leftTotal) {
                return rightTotal - leftTotal
            }

            return left.filePath.localeCompare(right.filePath)
        }),
    }
}

export async function collectSimpleDuplicateReport(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const roots = (options.roots ?? DEFAULT_SCAN_ROOTS)
        .map((rootPath) => (path.isAbsolute(rootPath) ? rootPath : path.join(projectRoot, rootPath)))
    const files = unique((await Promise.all(roots.map((rootPath) => collectSourceFiles(rootPath)))).flat())
    const declarations = {
        functions: [],
        types: [],
    }

    for (const filePath of files) {
        const relativeFilePath = toPosixPath(filePath, projectRoot)
        const content = await readFile(filePath, 'utf8')
        const currentDeclarations = extractDeclarations(content, relativeFilePath)

        declarations.functions.push(...currentDeclarations.functions)
        declarations.types.push(...currentDeclarations.types)
    }

    const sameNameFunctions = buildNamedGroups(declarations.functions.filter((item) => !item.exported))
    const sameNameTypes = buildNamedGroups(declarations.types)
    const nearNameFunctions = buildNearNameGroups(declarations.functions.filter((item) => !item.exported))

    return {
        ...buildGlobalBuckets({ nearNameFunctions, sameNameFunctions, sameNameTypes }),
        generatedAt: new Date().toISOString(),
        nearNameFunctions,
        reviewStatusOptions: [...REVIEW_STATUS_OPTIONS],
        roots: roots.map((rootPath) => toPosixPath(rootPath, projectRoot)),
        sameNameFunctions,
        sameNameTypes,
        summary: {
            functionDeclarations: declarations.functions.length,
            interfaceDeclarations: declarations.types.filter((item) => item.kind === 'interface').length,
            nearNameFunctionCandidates: nearNameFunctions.length,
            sameNameFunctionCandidates: sameNameFunctions.length,
            sameNameTypeCandidates: sameNameTypes.length,
            scannedFiles: files.length,
            typeDeclarations: declarations.types.filter((item) => item.kind === 'type').length,
        },
    }
}

export function renderMarkdownReport(report, artifactPath = null) {
    const lines = [
        '# Governance Baseline — simple-duplicates',
        '',
        `- 生成时间: ${report.generatedAt}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        '',
        '## Summary',
        '',
        `- 扫描文件数: ${report.summary.scannedFiles}`,
        `- 函数声明数: ${report.summary.functionDeclarations}`,
        `- type 声明数: ${report.summary.typeDeclarations}`,
        `- interface 声明数: ${report.summary.interfaceDeclarations}`,
        `- 同名内部函数候选: ${report.summary.sameNameFunctionCandidates}`,
        `- 同名 type/interface 候选: ${report.summary.sameNameTypeCandidates}`,
        `- 近似命名函数候选: ${report.summary.nearNameFunctionCandidates}`,
        '',
        '## Same Name Functions',
        '',
    ].filter(Boolean)

    if (report.sameNameFunctions.length === 0) {
        lines.push('- 无')
    } else {
        for (const group of report.sameNameFunctions.slice(0, 20)) {
            lines.push(`- ${group.name} (${group.occurrenceCount} 次 / ${group.fileCount} 文件, 状态: ${group.reviewStatus})`)
            for (const occurrence of group.occurrences) {
                lines.push(`  - ${occurrence.filePath}:${occurrence.line}`)
            }
        }
    }

    lines.push('')
    lines.push('## Same Name Types')
    lines.push('')

    if (report.sameNameTypes.length === 0) {
        lines.push('- 无')
    } else {
        for (const group of report.sameNameTypes.slice(0, 20)) {
            lines.push(`- ${group.name} (${group.occurrenceCount} 次 / ${group.fileCount} 文件, 状态: ${group.reviewStatus})`)
            for (const occurrence of group.occurrences) {
                lines.push(`  - ${occurrence.kind} ${occurrence.filePath}:${occurrence.line}`)
            }
        }
    }

    lines.push('')
    lines.push('## Near Name Functions')
    lines.push('')

    if (report.nearNameFunctions.length === 0) {
        lines.push('- 无')
    } else {
        for (const group of report.nearNameFunctions.slice(0, 20)) {
            lines.push(`- ${group.names.join(' / ')} (${group.occurrenceCount} 次 / ${group.fileCount} 文件, 状态: ${group.reviewStatus})`)
        }
    }

    return lines.join('\n')
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
    const report = await collectSimpleDuplicateReport({ roots })
    let artifactPaths = null

    if (output) {
        artifactPaths = await writeArtifacts(report, output)
    }

    console.info('Simple duplicate audit completed.')
    console.info(`- 扫描文件数: ${report.summary.scannedFiles}`)
    console.info(`- 同名内部函数候选: ${report.summary.sameNameFunctionCandidates}`)
    console.info(`- 同名 type/interface 候选: ${report.summary.sameNameTypeCandidates}`)
    console.info(`- 近似命名函数候选: ${report.summary.nearNameFunctionCandidates}`)

    if (artifactPaths) {
        console.info(`- JSON: ${toPosixPath(artifactPaths.jsonPath)}`)
        console.info(`- Markdown: ${toPosixPath(artifactPaths.markdownPath)}`)
    }

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
