import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runLinkGovernanceApply, runLinkGovernanceDryRun } from '@/server/services/migration-link-governance'
import { requireAdmin } from '@/server/utils/permission'
import applyHandler from '@/server/api/admin/migrations/link-governance/apply.post'
import dryRunHandler from '@/server/api/admin/migrations/link-governance/dry-run.post'

vi.mock('@/server/services/migration-link-governance', () => ({
    runLinkGovernanceDryRun: vi.fn(),
    runLinkGovernanceApply: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
        ...actual,
        readBody: vi.fn((event: { body?: unknown }) => event.body || {}),
    }
})

describe('admin link governance run api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdmin).mockResolvedValue({
            user: {
                id: 'admin-1',
                role: 'admin',
            },
        } as never)
    })

    it('should execute dry-run as admin', async () => {
        vi.mocked(runLinkGovernanceDryRun).mockResolvedValue({
            reportId: 'report-1',
            mode: 'dry-run',
            summary: {
                total: 1,
                resolved: 0,
                rewritten: 1,
                unchanged: 0,
                skipped: 0,
                failed: 0,
                needsConfirmation: 0,
            },
            statistics: { byScope: {}, byContentType: {}, byDomain: {} },
            items: [],
            redirectSeeds: [],
        })

        const result = await dryRunHandler({
            body: {
                scopes: ['asset-url'],
                filters: {
                    contentTypes: ['post'],
                },
            },
        } as never)

        expect(runLinkGovernanceDryRun).toHaveBeenCalledWith(expect.objectContaining({
            scopes: ['asset-url'],
        }), 'admin-1')
        expect(result.code).toBe(200)
        expect(result.data?.reportId).toBe('report-1')
    })

    it('should execute apply as admin', async () => {
        vi.mocked(runLinkGovernanceApply).mockResolvedValue({
            reportId: 'report-2',
            mode: 'apply',
            summary: {
                total: 2,
                resolved: 2,
                rewritten: 0,
                unchanged: 0,
                skipped: 0,
                failed: 0,
                needsConfirmation: 0,
            },
            statistics: { byScope: {}, byContentType: {}, byDomain: {} },
            items: [],
            redirectSeeds: [],
        })

        const result = await applyHandler({
            body: {
                scopes: ['asset-url'],
                filters: {
                    domains: ['legacy.example.com'],
                },
                options: {
                    reportFormat: 'markdown',
                    reviewedDryRunReportId: 'report-dry-run-1',
                },
            },
        } as never)

        expect(runLinkGovernanceApply).toHaveBeenCalledWith(expect.objectContaining({
            scopes: ['asset-url'],
            options: expect.objectContaining({
                reviewedDryRunReportId: 'report-dry-run-1',
            }),
        }), 'admin-1')
        expect(result.code).toBe(200)
        expect(result.data?.reportId).toBe('report-2')
    })
})
