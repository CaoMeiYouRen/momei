import { Feed } from 'feed'
import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostStatus } from '@/types/post'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl as string) || 'https://momei.app'
    const appName = (config.public.appName as string) || '墨梅博客'

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    })

    md.use(MarkdownItAnchor, {
        slugify: (s) => s.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
        permalink: MarkdownItAnchor.permalink.headerLink(),
    })

    const postRepo = dataSource.getRepository(Post)
    const posts = await postRepo.find({
        where: { status: PostStatus.PUBLISHED },
        order: { publishedAt: 'DESC' },
        take: 20,
        relations: ['author', 'category', 'tags'],
    })

    const feed = new Feed({
        title: appName,
        description: '墨梅博客 - 轻量跨语言博客创作平台',
        id: siteUrl,
        link: siteUrl,
        language: 'zh-CN',
        image: `${siteUrl}/logo.png`,
        favicon: `${siteUrl}/favicon.ico`,
        copyright: `All rights reserved ${new Date().getFullYear()}, ${appName}`,
        updated: posts[0]?.publishedAt || new Date(),
        generator: 'Momei Blog',
        feedLinks: {
            rss2: `${siteUrl}/feed.xml`,
        },
        author: {
            name: appName,
        },
    })

    posts.forEach((post) => {
        feed.addItem({
            title: post.title,
            id: `${siteUrl}/posts/${post.slug}`,
            link: `${siteUrl}/posts/${post.slug}`,
            description: post.summary || '',
            content: md.render(post.content),
            author: [
                {
                    name: post.author?.name || appName,
                },
            ],
            category: post.category ? [{ name: post.category.name }] : [],
            date: post.publishedAt || post.createdAt,
            image: post.coverImage || undefined,
        })
    })

    appendHeader(event, 'Content-Type', 'application/xml')
    return feed.rss2()
})
