import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingKey } from '@/types/setting'

const { getSettingsMock, useRuntimeConfigMock } = vi.hoisted(() => ({
    getSettingsMock: vi.fn(),
    useRuntimeConfigMock: vi.fn(),
}))

vi.mock('./openai-provider', () => ({
    OpenAIProvider: class {
        kind = 'openai'
        constructor(public config: unknown) {}
    },
}))

vi.mock('./anthropic-provider', () => ({
    AnthropicProvider: class {
        kind = 'anthropic'
        constructor(public config: unknown) {}
    },
}))

vi.mock('./gemini-provider', () => ({
    GeminiProvider: class {
        kind = 'gemini'
        constructor(public config: unknown) {}
    },
}))

vi.mock('./stable-diffusion-provider', () => ({
    StableDiffusionProvider: class {
        kind = 'stable-diffusion'
        constructor(public config: unknown) {}
    },
}))

vi.mock('./mock-provider', () => ({
    MockAIProvider: class {
        kind = 'mock'
    },
}))

vi.mock('./asr-siliconflow', () => ({
    SiliconFlowASRProvider: class {
        kind = 'asr-siliconflow'
        constructor(public apiKey: string, public endpoint: string, public model: string) {}
    },
}))

vi.mock('./asr-volcengine', () => ({
    VolcengineASRProvider: class {
        kind = 'asr-volcengine'
        constructor(public config: unknown) {}
    },
}))

vi.mock('./tts-openai', () => ({
    OpenAITTSProvider: class {
        kind = 'tts-openai'
        constructor(public config: unknown) {}
    },
}))

vi.mock('./tts-siliconflow', () => ({
    SiliconFlowTTSProvider: class {
        kind = 'tts-siliconflow'
        constructor(public config: unknown) {}
    },
}))

vi.mock('./tts-volcengine', () => ({
    VolcengineTTSProvider: class {
        kind = 'tts-volcengine'
        constructor(public config: unknown) {}
    },
}))

vi.mock('~/server/services/setting', () => ({
    getSettings: getSettingsMock,
}))

vi.stubGlobal('useRuntimeConfig', useRuntimeConfigMock)

import { getAIProvider } from './index'

function createSettings(overrides: Record<string, string> = {}) {
    return {
        [SettingKey.AI_ENABLED]: 'true',
        [SettingKey.AI_PROVIDER]: 'openai',
        [SettingKey.AI_API_KEY]: 'root-key',
        [SettingKey.AI_MODEL]: 'gpt-test',
        [SettingKey.AI_ENDPOINT]: 'https://api.example.com',
        ...overrides,
    }
}

describe('getAIProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useRuntimeConfigMock.mockReturnValue({
            public: {
                demoMode: false,
            },
        })
        getSettingsMock.mockResolvedValue(createSettings())
    })

    it('throws when category is disabled', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.AI_ENABLED]: 'false',
        }))

        await expect(getAIProvider('text')).rejects.toMatchObject({
            statusCode: 503,
            message: 'AI service (text) is disabled',
        })
    })

    it('throws when API key is required but missing', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.AI_API_KEY]: '',
        }))

        await expect(getAIProvider('text')).rejects.toMatchObject({
            statusCode: 500,
            message: 'AI API key for text is not configured',
        })
    })

    it('returns anthropic provider for text category', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.AI_PROVIDER]: 'anthropic',
        }))

        const provider = await getAIProvider('text') as { kind: string, config: { provider: string } }

        expect(provider.kind).toBe('anthropic')
        expect(provider.config.provider).toBe('anthropic')
    })

    it('returns gemini provider for image category with api token', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.AI_IMAGE_ENABLED]: 'true',
            [SettingKey.AI_IMAGE_PROVIDER]: 'gemini',
            [SettingKey.AI_IMAGE_API_KEY]: 'image-key',
            [SettingKey.AI_IMAGE_MODEL]: 'gemini-image',
            [SettingKey.GEMINI_API_TOKEN]: 'gemini-token',
        }))

        const provider = await getAIProvider('image') as { kind: string, config: { apiToken: string, provider: string } }

        expect(provider.kind).toBe('gemini')
        expect(provider.config.provider).toBe('gemini')
        expect(provider.config.apiToken).toBe('gemini-token')
    })

    it('returns stable diffusion provider for image category', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.AI_IMAGE_ENABLED]: 'true',
            [SettingKey.AI_IMAGE_PROVIDER]: 'stable-diffusion',
            [SettingKey.AI_IMAGE_API_KEY]: 'sd-key',
        }))

        const provider = await getAIProvider('image') as { kind: string }

        expect(provider.kind).toBe('stable-diffusion')
    })

    it('returns siliconflow asr provider', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.ASR_ENABLED]: 'true',
            [SettingKey.ASR_PROVIDER]: 'siliconflow',
            [SettingKey.ASR_API_KEY]: 'asr-key',
            [SettingKey.ASR_MODEL]: 'asr-model',
            [SettingKey.ASR_ENDPOINT]: 'https://asr.example.com',
        }))

        const provider = await getAIProvider('asr') as { kind: string, apiKey: string, endpoint: string, model: string }

        expect(provider.kind).toBe('asr-siliconflow')
        expect(provider.apiKey).toBe('asr-key')
        expect(provider.endpoint).toBe('https://asr.example.com')
        expect(provider.model).toBe('asr-model')
    })

    it('returns volcengine asr provider with resolved resource id', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.ASR_ENABLED]: 'true',
            [SettingKey.ASR_PROVIDER]: 'volcengine',
            [SettingKey.ASR_MODEL]: 'volc.bigasr.sauc.duration',
            [SettingKey.ASR_VOLCENGINE_CLUSTER_ID]: 'cluster-a',
            [SettingKey.VOLCENGINE_APP_ID]: 'app-id',
            [SettingKey.VOLCENGINE_ACCESS_KEY]: 'access-key',
            [SettingKey.ASR_ENDPOINT]: 'wss://asr.example.com',
        }))

        const provider = await getAIProvider('asr') as { kind: string, config: { resourceId: string, appId: string, token: string } }

        expect(provider.kind).toBe('asr-volcengine')
        expect(provider.config).toMatchObject({
            appId: 'app-id',
            token: 'access-key',
            resourceId: 'volc.bigasr.sauc.duration',
        })
    })

    it('returns volcengine tts provider without requiring generic api key', async () => {
        getSettingsMock.mockResolvedValue(createSettings({
            [SettingKey.TTS_ENABLED]: 'true',
            [SettingKey.TTS_PROVIDER]: 'volcengine',
            [SettingKey.TTS_API_KEY]: '',
            [SettingKey.TTS_MODEL]: 'tts-model',
            [SettingKey.VOLCENGINE_APP_ID]: 'app-id',
            [SettingKey.VOLCENGINE_ACCESS_KEY]: 'access-key',
            [SettingKey.VOLCENGINE_SECRET_KEY]: 'secret-key',
        }))

        const provider = await getAIProvider('tts') as { kind: string, config: { appId: string, accessKey: string, secretKey: string } }

        expect(provider.kind).toBe('tts-volcengine')
        expect(provider.config).toMatchObject({
            appId: 'app-id',
            accessKey: 'access-key',
            secretKey: 'secret-key',
        })
    })
})
