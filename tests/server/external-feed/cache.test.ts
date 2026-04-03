import { describe, expect, it } from 'vitest'
import {
    buildExternalFeedCacheKey,
    canUseStaleExternalFeedSnapshot,
    isExternalFeedSnapshotFresh,
} from '@/server/services/external-feed/cache'

describe('external-feed cache helpers', () => {
    it('builds a stable cache key', () => {
        expect(buildExternalFeedCacheKey('devto', 'en-US')).toBe('devto:en-US')
    })

    it('detects fresh and stale snapshots', () => {
        const now = new Date('2026-04-03T12:00:00.000Z')
        const snapshot = {
            sourceId: 'devto',
            localeBucket: 'en-US',
            fetchedAt: '2026-04-03T11:50:00.000Z',
            expiresAt: '2026-04-03T12:10:00.000Z',
            staleUntil: '2026-04-04T12:00:00.000Z',
            items: [],
        }

        expect(isExternalFeedSnapshotFresh(snapshot, now)).toBe(true)
        expect(canUseStaleExternalFeedSnapshot(snapshot, now)).toBe(true)
        expect(isExternalFeedSnapshotFresh(snapshot, new Date('2026-04-03T12:20:00.000Z'))).toBe(false)
        expect(canUseStaleExternalFeedSnapshot(snapshot, new Date('2026-04-05T12:00:00.000Z'))).toBe(false)
    })
})
