import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './[id].get'
import { getAICostDisplayConfig } from '@/server/services/ai/cost-display'
import { getAITaskDetail } from '@/server/services/ai/task-detail'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/services/ai/cost-display', () => ({
    getAICostDisplayConfig: vi.fn(),
}))

vi.mock('@/server/services/ai/task-detail', () => ({
    getAITaskDetail: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('GET /api/ai/tasks/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getRouterParam', vi.fn(() => 'task-1'))
    })

    it('should return task detail for current admin', async () => {
        vi.mocked(requireAdmin).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' },
        } as never)
        vi.mocked(getAITaskDetail).mockResolvedValue({
            id: 'task-1',
            userId: 'author-1',
        } as never)
        vi.mocked(getAICostDisplayConfig).mockResolvedValue({
            currencyCode: 'CNY',
            currencySymbol: '¥',
            quotaUnitPrice: 0.1,
        })

        const result = await handler({} as never)

        expect(getAITaskDetail).toHaveBeenCalledWith('task-1', 'admin-1', { isAdmin: true })
        expect(result).toEqual(expect.objectContaining({
            code: 200,
            data: {
                item: {
                    id: 'task-1',
                    userId: 'author-1',
                },
                costDisplay: {
                    currencyCode: 'CNY',
                    currencySymbol: '¥',
                    quotaUnitPrice: 0.1,
                },
            },
        }))
    })
})
