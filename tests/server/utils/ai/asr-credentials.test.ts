import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    DEFAULT_ASR_CREDENTIAL_TTL_SECONDS,
    generateASRCredentials,
    getASRConfigStatus,
    MAX_ASR_CREDENTIAL_TTL_SECONDS,
    MIN_ASR_CREDENTIAL_TTL_SECONDS,
    resolveASRCredentialTtlMilliseconds,
} from '@/server/utils/ai/asr-credentials'
import { SettingKey } from '@/types/setting'

const fetchMock = vi.fn()

beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock)
})

afterAll(() => {
    vi.unstubAllGlobals()
})

describe('ASR Credentials Utility', () => {
    const mockSettings: Record<string, string | undefined> = {
        [SettingKey.ASR_SILICONFLOW_API_KEY]: 'test-siliconflow-key',
        [SettingKey.ASR_API_KEY]: 'test-generic-key',
        [SettingKey.ASR_ENDPOINT]: 'https://api.siliconflow.cn/v1',
        [SettingKey.ASR_MODEL]: 'FunAudioLLM/SenseVoiceSmall',
        // Volcengine config (uses VOLCENGINE_* keys for getASRConfigStatus)
        [SettingKey.VOLCENGINE_APP_ID]: 'test-app-id',
        [SettingKey.VOLCENGINE_ACCESS_KEY]: 'test-access-key',
        // ASR-specific Volcengine config (for generateASRCredentials)
        [SettingKey.ASR_VOLCENGINE_APP_ID]: 'test-app-id',
        [SettingKey.ASR_VOLCENGINE_ACCESS_KEY]: 'test-access-key',
        [SettingKey.ASR_VOLCENGINE_SECRET_KEY]: 'test-secret-key',
        [SettingKey.ASR_VOLCENGINE_CLUSTER_ID]: 'test-cluster',
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

    describe('generateASRCredentials', () => {
        it('should generate SiliconFlow batch credentials', async () => {
            const credentials = await generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })

            expect(credentials.provider).toBe('siliconflow')
            expect(credentials.mode).toBe('batch')
            expect(credentials.authType).toBe('bearer')
            expect(credentials.issuedAt).toBeGreaterThan(0)
            expect(credentials.expiresInMs).toBe(5 * 60 * 1000)
            expect(credentials.apiKey).toBe('test-siliconflow-key')
            expect(credentials.model).toBe('FunAudioLLM/SenseVoiceSmall')
            expect(credentials.endpoint).toBe('https://api.siliconflow.cn/v1')
            expect(credentials.expiresAt).toBeGreaterThan(Date.now())
        })

        it('should fallback to generic API key for SiliconFlow', async () => {
            const settingsWithoutSpecificKey = {
                ...mockSettings,
                [SettingKey.ASR_SILICONFLOW_API_KEY]: undefined,
            }

            const credentials = await generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                connectId: 'connect-123',
                settings: settingsWithoutSpecificKey,
                expiresIn: 5 * 60 * 1000,
            })

            expect(credentials.apiKey).toBe('test-generic-key')
        })

        it('should generate Volcengine stream credentials with temporary jwt query auth', async () => {
            const credentials = await generateASRCredentials({
                provider: 'volcengine',
                mode: 'stream',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })

            expect(credentials.provider).toBe('volcengine')
            expect(credentials.mode).toBe('stream')
            expect(credentials.authType).toBe('query')
            expect(credentials.appId).toBe('test-app-id')
            expect(credentials.jwtToken).toBe('temporary-jwt-token')
            expect(credentials.issuedAt).toBeGreaterThan(0)
            expect(credentials.expiresInMs).toBe(5 * 60 * 1000)
            expect(credentials.authQuery).toEqual({
                api_resource_id: 'test-cluster',
                api_app_key: 'test-app-id',
                api_access_key: 'Jwt; temporary-jwt-token',
            })
            expect(credentials.temporaryUserId).toBeTruthy()
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(
                'https://openspeech.bytedance.com/api/v1/sts/token',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer; test-access-key',
                    }),
                }),
            )
        })

        it('should clamp volcengine token duration to provider minimum', async () => {
            await generateASRCredentials({
                provider: 'volcengine',
                mode: 'stream',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 1000,
            })

            const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
            const body = JSON.parse(typeof requestInit.body === 'string' ? requestInit.body : '{}')

            expect(body.duration).toBe(300)
        })

        it('should resolve credential ttl from human readable input', () => {
            expect(resolveASRCredentialTtlMilliseconds('10m')).toBe(10 * 60 * 1000)
        })

        it('should clamp credential ttl into supported range', () => {
            expect(resolveASRCredentialTtlMilliseconds('30s')).toBe(MIN_ASR_CREDENTIAL_TTL_SECONDS * 1000)
            expect(resolveASRCredentialTtlMilliseconds('5h')).toBe(MAX_ASR_CREDENTIAL_TTL_SECONDS * 1000)
            expect(resolveASRCredentialTtlMilliseconds(undefined)).toBe(DEFAULT_ASR_CREDENTIAL_TTL_SECONDS * 1000)
        })

        it('should throw error when SiliconFlow API key is missing', async () => {
            const emptySettings: Record<string, string | undefined> = {}

            await expect(generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                connectId: 'connect-123',
                settings: emptySettings,
                expiresIn: 5 * 60 * 1000,
            })).rejects.toThrow()
        })

        it('should throw error when Volcengine credentials are missing', async () => {
            const emptySettings: Record<string, string | undefined> = {}

            await expect(generateASRCredentials({
                provider: 'volcengine',
                mode: 'stream',
                connectId: 'connect-123',
                settings: emptySettings,
                expiresIn: 5 * 60 * 1000,
            })).rejects.toThrow()
        })
        it('should throw error when Volcengine token api returns invalid payload', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ foo: 'bar' }),
            })

            await expect(generateASRCredentials({
                provider: 'volcengine',
                mode: 'stream',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })).rejects.toThrow()
        })
    })

    describe('getASRConfigStatus', () => {
        it('should return correct status when both providers are configured', () => {
            const status = getASRConfigStatus(mockSettings)

            expect(status.enabled).toBe(true)
            expect(status.siliconflow).toBe(true)
            expect(status.volcengine).toBe(true)
        })

        it('should return correct status when only SiliconFlow is configured', () => {
            const settingsWithoutVolcengine = { ...mockSettings }
            delete settingsWithoutVolcengine[SettingKey.ASR_VOLCENGINE_APP_ID]
            delete settingsWithoutVolcengine[SettingKey.ASR_VOLCENGINE_ACCESS_KEY]
            delete settingsWithoutVolcengine[SettingKey.VOLCENGINE_APP_ID]
            delete settingsWithoutVolcengine[SettingKey.VOLCENGINE_ACCESS_KEY]

            const status = getASRConfigStatus(settingsWithoutVolcengine)

            expect(status.enabled).toBe(true)
            expect(status.siliconflow).toBe(true)
            expect(status.volcengine).toBe(false)
        })

        it('should fallback to generic Volcengine keys', () => {
            const settingsOnlyGenericVolcengine = { ...mockSettings }
            delete settingsOnlyGenericVolcengine[SettingKey.ASR_VOLCENGINE_APP_ID]
            delete settingsOnlyGenericVolcengine[SettingKey.ASR_VOLCENGINE_ACCESS_KEY]

            const status = getASRConfigStatus(settingsOnlyGenericVolcengine)

            expect(status.enabled).toBe(true)
            expect(status.siliconflow).toBe(true)
            expect(status.volcengine).toBe(true)
        })

        it('should return disabled when no providers are configured', () => {
            const emptySettings: Record<string, string | undefined> = {}
            const status = getASRConfigStatus(emptySettings)

            expect(status.enabled).toBe(false)
            expect(status.siliconflow).toBe(false)
            expect(status.volcengine).toBe(false)
        })
    })
})
