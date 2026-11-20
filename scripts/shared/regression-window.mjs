import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const REGRESSION_WINDOW_RELATIVE_PATH = path.join('docs', 'reports', 'regression', 'current.md')
const FIRST_RECORD_HEADING_PATTERN = /^## \d{4}-\d{2}-\d{2} /mu
const FIRST_MANAGED_START_MARKER = '<!-- regression-window:start:'

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

export function findManagedEntryRange(content, id) {
    const startMarker = `<!-- regression-window:start:${id} -->`
    const endMarker = `<!-- regression-window:end:${id} -->`
    const start = content.indexOf(startMarker)

    if (start < 0) {
        return null
    }

    const end = content.indexOf(endMarker, start + startMarker.length)

    if (end < 0) {
        return null
    }

    const inner = content.slice(start + startMarker.length, end)

    if (inner.includes(FIRST_MANAGED_START_MARKER)) {
        throw new Error(`Nested regression window blocks detected around id "${id}"; normalize current.md before upserting`)
    }

    return {
        end: end + endMarker.length,
        start,
    }
}

export function resolveManagedInsertionIndex(content) {
    const firstManagedIndex = content.indexOf(FIRST_MANAGED_START_MARKER)
    const firstRecordMatch = FIRST_RECORD_HEADING_PATTERN.exec(content)
    const candidates = [firstManagedIndex, firstRecordMatch?.index]
        .filter((value) => typeof value === 'number' && value >= 0)

    return candidates.length > 0 ? Math.min(...candidates) : -1
}

export function upsertRegressionWindowContent(content, entry) {
    const nextContent = content.trimEnd()
    const block = buildManagedEntryBlock(entry)
    const range = findManagedEntryRange(nextContent, entry.id)

    if (range) {
        const merged = `${nextContent.slice(0, range.start)}${block}${nextContent.slice(range.end)}`
        return `${merged.trimEnd()}\n`
    }

    const insertAt = resolveManagedInsertionIndex(nextContent)

    if (insertAt < 0) {
        return `${nextContent}\n\n${block}\n`
    }

    const before = nextContent.slice(0, insertAt).trimEnd()
    const after = nextContent.slice(insertAt).trimStart()

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
