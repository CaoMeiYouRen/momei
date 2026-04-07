import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    applyContentCandidateRewrite,
    buildIssue,
    buildRedirectSeed,
    buildRuntimeContext,
    collectContentCandidates,
    collectMatchingSeeds,
    deriveObjectKeyFromAssetUrl,
    domainMatches,
    getCandidateDomain,
    getCandidatePath,
    getSourceKind,
    looksLikeManagedAssetPath,
    normalizeContentTypes,
    pathPrefixMatches,
    resolveCanonicalRoute,
    resolveTargetPath,
    type GovernanceRuntimeContext,
} from './migration-link-governance.helpers'
import { SettingKey } from '@/types/setting'
import type {
    LinkGovernanceMappingSeed,
    LinkGovernanceRequest,
    LinkGovernanceScope,
} from '@/types/migration-link-governance'

const {
    postRepo,
    categoryRepo,
    tagRepo,
    reportRepo,
    getSettingsMock,
    getUploadStorageContextMock,
    resolveUploadedFileUrlMock,
} = vi.hoisted(() => ({
    postRepo: {
        find: vi.fn(),
    },
    categoryRepo: {
        find: vi.fn(),
    },
    tagRepo: {
        find: vi.fn(),
    },
    reportRepo: {
        save: vi.fn(),
        findOneBy: vi.fn(),
    },
    getSettingsMock: vi.fn(),
    getUploadStorageContextMock: vi.fn(),
    resolveUploadedFileUrlMock: vi.fn((objectKey: string, context: { assetPublicBaseUrl?: string, driverBaseUrl?: string }) => {
        const baseUrl = context.assetPublicBaseUrl || context.driverBaseUrl || ''
        return `${baseUrl.replace(/\/$/, '')}/${objectKey.replace(/^\//, '')}`
    }),
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn((entity: { name?: string }) => {
            switch (entity?.name) {
                case 'Post':
                    return postRepo
                case 'Category':
                    return categoryRepo
                case 'Tag':
                    return tagRepo
                case 'LinkGovernanceReport':
                    return reportRepo
                default:
                    throw new Error(`Unexpected repository: ${entity?.name || 'unknown'}`)
            }
        }),
    },
}))

vi.mock('@/server/services/setting', () => ({
    getSettings: getSettingsMock,
}))

vi.mock('@/server/services/upload', () => ({
    getUploadStorageContext: getUploadStorageContextMock,
    resolveUploadedFileUrl: resolveUploadedFileUrlMock,
}))

function createRuntimeContext(): GovernanceRuntimeContext {
    const posts = [
        { id: 'post-1', slug: 'hello-world', language: 'zh-CN', translationId: 'cluster-post' },
        { id: 'post-2', slug: 'second-post', language: 'en-US', translationId: null },
    ]
    const categories = [
        { id: 'category-1', slug: 'dev', language: 'zh-CN', translationId: 'cluster-category' },
    ]
    const tags = [
        { id: 'tag-1', slug: 'nuxt', language: 'zh-CN', translationId: 'cluster-tag' },
    ]

    return {
        entityMaps: {
            posts,
            categories,
            tags,
            postById: new Map(posts.map((item) => [item.id, item])),
            postBySlug: new Map(posts.map((item) => [item.slug, item])),
            postByTranslationId: new Map(posts.filter((item) => item.translationId).map((item) => [item.translationId as string, item])),
            categoryById: new Map(categories.map((item) => [item.id, item])),
            categoryBySlug: new Map(categories.map((item) => [item.slug, item])),
            categoryByTranslationId: new Map(categories.filter((item) => item.translationId).map((item) => [item.translationId as string, item])),
            tagById: new Map(tags.map((item) => [item.id, item])),
            tagBySlug: new Map(tags.map((item) => [item.slug, item])),
            tagByTranslationId: new Map(tags.filter((item) => item.translationId).map((item) => [item.translationId as string, item])),
        },
        defaultSeeds: [{
            source: '/legacy/posts/:slug',
            sourceKind: 'path-rule',
            matchMode: 'pattern',
            scope: 'post-link',
            targetType: 'post',
            targetRef: { slug: 'hello-world' },
            redirectMode: 'redirect-seed',
        }],
        siteUrl: 'https://blog.example.com',
        managedDomains: ['blog.example.com', 'assets.example.com'],
        storageContext: {
            rawStorageType: 's3',
            normalizedStorageType: 's3',
            bucketPrefix: 'assets/',
            assetPublicBaseUrl: 'https://assets.example.com/assets',
            driverBaseUrl: 'https://cdn.example.com/assets',
            env: {} as never,
            settings: {},
        },
        reportRepo: reportRepo as never,
    }
}

