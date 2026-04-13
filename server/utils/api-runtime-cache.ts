import type { H3Event } from 'h3'
import { clearRuntimeCache, getRuntimeCache, setRuntimeCache } from '@/server/utils/runtime-cache'

type RuntimeCachedLoader<T> = () => Promise<T>

export interface RuntimeApiCacheOptions<T> {
    event: H3Event
    key: string
    namespace: string
    ttlSeconds: number
    isSharedPublicResponse: boolean
    loader: RuntimeCachedLoader<T>
}

interface RuntimeApiCacheMetricEntry {
    bypasses: number
    hits: number
    misses: number
    requests: number
    writes: number
}

export interface RuntimeApiCacheMetricSnapshot extends RuntimeApiCacheMetricEntry {
    hitRate: number
}

const runtimeApiCacheNamespaceKeyRegistry = new Map<string, Set<string>>()
const runtimeApiCacheMetrics = new Map<string, RuntimeApiCacheMetricEntry>()

function normalizeRuntimeApiCacheNamespace(namespace: string) {
    return namespace.trim()
}

function getRuntimeApiCacheMetricEntry(namespace: string) {
    const normalizedNamespace = normalizeRuntimeApiCacheNamespace(namespace)
    const existing = runtimeApiCacheMetrics.get(normalizedNamespace)
    if (existing) {
        return existing
    }

    const created: RuntimeApiCacheMetricEntry = {
        bypasses: 0,
        hits: 0,
        misses: 0,
        requests: 0,
        writes: 0,
    }
    runtimeApiCacheMetrics.set(normalizedNamespace, created)
    return created
}

function recordRuntimeApiCacheMetric(namespace: string, field: keyof RuntimeApiCacheMetricEntry) {
    const entry = getRuntimeApiCacheMetricEntry(namespace)
    entry.requests += 1
    entry[field] += 1
}

function recordRuntimeApiCacheWrite(namespace: string) {
    const entry = getRuntimeApiCacheMetricEntry(namespace)
    entry.writes += 1
}

function rememberRuntimeApiCacheKey(namespace: string, key: string) {
    const normalizedNamespace = normalizeRuntimeApiCacheNamespace(namespace)
    const existingKeys = runtimeApiCacheNamespaceKeyRegistry.get(normalizedNamespace)
    if (existingKeys) {
        existingKeys.add(key)
        return
    }

    runtimeApiCacheNamespaceKeyRegistry.set(normalizedNamespace, new Set([key]))
}

function serializeCacheKeyPart(part: boolean | null | number | string | undefined) {
    if (part === null || part === undefined) {
        return 'null'
    }
    if (typeof part === 'boolean') {
        return part ? '1' : '0'
    }
    return String(part)
}

export function buildRuntimeApiCacheKey(namespace: string, ...parts: (boolean | null | number | string | undefined)[]) {
    const normalizedNamespace = normalizeRuntimeApiCacheNamespace(namespace)
    return [normalizedNamespace, ...parts.map(serializeCacheKeyPart)].join(':')
}

export function applyRuntimeApiCacheControl(event: H3Event, isSharedPublicResponse: boolean, ttlSeconds: number) {
    const cacheControl = isSharedPublicResponse
        ? `public, max-age=${ttlSeconds}`
        : 'private, no-store'
    event.node?.res?.setHeader('Cache-Control', cacheControl)
}

export async function withRuntimeApiCache<T>(options: RuntimeApiCacheOptions<T>) {
    const { event, key, namespace, ttlSeconds, isSharedPublicResponse, loader } = options
    const normalizedNamespace = normalizeRuntimeApiCacheNamespace(namespace)

    if (!isSharedPublicResponse) {
        recordRuntimeApiCacheMetric(normalizedNamespace, 'bypasses')
        applyRuntimeApiCacheControl(event, false, ttlSeconds)
        return await loader()
    }

    const cachedResponse = getRuntimeCache(key) as T | undefined
    if (cachedResponse !== undefined) {
        recordRuntimeApiCacheMetric(normalizedNamespace, 'hits')
        applyRuntimeApiCacheControl(event, true, ttlSeconds)
        return cachedResponse
    }

    recordRuntimeApiCacheMetric(normalizedNamespace, 'misses')
    const response = await loader()
    setRuntimeCache(key, response, ttlSeconds)
    rememberRuntimeApiCacheKey(normalizedNamespace, key)
    recordRuntimeApiCacheWrite(normalizedNamespace)
    applyRuntimeApiCacheControl(event, true, ttlSeconds)
    return response
}

export function getRuntimeApiCacheStatsSnapshot(namespace?: string) {
    if (namespace) {
        const normalizedNamespace = normalizeRuntimeApiCacheNamespace(namespace)
        const entry = runtimeApiCacheMetrics.get(normalizedNamespace)
        if (!entry) {
            return undefined
        }

        return {
            ...entry,
            hitRate: entry.requests > 0 ? entry.hits / entry.requests : 0,
        } satisfies RuntimeApiCacheMetricSnapshot
    }

    return Object.fromEntries(
        Array.from(runtimeApiCacheMetrics.entries()).map(([currentNamespace, entry]) => [
            currentNamespace,
            {
                ...entry,
                hitRate: entry.requests > 0 ? entry.hits / entry.requests : 0,
            } satisfies RuntimeApiCacheMetricSnapshot,
        ]),
    )
}

export function resetRuntimeApiCacheStats(namespace?: string) {
    if (namespace) {
        runtimeApiCacheMetrics.delete(normalizeRuntimeApiCacheNamespace(namespace))
        return
    }

    runtimeApiCacheMetrics.clear()
}

export function invalidateRuntimeApiCacheNamespace(namespace: string) {
    const normalizedNamespace = normalizeRuntimeApiCacheNamespace(namespace)
    const registeredKeys = runtimeApiCacheNamespaceKeyRegistry.get(normalizedNamespace)
    if (!registeredKeys) {
        return 0
    }

    let invalidatedCount = 0
    for (const key of registeredKeys) {
        clearRuntimeCache(key)
        invalidatedCount += 1
    }

    runtimeApiCacheNamespaceKeyRegistry.delete(normalizedNamespace)
    return invalidatedCount
}
