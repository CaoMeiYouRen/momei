import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const categoryRepo = dataSource.getRepository(Category)

    // Try to find by ID first
    const category = await categoryRepo.findOne({
        where: { id },
        relations: ['parent', 'children'],
    })

    // If not found, try to find by Slug (if the ID param is actually a slug)
    // But strictly speaking, this endpoint is [id].get.ts.
    // However, for convenience, sometimes we might want to support both or just ID.
    // The plan says: GET /api/categories/:id (or /api/categories/slug/:slug)
    // Let's stick to ID here. If user passes a slug, it won't match a UUID/Snowflake usually.

    if (!category) {
        throw createError({ statusCode: 404, statusMessage: 'Category not found' })
    }

    return {
        code: 200,
        data: category,
    }
})
