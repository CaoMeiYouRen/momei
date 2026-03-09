import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TTSService } from './tts'
import { getAIProvider } from '@/server/utils/ai'

vi.mock('../upload', () => ({
    buildPostUploadPrefix: vi.fn(),
    buildUploadStoredFilename: vi.fn(),
    uploadFromBuffer: vi.fn(),
    UploadType: {},
}))
vi.mock('../setting', () => ({
    getSettings: vi.fn(),
}))
vi.mock('@/server/utils/ai', () => ({
    getAIProvider: vi.fn(),
}))
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))
vi.mock('@/server/entities/post', () => ({
    Post: class Post {},
}))
vi.mock('@/server/entities/ai-task', () => ({
    AITask: class AITask {},
}))
vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}))
vi.mock('@/server/utils/post-metadata', () => ({
    applyPostMetadataPatch: vi.fn(),
}))
vi.mock('@/server/utils/ai/timeout', () => ({
    withAITimeout: vi.fn((promise: Promise<unknown>) => promise),
}))
vi.mock('./cost-display', () => ({
    estimateAIDisplayCost: vi.fn().mockResolvedValue(0),
}))

describe('TTSService estimateProviderCost', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should use canonical estimateTTSCost when available', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            estimateTTSCost: vi.fn().mockResolvedValue(0.15),
        } as any)

        await expect(TTSService.estimateProviderCost('hello', 'alloy', 'openai')).resolves.toBe(0.15)
    })

    it('should fall back to legacy estimateCost for compatibility', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'siliconflow',
            estimateCost: vi.fn().mockResolvedValue(0.08),
        } as any)

        await expect(TTSService.estimateProviderCost('hello', 'alex', 'siliconflow')).resolves.toBe(0.08)
    })
})
