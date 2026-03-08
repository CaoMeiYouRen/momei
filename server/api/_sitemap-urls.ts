import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'
import { PostStatus, PostVisibility } from '@/types/post'
import { buildLocalizedSitemapEntries } from '@/server/utils/sitemap'

export default defineSitemapEventHandler(async () => {
    const runtimeConfig = useRuntimeConfig()
    const baseUrl = runtimeConfig.public.siteUrl || 'https://momei.app'
    const postRepo = dataSource.getRepository(Post)
    const categoryRepo = dataSource.getRepository(Category)
    const tagRepo = dataSource.getRepository(Tag)

    const [posts, categories, tags] = await Promise.all([
        postRepo.find({
            where: {
                status: PostStatus.PUBLISHED,
                visibility: PostVisibility.PUBLIC,
            },
            select: ['id', 'slug', 'language', 'translationId', 'updatedAt'],
        }),
        categoryRepo.find({
            select: ['id', 'slug', 'language', 'translationId', 'updatedAt'],
        }),
        tagRepo.find({
            select: ['id', 'slug', 'language', 'translationId', 'updatedAt'],
        }),
    ])

    return [
        ...buildLocalizedSitemapEntries(posts, baseUrl, (post) => `/posts/${post.slug}`),
        ...buildLocalizedSitemapEntries(categories, baseUrl, (category) => `/categories/${category.slug}`),
        ...buildLocalizedSitemapEntries(tags, baseUrl, (tag) => `/tags/${tag.slug}`),
    ]
})
