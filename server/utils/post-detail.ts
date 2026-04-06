import { Brackets, type Repository } from 'typeorm'
import { Post } from '@/server/entities/post'
import { PostStatus, PostVisibility } from '@/types/post'
import { getLocaleRegistryItem } from '@/i18n/config/locale-registry'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'

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

export interface PostRelatedTaxonomyItem {
    id: string
    name: string
    slug: string
}

export interface PostRelatedItem extends PostNavigationItem {
    category?: PostRelatedTaxonomyItem | null
    tags?: PostRelatedTaxonomyItem[] | null
}

function resolveRecommendationLanguages(language: string) {
    return Array.from(new Set([language, ...getLocaleRegistryItem(language).fallbackChain]))
}

function resolvePostClusterKey(post: Pick<Post, 'id' | 'slug' | 'translationId'>) {
    return resolveTranslationClusterId(post.translationId, post.slug, post.id) || post.id
}

function getPostTimelineValue(post: Pick<Post, 'publishedAt' | 'createdAt'>) {
    const timeline = post.publishedAt ?? post.createdAt
    return timeline instanceof Date ? timeline.getTime() : 0
}

function mapRelatedTaxonomyItem(item?: { id: string, name: string, slug: string } | null) {
    if (!item) {
        return null
    }

    return {
        id: item.id,
        name: item.name,
        slug: item.slug,
    }
}

function mapRelatedItem(post: Post): PostRelatedItem {
    return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt ?? post.createdAt ?? null,
        language: post.language,
        category: mapRelatedTaxonomyItem(post.category),
        tags: post.tags?.map((tag) => mapRelatedTaxonomyItem(tag)).filter((tag): tag is PostRelatedTaxonomyItem => Boolean(tag)) || [],
    }
}

function getCategoryClusterKey(post: Pick<Post, 'category'>) {
    return resolveTranslationClusterId(post.category?.translationId, post.category?.slug, post.category?.id)
}

function getTagClusterKeys(post: Pick<Post, 'tags'>) {
    return new Set(
        (post.tags || [])
            .map((tag) => resolveTranslationClusterId(tag.translationId, tag.slug, tag.id))
            .filter((clusterId): clusterId is string => Boolean(clusterId)),
    )
}

function countSharedTagClusters(source: Set<string>, target: Set<string>) {
    let count = 0

    source.forEach((clusterId) => {
        if (target.has(clusterId)) {
            count += 1
        }
    })

    return count
}

function pickPreferredClusterCandidate(candidates: Post[], languages: string[]) {
    const languagePriority = new Map(languages.map((language, index) => [language, index]))

    return [...candidates].sort((left, right) => {
        const leftPriority = languagePriority.get(left.language) ?? Number.MAX_SAFE_INTEGER
        const rightPriority = languagePriority.get(right.language) ?? Number.MAX_SAFE_INTEGER

        if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority
        }

        return getPostTimelineValue(right) - getPostTimelineValue(left)
    })[0] || null
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

export async function getRelatedPublicPosts(
    postRepo: Repository<Post>,
    currentPost: Post,
    options?: { limit?: number },
): Promise<PostRelatedItem[]> {
    const limit = options?.limit ?? 3
    const categoryClusterKey = getCategoryClusterKey(currentPost)
    const tagClusterKeys = getTagClusterKeys(currentPost)

    if (!categoryClusterKey && tagClusterKeys.size === 0) {
        return []
    }

    const recommendationLanguages = resolveRecommendationLanguages(currentPost.language)
    const currentClusterKey = resolvePostClusterKey(currentPost)
    const timelineColumn = 'COALESCE(post.publishedAt, post.createdAt)'

    const candidates = await postRepo.createQueryBuilder('post')
        .select([
            'post.id',
            'post.slug',
            'post.title',
            'post.summary',
            'post.coverImage',
            'post.publishedAt',
            'post.createdAt',
            'post.language',
            'post.translationId',
        ])
        .leftJoin('post.category', 'category')
        .addSelect([
            'category.id',
            'category.name',
            'category.slug',
            'category.translationId',
        ])
        .leftJoin('post.tags', 'tags')
        .addSelect([
            'tags.id',
            'tags.name',
            'tags.slug',
            'tags.translationId',
        ])
        .addSelect(timelineColumn, 'post_timeline')
        .where('post.status = :status', { status: PostStatus.PUBLISHED })
        .andWhere('post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
        .andWhere('post.id != :currentId', { currentId: currentPost.id })
        .andWhere('COALESCE(post.translationId, post.slug, post.id) != :currentClusterKey', { currentClusterKey })
        .andWhere('post.language IN (:...recommendationLanguages)', { recommendationLanguages })
        .andWhere(new Brackets((subQuery) => {
            if (categoryClusterKey) {
                subQuery.where('COALESCE(category.translationId, category.slug, category.id) = :categoryClusterKey', { categoryClusterKey })
            }

            if (tagClusterKeys.size > 0) {
                const tagClusterKeyList = [...tagClusterKeys]

                if (categoryClusterKey) {
                    subQuery.orWhere('COALESCE(tags.translationId, tags.slug, tags.id) IN (:...tagClusterKeyList)', { tagClusterKeyList })
                } else {
                    subQuery.where('COALESCE(tags.translationId, tags.slug, tags.id) IN (:...tagClusterKeyList)', { tagClusterKeyList })
                }
            }
        }))
        .orderBy('post_timeline', 'DESC')
        .addOrderBy('post.id', 'DESC')
        .getMany()

    const clusterBuckets = new Map<string, Post[]>()

    candidates.forEach((candidate) => {
        const clusterKey = resolvePostClusterKey(candidate)
        const bucket = clusterBuckets.get(clusterKey)

        if (bucket) {
            bucket.push(candidate)
            return
        }

        clusterBuckets.set(clusterKey, [candidate])
    })

    const preferredCandidates = [...clusterBuckets.values()]
        .map((bucket) => pickPreferredClusterCandidate(bucket, recommendationLanguages))
        .filter((candidate): candidate is Post => Boolean(candidate))

    const scoredCandidates = preferredCandidates
        .map((candidate) => {
            const candidateCategoryClusterKey = getCategoryClusterKey(candidate)
            const candidateTagClusterKeys = getTagClusterKeys(candidate)
            const sharedTagCount = countSharedTagClusters(tagClusterKeys, candidateTagClusterKeys)
            const hasCategoryMatch = Boolean(categoryClusterKey && candidateCategoryClusterKey === categoryClusterKey)

            let score = 0

            if (hasCategoryMatch) {
                score += 6
            }

            if (sharedTagCount > 0) {
                score += Math.min(sharedTagCount, 3) * 3
            }

            if (hasCategoryMatch && sharedTagCount > 0) {
                score += 2
            }

            return {
                candidate,
                score,
            }
        })
        .filter((entry) => entry.score > 0)
        .sort((left, right) => {
            if (left.score !== right.score) {
                return right.score - left.score
            }

            return getPostTimelineValue(right.candidate) - getPostTimelineValue(left.candidate)
        })

    return scoredCandidates.slice(0, limit).map(({ candidate }) => mapRelatedItem(candidate))
}
