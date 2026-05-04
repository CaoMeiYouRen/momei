import { beforeEach, describe, expect, it, vi } from 'vitest'
import listHandler from '@/server/api/admin/agreements/index.get'
import activateHandler from '@/server/api/admin/agreements/[id]/activate.post'
import updateHandler from '@/server/api/admin/agreements/[id].put'
import { getAgreementVersions, setActiveAgreement, updateAgreementContent } from '@/server/services/agreement'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/services/agreement', () => ({
    getAgreementVersions: vi.fn(),
    setActiveAgreement: vi.fn(),
    updateAgreementContent: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('admin agreements api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getValidatedQuery', vi.fn((event: { query?: unknown }, parser: (query: unknown) => unknown) => Promise.resolve(parser(event.query || {}))))
        vi.stubGlobal('readValidatedBody', vi.fn((event: { body?: unknown }, parser: (body: unknown) => unknown) => Promise.resolve(parser(event.body))))
        vi.stubGlobal('getValidatedRouterParams', vi.fn((event: { context?: { params?: Record<string, string> } }, parser: (params: unknown) => unknown) => Promise.resolve(parser(event.context?.params || {}))))
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
                language: '  en-US  ',
            },
        } as never)

        if (!result) {
            throw new Error('Expected list handler result')
        }

        expect(getAgreementVersions).toHaveBeenCalledWith('user_agreement', 'en-US')
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

    it('updates an agreement after validating router params', async () => {
        vi.mocked(updateAgreementContent).mockResolvedValue({
            id: 'agreement-1',
            content: 'Updated agreement',
        } as never)

        const result = await updateHandler({
            context: {
                params: {
                    id: ' agreement-1 ',
                },
            },
            body: {
                content: 'Updated agreement',
            },
        } as never)

        if (!result) {
            throw new Error('Expected update handler result')
        }

        expect(updateAgreementContent).toHaveBeenCalledWith('agreement-1', { content: 'Updated agreement' })
        expect(result.code).toBe(200)
        expect(result.data).toMatchObject({ id: 'agreement-1' })
    })
})
