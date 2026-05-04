import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '@/server/api/admin/friend-links/index.get'
import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/services/friend-link', () => ({
    friendLinkService: {
        getFriendLinks: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('admin friend links api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getValidatedQuery', vi.fn((event: { query?: unknown }, parser: (query: unknown) => unknown) => Promise.resolve(parser(event.query || {}))))
        vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
    })

    it('should validate and normalize friend link list query', async () => {
        vi.mocked(friendLinkService.getFriendLinks).mockResolvedValue({
            items: [{ id: 'friend-link-1' }],
            total: 1,
            page: 2,
            limit: 15,
            totalPages: 1,
        } as never)

        const result = await handler({
            query: {
                page: '2',
                limit: '15',
                status: 'active',
                categoryId: ' category-1 ',
                featured: 'false',
                keyword: '  example  ',
            },
        } as never)

        expect(friendLinkService.getFriendLinks).toHaveBeenCalledWith({
            page: 2,
            limit: 15,
            status: 'active',
            categoryId: 'category-1',
            featured: false,
            keyword: 'example',
        })
        expect(result.data).toMatchObject({
            items: [{ id: 'friend-link-1' }],
            total: 1,
            page: 2,
            limit: 15,
        })
    })
})
