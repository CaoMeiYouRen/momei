import { beforeEach, describe, expect, it, vi } from 'vitest'
import deleteHandler from '@/server/api/admin/ai/tasks.delete'
import listHandler from '@/server/api/admin/ai/tasks.get'
import { dataSource } from '@/server/database'
import { getAICostDisplayConfig } from '@/server/services/ai/cost-display'
import { createAIAdminTaskListReadModelQuery, normalizeAIAdminTaskListItem } from '@/server/services/ai/task-detail'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/ai/cost-display', () => ({
    getAICostDisplayConfig: vi.fn(),
}))

vi.mock('@/server/services/ai/task-detail', () => ({
    createAIAdminTaskListReadModelQuery: vi.fn(),
    normalizeAIAdminTaskListItem: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

function createTaskListQueryBuilder() {
    const queryBuilder: Record<string, any> = {
        orderBy: vi.fn(),
        skip: vi.fn(),
        take: vi.fn(),
        andWhere: vi.fn(),
        getCount: vi.fn().mockResolvedValue(2),
        getRawMany: vi.fn().mockResolvedValue([{ id: 'task-1' }, { id: 'task-2' }]),
    }

    Object.keys(queryBuilder).forEach((key) => {
        if (!['getCount', 'getRawMany'].includes(key)) {
            queryBuilder[key].mockReturnValue(queryBuilder)
        }
    })

    return queryBuilder
}

describe('admin ai tasks api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getValidatedQuery', vi.fn((event: { query?: unknown }, parser: (query: unknown) => unknown) => Promise.resolve(parser(event.query || {}))))
        vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
    })

    it('should validate and apply admin ai task list filters', async () => {
        const queryBuilder = createTaskListQueryBuilder()

        vi.mocked(createAIAdminTaskListReadModelQuery).mockReturnValue(queryBuilder as never)
        vi.mocked(getAICostDisplayConfig).mockResolvedValue({ currencyCode: 'CNY', currencySymbol: '¥', quotaUnitPrice: 0.1 } as never)
        vi.mocked(normalizeAIAdminTaskListItem)
            .mockImplementation((item) => ({ id: item.id, normalized: true }) as never)

        const result = await listHandler({
            query: {
                page: '2',
                pageSize: '25',
                status: 'failed',
                chargeStatus: 'estimated',
                failureStage: 'provider_processing',
                search: '  volcengine  ',
            },
        } as never)

        expect(queryBuilder.skip).toHaveBeenCalledWith(25)
        expect(queryBuilder.take).toHaveBeenCalledWith(25)
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('task.status = :status', { status: 'failed' })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('task.chargeStatus = :chargeStatus', { chargeStatus: 'estimated' })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('task.failureStage = :failureStage', { failureStage: 'provider_processing' })
        expect(queryBuilder.andWhere).toHaveBeenCalledTimes(4)
        expect(normalizeAIAdminTaskListItem).toHaveBeenCalledTimes(2)
        expect(result).toEqual({
            items: [{ id: 'task-1', normalized: true }, { id: 'task-2', normalized: true }],
            total: 2,
            costDisplay: { currencyCode: 'CNY', currencySymbol: '¥', quotaUnitPrice: 0.1 },
        })
    })

    it('should validate and delete ai tasks by ids query', async () => {
        const deleteMock = vi.fn().mockResolvedValue(undefined)
        vi.mocked(dataSource.getRepository).mockReturnValue({ delete: deleteMock } as never)

        const result = await deleteHandler({
            query: {
                ids: '5fd0e68d1f80001, 5fd0e68d1f8e0001',
            },
        } as never)

        expect(deleteMock).toHaveBeenCalledWith({
            id: expect.objectContaining({ _value: ['5fd0e68d1f80001', '5fd0e68d1f8e0001'] }),
        })
        expect(result).toEqual({ success: true })
    })
})
