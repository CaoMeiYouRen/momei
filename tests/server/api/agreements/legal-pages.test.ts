import { beforeEach, describe, expect, it, vi } from 'vitest'
import userAgreementHandler from '@/server/api/agreements/user-agreement.get'
import privacyPolicyHandler from '@/server/api/agreements/privacy-policy.get'
import { getActiveAgreementContent } from '@/server/services/agreement'

vi.mock('@/server/services/agreement', () => ({
    getActiveAgreementContent: vi.fn(),
}))

describe('public agreements api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getQuery', vi.fn((event: { query?: unknown }) => event.query || {}))
    })

    it('returns the user agreement in the preferred language when available', async () => {
        vi.mocked(getActiveAgreementContent).mockResolvedValue({
            id: 'ua-v2-en',
            type: 'user_agreement',
            language: 'en-US',
            content: '# Agreement',
            version: '2.0.0-en',
            versionDescription: 'English reference translation',
            effectiveAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-02T00:00:00.000Z',
            authoritativeLanguage: 'zh-CN',
            authoritativeVersion: '2.0.0',
            isDefault: false,
            isReferenceTranslation: true,
            fallbackToAuthoritative: false,
            sourceAgreementId: 'ua-v2',
            sourceAgreementVersion: '2.0.0',
            history: [],
        })

        const result = await userAgreementHandler({
            query: {
                language: 'en-US',
            },
        } as never)

        expect(getActiveAgreementContent).toHaveBeenCalledWith('user_agreement', 'en-US')
        expect(result.code).toBe(200)
        expect(result.data).toMatchObject({
            id: 'ua-v2-en',
            isReferenceTranslation: true,
        })
    })

    it('returns privacy policy fallback payload when no agreement is configured', async () => {
        vi.mocked(getActiveAgreementContent).mockResolvedValue(null)

        const result = await privacyPolicyHandler({
            query: {
                language: 'ko-KR',
            },
        } as never)

        expect(getActiveAgreementContent).toHaveBeenCalledWith('privacy_policy', 'ko-KR')
        expect(result.code).toBe(200)
        expect(result.data).toMatchObject({
            language: 'ko-KR',
            isDefault: true,
            fallbackToAuthoritative: false,
        })
    })
})
