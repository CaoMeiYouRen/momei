import { describe, it, expect, beforeEach } from 'vitest'
import { TencentAdapter, createTencentAdapter } from '@/server/services/adapters/tencent'
import { AdPlacement } from '@/server/entities/ad-placement'
import { AdError } from '@/server/services/adapters/base'

describe('Tencent Adapter', () => {
    let adapter: TencentAdapter

    beforeEach(() => {
        adapter = new TencentAdapter('tencent', '腾讯广告 (广点通)', ['zh-CN'])
    })

    describe('properties', () => {
        it('should have correct id', () => {
            expect(adapter.id).toBe('tencent')
        })

        it('should have correct name', () => {
            expect(adapter.name).toBe('腾讯广告 (广点通)')
        })

        it('should support Chinese locale', () => {
            expect(adapter.supportedLocales).toContain('zh-CN')
        })
    })

    describe('initialize', () => {
        it('should initialize with valid config', async () => {
            const config = {
                appId: '1234567890',
                placementId: 'placement_123',
            }

            await expect(adapter.initialize(config)).resolves.not.toThrow()
            expect(adapter.getConfig()).toEqual(config)
        })

        it('should throw error without appId', async () => {
            const config = {}

            await expect(adapter.initialize(config)).rejects.toThrow(AdError)
            await expect(adapter.initialize(config)).rejects.toThrow('Tencent App ID is required')
        })

        it('should throw error with invalid appId format', async () => {
            const config = {
                appId: 'invalid',
            }

            await expect(adapter.initialize(config)).rejects.toThrow(AdError)
            await expect(adapter.initialize(config)).rejects.toThrow('Invalid Tencent App ID format')
        })
    })

    describe('verifyCredentials', () => {
        it('should return true when appId is configured', async () => {
            await adapter.initialize({ appId: '1234567890' })

            const result = await adapter.verifyCredentials()

            expect(result).toBe(true)
        })

        it('should return false when appId is not configured', async () => {
            const result = await adapter.verifyCredentials()

            expect(result).toBe(false)
        })
    })

    describe('getScript', () => {
        it('should return Tencent ad SDK script', async () => {
            await adapter.initialize({ appId: '1234567890' })

            const script = adapter.getScript()

            expect(script).toContain('TencentGDT')
            expect(script).toContain('app_id')
            expect(script).toContain('1234567890')
            expect(script).toContain('qzs.qq.com')
        })
    })

    describe('getPlacementHtml', () => {
        let placement: AdPlacement

        beforeEach(() => {
            placement = new AdPlacement()
            placement.name = 'Test Banner Ad'
            placement.adapterId = 'tencent'
            placement.enabled = true
            placement.priority = 10
        })

        it('should generate banner ad HTML with placementId in metadata', async () => {
            await adapter.initialize({ appId: '1234567890' })
            placement.metadata = {
                placementId: 'placement_123',
                width: 300,
                height: 250,
                adType: 'banner',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('placement_123')
            expect(html).toContain('300px')
            expect(html).toContain('250px')
            expect(html).toContain('TencentGDT')
        })

        it('should generate native ad HTML', async () => {
            await adapter.initialize({ appId: '1234567890' })
            placement.metadata = {
                placementId: 'placement_456',
                adType: 'native',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('placement_456')
            expect(html).toContain('tencent-native-ad')
            expect(html).toContain('type: \'native\'')
        })

        it('should use config placementId when metadata placementId is missing', async () => {
            await adapter.initialize({ appId: '1234567890', placementId: 'placement_default' })
            placement.metadata = {
                width: 728,
                height: 90,
                adType: 'banner',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('placement_default')
        })

        it('should throw error when no placementId is available', async () => {
            await adapter.initialize({ appId: '1234567890' })
            placement.metadata = {
                width: 300,
                height: 250,
                adType: 'banner',
            }

            expect(() => adapter.getPlacementHtml(placement)).toThrow(AdError)
            expect(() => adapter.getPlacementHtml(placement)).toThrow('Tencent placement ID is required')
        })

        it('should throw error when metadata is missing', () => {
            placement.metadata = null

            expect(() => adapter.getPlacementHtml(placement)).toThrow(AdError)
            expect(() => adapter.getPlacementHtml(placement)).toThrow('Ad placement metadata is required')
        })

        it('should use default dimensions when not specified', async () => {
            await adapter.initialize({ appId: '1234567890', placementId: 'placement_123' })
            placement.metadata = {
                adType: 'banner',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('300px')
            expect(html).toContain('250px')
        })
    })

    describe('getAdUnitConfig', () => {
        it('should return ad unit configuration', async () => {
            await adapter.initialize({ appId: '1234567890' })

            const config = adapter.getAdUnitConfig('placement_123', 300, 250)

            expect(config).toEqual({
                appId: '1234567890',
                placementId: 'placement_123',
                width: 300,
                height: 250,
                adapterId: 'tencent',
            })
        })
    })

    describe('supportsLocale', () => {
        it('should support Chinese locale', () => {
            expect(adapter.supportsLocale('zh-CN')).toBe(true)
        })

        it('should not support unsupported locales', () => {
            expect(adapter.supportsLocale('en-US')).toBe(false)
        })
    })

    describe('createTencentAdapter factory', () => {
        it('should create adapter with config', () => {
            const config = { appId: '1234567890' }
            const newAdapter = createTencentAdapter(config)

            expect(newAdapter).toBeInstanceOf(TencentAdapter)
            expect(newAdapter.id).toBe('tencent')
        })

        it('should create adapter without config', () => {
            const newAdapter = createTencentAdapter()

            expect(newAdapter).toBeInstanceOf(TencentAdapter)
            expect(newAdapter.id).toBe('tencent')
        })
    })
})
