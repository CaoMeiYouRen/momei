import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    applyRuntimeApiCacheControl,
    buildRuntimeApiCacheKey,
    getRuntimeApiCacheStatsSnapshot,
    invalidateRuntimeApiCacheNamespace,
    resetRuntimeApiCacheStats,
    withRuntimeApiCache,
} from './api-runtime-cache'
import { clearRuntimeCache, getRuntimeCache } from './runtime-cache'

function createEvent() {
    return {
        node: {
            res: {
                setHeader: vi.fn(),
            },
        },
    } as any
}

describe('api-runtime-cache', () => {
    beforeEach(() => {
        clearRuntimeCache()
        resetRuntimeApiCacheStats()
        vi.clearAllMocks()
    })

    it('should build stable cache keys', () => {
        expect(buildRuntimeApiCacheKey('settings:public', 'zh-CN')).toBe('settings:public:zh-CN')
        expect(buildRuntimeApiCacheKey('friend-links:public', true, undefined, null, 10)).toBe('friend-links:public:1:null:null:10')
    })

    it('should apply public cache-control header', () => {
        const event = createEvent()
        applyRuntimeApiCacheControl(event, true, 60)
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60')
    })

    it('should apply private cache-control header', () => {
        const event = createEvent()
        applyRuntimeApiCacheControl(event, false, 60)
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
    })

    it('should reuse runtime cache for shared public responses', async () => {
        const event = createEvent()
        const loader = vi.fn().mockResolvedValue({ code: 200 })

        const first = await withRuntimeApiCache({
            event,
            key: 'cache:test:key',
            namespace: 'cache:test',
            ttlSeconds: 60,
            isSharedPublicResponse: true,
            loader,
        })

        const second = await withRuntimeApiCache({
            event,
            key: 'cache:test:key',
            namespace: 'cache:test',
            ttlSeconds: 60,
            isSharedPublicResponse: true,
            loader,
        })

        expect(first).toEqual({ code: 200 })
        expect(second).toEqual({ code: 200 })
        expect(loader).toHaveBeenCalledTimes(1)
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60')
        expect(getRuntimeApiCacheStatsSnapshot('cache:test')).toEqual({
            bypasses: 0,
            hits: 1,
            misses: 1,
            requests: 2,
            writes: 1,
            hitRate: 0.5,
        })
    })

    it('should bypass runtime cache for private responses', async () => {
        const event = createEvent()
        const loader = vi.fn()
            .mockResolvedValueOnce({ code: 200, n: 1 })
            .mockResolvedValueOnce({ code: 200, n: 2 })

        const first = await withRuntimeApiCache({
            event,
            key: 'cache:test:private',
            namespace: 'cache:test:private',
            ttlSeconds: 60,
            isSharedPublicResponse: false,
            loader,
        })

        const second = await withRuntimeApiCache({
            event,
            key: 'cache:test:private',
            namespace: 'cache:test:private',
            ttlSeconds: 60,
            isSharedPublicResponse: false,
            loader,
        })

        expect(first).toEqual({ code: 200, n: 1 })
        expect(second).toEqual({ code: 200, n: 2 })
        expect(loader).toHaveBeenCalledTimes(2)
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
        expect(getRuntimeApiCacheStatsSnapshot('cache:test:private')).toEqual({
            bypasses: 2,
            hits: 0,
            misses: 0,
            requests: 2,
            writes: 0,
            hitRate: 0,
        })
    })

    it('should invalidate all remembered keys under the same namespace', async () => {
        const event = createEvent()

        await withRuntimeApiCache({
            event,
            key: 'taxonomy:list:page-1',
            namespace: 'taxonomy:list',
            ttlSeconds: 60,
            isSharedPublicResponse: true,
            loader: async () => ({ code: 200, page: 1 }),
        })

        await withRuntimeApiCache({
            event,
            key: 'taxonomy:list:page-2',
            namespace: 'taxonomy:list',
            ttlSeconds: 60,
            isSharedPublicResponse: true,
            loader: async () => ({ code: 200, page: 2 }),
        })

        expect(getRuntimeCache('taxonomy:list:page-1')).toEqual({ code: 200, page: 1 })
        expect(getRuntimeCache('taxonomy:list:page-2')).toEqual({ code: 200, page: 2 })
        expect(invalidateRuntimeApiCacheNamespace('taxonomy:list')).toBe(2)
        expect(getRuntimeCache('taxonomy:list:page-1')).toBeUndefined()
        expect(getRuntimeCache('taxonomy:list:page-2')).toBeUndefined()
    })
})
