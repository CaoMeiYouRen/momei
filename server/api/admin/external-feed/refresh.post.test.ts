import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './refresh.post'
import { requireAdmin } from '@/server/utils/permission'
import { refreshExternalFeedCaches } from '@/server/services/external-feed/aggregator'

vi.mock('@/server/utils/permission')
vi.mock('@/server/services/external-feed/aggregator', () => ({
    refreshExternalFeedCaches: vi.fn(),
}))

describe('POST /api/admin/external-feed/refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as any)
    })

    it('should accept empty body and refresh feeds', async () => {
        vi.mocked(refreshExternalFeedCaches).mockResolvedValue({ refreshedAt: new Date().toISOString() } as any)

        const result = await handler({} as any)
        expect(result).toBeDefined()
        expect(refreshExternalFeedCaches).toHaveBeenCalled()
    })
})
