import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const REGRESSION_WINDOW_RELATIVE_PATH = path.join('docs', 'reports', 'regression', 'current.md')
const FIRST_RECORD_HEADING_PATTERN = /^## \d{4}-\d{2}-\d{2} /mu

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

function buildManagedEntryBlock({ body, id, title }) {
    return [
        `<!-- regression-window:start:${id} -->`,
        `## ${title}`,
        '',
        body.trim(),
        '',
        `<!-- regression-window:end:${id} -->`,
    ].join('\n')
}

export function resolveRegressionWindowPath(projectRoot = process.cwd()) {
    return path.resolve(projectRoot, REGRESSION_WINDOW_RELATIVE_PATH)
}

export function toPosixRelativePath(fromFilePath, toFilePath) {
    return path.relative(path.dirname(fromFilePath), toFilePath).split(path.sep).join('/')
}

export function upsertRegressionWindowContent(content, entry) {
    const nextContent = content.trimEnd()
    const block = buildManagedEntryBlock(entry)
    const startMarker = `<!-- regression-window:start:${entry.id} -->`
    const endMarker = `<!-- regression-window:end:${entry.id} -->`
    const markerPattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\n?`, 'u')

    if (markerPattern.test(nextContent)) {
        return `${nextContent.replace(markerPattern, `${block}\n`).trimEnd()}\n`
    }

    const firstRecordMatch = FIRST_RECORD_HEADING_PATTERN.exec(nextContent)

    if (!firstRecordMatch) {
        return `${nextContent}\n\n${block}\n`
    }

    const before = nextContent.slice(0, firstRecordMatch.index).trimEnd()
    const after = nextContent.slice(firstRecordMatch.index).trimStart()

    return `${before}\n\n${block}\n\n${after}`
}

export async function upsertRegressionWindowEntry(entry, options = {}) {
    const projectRoot = options.projectRoot ?? process.cwd()
    const regressionWindowPath = options.regressionWindowPath ?? resolveRegressionWindowPath(projectRoot)
    const currentContent = await readFile(regressionWindowPath, 'utf8')
    const nextContent = upsertRegressionWindowContent(currentContent, entry)

    await writeFile(regressionWindowPath, nextContent, 'utf8')

    return {
        regressionWindowPath,
    }
}
