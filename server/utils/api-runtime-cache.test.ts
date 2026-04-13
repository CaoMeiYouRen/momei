import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    applyRuntimeApiCacheControl,
    buildRuntimeApiCacheKey,
    withRuntimeApiCache,
} from './api-runtime-cache'
import { clearRuntimeCache } from './runtime-cache'

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
            ttlSeconds: 60,
            isSharedPublicResponse: true,
            loader,
        })

        const second = await withRuntimeApiCache({
            event,
            key: 'cache:test:key',
            ttlSeconds: 60,
            isSharedPublicResponse: true,
            loader,
        })

        expect(first).toEqual({ code: 200 })
        expect(second).toEqual({ code: 200 })
        expect(loader).toHaveBeenCalledTimes(1)
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60')
    })

    it('should bypass runtime cache for private responses', async () => {
        const event = createEvent()
        const loader = vi.fn()
            .mockResolvedValueOnce({ code: 200, n: 1 })
            .mockResolvedValueOnce({ code: 200, n: 2 })

        const first = await withRuntimeApiCache({
            event,
            key: 'cache:test:private',
            ttlSeconds: 60,
            isSharedPublicResponse: false,
            loader,
        })

        const second = await withRuntimeApiCache({
            event,
            key: 'cache:test:private',
            ttlSeconds: 60,
            isSharedPublicResponse: false,
            loader,
        })

        expect(first).toEqual({ code: 200, n: 1 })
        expect(second).toEqual({ code: 200, n: 2 })
        expect(loader).toHaveBeenCalledTimes(2)
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
    })
})
