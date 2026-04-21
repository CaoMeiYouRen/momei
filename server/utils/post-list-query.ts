import { Brackets, type SelectQueryBuilder, type WhereExpressionBuilder } from 'typeorm'
import { Post } from '@/server/entities/post'
import { getLocaleRegistryItem } from '@/i18n/config/locale-registry'

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

export function applyPublishedPostLanguageFallbackFilter(
    qb: SelectQueryBuilder<Post>,
    language?: null | string,
) {
    if (!language) {
        return qb
    }

    const fallbackChain = getLocaleRegistryItem(language).fallbackChain

    qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
        sub.where('post.translationId IS NULL')

        fallbackChain.forEach((fallbackLanguage, index) => {
            const languageParam = index === 0 ? 'language' : `fallbackLanguage${index}`
            const params: Record<string, string | string[]> = {
                [languageParam]: fallbackLanguage,
            }

            sub.orWhere(new Brackets((candidate: WhereExpressionBuilder) => {
                candidate.where('post.translationId IS NOT NULL')
                    .andWhere(`post.language = :${languageParam}`, params)

                const previousLanguages = fallbackChain.slice(0, index)
                if (previousLanguages.length > 0) {
                    const previousLanguagesParam = `previousLanguages${index}`
                    candidate.andWhere((subQb: SelectQueryBuilder<Post>) => {
                        const existsQuery = subQb.subQuery()
                            .select('1')
                            .from(Post, 'p2')
                            .where('p2.translationId = post.translationId')
                            .andWhere('p2.status = :publishedStatus', { publishedStatus: 'published' })
                            .andWhere(`p2.language IN (:...${previousLanguagesParam})`, {
                                [previousLanguagesParam]: previousLanguages,
                            })
                            .getQuery()

                        return `NOT EXISTS ${existsQuery}`
                    })
                }
            }))
        })
    }))

    return qb
}
