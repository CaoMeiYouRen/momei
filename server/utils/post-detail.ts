import { Brackets, type Repository } from 'typeorm'
import { Post } from '@/server/entities/post'
import { PostStatus, PostVisibility } from '@/types/post'

export interface PostNavigationItem {
    id: string
    slug: string
    title: string
    summary?: string | null
    coverImage?: string | null
    publishedAt?: Date | null
    language: string
}

export interface PostTranslationItem {
    language: string
    slug: string
}

function mapNavigationItem(post: Post | null): PostNavigationItem | null {
    if (!post) {
        return null
    }

    return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt ?? post.createdAt ?? null,
        language: post.language,
    }
}

function createAdjacentQuery(postRepo: Repository<Post>, currentPost: Post) {
    const clusterKey = currentPost.translationId || currentPost.id

    return postRepo.createQueryBuilder('post')
        .select([
            'post.id',
            'post.slug',
            'post.title',
            'post.summary',
            'post.coverImage',
            'post.publishedAt',
            'post.createdAt',
            'post.language',
        ])
        .where('post.language = :language', { language: currentPost.language })
        .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
        .andWhere('post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
        .andWhere('post.id != :currentId', { currentId: currentPost.id })
        .andWhere('COALESCE(post.translationId, post.id) != :clusterKey', { clusterKey })
}

export async function getPostTranslations(postRepo: Repository<Post>, currentPost: Post): Promise<PostTranslationItem[]> {
    if (!currentPost.translationId) {
        return []
    }

    const translations = await postRepo.find({
        where: {
            translationId: currentPost.translationId,
            status: PostStatus.PUBLISHED,
        },
        select: ['language', 'slug'],
    })

    return translations.map((translation) => ({
        language: translation.language,
        slug: translation.slug,
    }))
}

export async function getAdjacentPublicPosts(postRepo: Repository<Post>, currentPost: Post): Promise<{
    previousPost: PostNavigationItem | null
    nextPost: PostNavigationItem | null
}> {
    const currentTimeline = currentPost.publishedAt ?? currentPost.createdAt

    if (!currentTimeline) {
        return {
            previousPost: null,
            nextPost: null,
        }
    }

    const timelineColumn = 'COALESCE(post.publishedAt, post.createdAt)'

    const previousQuery = createAdjacentQuery(postRepo, currentPost)
        .andWhere(new Brackets((subQuery) => {
            subQuery.where(`${timelineColumn} > :currentTimeline`, { currentTimeline })
                .orWhere(new Brackets((equalQuery) => {
                    equalQuery.where(`${timelineColumn} = :currentTimeline`, { currentTimeline })
                        .andWhere('post.id > :currentId', { currentId: currentPost.id })
                }))
        }))
        .orderBy(timelineColumn, 'ASC')
        .addOrderBy('post.id', 'ASC')

    const nextQuery = createAdjacentQuery(postRepo, currentPost)
        .andWhere(new Brackets((subQuery) => {
            subQuery.where(`${timelineColumn} < :currentTimeline`, { currentTimeline })
                .orWhere(new Brackets((equalQuery) => {
                    equalQuery.where(`${timelineColumn} = :currentTimeline`, { currentTimeline })
                        .andWhere('post.id < :currentId', { currentId: currentPost.id })
                }))
        }))
        .orderBy(timelineColumn, 'DESC')
        .addOrderBy('post.id', 'DESC')

    const [previousPost, nextPost] = await Promise.all([
        previousQuery.getOne(),
        nextQuery.getOne(),
    ])

    return {
        previousPost: mapNavigationItem(previousPost),
        nextPost: mapNavigationItem(nextPost),
    }
}
