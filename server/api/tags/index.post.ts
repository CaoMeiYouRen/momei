import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { auth } from '@/lib/auth'
import { tagBodySchema } from '@/utils/schemas/tag'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Admin and Author can create tags
    if (session.user.role !== 'admin' && session.user.role !== 'author') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => tagBodySchema.parse(b))
    const tagRepo = dataSource.getRepository(Tag)

    // Check if slug exists
    const existingSlug = await tagRepo.findOneBy({ slug: body.slug })
    if (existingSlug) {
        throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
    }

    // Check if name exists (Tags usually have unique names too)
    const existingName = await tagRepo.findOneBy({ name: body.name })
    if (existingName) {
        throw createError({ statusCode: 409, statusMessage: 'Tag name already exists' })
    }

    const tag = new Tag()
    tag.name = body.name
    tag.slug = body.slug
    tag.language = body.language

    await tagRepo.save(tag)

    return {
        code: 200,
        data: tag,
    }
})
