import { describe, it, expect, vi, beforeAll } from 'vitest'
import {
    generateASRCredentials,
    verifyASRSecurityToken,
    getASRConfigStatus,
} from '@/server/utils/ai/asr-credentials'
import { SettingKey } from '@/types/setting'

// Mock environment variables for tests
beforeAll(() => {
    vi.stubEnv('WEBHOOK_SECRET', 'test-webhook-secret')
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

    describe('generateASRCredentials', () => {
        it('should generate SiliconFlow batch credentials', () => {
            const credentials = generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })

            expect(credentials.provider).toBe('siliconflow')
            expect(credentials.mode).toBe('batch')
            expect(credentials.apiKey).toBe('test-siliconflow-key')
            expect(credentials.model).toBe('FunAudioLLM/SenseVoiceSmall')
            expect(credentials.endpoint).toBe('https://api.siliconflow.cn/v1')
            expect(credentials.securityToken).toBeDefined()
            expect(credentials.expiresAt).toBeGreaterThan(Date.now())
        })

        it('should fallback to generic API key for SiliconFlow', () => {
            const settingsWithoutSpecificKey = {
                ...mockSettings,
                [SettingKey.ASR_SILICONFLOW_API_KEY]: undefined,
            }

            const credentials = generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: settingsWithoutSpecificKey,
                expiresIn: 5 * 60 * 1000,
            })

            expect(credentials.apiKey).toBe('test-generic-key')
        })

        it('should generate Volcengine stream credentials', () => {
            const credentials = generateASRCredentials({
                provider: 'volcengine',
                mode: 'stream',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })

            expect(credentials.provider).toBe('volcengine')
            expect(credentials.mode).toBe('stream')
            expect(credentials.appId).toBe('test-app-id')
            expect(credentials.authHeaders).toBeDefined()
            expect(credentials.authHeaders?.['X-Api-App-Id']).toBe('test-app-id')
            expect(credentials.authHeaders?.['X-Api-Access-Key']).toBe('test-access-key')
            expect(credentials.securityToken).toBeDefined()
        })

        it('should throw error when SiliconFlow API key is missing', () => {
            const emptySettings: Record<string, string | undefined> = {}

            expect(() => generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: emptySettings,
                expiresIn: 5 * 60 * 1000,
            })).toThrow()
        })

        it('should throw error when Volcengine credentials are missing', () => {
            const emptySettings: Record<string, string | undefined> = {}

            expect(() => generateASRCredentials({
                provider: 'volcengine',
                mode: 'stream',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: emptySettings,
                expiresIn: 5 * 60 * 1000,
            })).toThrow()
        })
    })

    describe('verifyASRSecurityToken', () => {
        it('should verify valid security token', () => {
            const credentials = generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })

            const isValid = verifyASRSecurityToken(
                'user-123',
                'connect-123',
                credentials.expiresAt,
                credentials.securityToken,
            )

            expect(isValid).toBe(true)
        })

        it('should reject invalid security token', () => {
            const isValid = verifyASRSecurityToken(
                'user-123',
                'connect-123',
                Date.now() + 5 * 60 * 1000,
                'invalid-token',
            )

            expect(isValid).toBe(false)
        })

        it('should reject expired token', () => {
            const credentials = generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })

            // Simulate expired token by using past timestamp
            const isValid = verifyASRSecurityToken(
                'user-123',
                'connect-123',
                Date.now() - 1000, // 1 second ago
                credentials.securityToken,
            )

            expect(isValid).toBe(false)
        })

        it('should reject token with wrong user ID', () => {
            const credentials = generateASRCredentials({
                provider: 'siliconflow',
                mode: 'batch',
                userId: 'user-123',
                connectId: 'connect-123',
                settings: mockSettings,
                expiresIn: 5 * 60 * 1000,
            })

            const isValid = verifyASRSecurityToken(
                'wrong-user',
                'connect-123',
                credentials.expiresAt,
                credentials.securityToken,
            )

            expect(isValid).toBe(false)
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
            delete settingsWithoutVolcengine[SettingKey.VOLCENGINE_APP_ID]
            delete settingsWithoutVolcengine[SettingKey.VOLCENGINE_ACCESS_KEY]

            const status = getASRConfigStatus(settingsWithoutVolcengine)

            expect(status.enabled).toBe(true)
            expect(status.siliconflow).toBe(true)
            expect(status.volcengine).toBe(false)
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
