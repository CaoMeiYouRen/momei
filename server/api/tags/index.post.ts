import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { auth } from '@/lib/auth'
import { tagBodySchema } from '@/utils/schemas/tag'
import { isAdminOrAuthor } from '@/utils/shared/roles'
import { snowflake } from '@/server/utils/snowflake'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Admin and Author can create tags
    if (!isAdminOrAuthor(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => tagBodySchema.parse(b))
    const tagRepo = dataSource.getRepository(Tag)

    // Check if slug exists in the same language
    const existingSlug = await tagRepo.findOneBy({ slug: body.slug, language: body.language })
    if (existingSlug) {
        throw createError({ statusCode: 409, statusMessage: 'Slug already exists in this language' })
    }

    // Check if name exists in the same language
    const existingName = await tagRepo.findOneBy({ name: body.name, language: body.language })
    if (existingName) {
        throw createError({ statusCode: 409, statusMessage: 'Tag name already exists in this language' })
    }

    const tag = new Tag()
    tag.name = body.name
    tag.slug = body.slug
    tag.language = body.language
    tag.translationId = body.translationId || snowflake.generateId()

    await tagRepo.save(tag)

    return {
        code: 200,
        data: tag,
    }
})
