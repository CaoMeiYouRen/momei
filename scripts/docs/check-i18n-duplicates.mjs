import { readdir, access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')
const docsRoot = path.join(projectRoot, 'docs')
const i18nRoot = path.join(docsRoot, 'i18n')
const localePattern = /^[a-z]{2}(?:-[A-Z]{2})$/

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

async function listLocaleDirectories(baseDir) {
    if (!(await pathExists(baseDir))) {
        return []
    }

    const entries = await readdir(baseDir, { withFileTypes: true })
    return entries
        .filter((entry) => entry.isDirectory() && localePattern.test(entry.name))
        .map((entry) => entry.name)
}

async function walkMarkdownFiles(baseDir, currentDir = '') {
    const targetDir = path.join(baseDir, currentDir)
    const entries = await readdir(targetDir, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const relativePath = path.join(currentDir, entry.name)

        if (entry.isDirectory()) {
            files.push(...await walkMarkdownFiles(baseDir, relativePath))
            continue
        }

        if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(relativePath)
        }
    }

    return files
}

function toDocPath(...segments) {
    return path.posix.join(...segments.map((segment) => segment.replaceAll('\\', '/')))
}

async function main() {
    const locales = [...new Set([
        ...await listLocaleDirectories(docsRoot),
        ...await listLocaleDirectories(i18nRoot),
    ])].sort()

    const duplicates = []

    for (const locale of locales) {
        const legacyRoot = path.join(docsRoot, locale)
        const translatedRoot = path.join(i18nRoot, locale)

        if (!(await pathExists(legacyRoot)) || !(await pathExists(translatedRoot))) {
            continue
        }

        const legacyFiles = await walkMarkdownFiles(legacyRoot)

        for (const relativeFile of legacyFiles) {
            const translatedFile = path.join(translatedRoot, relativeFile)

            if (await pathExists(translatedFile)) {
                duplicates.push({
                    locale,
                    relativeFile: relativeFile.replaceAll('\\', '/'),
                    legacyPath: toDocPath('docs', locale, relativeFile),
                    translatedPath: toDocPath('docs', 'i18n', locale, relativeFile),
                })
            }
        }
    }

    if (duplicates.length === 0) {
        console.log('docs i18n duplicate check passed: no legacy/i18n duplicate translated pages found.')
        return
    }

    console.error('docs i18n duplicate check failed: found translated pages duplicated in both legacy and i18n directories:')

    for (const duplicate of duplicates) {
        console.error(`- ${duplicate.locale}/${duplicate.relativeFile}`)
        console.error(`  legacy: ${duplicate.legacyPath}`)
        console.error(`  i18n:   ${duplicate.translatedPath}`)
    }

    process.exitCode = 1
}

await main()
