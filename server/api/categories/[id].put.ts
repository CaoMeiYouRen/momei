import { Not } from 'typeorm'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { auth } from '@/lib/auth'
import { categoryUpdateSchema } from '@/utils/schemas/category'

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

    const body = await readValidatedBody(event, (b) => categoryUpdateSchema.parse(b))
    const categoryRepo = dataSource.getRepository(Category)

    const category = await categoryRepo.findOneBy({ id })
    if (!category) {
        throw createError({ statusCode: 404, statusMessage: 'Category not found' })
    }

    // Check slug uniqueness if updating slug or language
    if (
        (body.slug && body.slug !== category.slug)
        || (body.language && body.language !== category.language)
    ) {
        const targetSlug = body.slug ?? category.slug
        const targetLanguage = body.language ?? category.language
        const existing = await categoryRepo.findOne({
            where: {
                slug: targetSlug,
                language: targetLanguage,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists in this language' })
        }
        category.slug = targetSlug
    }

    // Check name uniqueness if updating name or language
    if (
        (body.name && body.name !== category.name)
        || (body.language && body.language !== category.language)
    ) {
        const targetName = body.name ?? category.name
        const targetLanguage = body.language ?? category.language
        const existing = await categoryRepo.findOne({
            where: {
                name: targetName,
                language: targetLanguage,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Category name already exists in this language' })
        }
    }

    if (body.name !== undefined) {
        category.name = body.name
    }
    if (body.description !== undefined) {
        category.description = body.description
    }
    if (body.language !== undefined) {
        category.language = body.language
    }

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
