import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler, { COMMENT_TRANSLATION_VISITOR_COOKIE_NAME } from './comment-translation.post'
import { commentTranslationService } from '@/server/services/comment-translation'
import { signCookieValue } from '@/server/utils/security'

vi.mock('@/server/services/comment-translation', () => ({
    commentTranslationService: {
        getOrCreateTranslation: vi.fn(),
    },
}))

const readBodyMock = vi.fn()
const getCookieMock = vi.fn()
const setCookieMock = vi.fn()

vi.stubGlobal('readBody', readBodyMock)
vi.stubGlobal('getCookie', getCookieMock)
vi.stubGlobal('setCookie', setCookieMock)

describe('POST /api/ai/comment-translation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        readBodyMock.mockResolvedValue({
            commentId: '5fd0e68d1f80001',
            targetLanguage: 'en-US',
        })
        vi.mocked(commentTranslationService.getOrCreateTranslation).mockResolvedValue({
            commentId: '5fd0e68d1f80001',
            targetLanguage: 'en-US',
            content: 'Translated comment',
            updatedAt: '2026-04-20T00:00:00.000Z',
            fromCache: false,
        })
        getCookieMock.mockReturnValue(undefined)
    })

    it('should use authenticated viewer as translation actor', async () => {
        const result = await handler({
            context: {
                auth: {
                    user: {
                        id: 'user-1',
                        email: 'user@example.com',
                        role: 'user',
                    },
                },
            },
        } as any)

        expect(commentTranslationService.getOrCreateTranslation).toHaveBeenCalledWith(expect.objectContaining({
            actorId: 'user-1',
            viewerEmail: 'user@example.com',
            viewerId: 'user-1',
            isAdmin: false,
        }))
        expect(setCookieMock).not.toHaveBeenCalled()
        expect(result).toEqual({
            code: 200,
            data: expect.objectContaining({
                content: 'Translated comment',
            }),
        })
    })

    it('should create signed visitor actor cookie for guest viewer', async () => {
        getCookieMock.mockImplementation((_, name: string) => {
            if (name === 'momei_guest_email') {
                return signCookieValue('guest@example.com')
            }

            return undefined
        })

        const event = { context: {} } as any
        await handler(event)

        expect(commentTranslationService.getOrCreateTranslation).toHaveBeenCalledWith(expect.objectContaining({
            actorId: expect.stringMatching(/^[0-9a-f-]{36}$/),
            viewerEmail: 'guest@example.com',
            viewerId: undefined,
            isAdmin: false,
        }))
        expect(setCookieMock).toHaveBeenCalledWith(
            event,
            COMMENT_TRANSLATION_VISITOR_COOKIE_NAME,
            expect.any(String),
            expect.objectContaining({
                httpOnly: true,
                sameSite: 'lax',
            }),
        )
    })
})
