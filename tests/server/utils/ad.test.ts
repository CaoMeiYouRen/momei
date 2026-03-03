import { describe, it, expect } from 'vitest'
import {
    generateAdCode,
    validateAdConfig,
    sanitizeMetadata,
    formatAdSize,
    parseTargetingRules,
    isAdFormatSupported,
} from '@/server/utils/ad'
import { AdFormat } from '@/types/ad'

describe('Ad Utility Functions', () => {
    describe('generateAdCode', () => {
        it('should generate valid AdSense code', () => {
            const code = generateAdCode('adsense', {
                slot: '1234567890',
                publisherId: 'pub-1234567890123456',
            })

            expect(code).toContain('adsbygoogle')
            expect(code).toContain('1234567890')
            expect(code).toContain('pub-1234567890123456')
        })

        it('should generate valid Baidu code', () => {
            const code = generateAdCode('baidu', {
                slot: 'slot_123',
                publisherId: '123456',
            })

            expect(code).toContain('cpro_id')
            expect(code).toContain('slot_123')
        })

        it('should generate valid Tencent code', () => {
            const code = generateAdCode('tencent', {
                slot: 'unit_id_123',
                appId: '1234567890',
            })

            expect(code).toContain('1234567890')
            expect(code).toContain('unit_id_123')
        })

        it('should return placeholder for unknown adapter', () => {
            const code = generateAdCode('unknown', {
                slot: 'test',
            })

            expect(code).toContain('Ad not available')
        })
    })

    describe('validateAdConfig', () => {
        it('should validate AdSense config', () => {
            const result = validateAdConfig('adsense', {
                publisherId: 'pub-1234567890123456',
                clientId: 'ca-pub-1234567890123456',
            })

            expect(result.valid).toBe(true)
        })

        it('should reject invalid AdSense config', () => {
            const result = validateAdConfig('adsense', {
                publisherId: '',
            })

            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('should validate Baidu config', () => {
            const result = validateAdConfig('baidu', {
                publisherId: '123456',
                tokenId: 'token123',
            })

            expect(result.valid).toBe(true)
        })

        it('should validate Tencent config', () => {
            const result = validateAdConfig('tencent', {
                appId: '1234567890',
                placementId: 'placement_123',
            })

            expect(result.valid).toBe(true)
        })
    })

    describe('sanitizeMetadata', () => {
        it('should sanitize HTML in metadata', () => {
            const metadata = {
                title: '<script>alert("xss")</script>Title',
                description: 'Description',
                badTag: '</script >',
                iframe: '<iframe src="malicious.com"></iframe>',
                malformedScriptClose: '</script\t\n bar>',
            }

            const sanitized = sanitizeMetadata(metadata)

            expect(sanitized.title).toBe('Title')
            expect(sanitized.description).toBe('Description')
            expect(sanitized.badTag).toBe('')
            expect(sanitized.iframe).toBe('')
            expect(sanitized.malformedScriptClose).toBe('')
        })

        it('should preserve safe metadata', () => {
            const metadata = {
                title: 'Safe Title',
                description: 'Safe Description',
                favicon: 'https://example.com/favicon.ico',
            }

            const sanitized = sanitizeMetadata(metadata)

            expect(sanitized.title).toBe('Safe Title')
            expect(sanitized.description).toBe('Safe Description')
            expect(sanitized.favicon).toBe('https://example.com/favicon.ico')
        })

        it('should handle null metadata', () => {
            const sanitized = sanitizeMetadata(null)

            expect(sanitized).toEqual({})
        })
    })

    describe('formatAdSize', () => {
        it('should format standard ad sizes', () => {
            expect(formatAdSize(300, 250)).toBe('300x250')
            expect(formatAdSize(728, 90)).toBe('728x90')
            expect(formatAdSize(160, 600)).toBe('160x600')
        })

        it('should format responsive size', () => {
            expect(formatAdSize('auto', 'auto')).toBe('responsive')
            expect(formatAdSize('100%', '100%')).toBe('responsive')
        })
    })

    describe('parseTargetingRules', () => {
        it('should parse valid targeting rules', () => {
            const rules = {
                categories: ['tech', 'news'],
                tags: ['javascript', 'vue'],
                locations: ['header', 'sidebar'],
            }

            const parsed = parseTargetingRules(JSON.stringify(rules))

            expect(parsed).toEqual(rules)
        })

        it('should handle invalid JSON gracefully', () => {
            const parsed = parseTargetingRules('invalid json')

            expect(parsed).toEqual({})
        })

        it('should handle empty string', () => {
            const parsed = parseTargetingRules('')

            expect(parsed).toEqual({})
        })
    })

    describe('isAdFormatSupported', () => {
        it('should check AdSense supported formats', () => {
            expect(isAdFormatSupported('adsense', AdFormat.DISPLAY)).toBe(true)
            expect(isAdFormatSupported('adsense', AdFormat.RESPONSIVE)).toBe(true)
            expect(isAdFormatSupported('adsense', AdFormat.NATIVE)).toBe(true)
            expect(isAdFormatSupported('adsense', AdFormat.VIDEO)).toBe(false)
        })

        it('should check Baidu supported formats', () => {
            expect(isAdFormatSupported('baidu', AdFormat.DISPLAY)).toBe(true)
            expect(isAdFormatSupported('baidu', AdFormat.NATIVE)).toBe(true)
            expect(isAdFormatSupported('baidu', AdFormat.VIDEO)).toBe(false)
        })

        it('should check Tencent supported formats', () => {
            expect(isAdFormatSupported('tencent', AdFormat.DISPLAY)).toBe(true)
            expect(isAdFormatSupported('tencent', AdFormat.NATIVE)).toBe(true)
            expect(isAdFormatSupported('tencent', AdFormat.VIDEO)).toBe(true)
        })

        it('should handle unknown adapter', () => {
            expect(isAdFormatSupported('unknown', AdFormat.DISPLAY)).toBe(false)
        })
    })
})
