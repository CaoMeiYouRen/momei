import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'
import { PostStatus, PostVisibility } from '@/types/post'

export default defineEventHandler(async () => {
    const postRepo = dataSource.getRepository(Post)
    const categoryRepo = dataSource.getRepository(Category)
    const tagRepo = dataSource.getRepository(Tag)

    const [posts, categories, tags] = await Promise.all([
        postRepo.find({
            where: {
                status: PostStatus.PUBLISHED,
                visibility: PostVisibility.PUBLIC,
            },
            select: ['slug', 'language', 'updatedAt'],
        }),
        categoryRepo.find({
            select: ['slug', 'language', 'updatedAt'],
        }),
        tagRepo.find({
            select: ['slug', 'language', 'updatedAt'],
        }),
    ])

    const urls: { loc: string, lastmod?: Date }[] = []

    // 默认语言不带前缀，其他语言带上语言代码作为前缀
    const defaultLocale = 'zh-CN'

    // Posts
    for (const post of posts) {
        const prefix = post.language === defaultLocale ? '' : `/${post.language}`
        urls.push({
            loc: `${prefix}/posts/${post.slug}`,
            lastmod: post.updatedAt,
        })
    }

    // Categories
    for (const cat of categories) {
        const prefix = cat.language === defaultLocale ? '' : `/${cat.language}`
        urls.push({
            loc: `${prefix}/categories/${cat.slug}`,
            lastmod: cat.updatedAt,
        })
    }

    // Tags
    for (const tag of tags) {
        const prefix = tag.language === defaultLocale ? '' : `/${tag.language}`
        urls.push({
            loc: `${prefix}/tags/${tag.slug}`,
            lastmod: tag.updatedAt,
        })
    }

    return urls
})
