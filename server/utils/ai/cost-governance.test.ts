import { describe, expect, it } from 'vitest'
import {
    calculateDisplayCost,
    calculateQuotaUnits,
    convertCostToDisplayCurrency,
    deriveChargeStatus,
    inferFailureStage,
    normalizeTaskCategory,
    normalizeUsageSnapshot,
} from './cost-governance'

describe('ai cost governance utils', () => {
    it('should normalize task category by type', () => {
        expect(normalizeTaskCategory(undefined, 'image_generation')).toBe('image')
        expect(normalizeTaskCategory(undefined, 'async_transcription')).toBe('asr')
        expect(normalizeTaskCategory('podcast', 'podcast')).toBe('podcast')
    })

    it('should normalize text usage snapshot from usage payload', () => {
        const snapshot = normalizeUsageSnapshot({
            category: 'text',
            type: 'summarize',
            payload: { content: 'hello world' },
            response: {
                content: 'summary',
                usage: {
                    promptTokens: 120,
                    completionTokens: 30,
                    totalTokens: 150,
                },
            },
        })

        expect(snapshot.totalTokens).toBe(150)
        expect(snapshot.textChars).toBeGreaterThan(0)
        expect(snapshot.outputChars).toBe('summary'.length)
    })

    it('should calculate higher quota units for image than text', () => {
        const textQuota = calculateQuotaUnits({
            category: 'text',
            type: 'summarize',
            usageSnapshot: { totalTokens: 800 },
        })

        const imageQuota = calculateQuotaUnits({
            category: 'image',
            type: 'image_generation',
            payload: { size: '2048x2048', n: 1, quality: 'hd' },
            usageSnapshot: { imageCount: 1, imageResolution: '2048x2048' },
        })

        expect(textQuota).toBe(1)
        expect(imageQuota).toBeGreaterThan(textQuota)
    })

    it('should calculate asr quota by audio seconds', () => {
        const quota = calculateQuotaUnits({
            category: 'asr',
            type: 'transcription',
            usageSnapshot: { audioSeconds: 75 },
        })

        expect(quota).toBe(12)
    })

    it('should calculate asr quota by audio bytes when duration is unavailable', () => {
        const quota = calculateQuotaUnits({
            category: 'asr',
            type: 'transcription',
            usageSnapshot: { audioBytes: 5 * 1024 * 1024 },
        })

        expect(quota).toBe(12)
    })

    it('should infer provider_rejected for 429 errors', () => {
        expect(inferFailureStage({ statusCode: 429 })).toBe('provider_rejected')
    })

    it('should mark rejected failures as waived', () => {
        expect(deriveChargeStatus({
            status: 'failed',
            failureStage: 'provider_rejected',
            quotaUnits: 10,
            settlementSource: 'estimated',
        })).toBe('waived')
    })

    it('should mark completed estimated settlement correctly', () => {
        expect(deriveChargeStatus({
            status: 'completed',
            quotaUnits: 3,
            settlementSource: 'estimated',
        })).toBe('estimated')
    })

    it('should convert provider cost into configured display currency', () => {
        expect(convertCostToDisplayCurrency(1, 'USD', {
            currencyCode: 'CNY',
            currencySymbol: '¥',
            quotaUnitPrice: 0.1,
            exchangeRates: { CNY: 1, USD: 7.2 },
            providerCurrencies: {},
        })).toBe(7.2)
    })

    it('should keep displayed cost correlated with quota units', () => {
        const displayCost = calculateDisplayCost({
            category: 'tts',
            type: 'tts',
            quotaUnits: 6,
            provider: 'openai',
            providerCost: 0.15,
            factors: {
                currencyCode: 'CNY',
                currencySymbol: '¥',
                quotaUnitPrice: 0.2,
                exchangeRates: { CNY: 1, USD: 7.2 },
                providerCurrencies: { openai: 'USD' },
            },
        })

        expect(displayCost).toBe(1.2)
    })
})
