import { describe, expect, it } from 'vitest'
import { mergeDistributionSourcePost } from './use-post-distribution-button'
import { buildDistributionMaterialBundle } from '@/utils/shared/distribution-template'
import { buildMemosDistributionPreview } from '@/utils/shared/post-distribution-preview'
import { PostStatus, PostVisibility, type Post } from '@/types/post'

type LiveDistributionSourcePost = NonNullable<Parameters<typeof mergeDistributionSourcePost>[0]>

function createLivePost(overrides: Partial<LiveDistributionSourcePost> = {}): LiveDistributionSourcePost {
    return {
        id: 'post-1',
        title: 'Post title',
        content: 'Post content',
        slug: 'post-title',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        views: 0,
        language: 'zh-CN',
        author: null,
        category: null,
        tags: null,
        ...overrides,
    }
}

function createFetchedPost(overrides: Partial<Post> = {}): Post {
    return {
        id: 'post-1',
        title: 'Post title',
        content: 'Post content',
        slug: 'post-title',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        views: 0,
        language: 'zh-CN',
        author: null,
        category: null,
        tags: null,
        ...overrides,
    }
}

describe('mergeDistributionSourcePost', () => {
    it('fills missing relation fields from fetched detail while preserving live content', () => {
        const livePost = createLivePost({
            title: 'Edited title',
            content: 'Edited content',
            tags: undefined,
            coverImage: undefined,
        })
        const fetchedPost = createFetchedPost({
            title: 'Persisted title',
            content: 'Persisted content',
            coverImage: 'https://example.com/cover.png',
            tags: [
                { id: 'tag-1', name: 'Nuxt', slug: 'nuxt' },
            ],
            author: {
                id: 'author-1',
                name: 'Author',
            },
        })

        const mergedPost = mergeDistributionSourcePost(livePost, fetchedPost)

        expect(mergedPost?.title).toBe('Edited title')
        expect(mergedPost?.content).toBe('Edited content')
        expect(mergedPost?.coverImage).toBe('https://example.com/cover.png')
        expect(mergedPost?.tags).toEqual([{ id: 'tag-1', name: 'Nuxt', slug: 'nuxt' }])
        expect(mergedPost?.author).toEqual({ id: 'author-1', name: 'Author' })
    })

    it('keeps explicit live relation edits instead of falling back to fetched detail', () => {
        const livePost = createLivePost({
            tags: [],
            coverImage: null,
        })
        const fetchedPost = createFetchedPost({
            coverImage: 'https://example.com/cover.png',
            tags: [
                { id: 'tag-1', name: 'Nuxt', slug: 'nuxt' },
            ],
        })

        const mergedPost = mergeDistributionSourcePost(livePost, fetchedPost)

        expect(mergedPost?.tags).toEqual([])
        expect(mergedPost?.coverImage).toBeNull()
    })

    it('normalizes live editor string tags into structured tags for preview tagLine', () => {
        const livePost = createLivePost({
            tags: ['TypeScript', 'CDN', 'OpenAPI'],
        })
        const fetchedPost = createFetchedPost({
            tags: [
                { id: 'tag-1', name: 'Legacy', slug: 'legacy' },
            ],
        })

        const mergedPost = mergeDistributionSourcePost(livePost, fetchedPost)
        const materialBundle = buildDistributionMaterialBundle(mergedPost!, {
            siteUrl: 'https://momei.example',
            defaultLicense: 'CC BY-NC-SA 4.0',
        })
        const preview = buildMemosDistributionPreview(materialBundle)

        expect(mergedPost?.tags).toEqual([
            { id: 'TypeScript', name: 'TypeScript', slug: 'TypeScript' },
            { id: 'CDN', name: 'CDN', slug: 'CDN' },
            { id: 'OpenAPI', name: 'OpenAPI', slug: 'OpenAPI' },
        ])
        expect(preview.tagLine).toBe('#TypeScript #CDN #OpenAPI')
    })
})

