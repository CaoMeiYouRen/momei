import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'

function createNitroResolveProbe() {
    const outputPath = resolvePath(process.cwd(), 'artifacts', 'nitro-resolve-probe.json')
    const tempOutputPath = `${outputPath}.tmp`
    const repoRoot = normalizeProbePath(process.cwd())
    const resolveCounts = new Map<string, { count: number, importers: Set<string> }>()
    const importerBucketCounts = new Map<string, number>()
    const targetBucketCounts = new Map<string, number>()
    const bucketPairCounts = new Map<string, { count: number, importers: Set<string>, targets: Set<string>, sources: Set<string> }>()
    let flushTimer: NodeJS.Timeout | undefined
    let flushInProgress = false
    let flushRequested = false
    let didWarnWriteBusy = false
    let flushIdlePromise: Promise<void> | undefined
    let resolveFlushIdle: (() => void) | undefined

    function normalizeProbePath(value: string) {
        return value.replaceAll('\\', '/').replace(/\/+/g, '/')
    }

    function toRepoRelativeProbePath(value: string) {
        const normalized = normalizeProbePath(value)

        if (normalized.startsWith(`${repoRoot}/`)) {
            return normalized.slice(repoRoot.length + 1)
        }

        return normalized
    }

    function inferTargetPath(source: string, importer?: string) {
        if (source.startsWith('@/') || source.startsWith('~/')) {
            return normalizeProbePath(resolvePath(process.cwd(), source.slice(2)))
        }

        if ((source.startsWith('./') || source.startsWith('../')) && importer) {
            return normalizeProbePath(resolvePath(dirname(importer), source))
        }

        return normalizeProbePath(source)
    }

    function getPackageBucket(source: string) {
        if (source.startsWith('@')) {
            const [scope, name] = source.split('/')
            return name ? `pkg:${scope}/${name}` : `pkg:${scope}`
        }

        const [name] = source.split('/')
        return `pkg:${name}`
    }

    function classifyProbeBucket(value: string) {
        const repoRelative = toRepoRelativeProbePath(value)

        if (repoRelative.startsWith('node:')) {
            return 'node-builtin'
        }

        if (repoRelative.startsWith('server/api/admin/')) {
            return 'server/api/admin'
        }

        if (repoRelative.startsWith('server/api/ai/')) {
            return 'server/api/ai'
        }

        if (repoRelative.startsWith('server/api/')) {
            return 'server/api'
        }

        if (repoRelative.startsWith('server/services/ai/')) {
            return 'server/services/ai'
        }

        if (repoRelative.startsWith('server/services/')) {
            return 'server/services'
        }

        if (repoRelative === 'server/database' || repoRelative.startsWith('server/database/')) {
            return 'server/database'
        }

        if (repoRelative.startsWith('server/entities/')) {
            return 'server/entities'
        }

        if (repoRelative.startsWith('server/utils/')) {
            return 'server/utils'
        }

        if (repoRelative.startsWith('server/middleware/')) {
            return 'server/middleware'
        }

        if (repoRelative.startsWith('server/routes/')) {
            return 'server/routes'
        }

        if (repoRelative.startsWith('server/plugins/')) {
            return 'server/plugins'
        }

        if (repoRelative.startsWith('i18n/locales/')) {
            return 'i18n/locales'
        }

        if (repoRelative.startsWith('i18n/')) {
            return 'i18n'
        }

        if (repoRelative.startsWith('components/admin/')) {
            return 'components/admin'
        }

        if (repoRelative.startsWith('pages/admin/')) {
            return 'pages/admin'
        }

        if (repoRelative.startsWith('utils/shared/')) {
            return 'utils/shared'
        }

        if (repoRelative.includes('/nitropack/dist/presets/_nitro/runtime/')) {
            return 'nitro/preset-runtime'
        }

        if (repoRelative.includes('/nitropack/dist/runtime/')) {
            return 'nitro/runtime'
        }

        if (repoRelative.startsWith('node_modules/.pnpm/')) {
            return 'node_modules'
        }

        if (!repoRelative.includes('/') && !repoRelative.startsWith('.')) {
            return getPackageBucket(repoRelative)
        }

        return 'other'
    }

    function incrementCount(map: Map<string, number>, key: string) {
        map.set(key, (map.get(key) ?? 0) + 1)
    }

    function toSortedEntries<T>(map: Map<string, T>, compare: (left: [string, T], right: [string, T]) => number) {
        return [...map.entries()].sort(compare)
    }

    function isFocusBucket(bucket: string) {
        return [
            'server/api',
            'server/services',
            'server/database',
            'server/entities',
            'server/utils',
            'server/middleware',
            'server/routes',
            'i18n/locales',
            'components/admin',
            'pages/admin',
        ].some((prefix) => bucket === prefix || bucket.startsWith(`${prefix}/`))
    }

    function isRetryableProbeWriteError(error: unknown) {
        return error instanceof Error
            && ('code' in error)
            && (error.code === 'EBUSY' || error.code === 'EPERM')
    }

    function getFlushIdlePromise() {
        if (!flushIdlePromise) {
            flushIdlePromise = new Promise<void>((resolve) => {
                resolveFlushIdle = resolve
            })
        }

        return flushIdlePromise
    }

    function settleFlushIdlePromise() {
        if (flushInProgress || flushRequested || flushTimer) {
            return
        }

        resolveFlushIdle?.()
        flushIdlePromise = undefined
        resolveFlushIdle = undefined
    }

    async function flushSummary() {
        flushRequested = true
        if (flushInProgress) {
            await getFlushIdlePromise()
            return
        }

        flushInProgress = true
        void getFlushIdlePromise()

        try {
            while (flushRequested) {
                flushRequested = false

                const summary = {
                    generatedAt: new Date().toISOString(),
                    outputPath,
                    topSpecifiers: [...resolveCounts.entries()]
                        .sort((left, right) => right[1].count - left[1].count)
                        .slice(0, 200)
                        .map(([source, entry]) => ({
                            source,
                            count: entry.count,
                            importers: [...entry.importers].slice(0, 20),
                        })),
                    topImporterBuckets: toSortedEntries(importerBucketCounts, (left, right) => right[1] - left[1])
                        .slice(0, 50)
                        .map(([bucket, count]) => ({ bucket, count })),
                    topTargetBuckets: toSortedEntries(targetBucketCounts, (left, right) => right[1] - left[1])
                        .slice(0, 50)
                        .map(([bucket, count]) => ({ bucket, count })),
                    topBucketPairs: toSortedEntries(bucketPairCounts, (left, right) => right[1].count - left[1].count)
                        .slice(0, 80)
                        .map(([pair, entry]) => ({
                            pair,
                            count: entry.count,
                            importers: [...entry.importers].slice(0, 12),
                            targets: [...entry.targets].slice(0, 12),
                            sources: [...entry.sources].slice(0, 12),
                        })),
                    focusBucketPairs: toSortedEntries(bucketPairCounts, (left, right) => right[1].count - left[1].count)
                        .filter(([pair]) => {
                            const [importerBucket = 'unknown', targetBucket = 'unknown'] = pair.split(' -> ')
                            return isFocusBucket(importerBucket) || isFocusBucket(targetBucket)
                        })
                        .slice(0, 80)
                        .map(([pair, entry]) => ({
                            pair,
                            count: entry.count,
                            importers: [...entry.importers].slice(0, 12),
                            targets: [...entry.targets].slice(0, 12),
                            sources: [...entry.sources].slice(0, 12),
                        })),
                }

                await mkdir(dirname(outputPath), { recursive: true })
                try {
                    await writeFile(tempOutputPath, JSON.stringify(summary, null, 2), 'utf8')
                    await rename(tempOutputPath, outputPath)
                    didWarnWriteBusy = false
                } catch (error) {
                    if (!isRetryableProbeWriteError(error)) {
                        throw error
                    }

                    flushRequested = true
                    if (!didWarnWriteBusy) {
                        didWarnWriteBusy = true
                        console.warn('[momei-perf] scope=nitro-resolve-probe stage=flush-busy action=retry')
                    }
                    break
                }
            }
        } finally {
            flushInProgress = false
            if (flushRequested && !flushTimer) {
                scheduleFlush()
            } else {
                settleFlushIdlePromise()
            }
        }
    }

    function scheduleFlush() {
        if (flushTimer) {
            return
        }

        flushTimer = setTimeout(() => {
            flushTimer = undefined
            void flushSummary().catch((error) => {
                console.error('[momei-perf] scope=nitro-resolve-probe stage=flush-failed', error)
            })
        }, 1000)
        flushTimer.unref?.()
    }

    return {
        name: 'momei-nitro-resolve-probe',
        resolveId(source: string, importer?: string) {
            const importerBucket = classifyProbeBucket(importer ? normalizeProbePath(importer) : 'unknown')
            const targetPath = inferTargetPath(source, importer)
            const targetBucket = classifyProbeBucket(targetPath)
            const entry = resolveCounts.get(source)
            if (entry) {
                entry.count += 1
                if (importer) {
                    entry.importers.add(importer)
                }
            } else {
                resolveCounts.set(source, {
                    count: 1,
                    importers: new Set(importer ? [importer] : []),
                })
            }

            incrementCount(importerBucketCounts, importerBucket)
            incrementCount(targetBucketCounts, targetBucket)

            const pairKey = `${importerBucket} -> ${targetBucket}`
            const pairEntry = bucketPairCounts.get(pairKey)
            if (pairEntry) {
                pairEntry.count += 1
                if (importer) {
                    pairEntry.importers.add(importer)
                }
                pairEntry.targets.add(targetPath)
                pairEntry.sources.add(source)
            } else {
                bucketPairCounts.set(pairKey, {
                    count: 1,
                    importers: new Set(importer ? [importer] : []),
                    targets: new Set([targetPath]),
                    sources: new Set([source]),
                })
            }

            scheduleFlush()
            return null
        },
        async buildEnd() {
            if (flushTimer) {
                clearTimeout(flushTimer)
                flushTimer = undefined
            }
            await flushSummary()
        },
    }
}

export function createNitroPerfHooks() {
    let buildStartedAt = 0
    let rollupStartedAt = 0

    return {
        'build:before'() {
            buildStartedAt = Date.now()
            console.info('[momei-perf] scope=nitro-dev-build stage=build-before durationMs=0')
        },
        'rollup:before'(_nitro: unknown, rollupConfig: { plugins?: { name?: string }[] }) {
            rollupStartedAt = Date.now()
            console.info(`[momei-perf] scope=nitro-dev-build stage=rollup-before durationMs=${buildStartedAt ? Date.now() - buildStartedAt : 0}`)
            rollupConfig.plugins ||= []
            if (!rollupConfig.plugins.some((plugin) => plugin.name === 'momei-nitro-resolve-probe')) {
                rollupConfig.plugins.push(createNitroResolveProbe())
            }
        },
        compiled() {
            console.info(`[momei-perf] scope=nitro-dev-build stage=compiled durationMs=${buildStartedAt ? Date.now() - buildStartedAt : 0}`)
            if (rollupStartedAt) {
                console.info(`[momei-perf] scope=nitro-dev-build stage=rollup-compiled durationMs=${Date.now() - rollupStartedAt}`)
            }
        },
    }
}

