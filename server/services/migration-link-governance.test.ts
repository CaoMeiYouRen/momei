import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LinkGovernanceReport } from '@/server/entities/link-governance-report'

const postRepo = {
    find: vi.fn(),
    findByIds: vi.fn(),
    save: vi.fn(),
}

const categoryRepo = {
    find: vi.fn(),
}

const tagRepo = {
    find: vi.fn(),
}

const reportRepo = {
    save: vi.fn(),
    findOneBy: vi.fn(),
}

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
    getSettings: vi.fn().mockResolvedValue({
        site_url: 'https://blog.example.com',
    }),
}))

vi.mock('@/server/services/upload', () => ({
    getUploadStorageContext: vi.fn().mockResolvedValue({
        assetPublicBaseUrl: 'https://assets.example.com/assets',
        driverBaseUrl: 'https://cdn.example.com/assets',
    }),
    resolveUploadedFileUrl: vi.fn((objectKey: string, context: { assetPublicBaseUrl?: string, driverBaseUrl?: string }) => {
        const baseUrl = context.assetPublicBaseUrl || context.driverBaseUrl || ''
        return `${baseUrl.replace(/\/$/, '')}/${objectKey.replace(/^\//, '')}`
    }),
}))

describe('server/services/migration-link-governance', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        categoryRepo.find.mockResolvedValue([])
        tagRepo.find.mockResolvedValue([])
        postRepo.findByIds.mockResolvedValue([])
        postRepo.save.mockImplementation((value: any) => Promise.resolve(value))
        reportRepo.save.mockImplementation((value: Partial<LinkGovernanceReport> & { id?: string }) => Promise.resolve({
            ...value,
            id: value.id || 'report-1',
        }))
        reportRepo.findOneBy.mockResolvedValue(null)
    })

    it('should generate rewrite candidates in dry-run mode', async () => {
        const post = {
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[legacy](/posts/post-1) ![cover](https://legacy.example.com/assets/posts/post-1/image/cover.png)',
            coverImage: 'https://legacy.example.com/assets/posts/post-1/image/cover.png',
            metadata: {
                audio: {
                    url: 'https://legacy.example.com/assets/posts/post-1/audio/tts.mp3',
                },
            },
        }

        postRepo.find.mockImplementation((options?: { select?: string[] }) => {
            if (options?.select) {
                return Promise.resolve([{
                    id: post.id,
                    slug: post.slug,
                    language: post.language,
                    translationId: post.translationId,
                }])
            }

            return Promise.resolve([post])
        })

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['asset-url', 'post-link'],
            filters: {
                domains: ['legacy.example.com'],
                pathPrefixes: ['/assets'],
                contentTypes: ['post'],
            },
        }, 'user-1')

        expect(result.summary.rewritten).toBeGreaterThanOrEqual(3)
        expect(result.summary.total).toBeGreaterThanOrEqual(3)
        expect(result.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                field: 'content',
                sourceValue: '/posts/post-1',
                targetValue: '/posts/hello-world',
                status: 'rewritten',
                scope: 'post-link',
            }),
            expect.objectContaining({
                field: 'coverImage',
                targetValue: 'https://assets.example.com/assets/posts/post-1/image/cover.png',
                scope: 'asset-url',
            }),
            expect.objectContaining({
                field: 'metadata.audio.url',
                targetValue: 'https://assets.example.com/assets/posts/post-1/audio/tts.mp3',
                scope: 'asset-url',
            }),
        ]))
        expect(result.redirectSeeds.length).toBeGreaterThan(0)
        expect(postRepo.save).not.toHaveBeenCalled()
    })

    it('should persist rewritten content in apply mode', async () => {
        const post = {
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[legacy](/posts/post-1) ![cover](https://legacy.example.com/assets/posts/post-1/image/cover.png)',
            coverImage: 'https://legacy.example.com/assets/posts/post-1/image/cover.png',
            metadata: {
                audio: {
                    url: 'https://legacy.example.com/assets/posts/post-1/audio/tts.mp3',
                },
            },
        }

        postRepo.find.mockImplementation((options?: { select?: string[] }) => {
            if (options?.select) {
                return Promise.resolve([{
                    id: post.id,
                    slug: post.slug,
                    language: post.language,
                    translationId: post.translationId,
                }])
            }

            return Promise.resolve([post])
        })

        const { runLinkGovernanceApply } = await import('./migration-link-governance')
        const result = await runLinkGovernanceApply({
            scopes: ['asset-url', 'post-link'],
            filters: {
                domains: ['legacy.example.com'],
                pathPrefixes: ['/assets'],
                contentTypes: ['post'],
            },
        }, 'user-1')

        expect(result.summary.resolved).toBeGreaterThanOrEqual(3)
        expect(postRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            content: '[legacy](/posts/hello-world) ![cover](https://assets.example.com/assets/posts/post-1/image/cover.png)',
            coverImage: 'https://assets.example.com/assets/posts/post-1/image/cover.png',
            metadata: {
                audio: {
                    url: 'https://assets.example.com/assets/posts/post-1/audio/tts.mp3',
                },
            },
        }))
    })

    it('should return report only to owner or admin', async () => {
        reportRepo.findOneBy.mockResolvedValue({
            id: 'report-1',
            mode: 'dry-run',
            requestedByUserId: 'owner-1',
            summary: {
                total: 1,
                resolved: 0,
                rewritten: 1,
                unchanged: 0,
                skipped: 0,
                failed: 0,
                needsConfirmation: 0,
            },
            statistics: {
                byScope: { 'post-link': 1 },
                byContentType: { post: 1 },
                byDomain: { 'legacy.example.com': 1 },
            },
            items: [],
            redirectSeeds: [],
            markdown: '# report',
        })

        const { getLinkGovernanceReportById } = await import('./migration-link-governance')

        await expect(getLinkGovernanceReportById('report-1', {
            userId: 'owner-1',
            role: 'user',
        })).resolves.toEqual(expect.objectContaining({ reportId: 'report-1' }))

        await expect(getLinkGovernanceReportById('report-1', {
            userId: 'other-user',
            role: 'user',
        })).rejects.toMatchObject({ statusCode: 403 })
    })
})
