import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getActiveAgreementContentMock, successMock } = vi.hoisted(() => ({
    getActiveAgreementContentMock: vi.fn(),
    successMock: vi.fn((payload: unknown) => ({ code: 200, data: payload })),
}))

vi.mock('@/server/services/agreement', () => ({
    getActiveAgreementContent: getActiveAgreementContentMock,
}))

vi.mock('@/server/utils/response', () => ({
    success: successMock,
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getQuery', vi.fn())

import { createAgreementPublicHandler } from './agreement-public'

describe('createAgreementPublicHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns active agreement when found', async () => {
        vi.mocked(getQuery).mockReturnValue({ language: 'en-US' })
        getActiveAgreementContentMock.mockResolvedValue({ id: 'agreement-1', type: 'privacy-policy' })
        const handler = createAgreementPublicHandler({
            type: 'privacy-policy',
            fetchErrorMessage: 'fetch failed',
            defaultContent: () => 'default',
        })

        const result = await handler({} as never)

        expect(getActiveAgreementContentMock).toHaveBeenCalledWith('privacy-policy', 'en-US')
        expect(result).toEqual({ code: 200, data: { id: 'agreement-1', type: 'privacy-policy' } })
    })

    it('builds default payload when no agreement exists', async () => {
        vi.mocked(getQuery).mockReturnValue({})
        getActiveAgreementContentMock.mockResolvedValue(null)
        const handler = createAgreementPublicHandler({
            type: 'user-agreement',
            fetchErrorMessage: 'fetch failed',
            defaultContent: () => 'default content',
        })

        const result = await handler({} as never)

        expect(result).toEqual({
            code: 200,
            data: expect.objectContaining({
                id: 'default',
                type: 'user-agreement',
                language: 'zh-CN',
                content: 'default content',
                isDefault: true,
            }),
        })
    })

    it('rethrows fetch failures as 500 createError', async () => {
        vi.mocked(getQuery).mockReturnValue({ language: 'zh-CN' })
        getActiveAgreementContentMock.mockRejectedValue(new Error('upstream failed'))
        const handler = createAgreementPublicHandler({
            type: 'privacy-policy',
            fetchErrorMessage: 'fetch failed',
            defaultContent: () => 'default content',
        })

        await expect(handler({} as never)).rejects.toMatchObject({
            statusCode: 500,
            statusMessage: 'upstream failed',
        })
    })
})
