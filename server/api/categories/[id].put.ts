import { z } from 'zod'
import { Not } from 'typeorm'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { auth } from '@/lib/auth'
import { isSnowflakeId } from '@/utils/shared/validate'

const bodySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }).optional(),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(), // Allow null to remove parent
    language: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || session.user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => bodySchema.parse(b))
    const categoryRepo = dataSource.getRepository(Category)

    const category = await categoryRepo.findOneBy({ id })
    if (!category) {
        throw createError({ statusCode: 404, statusMessage: 'Category not found' })
    }

    // Check slug uniqueness if updating
    if (body.slug && body.slug !== category.slug) {
        const existing = await categoryRepo.findOne({
            where: {
                slug: body.slug,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
        }
        category.slug = body.slug
    }

    if (body.name !== undefined) { category.name = body.name }
    if (body.description !== undefined) { category.description = body.description }
    if (body.language !== undefined) { category.language = body.language }

    if (body.parentId !== undefined) {
        if (body.parentId === null) {
            category.parentId = null
            category.parent = null as any
        } else {
            // Prevent circular dependency
            if (body.parentId === id) {
                throw createError({ statusCode: 400, statusMessage: 'Cannot set self as parent' })
            }
            const parent = await categoryRepo.findOneBy({ id: body.parentId })
            if (!parent) {
                throw createError({ statusCode: 400, statusMessage: 'Parent category not found' })
            }
            category.parentId = body.parentId
        }
    }

    await categoryRepo.save(category)

    return {
        code: 200,
        data: category,
    }
})
