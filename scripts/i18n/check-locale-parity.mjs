import { readdir, readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const ROOT_DIR = process.cwd()
const LOCALE_ROOT = resolve(ROOT_DIR, 'i18n', 'locales')
const DEFAULT_BASE_LOCALE = 'zh-CN'

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
        baseLocale: DEFAULT_BASE_LOCALE,
        locales: [],
        modules: [],
        failOnDiff: false,
        format: 'text',
    }

    for (const argument of argv) {
        if (argument === '--fail-on-diff') {
            options.failOnDiff = true
            continue
        }

        if (argument.startsWith('--base-locale=')) {
            options.baseLocale = argument.slice('--base-locale='.length).trim() || DEFAULT_BASE_LOCALE
            continue
        }

        if (argument.startsWith('--locale=')) {
            options.locales.push(...parseListArgument(argument.slice('--locale='.length)))
            continue
        }

        if (argument.startsWith('--module=')) {
            options.modules.push(...parseListArgument(argument.slice('--module='.length)))
            continue
        }

        if (argument.startsWith('--format=')) {
            const nextFormat = argument.slice('--format='.length).trim()
            options.format = nextFormat === 'json' ? 'json' : 'text'
        }
    }

    options.locales = [...new Set(options.locales)]
    options.modules = [...new Set(options.modules)]
    return options
}

function flattenMessages(source, prefix = '') {
    const result = []

    if (Array.isArray(source)) {
        source.forEach((value, index) => {
            const nextKey = `${prefix}[${index}]`

            if (value && typeof value === 'object') {
                result.push(...flattenMessages(value, nextKey))
                return
            }

            result.push(nextKey)
        })

        return result
    }

    if (!source || typeof source !== 'object') {
        if (prefix) {
            result.push(prefix)
        }

        return result
    }

    for (const [key, value] of Object.entries(source)) {
        const nextKey = prefix ? `${prefix}.${key}` : key

        if (value && typeof value === 'object') {
            result.push(...flattenMessages(value, nextKey))
            continue
        }

        result.push(nextKey)
    }

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
            const keys = flattenMessages(await readJson(modulePath)).sort()
            moduleMap.set(moduleName, keys)
        }

        localeMap.set(localeEntry.name, moduleMap)
    }

    return localeMap
}

function compareLocaleModules(baseLocale, targetLocale, baseModules, targetModules, requestedModules) {
    const moduleNames = requestedModules.length > 0
        ? requestedModules
        : [...new Set([...baseModules.keys(), ...targetModules.keys()])].sort()

    const moduleDiffs = []

    for (const moduleName of moduleNames) {
        const baseKeys = new Set(baseModules.get(moduleName) || [])
        const targetKeys = new Set(targetModules.get(moduleName) || [])

        const missingKeys = [...baseKeys].filter((key) => !targetKeys.has(key)).sort()
        const extraKeys = [...targetKeys].filter((key) => !baseKeys.has(key)).sort()

        if (missingKeys.length === 0 && extraKeys.length === 0) {
            continue
        }

        moduleDiffs.push({
            moduleName,
            missingKeys,
            extraKeys,
            baseModuleExists: baseModules.has(moduleName),
            targetModuleExists: targetModules.has(moduleName),
        })
    }

    return {
        baseLocale,
        targetLocale,
        moduleDiffs,
        missingCount: moduleDiffs.reduce((sum, item) => sum + item.missingKeys.length, 0),
        extraCount: moduleDiffs.reduce((sum, item) => sum + item.extraKeys.length, 0),
    }
}

function validateRequestedModules(baseModules, requestedModules, baseLocale) {
    if (requestedModules.length === 0) {
        return
    }

    const unknownModules = requestedModules.filter((moduleName) => !baseModules.has(moduleName))

    if (unknownModules.length > 0) {
        throw new Error(`Unknown module selector(s) for ${baseLocale}: ${unknownModules.join(', ')}`)
    }
}

function formatTextReport(report) {
    if (report.moduleDiffs.length === 0) {
        return `${report.targetLocale}: parity with ${report.baseLocale}`
    }

    const lines = [
        `${report.targetLocale}: ${report.moduleDiffs.length} module(s) differ from ${report.baseLocale} (${report.missingCount} missing / ${report.extraCount} extra keys)`,
    ]

    for (const moduleDiff of report.moduleDiffs) {
        lines.push(`  - ${moduleDiff.moduleName}`)

        if (!moduleDiff.targetModuleExists && moduleDiff.baseModuleExists) {
            lines.push(`    target module missing; expected ${moduleDiff.missingKeys.length} key(s)`)
        }

        if (!moduleDiff.baseModuleExists && moduleDiff.targetModuleExists) {
            lines.push(`    module not present in ${report.baseLocale}; found ${moduleDiff.extraKeys.length} extra key(s)`)
        }

        if (moduleDiff.missingKeys.length > 0) {
            lines.push(`    missing (${moduleDiff.missingKeys.length}):`)
            for (const key of moduleDiff.missingKeys) {
                lines.push(`      - ${key}`)
            }
        }

        if (moduleDiff.extraKeys.length > 0) {
            lines.push(`    extra (${moduleDiff.extraKeys.length}):`)
            for (const key of moduleDiff.extraKeys) {
                lines.push(`      - ${key}`)
            }
        }
    }

    return lines.join('\n')
}

async function main() {
    const options = parseArguments(process.argv.slice(2))
    const localeModules = await getLocaleModules()
    const baseModules = localeModules.get(options.baseLocale)

    if (!baseModules) {
        throw new Error(`Base locale ${options.baseLocale} does not exist under i18n/locales`)
    }

    validateRequestedModules(baseModules, options.modules, options.baseLocale)

    const targetLocales = options.locales.length > 0
        ? options.locales
        : [...localeModules.keys()].filter((localeCode) => localeCode !== options.baseLocale).sort()

    const reports = []

    for (const targetLocale of targetLocales) {
        const targetModules = localeModules.get(targetLocale)

        if (!targetModules) {
            reports.push({
                baseLocale: options.baseLocale,
                targetLocale,
                moduleDiffs: [{
                    moduleName: '*',
                    missingKeys: [],
                    extraKeys: [],
                    baseModuleExists: false,
                    targetModuleExists: false,
                }],
                missingCount: 0,
                extraCount: 0,
                missingLocale: true,
            })
            continue
        }

        reports.push(compareLocaleModules(options.baseLocale, targetLocale, baseModules, targetModules, options.modules))
    }

    if (options.format === 'json') {
        console.info(JSON.stringify(reports, null, 2))
    } else {
        for (const report of reports) {
            if (report.missingLocale) {
                console.info(`${report.targetLocale}: locale directory missing`)
                continue
            }

            console.info(formatTextReport(report))
        }
    }

    if (options.failOnDiff && reports.some((report) => report.missingLocale || report.moduleDiffs.length > 0)) {
        process.exitCode = 1
    }
}

main().catch((error) => {
    console.error('Failed to check locale parity:', error)
    process.exitCode = 1
})
