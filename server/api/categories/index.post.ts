import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { auth } from '@/lib/auth'
import { isSnowflakeId } from '@/utils/shared/validate'

const bodySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string().default('zh'),
})

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || session.user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => bodySchema.parse(b))
    const categoryRepo = dataSource.getRepository(Category)

    // Check if slug exists
    const existing = await categoryRepo.findOneBy({ slug: body.slug })
    if (existing) {
        throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
    }

    // Check parent if provided
    if (body.parentId) {
        const parent = await categoryRepo.findOneBy({ id: body.parentId })
        if (!parent) {
            throw createError({ statusCode: 400, statusMessage: 'Parent category not found' })
        }
    }

    const category = new Category()
    category.name = body.name
    category.slug = body.slug
    category.description = body.description ?? null
    category.parentId = body.parentId ?? null
    category.language = body.language

    await categoryRepo.save(category)

    return {
        code: 200,
        data: category,
    }
})
