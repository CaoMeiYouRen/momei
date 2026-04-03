import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '@/server/api/admin/external-feed/refresh.post'
import { refreshExternalFeedCaches } from '@/server/services/external-feed/aggregator'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

vi.mock('@/server/services/external-feed/aggregator', () => ({
    refreshExternalFeedCaches: vi.fn(),
}))

describe('admin external-feed refresh.post API handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('requires admin and returns refresh summary', async () => {
        vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
        vi.mocked(refreshExternalFeedCaches).mockResolvedValue({
            refreshedAt: '2026-04-03T12:00:00.000Z',
            sourceCount: 2,
            snapshotCount: 4,
            failureCount: 0,
        })

        const result = await handler({} as never)

        expect(requireAdmin).toHaveBeenCalled()
        expect(refreshExternalFeedCaches).toHaveBeenCalled()
        expect(result.code).toBe(200)
        expect(result.data).toEqual({
            refreshedAt: '2026-04-03T12:00:00.000Z',
            sourceCount: 2,
            snapshotCount: 4,
            failureCount: 0,
        })
    })
})
