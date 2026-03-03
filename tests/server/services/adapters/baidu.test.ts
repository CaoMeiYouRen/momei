import { describe, it, expect, beforeEach } from 'vitest'
import { BaiduAdapter, createBaiduAdapter } from '@/server/services/adapters/baidu'
import { AdPlacement } from '@/server/entities/ad-placement'
import { AdError } from '@/server/services/adapters/base'

describe('Baidu Adapter', () => {
    let adapter: BaiduAdapter

    beforeEach(() => {
        adapter = new BaiduAdapter('baidu', '百度联盟', ['zh-CN'])
    })

    describe('properties', () => {
        it('should have correct id', () => {
            expect(adapter.id).toBe('baidu')
        })

        it('should have correct name', () => {
            expect(adapter.name).toBe('百度联盟')
        })

        it('should support Chinese locale', () => {
            expect(adapter.supportedLocales).toContain('zh-CN')
        })
    })

    describe('initialize', () => {
        it('should initialize with valid config', async () => {
            const config = {
                slotId: 'u123456',
            }

            await expect(adapter.initialize(config)).resolves.not.toThrow()
            expect(adapter.getConfig()).toEqual(config)
        })

        it('should throw error without slotId', async () => {
            const config = {}

            await expect(adapter.initialize(config)).rejects.toThrow(AdError)
            await expect(adapter.initialize(config)).rejects.toThrow('Baidu slot ID is required')
        })

        it('should throw error with empty slotId', async () => {
            const config = {
                slotId: '',
            }

            await expect(adapter.initialize(config)).rejects.toThrow(AdError)
            await expect(adapter.initialize(config)).rejects.toThrow('Baidu slot ID is required')
        })
    })

    describe('verifyCredentials', () => {
        it('should return true when slotId is configured', async () => {
            await adapter.initialize({ slotId: 'u123456' })

            const result = await adapter.verifyCredentials()

            expect(result).toBe(true)
        })

        it('should return false when slotId is not configured', async () => {
            const result = await adapter.verifyCredentials()

            expect(result).toBe(false)
        })
    })

    describe('getScript', () => {
        it('should return Baidu union script', () => {
            const script = adapter.getScript()

            expect(script).toContain('cpro.baidustatic.com')
            expect(script).toContain('c.js')
            expect(script).toContain('<script')
        })
    })

    describe('getPlacementHtml', () => {
        let placement: AdPlacement

        beforeEach(() => {
            placement = new AdPlacement()
            placement.name = 'Test Sidebar Ad'
            placement.adapterId = 'baidu'
            placement.enabled = true
            placement.priority = 10
        })

        it('should generate valid Baidu ad HTML with slotId in metadata', async () => {
            placement.metadata = {
                slotId: 'u123456',
                width: 300,
                height: 250,
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('u123456')
            expect(html).toContain('300*250')
            expect(html).toContain('slotbydup')
        })

        it('should use config slotId when metadata slotId is missing', async () => {
            await adapter.initialize({ slotId: 'u789012' })
            placement.metadata = {
                width: 728,
                height: 90,
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('u789012')
            expect(html).toContain('728*90')
        })

        it('should throw error when no slotId is available', async () => {
            placement.metadata = {
                width: 300,
                height: 250,
            }

            expect(() => adapter.getPlacementHtml(placement)).toThrow(AdError)
            expect(() => adapter.getPlacementHtml(placement)).toThrow('Baidu slot ID is required')
        })

        it('should throw error when metadata is missing', () => {
            placement.metadata = undefined

            expect(() => adapter.getPlacementHtml(placement)).toThrow(AdError)
            expect(() => adapter.getPlacementHtml(placement)).toThrow('Ad placement metadata is required')
        })

        it('should use default dimensions when not specified', async () => {
            await adapter.initialize({ slotId: 'u123456' })
            placement.metadata = {
                slotId: 'u123456',
            }

            const html = adapter.getPlacementHtml(placement)

            expect(html).toContain('300*250')
        })
    })

    describe('getAdUnitConfig', () => {
        it('should return ad unit configuration', async () => {
            await adapter.initialize({ slotId: 'u123456' })

            const config = adapter.getAdUnitConfig('u123456', 300, 250)

            expect(config).toEqual({
                slotId: 'u123456',
                width: 300,
                height: 250,
                adapterId: 'baidu',
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

    describe('createBaiduAdapter factory', () => {
        it('should create adapter with config', () => {
            const config = { slotId: 'u123456' }
            const newAdapter = createBaiduAdapter(config)

            expect(newAdapter).toBeInstanceOf(BaiduAdapter)
            expect(newAdapter.id).toBe('baidu')
        })

        it('should create adapter without config', () => {
            const newAdapter = createBaiduAdapter()

            expect(newAdapter).toBeInstanceOf(BaiduAdapter)
            expect(newAdapter.id).toBe('baidu')
        })
    })
})
