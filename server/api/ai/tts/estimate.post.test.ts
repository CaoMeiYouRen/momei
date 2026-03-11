import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './estimate.post'
import { TTSService } from '@/server/services/ai'
import { calculateQuotaUnits } from '@/server/utils/ai/cost-governance'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai', () => ({
    TTSService: {
        estimateCostBreakdown: vi.fn(),
    },
}))
vi.mock('@/server/utils/ai/cost-governance', () => ({
    calculateQuotaUnits: vi.fn(),
}))
vi.mock('@/server/utils/permission', () => ({
    requireAdminOrAuthor: vi.fn(),
}))

const { readBody } = global as unknown as {
    readBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/tts/estimate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'author-1', role: 'author' },
        } as any)
    })

    it('should return structured estimate contract', async () => {
        vi.mocked(readBody).mockResolvedValue({
            provider: 'openai',
            voice: 'alloy',
            text: 'Hello world',
            mode: 'speech',
        })
        vi.mocked(calculateQuotaUnits).mockReturnValue(12)
        vi.mocked(TTSService.estimateCostBreakdown).mockResolvedValue({
            quotaUnits: 12,
            providerCost: 0.42,
            providerCurrency: 'USD',
            displayCost: 3.08,
            costDisplay: {
                currencyCode: 'CNY',
                currencySymbol: '¥',
                quotaUnitPrice: 0.12,
            },
        })

        const result = await handler({ context: {} } as any)

        expect(calculateQuotaUnits).toHaveBeenCalledWith({
            category: 'tts',
            type: 'tts',
            payload: {
                text: 'Hello world',
                voice: 'alloy',
                mode: 'speech',
            },
        })
        expect(TTSService.estimateCostBreakdown).toHaveBeenCalledWith('Hello world', 'alloy', 'openai', {
            mode: 'speech',
            quotaUnits: 12,
        })
        expect(result).toEqual({
            code: 200,
            locale: 'zh-CN',
            data: {
                providerCost: 0.42,
                providerCurrency: 'USD',
                displayCost: 3.08,
                quotaUnits: 12,
                costDisplay: {
                    currencyCode: 'CNY',
                    currencySymbol: '¥',
                    quotaUnitPrice: 0.12,
                },
            },
        })
    })

    it('should reject missing voice or text', async () => {
        vi.mocked(readBody).mockResolvedValue({
            provider: 'openai',
            voice: '',
            text: '',
        })

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Voice and text are required',
        })
    })
})
