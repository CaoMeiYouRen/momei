import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'
import { PostStatus, PostVisibility } from '@/types/post'
import { getLocaleRoutePrefix } from '@/i18n/config/locale-registry'

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

    // Posts
    for (const post of posts) {
        const prefix = getLocaleRoutePrefix(post.language)
        urls.push({
            loc: `${prefix}/posts/${post.slug}`,
            lastmod: post.updatedAt,
        })
    }

    // Categories
    for (const cat of categories) {
        const prefix = getLocaleRoutePrefix(cat.language)
        urls.push({
            loc: `${prefix}/categories/${cat.slug}`,
            lastmod: cat.updatedAt,
        })
    }

    // Tags
    for (const tag of tags) {
        const prefix = getLocaleRoutePrefix(tag.language)
        urls.push({
            loc: `${prefix}/tags/${tag.slug}`,
            lastmod: tag.updatedAt,
        })
    }

    return urls
})
