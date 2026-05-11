import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateTTSCredentials } from '@/server/utils/ai/tts-credentials'
import { SettingKey } from '@/types/setting'

const fetchMock = vi.fn()

beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock)
})

afterAll(() => {
    vi.unstubAllGlobals()
})

describe('TTS Credentials Utility', () => {
    const mockSettings: Record<string, string | undefined> = {
        [SettingKey.TTS_VOLCENGINE_APP_ID]: 'tts-app-id',
        [SettingKey.TTS_VOLCENGINE_ACCESS_KEY]: 'tts-access-key',
        [SettingKey.VOLCENGINE_APP_ID]: 'shared-app-id',
        [SettingKey.VOLCENGINE_ACCESS_KEY]: 'shared-access-key',
    }

    beforeEach(() => {
        fetchMock.mockReset()
        fetchMock.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                jwt_token: 'temporary-jwt-token',
            }),
        })
    })

    it('falls back to shared Volcengine credentials when TTS-specific grant is missing', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({
                    message: 'load grant: requested grant not found in SaaS storage',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    jwt_token: 'shared-jwt-token',
                }),
            })

        const credentials = await generateTTSCredentials({
            provider: 'volcengine',
            mode: 'speech',
            connectId: 'connect-123',
            settings: mockSettings,
            expiresIn: 5 * 60 * 1000,
        })

        expect(credentials.appId).toBe('shared-app-id')
        expect(credentials.jwtToken).toBe('shared-jwt-token')
        expect(credentials.authQuery).toEqual({
            api_resource_id: 'volc.service_type.10029',
            api_appid: 'shared-app-id',
            api_access_key: 'Jwt; shared-jwt-token',
        })
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://openspeech.bytedance.com/api/v1/sts/token',
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer; tts-access-key',
                }),
            }),
        )
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://openspeech.bytedance.com/api/v1/sts/token',
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer; shared-access-key',
                }),
            }),
        )
    })

    it('keeps the original failure when no shared fallback credentials exist', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({
                message: 'load grant: requested grant not found in SaaS storage',
            }),
        })

        await expect(generateTTSCredentials({
            provider: 'volcengine',
            mode: 'speech',
            connectId: 'connect-123',
            settings: {
                [SettingKey.TTS_VOLCENGINE_APP_ID]: 'tts-app-id',
                [SettingKey.TTS_VOLCENGINE_ACCESS_KEY]: 'tts-access-key',
            },
            expiresIn: 5 * 60 * 1000,
        })).rejects.toThrow('grant not found')

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('does not fallback to shared credentials for unrelated STS errors', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({
                message: 'rate limit exceeded',
            }),
        })

        await expect(generateTTSCredentials({
            provider: 'volcengine',
            mode: 'speech',
            connectId: 'connect-123',
            settings: mockSettings,
            expiresIn: 5 * 60 * 1000,
        })).rejects.toThrow('rate limit exceeded')

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
