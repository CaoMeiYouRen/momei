import { Not } from 'typeorm'
import { kebabCase } from 'lodash-es'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { assignDefined } from '@/server/utils/object'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import { generateRandomString } from '@/utils/shared/random'

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
    const translationClusterId = resolveTranslationClusterId(data.translationId, data.slug)

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
    if (translationClusterId) {
        const existingTranslation = await categoryRepo.findOneBy({
            translationId: translationClusterId,
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
    category.translationId = translationClusterId

    return categoryRepo.save(category)
}

export async function updateCategory(id: string, data: Partial<CategoryData>): Promise<Category> {
    const categoryRepo = dataSource.getRepository(Category)

    const category = await categoryRepo.findOneBy({ id })
    if (!category) {
        throw createError({ statusCode: 404, statusMessage: 'Category not found' })
    }

    const targetTranslationId = data.translationId !== undefined
        ? resolveTranslationClusterId(data.translationId, data.slug ?? category.slug)
        : resolveTranslationClusterId(category.translationId, data.slug ?? category.slug)

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
        'description',
        'parentId',
    ])
    category.translationId = targetTranslationId

    return categoryRepo.save(category)
}

/**
 * 检查错误是否为分类创建冲突（并发创建或已存在）
 */
function isCategoryConflictError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false
    }
    const msg = error.message || ''
    return msg.includes('duplicate key')
        || msg.includes('unique constraint')
        || msg.includes('already exists')
        || (error as { statusCode?: number }).statusCode === 409
}

/**
 * 获取或创建分类。常在文章创建/更新时自动处理不存在的分类。
 * 如果分类不存在，将根据名称自动生成 slug 并创建。
 */
export async function ensureCategory(name: string, language: string): Promise<Category> {
    const categoryRepo = dataSource.getRepository(Category)

    // 先按名称查找
    const existing = await categoryRepo.findOne({ where: { name, language } })
    if (existing) {
        return existing
    }

    // 自动生成 slug
    let slug = kebabCase(name)
    if (!slug) {
        slug = generateRandomString(8)
    }

    // 检查 slug 冲突，如果冲突则加随机后缀
    let existingBySlug = await categoryRepo.findOne({ where: { slug, language } })
    while (existingBySlug) {
        slug = `${slug}-${generateRandomString(4)}`
        existingBySlug = await categoryRepo.findOne({ where: { slug, language } })
    }

    try {
        return await createCategory({ name, slug, language })
    } catch (error: unknown) {
        // 并发创建冲突：另一个请求刚创建了同名/同slug分类 → 重新读取
        if (isCategoryConflictError(error)) {
            const created = await categoryRepo.findOne({ where: { name, language } })
            if (created) {
                return created
            }
            // 名称不存在但 slug 冲突 → 换个 slug 再试
            return createCategory({ name, slug: `${slug}-${generateRandomString(4)}`, language })
        }
        throw error
    }
}
