import { readdir, readFile } from 'node:fs/promises'
import { resolve, join, extname } from 'node:path'

const ROOT_DIR = process.cwd()
const LOCALE_ROOT = resolve(ROOT_DIR, 'i18n', 'locales')
const SOURCE_EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.vue'])
const DEFAULT_OUTPUT_MODE = 'all'
const DEFAULT_SUMMARY_LIMIT = 10
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

function parseListArgument(rawValue) {
    if (!rawValue) {
        return []
    }

    return rawValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

function parseArguments(argv) {
    const options = {
        failOnMissing: false,
        failOnUnused: false,
        locales: [],
        modules: [],
        only: DEFAULT_OUTPUT_MODE,
        summaryLimit: DEFAULT_SUMMARY_LIMIT,
    }

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]

        if (arg === '--fail-on-missing') {
            options.failOnMissing = true
            continue
        }

        if (arg === '--fail-on-unused') {
            options.failOnUnused = true
            continue
        }

        if (arg.startsWith('--locale=')) {
            options.locales.push(...parseListArgument(arg.slice('--locale='.length)))
            continue
        }

        if (arg === '--locale') {
            options.locales.push(...parseListArgument(argv[index + 1]))
            index += 1
            continue
        }

        if (arg.startsWith('--module=')) {
            options.modules.push(...parseListArgument(arg.slice('--module='.length)))
            continue
        }

        if (arg === '--module') {
            options.modules.push(...parseListArgument(argv[index + 1]))
            index += 1
            continue
        }

        if (arg.startsWith('--only=')) {
            options.only = arg.slice('--only='.length).trim() || DEFAULT_OUTPUT_MODE
            continue
        }

        if (arg === '--only') {
            options.only = argv[index + 1]?.trim() || DEFAULT_OUTPUT_MODE
            index += 1
            continue
        }

        if (arg.startsWith('--summary-limit=')) {
            options.summaryLimit = Number(arg.slice('--summary-limit='.length))
            continue
        }

        if (arg === '--summary-limit') {
            options.summaryLimit = Number(argv[index + 1])
            index += 1
        }
    }

    options.locales = [...new Set(options.locales)].sort()
    options.modules = [...new Set(options.modules)].sort()

    if (!['all', 'missing', 'unused'].includes(options.only)) {
        throw new Error(`Unsupported --only value: ${options.only}`)
    }

    if (!Number.isInteger(options.summaryLimit) || options.summaryLimit < 0) {
        throw new Error(`Expected --summary-limit to be a non-negative integer, received: ${options.summaryLimit}`)
    }

    return options
}

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

async function getLocaleModules(options) {
    const locales = await readdir(LOCALE_ROOT, { withFileTypes: true })
    const localeMap = new Map()
    const availableLocales = locales
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()

    const unknownLocales = options.locales.filter((localeCode) => !availableLocales.includes(localeCode))
    if (unknownLocales.length > 0) {
        throw new Error(`Unknown locale selector(s): ${unknownLocales.join(', ')}`)
    }

    for (const localeEntry of locales) {
        if (!localeEntry.isDirectory()) {
            continue
        }

        if (options.locales.length > 0 && !options.locales.includes(localeEntry.name)) {
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
            if (options.modules.length > 0 && !options.modules.includes(moduleName)) {
                continue
            }

            const modulePath = join(localeDir, moduleEntry.name)
            const keys = flattenMessages(await readJson(modulePath))
            moduleMap.set(moduleName, keys.sort())
        }

        localeMap.set(localeEntry.name, moduleMap)
    }

    if (options.modules.length > 0) {
        const availableModules = new Set()

        for (const modules of localeMap.values()) {
            for (const moduleName of modules.keys()) {
                availableModules.add(moduleName)
            }
        }

        const unknownModules = options.modules.filter((moduleName) => !availableModules.has(moduleName))
        if (unknownModules.length > 0) {
            throw new Error(`Unknown module selector(s): ${unknownModules.join(', ')}`)
        }
    }

    return localeMap
}

