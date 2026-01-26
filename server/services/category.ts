import { Not } from 'typeorm'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { assignDefined } from '@/server/utils/object'

export interface CategoryData {
    name: string
    slug: string
    language: string
    translationId?: string | null
    description?: string | null
    parentId?: string | null
}

export async function createCategory(data: CategoryData): Promise<Category> {
    const categoryRepo = dataSource.getRepository(Category)

    // Check slug uniqueness within same language
    const existingSlug = await categoryRepo.findOneBy({
        slug: data.slug,
        language: data.language,
    })
    if (existingSlug) {
        throw createError({ statusCode: 409, statusMessage: 'Category slug already exists in this language' })
    }

    // Check name uniqueness within same language
    const existingName = await categoryRepo.findOneBy({
        name: data.name,
        language: data.language,
    })
    if (existingName) {
        throw createError({ statusCode: 409, statusMessage: 'Category name already exists in this language' })
    }

    // Check translation group uniqueness
    if (data.translationId) {
        const existingTranslation = await categoryRepo.findOneBy({
            translationId: data.translationId,
            language: data.language,
        })
        if (existingTranslation) {
            throw createError({ statusCode: 409, statusMessage: 'A translation for this group already exists in this language' })
        }
    }

    // Check parent if provided
    if (data.parentId) {
        const parent = await categoryRepo.findOneBy({ id: data.parentId })
        if (!parent) {
            throw createError({ statusCode: 400, statusMessage: 'Parent category not found' })
        }
    }

    const category = new Category()
    assignDefined(category, data, [
        'name',
        'slug',
        'language',
        'description',
        'parentId',
    ])
    category.translationId = data.translationId || data.slug

    return await categoryRepo.save(category)
}

export async function updateCategory(id: string, data: Partial<CategoryData>): Promise<Category> {
    const categoryRepo = dataSource.getRepository(Category)

    const category = await categoryRepo.findOneBy({ id })
    if (!category) {
        throw createError({ statusCode: 404, statusMessage: 'Category not found' })
    }

    // Check slug uniqueness if updating
    if (
        (data.slug && data.slug !== category.slug)
        || (data.language && data.language !== category.language)
    ) {
        const targetSlug = data.slug ?? category.slug
        const targetLanguage = data.language ?? category.language
        const existing = await categoryRepo.findOne({
            where: {
                slug: targetSlug,
                language: targetLanguage,
                id: Not(id),
            },
        })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Category slug already exists in this language' })
        }
    }

    // Check name uniqueness if updating
    if (
        (data.name && data.name !== category.name)
        || (data.language && data.language !== category.language)
    ) {
        const targetName = data.name ?? category.name
        const targetLanguage = data.language ?? category.language
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

    // Check translation group uniqueness
    if (
        (data.translationId !== undefined && data.translationId !== category.translationId)
        || (data.language && data.language !== category.language)
    ) {
        const targetTranslationId = data.translationId ?? category.translationId
        const targetLanguage = data.language ?? category.language
        if (targetTranslationId) {
            const existing = await categoryRepo.findOne({
                where: {
                    translationId: targetTranslationId,
                    language: targetLanguage,
                    id: Not(id),
                },
            })
            if (existing) {
                throw createError({ statusCode: 409, statusMessage: 'A translation for this group already exists in this language' })
            }
        }
    }

    // Check parent if provided
    if (data.parentId) {
        const parent = await categoryRepo.findOneBy({ id: data.parentId })
        if (!parent) {
            throw createError({ statusCode: 400, statusMessage: 'Parent category not found' })
        }
    }

    assignDefined(category, data, [
        'name',
        'slug',
        'language',
        'translationId',
        'description',
        'parentId',
    ])

    return await categoryRepo.save(category)
}
