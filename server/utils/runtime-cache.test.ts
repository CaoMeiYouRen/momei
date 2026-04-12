import { describe, it, expect, beforeEach } from 'vitest'
import { getRuntimeCache, setRuntimeCache, clearRuntimeCache } from './runtime-cache'

describe('runtime-cache', () => {
    beforeEach(() => {
        clearRuntimeCache()
    })

    describe('setRuntimeCache / getRuntimeCache', () => {
        it('should store and retrieve a value within TTL', () => {
            const now = Date.now()
            setRuntimeCache('key1', { data: 42 }, 60, now)
            expect(getRuntimeCache('key1', now + 1000)).toEqual({ data: 42 })
        })

        it('should return undefined for unknown key', () => {
            expect(getRuntimeCache('nonexistent')).toBeUndefined()
        })

        it('should return undefined after TTL expires', () => {
            const now = 1_000_000
            setRuntimeCache('expiring', 'hello', 10, now)
            // 10 seconds later, still valid
            expect(getRuntimeCache('expiring', now + 9_999)).toBe('hello')
            // exactly at expiry boundary: expiresAt = now + 10*1000, and entry.expiresAt <= now means expired
            expect(getRuntimeCache('expiring', now + 10_000)).toBeUndefined()
        })

        it('should lazily evict expired entry on read', () => {
            const now = 1_000_000
            setRuntimeCache('stale', 'value', 5, now)
            // expired
            expect(getRuntimeCache('stale', now + 10_000)).toBeUndefined()
            // second read after eviction also returns undefined
            expect(getRuntimeCache('stale', now + 10_001)).toBeUndefined()
        })

        it('should overwrite an existing key', () => {
            const now = Date.now()
            setRuntimeCache('dup', 'first', 60, now)
            setRuntimeCache('dup', 'second', 60, now)
            expect(getRuntimeCache('dup', now + 100)).toBe('second')
        })
    })

    describe('clearRuntimeCache', () => {
        it('should clear a single key', () => {
            const now = Date.now()
            setRuntimeCache('a', 1, 60, now)
            setRuntimeCache('b', 2, 60, now)
            clearRuntimeCache('a')
            expect(getRuntimeCache('a', now + 100)).toBeUndefined()
            expect(getRuntimeCache('b', now + 100)).toBe(2)
        })

        it('should clear all keys when called without argument', () => {
            const now = Date.now()
            setRuntimeCache('x', 1, 60, now)
            setRuntimeCache('y', 2, 60, now)
            clearRuntimeCache()
            expect(getRuntimeCache('x', now + 100)).toBeUndefined()
            expect(getRuntimeCache('y', now + 100)).toBeUndefined()
        })
    })
})
