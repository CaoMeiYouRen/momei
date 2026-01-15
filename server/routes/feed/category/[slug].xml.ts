import { generateFeed } from '../../../utils/feed'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'

export default defineEventHandler(async (event) => {
    const slug = decodeURIComponent(getRouterParam(event, 'slug') || '')
    if (!slug) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Category slug is required',
        })
    }

    const categoryRepo = dataSource.getRepository(Category)
    const category = await categoryRepo.findOne({
        where: { slug },
    })

    if (!category) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Category not found',
        })
    }

    const feed = await generateFeed(event, {
        categoryId: category.id,
        titleSuffix: `分类: ${category.name}`,
    })

    appendHeader(event, 'Content-Type', 'application/xml')
    return feed.rss2()
})
