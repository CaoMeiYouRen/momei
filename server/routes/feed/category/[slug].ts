import { generateFeed, getFeedLanguage } from '@/server/utils/feed'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'

export default defineEventHandler(async (event) => {
    let slug = getRouterParam(event, 'slug') || ''
    let format: 'rss2' | 'atom1' | 'json1' = 'rss2'
    let contentType = 'application/xml'

    // 根据后缀判断格式并剥离
    if (slug.endsWith('.xml')) {
        slug = slug.slice(0, -4)
        format = 'rss2'
        contentType = 'application/xml'
    } else if (slug.endsWith('.atom')) {
        slug = slug.slice(0, -5)
        format = 'atom1'
        contentType = 'application/atom+xml'
    } else if (slug.endsWith('.json')) {
        slug = slug.slice(0, -5)
        format = 'json1'
        contentType = 'application/feed+json'
    }

    slug = decodeURIComponent(slug)

    if (!slug) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Category slug is required',
        })
    }

    const language = getFeedLanguage(event)
    const categoryRepo = dataSource.getRepository(Category)
    const category = await categoryRepo.findOne({
        where: { slug, language },
    })

    if (!category) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Category not found',
        })
    }

    const feed = await generateFeed(event, {
        categoryId: category.id,
        language: category.language,
        titleSuffix: category.language === 'zh-CN' ? `分类: ${category.name}` : `Category: ${category.name}`,
    })

    appendHeader(event, 'Content-Type', contentType)
    return feed[format]()
})
