import { generateFeed } from '@/server/utils/feed'

export default defineEventHandler(async (event) => {
    const feed = await generateFeed(event, {
        isPodcast: true,
        titleSuffix: 'Podcast',
    })

    appendHeader(event, 'Content-Type', 'application/atom+xml')
    return feed.atom1()
})
