import { generateFeed } from '../../../utils/feed'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'

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
