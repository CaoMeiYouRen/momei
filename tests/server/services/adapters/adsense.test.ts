import { describe, it, expect, beforeEach } from 'vitest'
import { AdSenseAdapter, createAdSenseAdapter } from '@/server/services/adapters/adsense'
import { AdPlacement } from '@/server/entities/ad-placement'
import { AdError } from '@/server/services/adapters/base'

describe('AdSense Adapter', () => {
    let adapter: AdSenseAdapter

    beforeEach(() => {
        adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])
    })

    describe('properties', () => {
        it('should have correct id', () => {
            expect(adapter.id).toBe('adsense')
        })

        it('should have correct name', () => {
            expect(adapter.name).toBe('Google AdSense')
        })

        it('should support all locales', () => {
            expect(adapter.supportedLocales).toContain('*')
        })
    })

    describe('initialize', () => {
        it('should initialize with valid config', async () => {
            const config = {
                clientId: 'ca-pub-1234567890123456',
            }

            await expect(adapter.initialize(config)).resolves.not.toThrow()
            expect(adapter.getConfig()).toEqual(config)
        })

        it('should throw error without clientId', async () => {
            const config = {}

            await expect(adapter.initialize(config)).rejects.toThrow(AdError)
            await expect(adapter.initialize(config)).rejects.toThrow('AdSense Client ID is required')
        })

        it('should throw error with invalid clientId format', async () => {
            const config = {
                clientId: 'invalid-format',
            }

            await expect(adapter.initialize(config)).rejects.toThrow(AdError)
            await expect(adapter.initialize(config)).rejects.toThrow('Invalid AdSense Client ID format')
        })
    })

    describe('verifyCredentials', () => {
        it('should return true when clientId is configured', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

            const result = await adapter.verifyCredentials()

            expect(result).toBe(true)
        })

        it('should return false when clientId is not configured', async () => {
            const result = await adapter.verifyCredentials()

            expect(result).toBe(false)
        })
    })

    describe('getScript', () => {
        it('should return AdSense script with clientId', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

            const script = adapter.getScript()

            expect(script).toContain('pagead2.googlesyndication.com')
            expect(script).toContain('adsbygoogle.js')
            expect(script).toContain('ca-pub-1234567890123456')
            expect(script).toContain('<script')
        })
    })

    describe('getPlacementHtml', () => {
        let placement: AdPlacement

        beforeEach(() => {
            placement = new AdPlacement()
            placement.name = 'Test Sidebar Ad'
            placement.adapterId = 'adsense'
            placement.enabled = true
            placement.priority = 10
        })

        it('should generate valid AdSense HTML with responsive format', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })
            placement.metadata = {
                slot: '1234567890',
                format: 'responsive',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('adsbygoogle')
            expect(html).toContain('ca-pub-1234567890123456')
            expect(html).toContain('1234567890')
            expect(html).toContain('data-ad-format="responsive"')
            expect(html).toContain('display:block')
        })

        it('should generate valid AdSense HTML with auto format', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })
            placement.metadata = {
                slot: '1234567890',
                format: 'auto',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('adsbygoogle')
            expect(html).toContain('data-ad-format="auto"')
        })

        it('should generate valid AdSense HTML with specific format', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })
            placement.metadata = {
                slot: '1234567890',
                format: 'rectangle',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('adsbygoogle')
            expect(html).toContain('data-ad-format="rectangle"')
            expect(html).toContain('display:inline-block')
        })

        it('should default to responsive format when not specified', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })
            placement.metadata = {
                slot: '1234567890',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('data-ad-format="responsive"')
        })

        it('should throw error when slot is missing', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })
            placement.metadata = {
                format: 'responsive',
            }

            expect(() => adapter.getPlacementHtml(placement)).toThrow(AdError)
            expect(() => adapter.getPlacementHtml(placement)).toThrow('AdSense slot ID is required')
        })

        it('should throw error when metadata is missing', () => {
            placement.metadata = undefined

            expect(() => adapter.getPlacementHtml(placement)).toThrow(AdError)
            expect(() => adapter.getPlacementHtml(placement)).toThrow('Ad placement metadata is required')
        })

        it('should include full-width-responsive attribute', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })
            placement.metadata = {
                slot: '1234567890',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('data-full-width-responsive="true"')
        })
    })

    describe('getAdUnitConfig', () => {
        it('should return ad unit configuration', async () => {
            await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

            const config = adapter.getAdUnitConfig('1234567890')

            expect(config).toEqual({
                clientId: 'ca-pub-1234567890123456',
                slot: '1234567890',
            })
        })
    })

    describe('supportsLocale', () => {
        it('should support all locales', () => {
            expect(adapter.supportsLocale('en-US')).toBe(true)
            expect(adapter.supportsLocale('zh-CN')).toBe(true)
            expect(adapter.supportsLocale('ja-JP')).toBe(true)
        })
    })

    describe('createAdSenseAdapter factory', () => {
        it('should create adapter', () => {
            const newAdapter = createAdSenseAdapter()

            expect(newAdapter).toBeInstanceOf(AdSenseAdapter)
            expect(newAdapter.id).toBe('adsense')
            expect(newAdapter.name).toBe('Google AdSense')
        })
    })
})
