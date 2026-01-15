import { generateFeed, getFeedLanguage } from '@/server/utils/feed'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'

export default defineEventHandler(async (event) => {
    let slug = getRouterParam(event, 'slug') || ''

    // 如果 URL 包含 .xml 后缀，在这里进行剥离，因为文件名改为 [slug].ts 后参数会带上后缀
    if (slug.endsWith('.xml')) {
        slug = slug.slice(0, -4)
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

    appendHeader(event, 'Content-Type', 'application/xml')
    return feed.rss2()
})
