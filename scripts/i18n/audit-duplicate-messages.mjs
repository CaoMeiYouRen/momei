import { readdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { parseCliOptions } from '../shared/cli.mjs'

const ROOT_DIR = process.cwd()
const LOCALE_ROOT = resolve(ROOT_DIR, 'i18n', 'locales')
const DEFAULT_FORMAT = 'text'
const DEFAULT_LIMIT = 50
const DEFAULT_MIN_GROUP_SIZE = 2

function parseListArgument(rawValue) {
    if (!rawValue) {
        return []
    }

    return rawValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

function parseNumberArgument(rawValue, fallbackValue) {
    const parsedValue = Number(rawValue)

    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
        throw new Error(`Expected a non-negative integer, received: ${rawValue}`)
    }

    return Number.isNaN(parsedValue) ? fallbackValue : parsedValue
}

function parseArguments(argv) {
    const options = parseCliOptions(argv, {
        defaults: {
            crossModuleOnly: false,
            format: DEFAULT_FORMAT,
            limit: DEFAULT_LIMIT,
            locales: [],
            minGroupSize: DEFAULT_MIN_GROUP_SIZE,
            modules: [],
        },
        flags: {
            '--cross-module-only': { key: 'crossModuleOnly' },
        },
        values: {
            '--format': {
                key: 'format',
                allowedValues: ['json', 'markdown', 'text'],
                invalidMessage: () => 'Unsupported format value',
                parse: (value) => value.trim() || DEFAULT_FORMAT,
            },
            '--limit': {
                key: 'limit',
                parse: (value) => parseNumberArgument(value, DEFAULT_LIMIT),
            },
            '--locale': {
                key: 'locales',
                parse: parseListArgument,
                collect: (current = [], next = []) => [...current, ...next],
            },
            '--min-group-size': {
                key: 'minGroupSize',
                parse: (value) => {
                    const parsedValue = parseNumberArgument(value, DEFAULT_MIN_GROUP_SIZE)

                    if (parsedValue < 2) {
                        throw new Error('--min-group-size must be at least 2')
                    }

                    return parsedValue
                },
            },
            '--module': {
                key: 'modules',
                parse: parseListArgument,
                collect: (current = [], next = []) => [...current, ...next],
            },
            '--output': {
                key: 'outputPath',
                parse: (value) => value.trim(),
            },
        },
    })

    options.locales = [...new Set(options.locales)].sort()
    options.modules = [...new Set(options.modules)].sort()

    return options
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0
}

function flattenMessageEntries(source, prefix = '') {
    const result = []

    if (Array.isArray(source)) {
        source.forEach((value, index) => {
            const nextKey = `${prefix}[${index}]`

            if (value && typeof value === 'object') {
                result.push(...flattenMessageEntries(value, nextKey))
                return
            }

            if (isNonEmptyString(value)) {
                result.push({ key: nextKey, value })
            }
        })

        return result
    }

    if (!source || typeof source !== 'object') {
        if (prefix && isNonEmptyString(source)) {
            result.push({ key: prefix, value: source })
        }

        return result
    }

    for (const [key, value] of Object.entries(source)) {
        const nextKey = prefix ? `${prefix}.${key}` : key

        if (value && typeof value === 'object') {
            result.push(...flattenMessageEntries(value, nextKey))
            continue
        }

        if (isNonEmptyString(value)) {
            result.push({ key: nextKey, value })
        }
    }

    return result
}

async function readJson(filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'))
}

async function getLocaleMessageMaps(requestedModules) {
    const localeEntries = await readdir(LOCALE_ROOT, { withFileTypes: true })
    const localeMessageMaps = new Map()

    for (const localeEntry of localeEntries) {
        if (!localeEntry.isDirectory()) {
            continue
        }

        const localeDir = join(LOCALE_ROOT, localeEntry.name)
        const moduleEntries = await readdir(localeDir, { withFileTypes: true })
        const messageMap = new Map()
        const moduleNames = []

        for (const moduleEntry of moduleEntries) {
            if (!moduleEntry.isFile() || extname(moduleEntry.name) !== '.json') {
                continue
            }

            const moduleName = moduleEntry.name.replace(/\.json$/u, '')
            if (requestedModules.length > 0 && !requestedModules.includes(moduleName)) {
                continue
            }

            const modulePath = join(localeDir, moduleEntry.name)
            const entries = flattenMessageEntries(await readJson(modulePath))

            moduleNames.push(moduleName)

            for (const entry of entries) {
                messageMap.set(entry.key, {
                    moduleName,
                    value: entry.value,
                })
            }
        }

        localeMessageMaps.set(localeEntry.name, {
            messageMap,
            moduleNames: moduleNames.sort(),
        })
    }

    return localeMessageMaps
}

function ensureRequestedLocales(localeMessageMaps, requestedLocales) {
    if (requestedLocales.length === 0) {
        return
    }

    const missingLocales = requestedLocales.filter((localeCode) => !localeMessageMaps.has(localeCode))

    if (missingLocales.length > 0) {
        throw new Error(`Unknown locale selector(s): ${missingLocales.join(', ')}`)
    }
}

function ensureRequestedModules(localeMessageMaps, requestedModules) {
    if (requestedModules.length === 0) {
        return
    }

    const allModules = new Set()

    for (const localeData of localeMessageMaps.values()) {
        localeData.moduleNames.forEach((moduleName) => allModules.add(moduleName))
    }

    const unknownModules = requestedModules.filter((moduleName) => !allModules.has(moduleName))

    if (unknownModules.length > 0) {
        throw new Error(`Unknown module selector(s): ${unknownModules.join(', ')}`)
    }
}

function getTargetLocales(localeMessageMaps, requestedLocales) {
    if (requestedLocales.length > 0) {
        return requestedLocales
    }

    return [...localeMessageMaps.keys()].sort()
}

function getSharedKeys(localeCodes, localeMessageMaps) {
    const unionKeys = new Set()
    let sharedKeys = null

    for (const localeCode of localeCodes) {
        const messageMap = localeMessageMaps.get(localeCode)?.messageMap
        const localeKeys = new Set(messageMap?.keys() || [])

        localeKeys.forEach((key) => unionKeys.add(key))

        if (sharedKeys === null) {
            sharedKeys = localeKeys
            continue
        }

        sharedKeys = new Set([...sharedKeys].filter((key) => localeKeys.has(key)))
    }

    return {
        incompleteKeyCount: unionKeys.size - (sharedKeys?.size || 0),
        sharedKeys: [...(sharedKeys || [])].sort(),
        totalDistinctKeys: unionKeys.size,
    }
}

function buildDuplicateGroups(localeCodes, localeMessageMaps, sharedKeys, minGroupSize) {
    const groupMap = new Map()

    for (const key of sharedKeys) {
        const signatureValues = localeCodes.map((localeCode) => localeMessageMaps.get(localeCode).messageMap.get(key)?.value)
        const signatureKey = JSON.stringify(signatureValues)
        const moduleName = localeMessageMaps.get(localeCodes[0]).messageMap.get(key)?.moduleName || 'unknown'
        const currentGroup = groupMap.get(signatureKey)

        if (currentGroup) {
            currentGroup.keys.push({ key, moduleName })
            continue
        }

        groupMap.set(signatureKey, {
            keys: [{ key, moduleName }],
            values: Object.fromEntries(localeCodes.map((localeCode, index) => [localeCode, signatureValues[index]])),
        })
    }

    return [...groupMap.values()]
        .filter((group) => group.keys.length >= minGroupSize)
        .map((group) => {
            const uniqueModules = [...new Set(group.keys.map((item) => item.moduleName))].sort()

            return {
                crossModule: uniqueModules.length > 1,
                keyCount: group.keys.length,
                keys: group.keys.sort((left, right) => left.key.localeCompare(right.key)),
                modules: uniqueModules,
                values: group.values,
            }
        })
        .sort((left, right) => {
            if (left.crossModule !== right.crossModule) {
                return Number(right.crossModule) - Number(left.crossModule)
            }

            if (left.modules.length !== right.modules.length) {
                return right.modules.length - left.modules.length
            }

            if (left.keyCount !== right.keyCount) {
                return right.keyCount - left.keyCount
            }

            return left.keys[0]?.key.localeCompare(right.keys[0]?.key) || 0
        })
}

function getVisibleGroups(groups, limit, crossModuleOnly) {
    const filteredGroups = crossModuleOnly
        ? groups.filter((group) => group.crossModule)
        : groups

    if (limit === 0) {
        return filteredGroups
    }

    return filteredGroups.slice(0, limit)
}

function buildReport(options, groups, summaryInput) {
    const visibleGroups = getVisibleGroups(groups, options.limit, options.crossModuleOnly)
    const crossModuleGroupCount = groups.filter((group) => group.crossModule).length
    const totalKeysInGroups = groups.reduce((sum, group) => sum + group.keyCount, 0)

    return {
        filters: {
            crossModuleOnly: options.crossModuleOnly,
            limit: options.limit,
            minGroupSize: options.minGroupSize,
            modules: options.modules,
        },
        groups: visibleGroups,
        summary: {
            crossModuleGroupCount,
            duplicateGroupCount: groups.length,
            incompleteKeyCount: summaryInput.incompleteKeyCount,
            locales: summaryInput.localeCodes,
            sharedKeyCount: summaryInput.sharedKeyCount,
            shownGroupCount: visibleGroups.length,
            totalDistinctKeyCount: summaryInput.totalDistinctKeys,
            totalKeysInGroups,
        },
    }
}

function formatGroupHeader(index, group) {
    const moduleText = group.modules.length === 1
        ? `${group.modules[0]} module`
        : `${group.modules.length} modules`

    return `${index + 1}. ${group.keyCount} keys across ${moduleText}${group.crossModule ? ' (cross-module)' : ''}`
}

function formatValues(values) {
    return Object.entries(values)
        .map(([localeCode, value]) => `      - ${localeCode}: ${value}`)
        .join('\n')
}

function formatKeys(keys) {
    return keys
        .map((item) => `      - ${item.key} [${item.moduleName}]`)
        .join('\n')
}

function formatTextReport(report) {
    const { groups, summary } = report
    const lines = [
        `Scanned ${summary.locales.length} locale(s): ${summary.locales.join(', ')}`,
        `Shared non-empty string keys: ${summary.sharedKeyCount} / ${summary.totalDistinctKeyCount} total distinct keys`,
        `Duplicate groups that match in every locale: ${summary.duplicateGroupCount} (${summary.totalKeysInGroups} keys involved, ${summary.crossModuleGroupCount} cross-module)`,
        `Groups shown: ${summary.shownGroupCount}${report.filters.crossModuleOnly ? ' (cross-module only)' : ''}`,
    ]

    if (summary.incompleteKeyCount > 0) {
        lines.push(`Keys excluded because they are not present in every scanned locale: ${summary.incompleteKeyCount}`)
    }

    if (groups.length === 0) {
        lines.push('No duplicate groups matched the current filters.')
        return lines.join('\n')
    }

    groups.forEach((group, index) => {
        lines.push('')
        lines.push(formatGroupHeader(index, group))
        lines.push(`   modules: ${group.modules.join(', ')}`)
        lines.push('   keys:')
        lines.push(formatKeys(group.keys))
        lines.push('   values:')
        lines.push(formatValues(group.values))
    })

    return lines.join('\n')
}

function formatMarkdownReport(report) {
    const { groups, summary } = report
    const lines = [
        '# Duplicate Message Audit',
        '',
        '## Summary',
        '',
        `- Locales: ${summary.locales.join(', ')}`,
        `- Shared non-empty string keys: ${summary.sharedKeyCount} / ${summary.totalDistinctKeyCount}`,
        `- Duplicate groups that match in every locale: ${summary.duplicateGroupCount}`,
        `- Cross-module groups: ${summary.crossModuleGroupCount}`,
        `- Keys involved in duplicate groups: ${summary.totalKeysInGroups}`,
        `- Groups shown: ${summary.shownGroupCount}${report.filters.crossModuleOnly ? ' (cross-module only)' : ''}`,
        `- Keys excluded because they are not present in every scanned locale: ${summary.incompleteKeyCount}`,
    ]

    if (groups.length === 0) {
        lines.push('', '## Result', '', 'No duplicate groups matched the current filters.')
        return lines.join('\n')
    }

    lines.push('', '## Candidate Groups')

    groups.forEach((group, index) => {
        lines.push('')
        lines.push(`### ${formatGroupHeader(index, group)}`)
        lines.push('')
        lines.push(`- Modules: ${group.modules.join(', ')}`)
        lines.push('- Keys:')
        group.keys.forEach((item) => {
            lines.push(`  - ${item.key} [${item.moduleName}]`)
        })
        lines.push('- Values:')
        Object.entries(group.values).forEach(([localeCode, value]) => {
            lines.push(`  - ${localeCode}: ${value}`)
        })
    })

    return lines.join('\n')
}

function renderReport(report, format) {
    if (format === 'json') {
        return JSON.stringify(report, null, 2)
    }

    if (format === 'markdown') {
        return formatMarkdownReport(report)
    }

    return formatTextReport(report)
}

async function main() {
    const options = parseArguments(process.argv.slice(2))
    const localeMessageMaps = await getLocaleMessageMaps(options.modules)

    ensureRequestedLocales(localeMessageMaps, options.locales)
    ensureRequestedModules(localeMessageMaps, options.modules)

    const localeCodes = getTargetLocales(localeMessageMaps, options.locales)
    if (localeCodes.length < 2) {
        throw new Error('At least two locales are required to audit duplicate messages')
    }

    const { incompleteKeyCount, sharedKeys, totalDistinctKeys } = getSharedKeys(localeCodes, localeMessageMaps)
    const groups = buildDuplicateGroups(localeCodes, localeMessageMaps, sharedKeys, options.minGroupSize)
    const report = buildReport(options, groups, {
        incompleteKeyCount,
        localeCodes,
        sharedKeyCount: sharedKeys.length,
        totalDistinctKeys,
    })
    const renderedReport = renderReport(report, options.format)

    if (options.outputPath) {
        const resolvedOutputPath = resolve(ROOT_DIR, options.outputPath)

        await writeFile(resolvedOutputPath, renderedReport, 'utf8')
        console.info(`Wrote duplicate message audit to ${resolvedOutputPath}`)
        return
    }

    console.info(renderedReport)
}

main().catch((error) => {
    console.error('Failed to audit duplicate locale messages:', error)
    process.exitCode = 1
})
