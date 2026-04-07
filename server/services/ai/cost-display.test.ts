import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    estimateAICostBreakdown,
    estimateAIDisplayCost,
    getAICostDisplayConfig,
    getAICostFactors,
} from './cost-display'
import { DEFAULT_AI_COST_FACTORS } from '@/server/utils/ai/cost-governance'

const { getSettingMock } = vi.hoisted(() => ({
    getSettingMock: vi.fn(),
}))

vi.mock('@/server/services/setting', () => ({
    getSetting: getSettingMock,
}))

describe('ai cost display service', () => {
    beforeEach(() => {
        getSettingMock.mockReset()
    })

    it('falls back to default factors when stored json is invalid', async () => {
        getSettingMock.mockResolvedValueOnce('{invalid-json')

        await expect(getAICostFactors()).resolves.toEqual(DEFAULT_AI_COST_FACTORS)
    })

    it('normalizes valid stored factors', async () => {
        getSettingMock.mockResolvedValueOnce(JSON.stringify({
            currencyCode: ' usd ',
            currencySymbol: ' $ ',
            quotaUnitPrice: 0.5,
            exchangeRates: {
                usd: 1,
                eur: 8.1,
            },
            providerCurrencies: {
                openai: ' usd ',
                custom: ' eur ',
            },
        }))

        await expect(getAICostFactors()).resolves.toEqual(expect.objectContaining({
            currencyCode: 'USD',
            currencySymbol: '$',
            quotaUnitPrice: 0.5,
            exchangeRates: expect.objectContaining({
                USD: 1,
                EUR: 8.1,
            }),
            providerCurrencies: expect.objectContaining({
                openai: 'USD',
                custom: 'EUR',
            }),
        }))
    })

    it('exposes display config from normalized factors', async () => {
        getSettingMock.mockResolvedValueOnce(JSON.stringify({
            currencyCode: 'CNY',
            currencySymbol: '¥',
            quotaUnitPrice: 0.25,
        }))

        await expect(getAICostDisplayConfig()).resolves.toEqual({
            currencyCode: 'CNY',
            currencySymbol: '¥',
            quotaUnitPrice: 0.25,
        })
    })

    it('estimates breakdown with provider currency fallback and higher converted provider cost', async () => {
        getSettingMock.mockResolvedValueOnce(JSON.stringify(DEFAULT_AI_COST_FACTORS))

        await expect(estimateAICostBreakdown({
            provider: 'openai',
            providerCost: 1,
            quotaUnits: 2,
        })).resolves.toEqual({
            providerCost: 1,
            providerCurrency: 'USD',
            displayCost: 7.2,
            costDisplay: {
                currencyCode: 'CNY',
                currencySymbol: '¥',
                quotaUnitPrice: 0.1,
            },
        })
    })

    it('returns display cost directly when provider cost is absent', async () => {
        getSettingMock.mockResolvedValueOnce(JSON.stringify(DEFAULT_AI_COST_FACTORS))

        await expect(estimateAIDisplayCost({
            provider: 'siliconflow',
            quotaUnits: 3,
            providerCost: 0,
        })).resolves.toBe(0.3)
    })
})
