import { beforeEach, describe, expect, it, vi } from 'vitest'

const validateApiKeyRequest = vi.fn()
const runLinkGovernanceDryRun = vi.fn()
const runLinkGovernanceApply = vi.fn()
const getLinkGovernanceReportById = vi.fn()

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
        ...actual,
        readBody: vi.fn((event: { body?: unknown }) => event.body || {}),
        getRouterParam: vi.fn((event: { context?: { params?: Record<string, string> } }, name: string) => event.context?.params?.[name]),
    }
})

vi.mock('@/server/utils/validate-api-key', () => ({
    validateApiKeyRequest,
}))

vi.mock('@/server/services/migration-link-governance', () => ({
    runLinkGovernanceDryRun,
    runLinkGovernanceApply,
    getLinkGovernanceReportById,
}))

describe('external link governance api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        validateApiKeyRequest.mockResolvedValue({
            user: {
                id: 'user-1',
                role: 'admin',
            },
        })
    })

    it('should execute dry-run handler', async () => {
        runLinkGovernanceDryRun.mockResolvedValue({ reportId: 'report-1', summary: { total: 1 } })
        const handler = (await import('@/server/api/external/migrations/link-governance/dry-run.post')).default

        const result = await handler({
            body: {
                scopes: ['post-link'],
            },
        } as any)

        expect(validateApiKeyRequest).toHaveBeenCalled()
        expect(runLinkGovernanceDryRun).toHaveBeenCalledWith(expect.objectContaining({ scopes: ['post-link'] }), 'user-1')
        expect(result.code).toBe(200)
        expect(result.data).toBeDefined()
        if (!result.data) {
            throw new Error('Expected dry-run data')
        }

        expect(result.data.reportId).toBe('report-1')
    })

    it('should execute apply handler', async () => {
        runLinkGovernanceApply.mockResolvedValue({ reportId: 'report-2', summary: { total: 2 } })
        const handler = (await import('@/server/api/external/migrations/link-governance/apply.post')).default

        const result = await handler({
            body: {
                scopes: ['asset-url'],
                options: {
                    skipConfirmation: true,
                },
            },
        } as any)

        expect(runLinkGovernanceApply).toHaveBeenCalledWith(expect.objectContaining({ scopes: ['asset-url'] }), 'user-1')
        expect(result.code).toBe(200)
        expect(result.data).toBeDefined()
        if (!result.data) {
            throw new Error('Expected apply data')
        }

        expect(result.data.reportId).toBe('report-2')
    })

    it('should return report by id', async () => {
        getLinkGovernanceReportById.mockResolvedValue({ reportId: 'report-3', items: [] })
        const handler = (await import('@/server/api/external/migrations/link-governance/reports/[reportId].get')).default

        const result = await handler({
            context: {
                params: {
                    reportId: 'report-3',
                },
            },
        } as any)

        expect(getLinkGovernanceReportById).toHaveBeenCalledWith('report-3', {
            userId: 'user-1',
            role: 'admin',
        })
        expect(result.code).toBe(200)
        expect(result.data).toBeDefined()
        if (!result.data) {
            throw new Error('Expected report detail data')
        }

        expect(result.data.reportId).toBe('report-3')
    })
})
