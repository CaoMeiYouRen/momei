import { kebabCase } from 'lodash-es'
import { snowflake } from '../snowflake'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { generateRandomString } from '@/utils/shared/random'

/**
 * 获取或创建标签。常用于文章发布时自动处理标签。
 * 如果标签不存在，将根据名称自动生成 slug。
 */
export async function ensureTags(tagNames: string[], language: string): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) { return [] }

    const tagRepo = dataSource.getRepository(Tag)
    const result: Tag[] = []

    for (const name of tagNames) {
        let tag = await tagRepo.findOne({ where: { name, language } })
        if (!tag) {
            tag = new Tag()
            tag.name = name
            tag.language = language
            tag.translationId = snowflake.generateId()

            // 自动生成 Slug
            let slug = kebabCase(name)
            if (!slug) {
                slug = generateRandomString(8)
            }

            // 检查 Slug 冲突
            let existingTagSlug = await tagRepo.findOne({ where: { slug, language } })
            while (existingTagSlug) {
                slug = `${slug}-${generateRandomString(4)}`
                existingTagSlug = await tagRepo.findOne({ where: { slug, language } })
            }

            tag.slug = slug
            await tagRepo.save(tag)
        }
        result.push(tag)
    }

    return result
}
