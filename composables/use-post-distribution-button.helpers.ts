import type { Post } from '@/types/post'

export type DistributionSourcePost = Omit<Post, 'tags'> & {
    tags?: Post['tags'] | string[] | null
}

type StructuredDistributionTag = NonNullable<NonNullable<Post['tags']>[number]>

function preferLiveDistributionValue<T>(liveValue: T | undefined, fetchedValue: T): T {
    return liveValue === undefined ? fetchedValue : liveValue
}

function preferFetchedRelationValue<T>(liveValue: T | null | undefined, fetchedValue: T): T {
    return liveValue ?? fetchedValue
}

function normalizeDistributionSourceTag(tag: string | StructuredDistributionTag): StructuredDistributionTag | null {
    if (typeof tag === 'string') {
        const normalizedTag = tag.trim()
        return normalizedTag
            ? { id: normalizedTag, name: normalizedTag, slug: normalizedTag }
            : null
    }

    const normalizedName = tag.name?.trim()
    if (!normalizedName) {
        return null
    }

    const normalizedSlug = tag.slug?.trim() || normalizedName
    const normalizedId = tag.id?.trim() || normalizedSlug

    return {
        id: normalizedId,
        name: normalizedName,
        slug: normalizedSlug,
    }
}

function resolveDistributionSourceTags(
    liveTags: DistributionSourcePost['tags'],
    fetchedTags: Post['tags'],
): Post['tags'] {
    if (Array.isArray(liveTags)) {
        return liveTags
            .map((tag) => normalizeDistributionSourceTag(tag as string | StructuredDistributionTag))
            .filter((tag): tag is StructuredDistributionTag => Boolean(tag))
    }

    return fetchedTags
}

export function mergeDistributionSourcePost(livePost: DistributionSourcePost | null, fetchedPost: Post | null): Post | null {
    if (!livePost) {
        return fetchedPost
    }

    if (!fetchedPost) {
        const { tags: liveTags, ...restLivePost } = livePost

        return {
            ...restLivePost,
            tags: resolveDistributionSourceTags(liveTags, null),
        }
    }

    return {
        ...fetchedPost,
        ...livePost,
        author: preferFetchedRelationValue(livePost.author, fetchedPost.author),
        authorId: preferLiveDistributionValue(livePost.authorId, fetchedPost.authorId),
        category: preferFetchedRelationValue(livePost.category, fetchedPost.category),
        categoryId: preferLiveDistributionValue(livePost.categoryId, fetchedPost.categoryId),
        coverImage: preferLiveDistributionValue(livePost.coverImage, fetchedPost.coverImage),
        copyright: preferLiveDistributionValue(livePost.copyright, fetchedPost.copyright),
        metadata: preferLiveDistributionValue(livePost.metadata, fetchedPost.metadata),
        summary: preferLiveDistributionValue(livePost.summary, fetchedPost.summary),
        tags: resolveDistributionSourceTags(livePost.tags, fetchedPost.tags),
        translationId: preferLiveDistributionValue(livePost.translationId, fetchedPost.translationId),
    }
}
