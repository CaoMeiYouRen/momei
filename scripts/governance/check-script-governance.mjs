import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const defaultScriptRoot = path.join(repoRoot, 'scripts')
export const DEFAULT_SEARCH_ROOTS = [
    path.join(repoRoot, 'package.json'),
    path.join(repoRoot, 'AGENTS.md'),
    path.join(repoRoot, 'CLAUDE.md'),
    path.join(repoRoot, 'scripts', 'README.md'),
    path.join(repoRoot, 'docs'),
    path.join(repoRoot, '.github', 'workflows'),
]
export const SCRIPT_FILE_EXTENSIONS = new Set(['.mjs', '.js', '.cjs', '.ts', '.ps1'])
export const TEMP_DIR_NAMES = new Set(['temp', 'tmp', '_temp', '_tmp'])

const SEARCHABLE_EXTENSIONS = new Set(['.md', '.json', '.yml', '.yaml'])
const REFERENCE_SOURCE_ORDER = ['package-json', 'workflow', 'scripts-guide', 'docs', 'root-doc', 'other']

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            mode: 'warn',
            output: null,
        },
        values: {
            '--mode': {
                key: 'mode',
                allowedValues: ['warn', 'error'],
                invalidMessage: (value) => `[script-governance] 不支持的模式: ${value}，请使用 warn 或 error`,
            },
            '--output': { key: 'output' },
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

export function isScriptFile(fileName) {
    return SCRIPT_FILE_EXTENSIONS.has(path.extname(fileName))
}

export function isTemporaryScript(relativeFile) {
    const segments = relativeFile.split('/')

    return segments.some((segment) => TEMP_DIR_NAMES.has(segment))
}

async function listFilesRecursive(baseDir, matcher, currentDir = '') {
    if (!(await pathExists(baseDir))) {
        return []
    }

    const targetDir = path.join(baseDir, currentDir)
    const entries = await readdir(targetDir, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const relativePath = path.join(currentDir, entry.name)

        if (entry.isDirectory()) {
            files.push(...await listFilesRecursive(baseDir, matcher, relativePath))
            continue
        }

        if (entry.isFile() && matcher(entry.name)) {
            files.push(relativePath.replaceAll('\\', '/'))
        }
    }

    return files.sort()
}

function shouldSkipSearchPath(targetPath, projectRoot = repoRoot) {
    const relativePath = toPosixPath(targetPath, projectRoot)

    return relativePath === 'docs/.vitepress/dist' || relativePath.startsWith('docs/.vitepress/dist/')
}

async function collectSearchableFiles(targetPath, projectRoot = repoRoot) {
    if (!(await pathExists(targetPath)) || shouldSkipSearchPath(targetPath, projectRoot)) {
        return []
    }

    try {
        const entries = await readdir(targetPath, { withFileTypes: true })
        const files = []

        for (const entry of entries) {
            const absolutePath = path.join(targetPath, entry.name)

            if (shouldSkipSearchPath(absolutePath, projectRoot)) {
                continue
            }

            if (entry.isDirectory()) {
                files.push(...await collectSearchableFiles(absolutePath, projectRoot))
                continue
            }

            if (entry.isFile() && SEARCHABLE_EXTENSIONS.has(path.extname(entry.name))) {
                files.push(absolutePath)
            }
        }

        return files.sort()
    } catch {
        if (!SEARCHABLE_EXTENSIONS.has(path.extname(targetPath))) {
            return []
        }

        return [targetPath]
    }
}

function unique(values) {
    return [...new Set(values)].sort()
}

function uniqueBy(values, keyFn) {
    const seen = new Set()
    const result = []

    for (const value of values) {
        const key = keyFn(value)

        if (seen.has(key)) {
            continue
        }

        seen.add(key)
        result.push(value)
    }

    return result
}

function classifyReferenceSource(targetPath, projectRoot = repoRoot) {
    const relativePath = toPosixPath(targetPath, projectRoot)

    if (relativePath === 'package.json') {
        return 'package-json'
    }

    if (relativePath.startsWith('.github/workflows/')) {
        return 'workflow'
    }

    if (relativePath === 'scripts/README.md') {
        return 'scripts-guide'
    }

    if (relativePath === 'AGENTS.md' || relativePath === 'CLAUDE.md' || relativePath.startsWith('README')) {
        return 'root-doc'
    }

    if (relativePath.startsWith('docs/')) {
        return 'docs'
    }

    return 'other'
}

function buildFinding(code, filePath, message, severity = 'warning') {
    return {
        code,
        filePath,
        message,
        severity,
    }
}

export function extractScriptReferences(content) {
    const matches = content.matchAll(/(?:^|[^A-Za-z0-9_/-])((?:(?:\.\.\/)|(?:\.\/))*scripts\/[A-Za-z0-9._/-]+\.(?:mjs|js|cjs|ts|ps1))/gu)

    return unique([...matches].map((match) => match[1].replace(/^((?:\.\.\/)|(?:\.\/))+/u, '')))
}

function buildDirectoryBuckets(scriptEntries) {
    const buckets = new Map()

    for (const entry of scriptEntries) {
        const segments = entry.scriptPath.split('/')
        const directory = segments.length > 2 ? segments[1] : '(root)'
        const current = buckets.get(directory) ?? {
            directory,
            scriptsWithStableEntry: 0,
            scriptsWithoutStableEntry: 0,
            temporaryScripts: 0,
            totalScripts: 0,
        }

        current.totalScripts += 1

        if (entry.isTemporary) {
            current.temporaryScripts += 1
        }

        if (entry.hasStableEntry) {
            current.scriptsWithStableEntry += 1
        } else if (!entry.isTemporary) {
            current.scriptsWithoutStableEntry += 1
        }

        buckets.set(directory, current)
    }

    return [...buckets.values()].sort((left, right) => {
        if (right.scriptsWithoutStableEntry !== left.scriptsWithoutStableEntry) {
            return right.scriptsWithoutStableEntry - left.scriptsWithoutStableEntry
        }

        if (right.temporaryScripts !== left.temporaryScripts) {
            return right.temporaryScripts - left.temporaryScripts
        }

        return left.directory.localeCompare(right.directory)
    })
}

function normalizeReferenceDetails(referenceDetails) {
    return uniqueBy(referenceDetails, (item) => item.filePath)
        .sort((left, right) => {
            const leftIndex = REFERENCE_SOURCE_ORDER.indexOf(left.source)
            const rightIndex = REFERENCE_SOURCE_ORDER.indexOf(right.source)

            if (leftIndex !== rightIndex) {
                return leftIndex - rightIndex
            }

            return left.filePath.localeCompare(right.filePath)
        })
}

export async function collectScriptGovernanceReport(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const scriptRoot = options.scriptRoot ?? path.join(projectRoot, 'scripts')
    const searchRoots = (options.searchRoots ?? DEFAULT_SEARCH_ROOTS).map((rootPath) => (
        path.isAbsolute(rootPath) ? rootPath : path.join(projectRoot, rootPath)
    ))
    const searchableFiles = unique((await Promise.all(
        searchRoots.map((rootPath) => collectSearchableFiles(rootPath, projectRoot)),
    )).flat())
    const searchableContents = new Map()

    for (const filePath of searchableFiles) {
        searchableContents.set(filePath, await readFile(filePath, 'utf8'))
    }

    const scriptRelFiles = await listFilesRecursive(scriptRoot, isScriptFile)
    const scriptEntries = scriptRelFiles.map((relativeFile) => {
        const scriptPath = path.join(scriptRoot, relativeFile)
        const relativePath = toPosixPath(scriptPath, projectRoot)
        const references = []

        for (const [filePath, content] of searchableContents.entries()) {
            if (!content.includes(relativePath)) {
                continue
            }

            references.push({
                filePath: toPosixPath(filePath, projectRoot),
                source: classifyReferenceSource(filePath, projectRoot),
            })
        }

        const normalizedReferences = normalizeReferenceDetails(references)
        const stableSources = unique(
            normalizedReferences
                .map((item) => item.source)
                .filter((source) => source !== 'other'),
        )
        const relativeScriptPath = relativePath.replace(/^scripts\//u, '')

        return {
            hasStableEntry: stableSources.length > 0,
            isTemporary: isTemporaryScript(relativeScriptPath),
            references: normalizedReferences,
            scriptPath: relativePath,
            stableSources,
        }
    }).sort((left, right) => left.scriptPath.localeCompare(right.scriptPath))

    const declaredReferenceMap = new Map()

    for (const [filePath, content] of searchableContents.entries()) {
        for (const scriptPath of extractScriptReferences(content)) {
            const current = declaredReferenceMap.get(scriptPath) ?? new Set()

            current.add(toPosixPath(filePath, projectRoot))
            declaredReferenceMap.set(scriptPath, current)
        }
    }

    const documentedMissingScripts = []

    for (const [scriptPath, referencedBy] of declaredReferenceMap.entries()) {
        const absoluteScriptPath = path.join(projectRoot, scriptPath.replaceAll('/', path.sep))

        if (await pathExists(absoluteScriptPath)) {
            continue
        }

        documentedMissingScripts.push({
            referencedBy: [...referencedBy].sort(),
            scriptPath,
        })
    }

    documentedMissingScripts.sort((left, right) => left.scriptPath.localeCompare(right.scriptPath))

    const temporaryScripts = scriptEntries.filter((entry) => entry.isTemporary)
    const longTermScripts = scriptEntries.filter((entry) => !entry.isTemporary)
    const documentedOnlyScripts = longTermScripts.filter((entry) => (
        entry.hasStableEntry && !entry.stableSources.some((source) => source === 'package-json' || source === 'workflow')
    ))
    const unreferencedScripts = longTermScripts.filter((entry) => !entry.hasStableEntry)
    const findings = [
        ...temporaryScripts.map((entry) => buildFinding(
            'temporary-script-residue',
            entry.scriptPath,
            '发现临时脚本残留；若只服务单次任务，应在收口前删除或移出长期脚本目录。',
        )),
        ...unreferencedScripts.map((entry) => buildFinding(
            'unreferenced-script',
            entry.scriptPath,
            '未在 package.json、workflow 或治理文档中发现稳定入口，建议确认是否仍应作为长期脚本保留。',
        )),
        ...documentedMissingScripts.map((entry) => buildFinding(
            'documented-missing-script',
            entry.scriptPath,
            `在 ${entry.referencedBy.join('、')} 中声明，但脚本文件不存在。`,
        )),
    ].sort((left, right) => {
        if (left.code !== right.code) {
            return left.code.localeCompare(right.code)
        }

        return left.filePath.localeCompare(right.filePath)
    })

    return {
        directoryBuckets: buildDirectoryBuckets(scriptEntries),
        documentedMissingScripts,
        documentedOnlyScripts,
        findings,
        generatedAt: new Date().toISOString(),
        scriptRoot: toPosixPath(scriptRoot, projectRoot),
        scripts: scriptEntries,
        searchRoots: searchRoots.map((rootPath) => toPosixPath(rootPath, projectRoot)),
        summary: {
            documentedMissingScripts: documentedMissingScripts.length,
            documentedOnlyScripts: documentedOnlyScripts.length,
            longTermScripts: longTermScripts.length,
            scriptsWithStableEntry: longTermScripts.length - unreferencedScripts.length,
            scriptsWithoutStableEntry: unreferencedScripts.length,
            temporaryScripts: temporaryScripts.length,
            totalScripts: scriptEntries.length,
        },
        temporaryScripts,
        unreferencedScripts,
    }
}

function printSection(title, lines) {
    console.info(`${title}:`)

    if (lines.length === 0) {
        console.info('- 无')
        return
    }

    for (const line of lines) {
        console.info(`- ${line}`)
    }
}

export function renderMarkdownReport(report, artifactPath = null) {
    const lines = [
        '# Governance Baseline — script-governance',
        '',
        `- 生成时间: ${report.generatedAt}`,
        `- 脚本根目录: ${report.scriptRoot}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        '',
        '## Summary',
        '',
        `- 总脚本数: ${report.summary.totalScripts}`,
        `- 长期脚本数: ${report.summary.longTermScripts}`,
        `- 已命中稳定入口: ${report.summary.scriptsWithStableEntry}`,
        `- 缺少稳定入口: ${report.summary.scriptsWithoutStableEntry}`,
        `- 仅文档引用: ${report.summary.documentedOnlyScripts}`,
        `- 临时脚本残留: ${report.summary.temporaryScripts}`,
        `- 文档声明但缺失: ${report.summary.documentedMissingScripts}`,
        '',
        '## Findings',
        '',
    ].filter(Boolean)

    if (report.findings.length === 0) {
        lines.push('- 无')
    } else {
        for (const finding of report.findings) {
            lines.push(`- [${finding.code}] ${finding.filePath}: ${finding.message}`)
        }
    }

    lines.push('')
    lines.push('## Documented Only')
    lines.push('')

    if (report.documentedOnlyScripts.length === 0) {
        lines.push('- 无')
    } else {
        for (const entry of report.documentedOnlyScripts) {
            lines.push(`- ${entry.scriptPath} (${entry.stableSources.join(', ')})`)
        }
    }

    lines.push('')
    lines.push('## Directory Buckets')
    lines.push('')

    if (report.directoryBuckets.length === 0) {
        lines.push('- 无')
    } else {
        for (const bucket of report.directoryBuckets) {
            lines.push(`- ${bucket.directory}: total=${bucket.totalScripts}, stable=${bucket.scriptsWithStableEntry}, missing=${bucket.scriptsWithoutStableEntry}, temp=${bucket.temporaryScripts}`)
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
    const { mode, output } = parseArgs(argv)
    const report = await collectScriptGovernanceReport({ mode })
    let artifactPaths = null

    if (output) {
        artifactPaths = await writeArtifacts(report, output)
    }

    console.info(report.findings.length === 0 ? 'Script governance check passed.' : 'Script governance check completed with warnings.')
    printSection('Summary', [
        `总脚本数: ${report.summary.totalScripts}`,
        `长期脚本数: ${report.summary.longTermScripts}`,
        `稳定入口: ${report.summary.scriptsWithStableEntry}`,
        `缺少稳定入口: ${report.summary.scriptsWithoutStableEntry}`,
        `仅文档引用: ${report.summary.documentedOnlyScripts}`,
        `临时脚本残留: ${report.summary.temporaryScripts}`,
        `文档声明但缺失: ${report.summary.documentedMissingScripts}`,
    ])
    printSection('Findings', report.findings.map((finding) => `[${finding.code}] ${finding.filePath}: ${finding.message}`))

    if (artifactPaths) {
        printSection('Artifacts', [
            toPosixPath(artifactPaths.jsonPath),
            toPosixPath(artifactPaths.markdownPath),
        ])
    }

    if (mode === 'error' && report.findings.length > 0) {
        process.exitCode = 1
    }

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
