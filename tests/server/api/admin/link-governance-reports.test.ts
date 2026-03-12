import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLinkGovernanceReportById, listLinkGovernanceReports } from '@/server/services/migration-link-governance'
import { requireAdmin } from '@/server/utils/permission'
import listHandler from '@/server/api/admin/migrations/link-governance/reports.get'
import detailHandler from '@/server/api/admin/migrations/link-governance/reports/[reportId].get'

vi.mock('@/server/services/migration-link-governance', () => ({
    listLinkGovernanceReports: vi.fn(),
    getLinkGovernanceReportById: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('admin link governance reports api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getQuery', vi.fn((event: { query?: unknown }) => event.query || {}))
        vi.mocked(requireAdmin).mockResolvedValue({
            user: {
                id: 'admin-1',
                role: 'admin',
            },
        } as never)
    })

    it('should list reports with pagination filters', async () => {
        vi.mocked(listLinkGovernanceReports).mockResolvedValue({
            items: [],
            total: 0,
            page: 2,
            limit: 5,
            totalPages: 0,
        })

        const result = await listHandler({
            query: {
                page: '2',
                limit: '5',
                mode: 'dry-run',
                status: 'completed',
            },
        } as never)

        expect(listLinkGovernanceReports).toHaveBeenCalledWith({
            page: 2,
            limit: 5,
            mode: 'dry-run',
            status: 'completed',
        })
        expect(result.code).toBe(200)
        expect(result.data).toBeDefined()
        if (!result.data) {
            throw new Error('Expected list result data')
        }

        expect(result.data.page).toBe(2)
    })

    it('should return report detail', async () => {
        vi.mocked(getLinkGovernanceReportById).mockResolvedValue({
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
            statistics: {
                byScope: { 'post-link': 1 },
                byContentType: { post: 1 },
                byDomain: { local: 1 },
            },
            items: [],
            redirectSeeds: [],
        })

        const result = await detailHandler({
            context: {
                params: {
                    reportId: 'report-1',
                },
            },
        } as never)

        expect(getLinkGovernanceReportById).toHaveBeenCalledWith('report-1', {
            userId: 'admin-1',
            role: 'admin',
        })
        expect(result.code).toBe(200)
        expect(result.data).toBeDefined()
        if (!result.data) {
            throw new Error('Expected detail result data')
        }

        expect(result.data.reportId).toBe('report-1')
    })
})
