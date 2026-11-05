import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LinkGovernanceReport } from '@/server/entities/link-governance-report'

const postRepo = {
    find: vi.fn(),
    findBy: vi.fn(),
    save: vi.fn(),
}

const userRepo = {
    find: vi.fn(),
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
    findAndCount: vi.fn(),
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
                case 'User':
                    return userRepo
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

function mockPostLookup(post: Record<string, unknown>) {
    postRepo.find.mockImplementation((options?: { select?: unknown }) => {
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
}

describe('server/services/migration-link-governance edge cases', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        categoryRepo.find.mockResolvedValue([])
        tagRepo.find.mockResolvedValue([])
        postRepo.find.mockReset()
        postRepo.find.mockResolvedValue([])
        postRepo.findBy.mockReset()
        postRepo.findBy.mockResolvedValue([])
        userRepo.find.mockReset()
        userRepo.find.mockResolvedValue([])
        postRepo.save.mockImplementation((value: unknown) => Promise.resolve(value))
        reportRepo.save.mockImplementation((value: Partial<LinkGovernanceReport> & { id?: string }) => Promise.resolve({
            ...value,
            id: value.id || 'report-1',
        }))
        reportRepo.findOneBy.mockReset()
        reportRepo.findOneBy.mockResolvedValue(null)
        reportRepo.findAndCount.mockReset()
        reportRepo.findAndCount.mockResolvedValue([[], 0])
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('should mark reachable out-of-scope domains as domain-out-of-scope during online validation', async () => {
        mockPostLookup({
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[external](https://outside.example.com/hello)',
            coverImage: null,
            metadata: null,
        })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['post-link'],
            filters: {
                domains: ['legacy.example.com'],
            },
            options: {
                validationMode: 'static+online',
            },
        }, 'user-1')

        expect(result.items).toEqual([
            expect.objectContaining({
                sourceValue: 'https://outside.example.com/hello',
                status: 'skipped',
                issues: [expect.objectContaining({ code: 'domain-out-of-scope' })],
            }),
        ])
    })

    it('should abort slow external probes and record them as unreachable', async () => {
        mockPostLookup({
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[external](https://slow.example.com/hello)',
            coverImage: null,
            metadata: null,
        })
        vi.useFakeTimers()
        const fetchMock = vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        }))
        vi.stubGlobal('fetch', fetchMock)

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const pending = runLinkGovernanceDryRun({
            scopes: ['post-link'],
            filters: {
                domains: ['legacy.example.com'],
            },
            options: {
                validationMode: 'static+online',
            },
        }, 'user-1')

        await vi.advanceTimersByTimeAsync(3000)
        const result = await pending

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect((fetchMock.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(true)
        expect(result.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                status: 'skipped',
                issues: [expect.objectContaining({ code: 'external-unreachable' })],
            }),
        ]))
    })

    it('should skip relative content links when relative rewriting is disabled', async () => {
        mockPostLookup({
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[doc](./guides/intro)',
            coverImage: null,
            metadata: null,
        })

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['post-link'],
        }, 'user-1')

        expect(result.items).toEqual([
            expect.objectContaining({
                sourceValue: './guides/intro',
                sourceKind: 'relative',
                status: 'skipped',
                issues: [expect.objectContaining({ code: 'manual-confirmation-required' })],
            }),
        ])
    })

    it('should skip out-of-scope absolute domains in static validation mode', async () => {
        mockPostLookup({
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[external](https://outside.example.com/hello)',
            coverImage: null,
            metadata: null,
        })

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['post-link'],
            filters: {
                domains: ['legacy.example.com'],
            },
        }, 'user-1')

        expect(result.items).toEqual([
            expect.objectContaining({
                status: 'skipped',
                issues: [expect.objectContaining({ code: 'domain-out-of-scope' })],
            }),
        ])
    })

    it('should fail a seed match whose target entity no longer exists', async () => {
        mockPostLookup({
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[legacy](/legacy/target)',
            coverImage: null,
            metadata: null,
        })

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['post-link'],
            seeds: [{
                source: '/legacy/target',
                sourceKind: 'root-relative',
                matchMode: 'exact',
                scope: 'post-link',
                targetType: 'post',
                targetRef: { id: 'missing-post' },
                redirectMode: 'alias-only',
            }],
        }, 'user-1')

        expect(result.items).toEqual([
            expect.objectContaining({
                sourceValue: '/legacy/target',
                targetValue: null,
                status: 'failed',
                issues: [expect.objectContaining({ code: 'target-not-found' })],
            }),
        ])
    })

    it('should fall back to canonical routes for links outside seed scopes', async () => {
        mockPostLookup({
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[archive](/archives)',
            coverImage: null,
            metadata: null,
        })

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['page-link'],
        }, 'user-1')

        expect(result.items).toEqual([
            expect.objectContaining({
                sourceValue: '/archives',
                targetValue: '/archives',
                status: 'unchanged',
                matchedBy: 'canonical',
            }),
        ])
    })

    it('should fail in-scope links that match neither seeds nor canonical routes', async () => {
        mockPostLookup({
            id: 'post-1',
            slug: 'hello-world',
            language: 'zh-CN',
            translationId: 'translation-1',
            content: '[unknown](https://blog.example.com/unknown/page)',
            coverImage: null,
            metadata: null,
        })

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['post-link'],
        }, 'user-1')

        expect(result.items).toEqual([
            expect.objectContaining({
                sourceValue: 'https://blog.example.com/unknown/page',
                status: 'failed',
                issues: [expect.objectContaining({ code: 'mapping-missing' })],
            }),
        ])
    })

    it('should reject apply when the reviewed report is not a dry-run', async () => {
        reportRepo.findOneBy.mockResolvedValueOnce({
            id: 'report-1',
            mode: 'apply',
            status: 'completed',
            requestedByUserId: 'user-1',
            scopes: ['asset-url'],
            filters: null,
            options: null,
        })

        const { runLinkGovernanceApply } = await import('./migration-link-governance')

        await expect(runLinkGovernanceApply({
            scopes: ['asset-url'],
            options: { reviewedDryRunReportId: 'report-1' },
        }, 'user-1')).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Reviewed dry-run report not found',
        })
    })

    it('should reject apply when the reviewed report is not completed', async () => {
        reportRepo.findOneBy.mockResolvedValueOnce({
            id: 'report-1',
            mode: 'dry-run',
            status: 'running',
            requestedByUserId: 'user-1',
            scopes: ['asset-url'],
            filters: null,
            options: null,
        })

        const { runLinkGovernanceApply } = await import('./migration-link-governance')

        await expect(runLinkGovernanceApply({
            scopes: ['asset-url'],
            options: { reviewedDryRunReportId: 'report-1' },
        }, 'user-1')).rejects.toMatchObject({
            statusCode: 409,
            statusMessage: 'Reviewed dry-run report is not ready for apply',
        })
    })

    it('should skip post loading when content types exclude posts', async () => {
        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['post-link'],
            filters: {
                contentTypes: ['category'],
            },
        }, 'user-1')

        expect(result.summary.total).toBe(0)
        expect(postRepo.find).toHaveBeenCalledTimes(1)
        expect(postRepo.find).toHaveBeenCalledWith(expect.objectContaining({ select: expect.any(Object) }))
    })

    it('should skip retry loading when the reviewed report has no failed items', async () => {
        reportRepo.findOneBy.mockResolvedValueOnce({
            id: 'report-retry',
            items: [{ contentType: 'post', contentId: 'post-1', status: 'resolved' }],
        })

        const { runLinkGovernanceDryRun } = await import('./migration-link-governance')
        const result = await runLinkGovernanceDryRun({
            scopes: ['post-link'],
            options: {
                retryFailuresFromReportId: 'report-retry',
            },
        }, 'user-1')

        expect(result.summary.total).toBe(0)
        expect(reportRepo.findOneBy).toHaveBeenCalledWith({ id: 'report-retry' })
        expect(postRepo.findBy).not.toHaveBeenCalled()
    })

    it('should list reports with clamped pagination, filters and requester identity', async () => {
        const baseReport = {
            mode: 'dry-run',
            status: 'completed',
            scopes: ['post-link'],
            summary: null,
            items: [{ contentType: 'post', contentId: 'post-1', status: 'resolved' }],
            redirectSeeds: [],
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        }
        reportRepo.findAndCount.mockResolvedValueOnce([
            [
                { ...baseReport, id: 'report-1', requestedByUserId: 'user-1' },
                { ...baseReport, id: 'report-2', requestedByUserId: 'ghost' },
            ],
            2,
        ])
        userRepo.find.mockResolvedValueOnce([
            { id: 'user-1', name: 'Owner', email: 'owner@example.com' },
        ])

        const { listLinkGovernanceReports } = await import('./migration-link-governance')
        const result = await listLinkGovernanceReports({
            page: 0,
            limit: 500,
            mode: 'dry-run',
            status: 'completed',
        })

        expect(reportRepo.findAndCount).toHaveBeenCalledWith({
            where: { mode: 'dry-run', status: 'completed' },
            order: { createdAt: 'DESC' },
            skip: 0,
            take: 100,
        })
        expect(userRepo.find).toHaveBeenCalledTimes(1)
        expect(userRepo.find).toHaveBeenCalledWith(expect.objectContaining({
            select: { id: true, name: true, email: true },
            where: { id: expect.anything() },
        }))
        expect(result).toMatchObject({
            total: 2,
            page: 1,
            limit: 100,
            totalPages: 1,
        })
        expect(result.items[0]).toMatchObject({
            reportId: 'report-1',
            requestedByName: 'Owner',
            requestedByEmail: 'owner@example.com',
            itemCount: 1,
            redirectSeedCount: 0,
        })
        expect(result.items[1]).toMatchObject({
            reportId: 'report-2',
            requestedByName: null,
            requestedByEmail: null,
        })
    })

    it('should list empty reports without querying users', async () => {
        const { listLinkGovernanceReports } = await import('./migration-link-governance')
        const result = await listLinkGovernanceReports({})

        expect(userRepo.find).not.toHaveBeenCalled()
        expect(result).toMatchObject({
            items: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        })
    })

    it('should return 404 when a governance report does not exist', async () => {
        const { getLinkGovernanceReportById } = await import('./migration-link-governance')

        await expect(getLinkGovernanceReportById('missing', { userId: 'user-1' })).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    it('should expose the default mapping seeds built from the runtime context', async () => {
        const { buildDefaultLinkGovernanceSeeds } = await import('./migration-link-governance')

        const seeds = await buildDefaultLinkGovernanceSeeds()

        expect(seeds).toEqual(expect.arrayContaining([
            expect.objectContaining({ source: '/archives', scope: 'archive-link' }),
        ]))
    })
})
