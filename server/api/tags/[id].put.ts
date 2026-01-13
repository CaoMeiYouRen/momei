import { Not } from 'typeorm'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { auth } from '@/lib/auth'
import { tagUpdateSchema } from '@/utils/schemas/tag'

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

    const body = await readValidatedBody(event, (b) => tagUpdateSchema.parse(b))
    const tagRepo = dataSource.getRepository(Tag)

    const tag = await tagRepo.findOneBy({ id })
    if (!tag) {
        throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
    }

    // Check slug uniqueness if updating slug or language
    if (
        (body.slug && body.slug !== tag.slug)
        || (body.language && body.language !== tag.language)
    ) {
        const targetSlug = body.slug ?? tag.slug
        const targetLanguage = body.language ?? tag.language
        const existing = await tagRepo.findOne({
            where: {
                slug: targetSlug,
                language: targetLanguage,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists in this language' })
        }
    }

    // Check name uniqueness if updating name or language
    if (
        (body.name && body.name !== tag.name)
        || (body.language && body.language !== tag.language)
    ) {
        const targetName = body.name ?? tag.name
        const targetLanguage = body.language ?? tag.language
        const existing = await tagRepo.findOne({
            where: {
                name: targetName,
                language: targetLanguage,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Tag name already exists in this language' })
        }
    }

    if (body.slug) {
        tag.slug = body.slug
    }
    if (body.name) {
        tag.name = body.name
    }
    if (body.language !== undefined) {
        tag.language = body.language
    }

    await tagRepo.save(tag)

    return {
        code: 200,
        data: tag,
    }
})
