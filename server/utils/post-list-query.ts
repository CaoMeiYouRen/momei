import type { SelectQueryBuilder } from 'typeorm'
import type { Post } from '@/server/entities/post'

export function applyPostListSelect(qb: SelectQueryBuilder<Post>) {
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

    qb.leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image', 'author.email'])
        .leftJoin('post.category', 'category')
        .addSelect(['category.id', 'category.name', 'category.slug'])
        .leftJoin('post.tags', 'tags')
        .addSelect(['tags.id', 'tags.name', 'tags.slug'])

    return qb
}
