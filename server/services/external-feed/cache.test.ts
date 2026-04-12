import { describe, it, expect } from 'vitest'
import {
    buildExternalFeedCacheKey,
    isExternalFeedSnapshotFresh,
    canUseStaleExternalFeedSnapshot,
} from './cache'
import type { ExternalFeedSnapshot } from '@/types/external-feed'

function makeSnapshot(overrides: Partial<ExternalFeedSnapshot> = {}): ExternalFeedSnapshot {
    return {
        sourceId: 'src-1',
        localeBucket: 'zh-CN',
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        staleUntil: new Date(Date.now() + 3600000).toISOString(),
        items: [],
        ...overrides,
    }
}

describe('buildExternalFeedCacheKey', () => {
    it('concatenates sourceId and localeBucket', () => {
        expect(buildExternalFeedCacheKey('src-1', 'zh-CN')).toBe('src-1:zh-CN')
    })

    it('works with arbitrary values', () => {
        expect(buildExternalFeedCacheKey('feed-123', 'en-US')).toBe('feed-123:en-US')
    })
})

describe('isExternalFeedSnapshotFresh', () => {
    it('returns true when expiresAt is in the future', () => {
        const snapshot = makeSnapshot({ expiresAt: new Date(Date.now() + 5000).toISOString() })
        expect(isExternalFeedSnapshotFresh(snapshot, new Date())).toBe(true)
    })

    it('returns false when expiresAt is in the past', () => {
        const snapshot = makeSnapshot({ expiresAt: new Date(Date.now() - 5000).toISOString() })
        expect(isExternalFeedSnapshotFresh(snapshot, new Date())).toBe(false)
    })

    it('uses current time as default for now', () => {
        const snapshot = makeSnapshot({ expiresAt: new Date(Date.now() + 10000).toISOString() })
        expect(isExternalFeedSnapshotFresh(snapshot)).toBe(true)
    })
})

describe('canUseStaleExternalFeedSnapshot', () => {
    it('returns true when staleUntil is in the future', () => {
        const snapshot = makeSnapshot({ staleUntil: new Date(Date.now() + 5000).toISOString() })
        expect(canUseStaleExternalFeedSnapshot(snapshot, new Date())).toBe(true)
    })

    it('returns false when staleUntil is in the past', () => {
        const snapshot = makeSnapshot({ staleUntil: new Date(Date.now() - 5000).toISOString() })
        expect(canUseStaleExternalFeedSnapshot(snapshot, new Date())).toBe(false)
    })

    it('uses current time as default for now', () => {
        const snapshot = makeSnapshot({ staleUntil: new Date(Date.now() + 10000).toISOString() })
        expect(canUseStaleExternalFeedSnapshot(snapshot)).toBe(true)
    })
})
