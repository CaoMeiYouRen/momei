import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '@/server/api/admin/marketing/campaigns.get'
import { dataSource } from '@/server/database'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('admin marketing campaigns api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getValidatedQuery', vi.fn((event: { query?: unknown }, parser: (query: unknown) => unknown) => Promise.resolve(parser(event.query || {}))))
        vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
    })

    it('should validate pagination query before listing campaigns', async () => {
        const findAndCount = vi.fn().mockResolvedValue([
            [{ id: 'campaign-1', title: 'Launch' }],
            1,
        ])
        vi.mocked(dataSource.getRepository).mockReturnValue({ findAndCount } as never)

        const result = await handler({
            query: {
                page: '2',
                limit: '15',
            },
        } as never)

        expect(findAndCount).toHaveBeenCalledWith({
            order: { createdAt: 'DESC' },
            skip: 15,
            take: 15,
            relations: ['sender'],
        })
        expect(result).toEqual({
            code: 200,
            data: {
                items: [{ id: 'campaign-1', title: 'Launch' }],
                total: 1,
                page: 2,
                limit: 15,
            },
        })
    })
})
