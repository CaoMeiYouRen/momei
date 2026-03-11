import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { requireAuth } from '@/server/utils/permission'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAuth: vi.fn(),
}))

describe('notifications index.get API handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('eventHandler', vi.fn((fn: unknown) => fn))
        vi.stubGlobal('getValidatedQuery', vi.fn((event: { query?: unknown }, validate: (query: unknown) => unknown) => Promise.resolve(validate(event.query || {}))))
    })

    it('should return paginated notification history for current user', async () => {
        const { default: handler } = await import('@/server/api/notifications/index.get')
        const queryBuilder = {
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            take: vi.fn().mockReturnThis(),
            getManyAndCount: vi.fn().mockResolvedValue([
                [
                    {
                        id: 'notification-1',
                        title: '任务完成',
                        isRead: false,
                    },
                ],
                1,
            ]),
        }

        vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(dataSource.getRepository).mockReturnValue({
            createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
        } as never)

        const result = await handler({ query: { page: '1', limit: '10' } } as never)

        expect(queryBuilder.where).toHaveBeenCalledWith('(notification.userId = :userId OR notification.userId IS NULL)', { userId: 'user-1' })
        expect(queryBuilder.skip).toHaveBeenCalledWith(0)
        expect(queryBuilder.take).toHaveBeenCalledWith(10)
        expect(result).toEqual({
            items: [
                {
                    id: 'notification-1',
                    title: '任务完成',
                    isRead: false,
                },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        })
    })

    it('should apply unread filter when unreadOnly is true', async () => {
        const { default: handler } = await import('@/server/api/notifications/index.get')
        const queryBuilder = {
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            take: vi.fn().mockReturnThis(),
            getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
        }

        vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-2' } } as never)
        vi.mocked(dataSource.getRepository).mockReturnValue({
            createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
        } as never)

        await handler({ query: { unreadOnly: 'true' } } as never)

        expect(queryBuilder.andWhere).toHaveBeenCalledWith('notification.isRead = :isRead', { isRead: false })
    })
})
