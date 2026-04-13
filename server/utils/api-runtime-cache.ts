import type { H3Event } from 'h3'
import { getRuntimeCache, setRuntimeCache } from '@/server/utils/runtime-cache'

type RuntimeCachedLoader<T> = () => Promise<T>

export interface RuntimeApiCacheOptions<T> {
    event: H3Event
    key: string
    ttlSeconds: number
    isSharedPublicResponse: boolean
    loader: RuntimeCachedLoader<T>
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
    const normalizedNamespace = namespace.trim()
    return [normalizedNamespace, ...parts.map(serializeCacheKeyPart)].join(':')
}

export function applyRuntimeApiCacheControl(event: H3Event, isSharedPublicResponse: boolean, ttlSeconds: number) {
    const cacheControl = isSharedPublicResponse
        ? `public, max-age=${ttlSeconds}`
        : 'private, no-store'
    event.node?.res?.setHeader('Cache-Control', cacheControl)
}

export async function withRuntimeApiCache<T>(options: RuntimeApiCacheOptions<T>) {
    const { event, key, ttlSeconds, isSharedPublicResponse, loader } = options

    if (!isSharedPublicResponse) {
        applyRuntimeApiCacheControl(event, false, ttlSeconds)
        return await loader()
    }

    const cachedResponse = getRuntimeCache(key) as T | undefined
    if (cachedResponse !== undefined) {
        applyRuntimeApiCacheControl(event, true, ttlSeconds)
        return cachedResponse
    }

    const response = await loader()
    setRuntimeCache(key, response, ttlSeconds)
    applyRuntimeApiCacheControl(event, true, ttlSeconds)
    return response
}
