import { Feed } from 'feed'
import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import { generateFeed } from '@/server/utils/feed'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'

export default defineEventHandler(async (event) => {
    const feed = await generateFeed(event)

    appendHeader(event, 'Content-Type', 'application/xml')
    return feed.rss2()
})