describe('server/services/migration-link-governance.helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        postRepo.find.mockResolvedValue([
            { id: 'post-1', slug: 'hello-world', language: 'zh-CN', translationId: 'cluster-post' },
            { id: 'post-2', slug: 'second-post', language: 'en-US', translationId: null },
        ])
        categoryRepo.find.mockResolvedValue([
            { id: 'category-1', slug: 'dev', language: 'zh-CN', translationId: 'cluster-category' },
        ])
        tagRepo.find.mockResolvedValue([
            { id: 'tag-1', slug: 'nuxt', language: 'zh-CN', translationId: 'cluster-tag' },
        ])
        getSettingsMock.mockResolvedValue({
            [SettingKey.SITE_URL]: 'https://blog.example.com',
        })
        getUploadStorageContextMock.mockResolvedValue({
            rawStorageType: 's3',
            normalizedStorageType: 's3',
            bucketPrefix: 'assets/',
            assetPublicBaseUrl: 'https://assets.example.com/assets',
            driverBaseUrl: 'https://cdn.example.com/assets',
            env: {} as never,
            settings: {},
        })
    })

    it('应规范化内容类型、来源类型、域名和路径匹配', () => {
        expect(normalizeContentTypes()).toEqual(['post'])
        expect(normalizeContentTypes(['post', 'invalid-type' as never, 'post'])).toEqual(['post'])

        expect(getSourceKind('https://blog.example.com/posts/hello-world')).toBe('absolute')
        expect(getSourceKind('/posts/hello-world')).toBe('root-relative')
        expect(getSourceKind('./posts/hello-world')).toBe('relative')

        expect(getCandidateDomain('https://BLOG.example.com/posts/hello-world')).toBe('blog.example.com')
        expect(getCandidateDomain('not-a-url')).toBeNull()
        expect(getCandidateDomain('https://[broken')).toBeNull()

        expect(getCandidatePath('https://blog.example.com/posts/hello-world?tab=1#hash', 'absolute')).toBe('/posts/hello-world')
        expect(getCandidatePath('/posts//hello-world?tab=1', 'root-relative')).toBe('/posts/hello-world')
        expect(getCandidatePath('\\posts\\hello-world ', 'relative')).toBe('/posts/hello-world')

        expect(domainMatches(null, { domains: ['legacy.example.com'] }, ['blog.example.com'])).toBe(true)
        expect(domainMatches('blog.example.com', { domains: ['legacy.example.com'] }, ['blog.example.com'])).toBe(true)
        expect(domainMatches('other.example.com', { domains: ['legacy.example.com'] }, ['blog.example.com'])).toBe(false)

        expect(pathPrefixMatches('/assets/posts/hello-world', { pathPrefixes: ['/assets'] })).toBe(true)
        expect(pathPrefixMatches('/uploads/posts/hello-world', { pathPrefixes: ['/assets'] })).toBe(false)

        expect(buildIssue('target-not-found', '缺少目标')).toEqual({ code: 'target-not-found', message: '缺少目标' })
        expect(looksLikeManagedAssetPath('/uploads/image.png')).toBe(true)
        expect(looksLikeManagedAssetPath('/posts/post-1/audio/tts.mp3')).toBe(true)
        expect(looksLikeManagedAssetPath('/about')).toBe(false)
    })

    it('deriveObjectKeyFromAssetUrl 应覆盖绝对路径、相对路径和托管域回退', () => {
        const runtime = createRuntimeContext()

        expect(deriveObjectKeyFromAssetUrl({
            value: 'https://assets.example.com/assets/posts/post-1/image/cover.png',
            sourceKind: 'absolute',
            runtime,
            options: undefined,
            field: 'coverImage',
            filters: { pathPrefixes: ['/assets'] },
        })).toBe('posts/post-1/image/cover.png')

        expect(deriveObjectKeyFromAssetUrl({
            value: '/assets/posts/post-1/audio/tts.mp3',
            sourceKind: 'root-relative',
            runtime,
            options: undefined,
            field: 'metadata.audio.url',
            filters: { pathPrefixes: ['/assets'] },
        })).toBe('posts/post-1/audio/tts.mp3')

        expect(deriveObjectKeyFromAssetUrl({
            value: 'uploads/post-1/image/cover.png',
            sourceKind: 'relative',
            runtime,
            options: { allowRelativeLinks: false },
            field: 'content',
            filters: { pathPrefixes: ['/uploads'] },
        })).toBeNull()

        expect(deriveObjectKeyFromAssetUrl({
            value: 'https://blog.example.com/uploads/post-1/image/cover.png',
            sourceKind: 'absolute',
            runtime,
            options: undefined,
            field: 'content',
            filters: { domains: ['blog.example.com'], pathPrefixes: ['/uploads'] },
        })).toBe('post-1/image/cover.png')
    })

    it('buildRedirectSeed 应处理不同 scope 和无效输入', () => {
        expect(buildRedirectSeed('/legacy', '/legacy', 'post-link')).toBeUndefined()
        expect(buildRedirectSeed('/legacy', '/assets/new.png', 'asset-url')).toEqual({
            source: '/legacy',
            target: '/assets/new.png',
            statusCode: 301,
            reason: 'asset-domain-migration',
        })
        expect(buildRedirectSeed('/old', '/archives', 'archive-link')).toEqual(expect.objectContaining({
            reason: 'legacy-permalink',
        }))
    })

    it('buildRuntimeContext 应构建实体映射、默认 seeds 和托管域名', async () => {
        const runtime = await buildRuntimeContext()

        expect(postRepo.find).toHaveBeenCalledWith({
            select: ['id', 'slug', 'language', 'translationId'],
        })
        expect(runtime.siteUrl).toBe('https://blog.example.com')
        expect(runtime.managedDomains).toEqual(expect.arrayContaining([
            'blog.example.com',
            'assets.example.com',
            'cdn.example.com',
        ]))
        expect(runtime.entityMaps.postById.get('post-1')?.slug).toBe('hello-world')
        expect(runtime.entityMaps.categoryByTranslationId.get('cluster-category')?.id).toBe('category-1')
        expect(runtime.defaultSeeds).toEqual(expect.arrayContaining([
            expect.objectContaining({ source: '/posts/hello-world', scope: 'post-link' }),
            expect.objectContaining({ source: '/posts/post-1', redirectMode: 'redirect-seed' }),
            expect.objectContaining({ source: '/categories/dev', scope: 'category-link' }),
            expect.objectContaining({ source: '/tags/nuxt', scope: 'tag-link' }),
            expect.objectContaining({ source: '/archives', scope: 'archive-link' }),
        ]))
    })

    it('resolveTargetPath 应解析 page/archive/asset/post/category/tag', () => {
        const runtime = createRuntimeContext()

        expect(resolveTargetPath('page', { pageKey: 'about' }, runtime)).toBe('/about')
        expect(resolveTargetPath('archive', {}, runtime)).toBe('/archives')
        expect(resolveTargetPath('asset', { objectKey: 'posts/post-1/image/cover.png' }, runtime)).toBe('https://assets.example.com/assets/posts/post-1/image/cover.png')
        expect(resolveTargetPath('asset', {}, runtime)).toBeNull()
        expect(resolveTargetPath('post', { id: 'post-1' }, runtime)).toBe('/posts/hello-world')
        expect(resolveTargetPath('post', {}, runtime, 'second-post')).toBe('/posts/second-post')
        expect(resolveTargetPath('category', { translationId: 'cluster-category' }, runtime)).toBe('/categories/dev')
        expect(resolveTargetPath('tag', { id: 'tag-1' }, runtime)).toBe('/tags/nuxt')

        expect(resolveUploadedFileUrlMock).toHaveBeenCalledWith('posts/post-1/image/cover.png', runtime.storageContext)
    })

    it('collectMatchingSeeds 应匹配 exact、prefix 和 path-rule pattern', () => {
        const runtime = createRuntimeContext()
        const request: LinkGovernanceRequest = {
            scopes: ['post-link'] as LinkGovernanceScope[],
            seeds: [
                {
                    source: '/posts/hello-world',
                    sourceKind: 'root-relative',
                    matchMode: 'exact',
                    scope: 'post-link',
                    targetType: 'post',
                    targetRef: { id: 'post-1' },
                    redirectMode: 'alias-only',
                },
                {
                    source: '/docs',
                    sourceKind: 'root-relative',
                    matchMode: 'prefix',
                    scope: 'post-link',
                    targetType: 'post',
                    targetRef: { id: 'post-2' },
                    redirectMode: 'alias-only',
                },
            ] as LinkGovernanceMappingSeed[],
        }

        const exactMatches = collectMatchingSeeds({
            value: '/posts/hello-world',
            sourceKind: 'root-relative',
            field: 'content',
        }, runtime, request)
        expect(exactMatches).toHaveLength(1)
        expect(exactMatches[0]?.seed.source).toBe('/posts/hello-world')

        const prefixMatches = collectMatchingSeeds({
            value: '/docs/tutorial/intro',
            sourceKind: 'root-relative',
            field: 'content',
        }, runtime, request)
        expect(prefixMatches).toHaveLength(1)
        expect(prefixMatches[0]?.seed.source).toBe('/docs')

        const patternMatches = collectMatchingSeeds({
            value: '/legacy/posts/hello-world',
            sourceKind: 'root-relative',
            field: 'content',
        }, runtime, { scopes: ['post-link'] })
        expect(patternMatches).toHaveLength(1)
        expect(patternMatches[0]?.matched.params).toEqual({ slug: 'hello-world' })
    })

    it('resolveCanonicalRoute 应解析 archive、静态页、文章、分类、标签与缺失路由', () => {
        const runtime = createRuntimeContext()

        expect(resolveCanonicalRoute('/archives', runtime)).toEqual(expect.objectContaining({
            targetValue: '/archives',
            scope: 'archive-link',
            status: 'unchanged',
        }))
        expect(resolveCanonicalRoute('/about', runtime)).toEqual(expect.objectContaining({
            targetValue: '/about',
            scope: 'page-link',
        }))
        expect(resolveCanonicalRoute('/posts/post-1', runtime)).toEqual(expect.objectContaining({
            targetValue: '/posts/hello-world',
            scope: 'post-link',
            status: 'rewritten',
            matchedBy: 'id',
        }))
        expect(resolveCanonicalRoute('/categories/dev', runtime)).toEqual(expect.objectContaining({
            targetValue: '/categories/dev',
            scope: 'category-link',
        }))
        expect(resolveCanonicalRoute('/tags/nuxt', runtime)).toEqual(expect.objectContaining({
            targetValue: '/tags/nuxt',
            scope: 'tag-link',
        }))
        expect(resolveCanonicalRoute('/posts/missing', runtime)).toBeNull()
    })

    it('collectContentCandidates 与 applyContentCandidateRewrite 应提取并改写 markdown/html 链接', () => {
        const input = '[文章](/posts/post-1) <img src="https://legacy.example.com/assets/posts/post-1/image/cover.png"> ![音频](https://legacy.example.com/assets/posts/post-1/audio/tts.mp3)'

        const candidates = collectContentCandidates(input)
        expect(candidates).toEqual([
            { value: '/posts/post-1', sourceKind: 'root-relative', field: 'content' },
            { value: 'https://legacy.example.com/assets/posts/post-1/audio/tts.mp3', sourceKind: 'absolute', field: 'content' },
            { value: 'https://legacy.example.com/assets/posts/post-1/image/cover.png', sourceKind: 'absolute', field: 'content' },
        ])

        expect(applyContentCandidateRewrite(input, '/posts/post-1', '/posts/hello-world')).toContain('[文章](/posts/hello-world)')
        expect(applyContentCandidateRewrite(input, 'https://legacy.example.com/assets/posts/post-1/image/cover.png', 'https://assets.example.com/assets/posts/post-1/image/cover.png')).toContain('https://assets.example.com/assets/posts/post-1/image/cover.png')
        expect(applyContentCandidateRewrite(input, '/posts/post-1', '/posts/post-1')).toBe(input)
    })
})
