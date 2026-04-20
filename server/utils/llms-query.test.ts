import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
    const queryBuilder = {
        leftJoinAndSelect: vi.fn(),
        where: vi.fn(),
        andWhere: vi.fn(),
        orderBy: vi.fn(),
        addOrderBy: vi.fn(),
        take: vi.fn(),
        getMany: vi.fn(),
    }

    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder)
    queryBuilder.where.mockReturnValue(queryBuilder)
    queryBuilder.andWhere.mockReturnValue(queryBuilder)
    queryBuilder.orderBy.mockReturnValue(queryBuilder)
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder)
    queryBuilder.take.mockReturnValue(queryBuilder)
    queryBuilder.getMany.mockResolvedValue([])

    return {
        queryBuilder,
        mockGetRepository: vi.fn(() => ({
            createQueryBuilder: vi.fn(() => queryBuilder),
        })),
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: hoisted.mockGetRepository,
    },
}))

import { fetchPublishedLlmsPosts } from './llms'

describe('server/utils/llms query builder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        hoisted.mockGetRepository.mockReturnValue({
            createQueryBuilder: vi.fn(() => hoisted.queryBuilder),
        })
        hoisted.queryBuilder.leftJoinAndSelect.mockReturnValue(hoisted.queryBuilder)
        hoisted.queryBuilder.where.mockReturnValue(hoisted.queryBuilder)
        hoisted.queryBuilder.andWhere.mockReturnValue(hoisted.queryBuilder)
        hoisted.queryBuilder.orderBy.mockReturnValue(hoisted.queryBuilder)
        hoisted.queryBuilder.addOrderBy.mockReturnValue(hoisted.queryBuilder)
        hoisted.queryBuilder.take.mockReturnValue(hoisted.queryBuilder)
        hoisted.queryBuilder.getMany.mockResolvedValue([])
    })

    it('orders published llms posts by publishedAt then createdAt', async () => {
        await fetchPublishedLlmsPosts(12)

        expect(hoisted.queryBuilder.orderBy).toHaveBeenCalledWith('post.publishedAt', 'DESC', 'NULLS LAST')
        expect(hoisted.queryBuilder.addOrderBy).toHaveBeenCalledWith('post.createdAt', 'DESC')
        expect(hoisted.queryBuilder.take).toHaveBeenCalledWith(12)
        expect(hoisted.queryBuilder.getMany).toHaveBeenCalled()
    })
})
