import { beforeEach, describe, expect, it, vi } from 'vitest'
import listHandler from '@/server/api/admin/agreements/index.get'
import activateHandler from '@/server/api/admin/agreements/[id]/activate.post'
import { getAgreementVersions, setActiveAgreement } from '@/server/services/agreement'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/services/agreement', () => ({
    getAgreementVersions: vi.fn(),
    setActiveAgreement: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('admin agreements api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getQuery', vi.fn((event: { query?: unknown }) => event.query || {}))
        vi.stubGlobal('readValidatedBody', vi.fn((event: { body?: unknown }, parser: (body: unknown) => unknown) => Promise.resolve(parser(event.body))))
        vi.stubGlobal('getRouterParam', vi.fn((event: { context?: { params?: Record<string, string> } }, key: string) => event.context?.params?.[key]))
        vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
    })

    it('returns the governance payload for the requested agreement type', async () => {
        vi.mocked(getAgreementVersions).mockResolvedValue({
            mainLanguage: 'zh-CN',
            activeAgreementId: 'ua-v2',
            items: [],
            authoritativeOptions: [],
        })

        const result = await listHandler({
            query: {
                type: 'user_agreement',
            },
        } as never)

        if (!result) {
            throw new Error('Expected list handler result')
        }

        expect(getAgreementVersions).toHaveBeenCalledWith('user_agreement', undefined)
        expect(result.code).toBe(200)
        expect(result.data).toMatchObject({
            mainLanguage: 'zh-CN',
            activeAgreementId: 'ua-v2',
        })
    })

    it('activates an authoritative agreement version', async () => {
        vi.mocked(setActiveAgreement).mockResolvedValue({
            id: 'ua-v3',
            type: 'user_agreement',
        } as never)

        const result = await activateHandler({
            context: {
                params: {
                    id: 'user_agreement',
                },
            },
            body: {
                agreementId: 'ua-v3',
            },
        } as never)

        if (!result) {
            throw new Error('Expected activate handler result')
        }

        expect(setActiveAgreement).toHaveBeenCalledWith('user_agreement', 'ua-v3')
        expect(result.code).toBe(200)
        expect(result.data).toMatchObject({ id: 'ua-v3' })
    })
})
