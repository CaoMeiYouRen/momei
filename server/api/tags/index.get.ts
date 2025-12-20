import { z } from 'zod'
import { Like } from 'typeorm'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { tagQuerySchema } from '@/utils/schemas/tag'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))

    const tagRepo = dataSource.getRepository(Tag)

    const skip = (query.page - 1) * query.limit

    const where: any = {}

    if (query.search) {
        where.name = Like(`%${query.search}%`)
    }

    if (query.language) {
        where.language = query.language
    }

    const [items, total] = await tagRepo.findAndCount({
        where,
        skip,
        take: query.limit,
        order: { createdAt: 'DESC' },
    })

    return {
        code: 200,
        data: {
            list: items,
            total,
            page: query.page,
            limit: query.limit,
        },
    }
})
