import { describe, expect, it } from 'vitest'
import {
    HOMEPAGE_LATEST_POST_LIMIT,
    HOMEPAGE_PINNED_POST_LIMIT,
    MAX_PINNED_POSTS,
} from './post-pinning'

describe('post-pinning constants', () => {
    it('exposes expected limits', () => {
        expect(MAX_PINNED_POSTS).toBe(3)
        expect(HOMEPAGE_PINNED_POST_LIMIT).toBe(1)
        expect(HOMEPAGE_LATEST_POST_LIMIT).toBe(3)
    })

    it('keeps homepage pinned limit within global limit', () => {
        expect(HOMEPAGE_PINNED_POST_LIMIT).toBeLessThanOrEqual(MAX_PINNED_POSTS)
    })
})
