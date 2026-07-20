import { generateFeed, injectRssStylesheet } from '@/server/utils/feed'

export default defineEventHandler(async (event) => {
    const feed = await generateFeed(event)

    appendHeader(event, 'Content-Type', 'application/xml')
    return injectRssStylesheet(feed.rss2())
})
