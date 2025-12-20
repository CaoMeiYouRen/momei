import { z } from 'zod'
import { Not } from 'typeorm'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { auth } from '@/lib/auth'
import { isSnowflakeId } from '@/utils/shared/validate'

const bodySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }).optional(),
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
    const tagRepo = dataSource.getRepository(Tag)

    const tag = await tagRepo.findOneBy({ id })
    if (!tag) {
        throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
    }

    // Check slug uniqueness if updating
    if (body.slug && body.slug !== tag.slug) {
        const existing = await tagRepo.findOne({
            where: {
                slug: body.slug,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
        }
        tag.slug = body.slug
    }

    // Check name uniqueness if updating
    if (body.name && body.name !== tag.name) {
        const existing = await tagRepo.findOne({
            where: {
                name: body.name,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Tag name already exists' })
        }
        tag.name = body.name
    }

    if (body.language !== undefined) { tag.language = body.language }

    await tagRepo.save(tag)

    return {
        code: 200,
        data: tag,
    }
})
