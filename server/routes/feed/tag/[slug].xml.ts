import { generateFeed } from '../../../utils/feed'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'

export default defineEventHandler(async (event) => {
    const slug = decodeURIComponent(getRouterParam(event, 'slug') || '')
    if (!slug) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Tag slug is required',
        })
    }

    const tagRepo = dataSource.getRepository(Tag)
    const tag = await tagRepo.findOne({
        where: { slug },
    })

    if (!tag) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Tag not found',
        })
    }

    const feed = await generateFeed(event, {
        tagId: tag.id,
        titleSuffix: `标签: ${tag.name}`,
    })

    appendHeader(event, 'Content-Type', 'application/xml')
    return feed.rss2()
})
