import { readdir, readFile } from 'node:fs/promises'
import { resolve, join, extname } from 'node:path'

const ROOT_DIR = process.cwd()
const LOCALE_ROOT = resolve(ROOT_DIR, 'i18n', 'locales')
const SOURCE_EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.vue'])
const IGNORED_DIRS = new Set([
    '.git',
    '.nuxt',
    '.output',
    '.vercel',
    'coverage',
    'dist',
    'docs',
    'logs',
    'node_modules',
    'packages',
    'playwright-report',
    'public',
    'static',
    'test-results',
])

const DYNAMIC_KEY_PATTERNS = [
    /^app\./u,
    /^common\.languages\./u,
    /^common\.platforms\./u,
    /^components\.post\.copyright\.licenses\./u,
    /^components\.post\.share\.platforms\./u,
    /^components\.post\.sponsor\.platforms\./u,
    /^pages\.about\.meaning\.features\[\d+\]$/u,
    /^pages\.about\.features\.items\[\d+\]\.(title|desc)$/u,
    /^pages\.admin\.ai\.types\./u,
    /^pages\.admin\.ai\.statuses\./u,
    /^pages\.admin\.ai\.alerts\./u,
    /^pages\.admin\.ai\.charge_statuses\./u,
    /^pages\.admin\.ai\.failure_stages\./u,
    /^pages\.admin\.marketing\.status\./u,
    /^pages\.admin\.posts\.ai\./u,
    /^pages\.admin\.posts\.tts\./u,
    /^pages\.admin\.posts\.wechatsync\./u,
    /^pages\.admin\.settings\.system\.audit_logs\./u,
    /^pages\.admin\.settings\.system\.hints\./u,
    /^pages\.admin\.settings\.system\.keys\./u,
    /^pages\.admin\.settings\.system\.smart_mode\.source_counts\./u,
    /^pages\.admin\.settings\.system\.source_badges\./u,
    /^pages\.admin\.settings\.system\.notifications\.events\./u,
    /^pages\.admin\.snippets\.source_types\./u,
    /^pages\.archives\.months\./u,
    /^pages\.posts\.locked\./u,
    /^pages\.settings\.commercial\.social_platforms\./u,
]

const QUOTED_KEY_REGEX = /['"`]([A-Za-z][\w-]*(?:\.[\w\-[\]]+)+)['"`]/gu

function flattenMessages(source, prefix = '') {
    const result = []

    if (Array.isArray(source)) {
        source.forEach((value, index) => {
            const key = `${prefix}[${index}]`
            if (value && typeof value === 'object') {
                result.push(...flattenMessages(value, key))
                return
            }

            result.push(key)
        })

        return result
    }

    if (!source || typeof source !== 'object') {
        if (prefix) {
            result.push(prefix)
        }
        return result
    }

    Object.entries(source).forEach(([key, value]) => {
        const nextKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object') {
            result.push(...flattenMessages(value, nextKey))
            return
        }

        result.push(nextKey)
    })

    return result
}

async function readJson(filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'))
}

async function getLocaleModules() {
    const locales = await readdir(LOCALE_ROOT, { withFileTypes: true })
    const localeMap = new Map()

    for (const localeEntry of locales) {
        if (!localeEntry.isDirectory()) {
            continue
        }

        const localeDir = join(LOCALE_ROOT, localeEntry.name)
        const modules = await readdir(localeDir, { withFileTypes: true })
        const moduleMap = new Map()

        for (const moduleEntry of modules) {
            if (!moduleEntry.isFile() || extname(moduleEntry.name) !== '.json') {
                continue
            }

            const moduleName = moduleEntry.name.replace(/\.json$/u, '')
            const modulePath = join(localeDir, moduleEntry.name)
            const keys = flattenMessages(await readJson(modulePath))
            moduleMap.set(moduleName, keys.sort())
        }

        localeMap.set(localeEntry.name, moduleMap)
    }

    return localeMap
}

async function walkSourceFiles(currentDir, files = []) {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
        if (entry.name.startsWith('.')) {
            if (!['.github'].includes(entry.name)) {
                continue
            }
        }

        const absolutePath = join(currentDir, entry.name)
        if (entry.isDirectory()) {
            if (IGNORED_DIRS.has(entry.name)) {
                continue
            }

            await walkSourceFiles(absolutePath, files)
            continue
        }

        if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
            files.push(absolutePath)
        }
    }

    return files
}

async function getReferencedKeys() {
    const files = await walkSourceFiles(ROOT_DIR)
    const referencedKeys = new Set()

    for (const filePath of files) {
        const content = await readFile(filePath, 'utf8')
        QUOTED_KEY_REGEX.lastIndex = 0

        for (const match of content.matchAll(QUOTED_KEY_REGEX)) {
            referencedKeys.add(match[1])
        }
    }

    return referencedKeys
}

function formatSection(title, items) {
    if (items.length === 0) {
        return `${title}: none`
    }

    return `${title}:\n${items.map((item) => `  - ${item}`).join('\n')}`
}

function collectMissingParity(localeModules) {
    const localeCodes = [...localeModules.keys()].sort()
    const localeNames = localeCodes.filter((locale) => locale)

    if (localeNames.length < 2) {
        return []
    }

    const [baseLocale, ...otherLocales] = localeNames
    const baseModules = localeModules.get(baseLocale)
    const results = []

    for (const otherLocale of otherLocales) {
        const currentModules = localeModules.get(otherLocale)
        const moduleNames = new Set([...baseModules.keys(), ...currentModules.keys()])

        for (const moduleName of moduleNames) {
            const baseKeys = new Set(baseModules.get(moduleName) || [])
            const currentKeys = new Set(currentModules.get(moduleName) || [])

            const missingInCurrent = [...baseKeys].filter((key) => !currentKeys.has(key))
            const missingInBase = [...currentKeys].filter((key) => !baseKeys.has(key))

            missingInCurrent.forEach((key) => {
                results.push(`${otherLocale}/${moduleName}.json is missing ${key}`)
            })
            missingInBase.forEach((key) => {
                results.push(`${baseLocale}/${moduleName}.json is missing ${key}`)
            })
        }
    }

    return results.sort()
}

function collectUnusedCandidates(localeModules, referencedKeys) {
    const results = []

    for (const [localeCode, modules] of localeModules.entries()) {
        for (const [moduleName, keys] of modules.entries()) {
            for (const key of keys) {
                if (referencedKeys.has(key)) {
                    continue
                }

                if (DYNAMIC_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
                    continue
                }

                results.push(`${localeCode}/${moduleName}.json -> ${key}`)
            }
        }
    }

    return results.sort()
}

async function main() {
    const localeModules = await getLocaleModules()
    const referencedKeys = await getReferencedKeys()

    const missingParity = collectMissingParity(localeModules)
    const unusedCandidates = collectUnusedCandidates(localeModules, referencedKeys)

    console.info(formatSection('Missing parity keys', missingParity))
    console.info('')
    console.info(formatSection('Unused candidate keys', unusedCandidates))

    if (process.argv.includes('--fail-on-missing') && missingParity.length > 0) {
        process.exitCode = 1
    }
}

main().catch((error) => {
    console.error('Failed to audit locale keys:', error)
    process.exitCode = 1
})