function shouldScanSourceFile(filePath) {
    return !(/(?:^|[/\\])tests(?:[/\\]|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(filePath))
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

        if (SOURCE_EXTENSIONS.has(extname(entry.name)) && shouldScanSourceFile(absolutePath)) {
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
                results.push({
                    key,
                    localeCode: otherLocale,
                    moduleName,
                })
            })
            missingInBase.forEach((key) => {
                results.push({
                    key,
                    localeCode: baseLocale,
                    moduleName,
                })
            })
        }
    }

    return results.sort((left, right) => {
        const leftPath = `${left.localeCode}/${left.moduleName}.json`
        const rightPath = `${right.localeCode}/${right.moduleName}.json`
        return leftPath.localeCompare(rightPath) || left.key.localeCompare(right.key)
    })
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

                results.push({
                    key,
                    localeCode,
                    moduleName,
                })
            }
        }
    }

    return results.sort((left, right) => {
        const leftPath = `${left.localeCode}/${left.moduleName}.json`
        const rightPath = `${right.localeCode}/${right.moduleName}.json`
        return leftPath.localeCompare(rightPath) || left.key.localeCompare(right.key)
    })
}

function formatFinding(item, kind) {
    const prefix = `${item.localeCode}/${item.moduleName}.json`
    return kind === 'missing'
        ? `${prefix} is missing ${item.key}`
        : `${prefix} -> ${item.key}`
}

function summarizeFindings(items, options) {
    const moduleHotspots = new Map()
    const localeCounts = new Map()

    for (const item of items) {
        const localeCount = localeCounts.get(item.localeCode) || 0
        localeCounts.set(item.localeCode, localeCount + 1)

        const hotspotKey = `${item.localeCode}/${item.moduleName}.json`
        const hotspotCount = moduleHotspots.get(hotspotKey) || 0
        moduleHotspots.set(hotspotKey, hotspotCount + 1)
    }

    return {
        localeCounts: [...localeCounts.entries()]
            .sort((left, right) => left[0].localeCompare(right[0]))
            .map(([localeCode, count]) => `${localeCode}: ${count}`),
        scannedLocales: options.locales.length > 0 ? options.locales : [...options.availableLocales],
        scannedModules: options.modules.length > 0 ? options.modules : [...options.availableModules],
        topHotspots: [...moduleHotspots.entries()]
            .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
            .slice(0, options.summaryLimit)
            .map(([modulePath, count]) => `${modulePath}: ${count}`),
        total: items.length,
    }
}

function formatSummary(title, summary) {
    const summaryLines = [
        `${title}:`,
        `  - total: ${summary.total}`,
        `  - scanned locales: ${summary.scannedLocales.join(', ') || 'none'}`,
        `  - scanned modules: ${summary.scannedModules.join(', ') || 'none'}`,
        `  - per-locale: ${summary.localeCounts.join(', ') || 'none'}`,
    ]

    if (summary.topHotspots.length > 0) {
        summaryLines.push('  - top hotspots:')
        summary.topHotspots.forEach((hotspot) => {
            summaryLines.push(`    - ${hotspot}`)
        })
    }

    return summaryLines.join('\n')
}

async function main() {
    const options = parseArguments(process.argv.slice(2))
    const localeModules = await getLocaleModules(options)
    const referencedKeys = await getReferencedKeys()
    const availableLocales = [...localeModules.keys()].sort()
    const availableModules = [...new Set(
        [...localeModules.values()].flatMap((modules) => [...modules.keys()]),
    )].sort()

    const missingParity = collectMissingParity(localeModules)
    const unusedCandidates = collectUnusedCandidates(localeModules, referencedKeys)
    const showMissing = options.only === 'all' || options.only === 'missing'
    const showUnused = options.only === 'all' || options.only === 'unused'

    if (showMissing) {
        console.info(formatSummary('Missing parity summary', summarizeFindings(missingParity, {
            availableLocales,
            availableModules,
            locales: options.locales,
            modules: options.modules,
            summaryLimit: options.summaryLimit,
        })))
        console.info('')
        console.info(formatSection('Missing parity keys', missingParity.map((item) => formatFinding(item, 'missing'))))
    }

    if (showMissing && showUnused) {
        console.info('')
    }

    if (showUnused) {
        console.info(formatSummary('Unused candidate summary', summarizeFindings(unusedCandidates, {
            availableLocales,
            availableModules,
            locales: options.locales,
            modules: options.modules,
            summaryLimit: options.summaryLimit,
        })))
        console.info('')
        console.info(formatSection('Unused candidate keys', unusedCandidates.map((item) => formatFinding(item, 'unused'))))
    }

    if (options.failOnMissing && missingParity.length > 0) {
        process.exitCode = 1
    }

    if (options.failOnUnused && unusedCandidates.length > 0) {
        process.exitCode = 1
    }
}

main().catch((error) => {
    console.error('Failed to audit locale keys:', error)
    process.exitCode = 1
})
