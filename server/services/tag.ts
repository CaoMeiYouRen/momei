import { kebabCase } from 'lodash-es'
import { Not } from 'typeorm'
import { snowflake } from '@/server/utils/snowflake'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { generateRandomString } from '@/utils/shared/random'

interface TagData {
    name: string
    slug: string
    language: string
    translationId?: string | null
}

/**
 * 创建单个标签，包含完整校验
 */
export async function createTag(data: TagData): Promise<Tag> {
    const tagRepo = dataSource.getRepository(Tag)

    // 校验 Slug
    const existingSlug = await tagRepo.findOneBy({ slug: data.slug, language: data.language })
    if (existingSlug) {
        throw createError({ statusCode: 409, statusMessage: 'Slug already exists in this language' })
    }

    // 校验名称
    const existingName = await tagRepo.findOneBy({ name: data.name, language: data.language })
    if (existingName) {
        throw createError({ statusCode: 409, statusMessage: 'Tag name already exists in this language' })
    }

    // 校验翻译组唯一性 (translationId + language)
    if (data.translationId) {
        const existingTranslation = await tagRepo.findOneBy({
            translationId: data.translationId,
            language: data.language,
        })
        if (existingTranslation) {
            throw createError({ statusCode: 409, statusMessage: 'A translation for this group already exists in this language' })
        }
    }

    const tag = new Tag()
    tag.name = data.name
    tag.slug = data.slug
    tag.language = data.language
    tag.translationId = data.translationId || snowflake.generateId()

    return await tagRepo.save(tag)
}

/**
 * 更新标签，包含唯一性校验
 */
export async function updateTag(id: string, data: Partial<TagData>): Promise<Tag> {
    const tagRepo = dataSource.getRepository(Tag)
    const tag = await tagRepo.findOneBy({ id })
    if (!tag) {
        throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
    }

    // 检查 slug 唯一性
    if (
        (data.slug && data.slug !== tag.slug)
        || (data.language && data.language !== tag.language)
    ) {
        const targetSlug = data.slug ?? tag.slug
        const targetLanguage = data.language ?? tag.language
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

    // 检查名称唯一性
    if (
        (data.name && data.name !== tag.name)
        || (data.language && data.language !== tag.language)
    ) {
        const targetName = data.name ?? tag.name
        const targetLanguage = data.language ?? tag.language
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

    // 检查翻译组唯一性 (translationId + language)
    if (
        (data.translationId !== undefined && data.translationId !== tag.translationId)
        || (data.language && data.language !== tag.language)
    ) {
        const targetTranslationId = data.translationId ?? tag.translationId
        const targetLanguage = data.language ?? tag.language
        if (targetTranslationId) {
            const existing = await tagRepo.findOne({
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

    if (data.name !== undefined) { tag.name = data.name }
    if (data.slug !== undefined) { tag.slug = data.slug }
    if (data.language !== undefined) { tag.language = data.language }
    if (data.translationId !== undefined) { tag.translationId = data.translationId }

    return await tagRepo.save(tag)
}

/**
 * 获取或创建标签。常用于文章发布时自动处理标签。
 * 如果标签不存在，将根据名称自动生成 slug。
 */
export async function ensureTags(tagNames: string[], language: string): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) {
        return []
    }

    const tagRepo = dataSource.getRepository(Tag)
    const result: Tag[] = []

    for (const name of tagNames) {
        let tag = await tagRepo.findOne({ where: { name, language } })
        if (!tag) {
            // 自动生成 Slug
            let slug = kebabCase(name)
            if (!slug) {
                slug = generateRandomString(8)
            }

            // 检查 Slug 冲突，如果冲突则加随机后缀
            let existingTagSlug = await tagRepo.findOne({ where: { slug, language } })
            while (existingTagSlug) {
                slug = `${slug}-${generateRandomString(4)}`
                existingTagSlug = await tagRepo.findOne({ where: { slug, language } })
            }

            // 调用统一的创建逻辑
            tag = await createTag({
                name,
                slug,
                language,
            })
        }
        result.push(tag)
    }

    return result
}
