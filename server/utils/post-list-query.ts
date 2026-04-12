import type { SelectQueryBuilder } from 'typeorm'
import type { Post } from '@/server/entities/post'

interface PostListSelectOptions {
    includeAuthor?: boolean
    includeAuthorEmail?: boolean
    includeCategory?: boolean
    includeTags?: boolean
}

export function applyPostListSelect(
    qb: SelectQueryBuilder<Post>,
    options: PostListSelectOptions = {},
) {
    const {
        includeAuthor = true,
        includeAuthorEmail = true,
        includeCategory = true,
        includeTags = true,
    } = options

    // 列表查询只选择“卡片渲染与管理摘要”所需字段，
    // 明确排除 content/html/password 等重字段，降低查询体积与序列化成本。
    qb.select([
        'post.id',
        'post.title',
        'post.slug',
        'post.summary',
        'post.coverImage',
        'post.language',
        'post.translationId',
        'post.authorId',
        'post.categoryId',
        'post.status',
        'post.visibility',
        'post.views',
        'post.isPinned',
        'post.metaVersion',
        'post.metadata',
        'post.publishedAt',
        'post.createdAt',
        'post.updatedAt',
    ])

    if (includeAuthor) {
        qb.leftJoin('post.author', 'author')

        const authorSelects = ['author.id', 'author.name', 'author.image']
        if (includeAuthorEmail) {
            authorSelects.push('author.email')
        }

        qb.addSelect(authorSelects)
    }

    // 关联查询按需开启，避免在不需要分类/标签信息的接口里产生额外 join 开销。
    if (includeCategory) {
        qb.leftJoin('post.category', 'category')
            .addSelect(['category.id', 'category.name', 'category.slug'])
    }

    if (includeTags) {
        qb.leftJoin('post.tags', 'tags')
            .addSelect(['tags.id', 'tags.name', 'tags.slug'])
    }

    return qb
}
