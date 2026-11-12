import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const ROOT_DIR = process.cwd()
const LOCALE_ROOT = resolve(ROOT_DIR, 'i18n', 'locales')
const DEFAULT_FORMAT = 'text'
const DEFAULT_LIMIT = 50
const DEFAULT_MIN_GROUP_SIZE = 2
const DEFAULT_MAX_GROUPS = 74
const DEFAULT_ALLOWLIST_PATH = 'scripts/i18n/duplicate-group-allowlist.json'

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
            allowlist: DEFAULT_ALLOWLIST_PATH,
            maxGroups: DEFAULT_MAX_GROUPS,
        },
        flags: {
            '--cross-module-only': { key: 'crossModuleOnly' },
            '--gate': { key: 'gate' },
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
            '--allowlist': {
                key: 'allowlist',
                parse: (value) => value.trim() || DEFAULT_ALLOWLIST_PATH,
            },
            '--max-groups': {
                key: 'maxGroups',
                parse: (value) => parseNumberArgument(value, DEFAULT_MAX_GROUPS),
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

/**
 * 为一组重复 key 生成稳定 id（排序后 key 集合的 sha256 前 12 位）。
 * allowlist 用它识别「同一组」而不受 locale 值改动影响。
 */
export function computeGroupId(group) {
    const keys = group.keys.map((item) => item.key).toSorted()
    return `g-${createHash('sha256').update(keys.join('\n')).digest('hex').slice(0, 12)}`
}

/**
 * 校验 allowlist 与当前重复组是否双向对齐：
 * 未登记的新组、失效条目、重复 id、缺少理由/复核日期、已到期条目都会判红。
 */
export function validateAllowlistCoverage(groups, allowlist, options = {}) {
    const today = options.today ?? new Date().toISOString().slice(0, 10)
    const entries = Array.isArray(allowlist?.groups) ? allowlist.groups : []
    const allowById = new Map(entries.map((entry) => [entry.id, entry]))
    const groupsWithId = groups.map((group) => ({
        group,
        id: computeGroupId(group),
    }))
    const matchedIds = new Set(groupsWithId.map((item) => item.id))
    const unlisted = groupsWithId
        .filter((item) => !allowById.has(item.id))
        .map((item) => ({
            id: item.id,
            keys: item.group.keys.map((key) => key.key),
        }))
    const stale = entries
        .filter((entry) => !matchedIds.has(entry.id))
        .map((entry) => ({
            id: entry.id,
            keys: Array.isArray(entry.keys) ? entry.keys : [],
        }))
    const seenIds = new Set()
    const duplicateIds = []

    for (const entry of entries) {
        if (seenIds.has(entry.id)) {
            duplicateIds.push(entry.id)
        }
        seenIds.add(entry.id)
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/u
    const incomplete = entries
        .filter((entry) => typeof entry.reason !== 'string'
            || entry.reason.trim().length === 0
            || typeof entry.reviewAt !== 'string'
            || !datePattern.test(entry.reviewAt))
        .map((entry) => entry.id)
    const expired = entries
        .filter((entry) => datePattern.test(entry.reviewAt ?? '') && entry.reviewAt < today)
        .map((entry) => entry.id)
    const entryKeysById = new Map(entries.map((entry) => [entry.id, entry.keys]))
    const keyMismatch = groupsWithId
        .filter((item) => {
            const entryKeys = entryKeysById.get(item.id)
            if (!Array.isArray(entryKeys)) {
                return true
            }
            const liveKeys = item.group.keys.map((key) => key.key).toSorted()
            return JSON.stringify(entryKeys.toSorted()) !== JSON.stringify(liveKeys)
        })
        .map((item) => item.id)

    return {
        duplicateIds,
        expired,
        incomplete,
        keyMismatch,
        ok: unlisted.length === 0
            && stale.length === 0
            && duplicateIds.length === 0
            && incomplete.length === 0
            && expired.length === 0
            && keyMismatch.length === 0,
        stale,
        unlisted,
    }
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
    if (options.gate) {
        const allowlistPath = resolve(ROOT_DIR, options.allowlist)
        let allowlist

        try {
            allowlist = JSON.parse(await readFile(allowlistPath, 'utf8'))
        } catch (error) {
            console.error(`Duplicate message gate failed: cannot read allowlist ${options.allowlist} (${error instanceof Error ? error.message : String(error)})`)
            process.exitCode = 1
            return
        }

        const coverage = validateAllowlistCoverage(groups, allowlist)
        const failures = []

        if (groups.length > options.maxGroups) {
            failures.push(`duplicate groups ${groups.length} exceed budget ${options.maxGroups}`)
        }
        if (coverage.unlisted.length > 0) {
            failures.push(`unlisted duplicate groups: ${coverage.unlisted.map((item) => item.id).join(', ')}`)
        }
        if (coverage.stale.length > 0) {
            failures.push(`stale allowlist entries: ${coverage.stale.map((item) => item.id).join(', ')}`)
        }
        if (coverage.duplicateIds.length > 0) {
            failures.push(`duplicate allowlist ids: ${[...new Set(coverage.duplicateIds)].join(', ')}`)
        }
        if (coverage.incomplete.length > 0) {
            failures.push(`allowlist entries missing reason/reviewAt: ${coverage.incomplete.join(', ')}`)
        }
        if (coverage.expired.length > 0) {
            failures.push(`allowlist entries past reviewAt: ${coverage.expired.join(', ')}`)
        }
        if (coverage.keyMismatch.length > 0) {
            failures.push(`allowlist keys drifted from live groups: ${coverage.keyMismatch.join(', ')}`)
        }

        if (failures.length > 0) {
            console.error('Duplicate message gate failed:')
            failures.forEach((failure) => console.error(`- ${failure}`))
            coverage.unlisted.forEach((item) => console.error(`  unlisted ${item.id}: ${item.keys.join(', ')}`))
            coverage.stale.forEach((item) => console.error(`  stale ${item.id}: ${item.keys.join(', ')}`))
            process.exitCode = 1
            return
        }

        console.info(`Duplicate message gate passed: ${groups.length} groups within budget ${options.maxGroups}, allowlist coverage complete.`)
        return
    }

    const renderedReport = renderReport(report, options.format)

    if (options.outputPath) {
        const resolvedOutputPath = resolve(ROOT_DIR, options.outputPath)

        await writeFile(resolvedOutputPath, renderedReport, 'utf8')
        console.info(`Wrote duplicate message audit to ${resolvedOutputPath}`)
        return
    }

    console.info(renderedReport)
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error('Failed to audit duplicate locale messages:', error)
        process.exitCode = 1
    })
}
