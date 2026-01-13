import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { auth } from '@/lib/auth'
import { categoryBodySchema } from '@/utils/schemas/category'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !isAdmin(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => categoryBodySchema.parse(b))
    const categoryRepo = dataSource.getRepository(Category)

    // Check if slug exists in the same language
    const existing = await categoryRepo.findOneBy({ slug: body.slug, language: body.language })
    if (existing) {
        throw createError({ statusCode: 409, statusMessage: 'Slug already exists in this language' })
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
