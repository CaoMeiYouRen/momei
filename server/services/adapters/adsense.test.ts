import { describe, expect, it } from 'vitest'
import { AdError } from './base'
import { AdSenseAdapter, createAdSenseAdapter } from './adsense'

describe('AdSenseAdapter', () => {
    it('validates and stores a correct client id', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])

        await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

        await expect(adapter.verifyCredentials()).resolves.toBe(true)
        expect(adapter.getConfig()).toEqual({ clientId: 'ca-pub-1234567890123456' })
    })

    it('rejects missing client id', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])

        await expect(adapter.initialize({ clientId: '' })).rejects.toThrowError(new AdError('AdSense Client ID is required'))
    })

    it('rejects invalid client id format', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])

        await expect(adapter.initialize({ clientId: 'pub-123' })).rejects.toThrow('Invalid AdSense Client ID format')
    })

    it('renders script html with configured client id', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])
        await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

        expect(adapter.getScript()).toContain('client=ca-pub-1234567890123456')
        expect(adapter.getScript()).toContain('adsbygoogle.js')
    })

    it('throws when placement metadata is missing', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])
        await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

        expect(() => adapter.getPlacementHtml({ metadata: null } as never)).toThrow('Ad placement metadata is required for AdSense')
    })

    it('throws when slot id is missing', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])
        await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

        expect(() => adapter.getPlacementHtml({ metadata: {} } as never)).toThrow('AdSense slot ID is required in placement metadata')
    })

    it('renders responsive placement html by default', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])
        await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

        const html = adapter.getPlacementHtml({
            metadata: { slot: '9876543210' },
        } as never)

        expect(html).toContain('display:block')
        expect(html).toContain('data-ad-slot="9876543210"')
        expect(html).toContain('data-ad-format="responsive"')
    })

    it('renders auto format placement and exposes ad unit config', async () => {
        const adapter = new AdSenseAdapter('adsense', 'Google AdSense', ['*'])
        await adapter.initialize({ clientId: 'ca-pub-1234567890123456' })

        const html = adapter.getPlacementHtml({
            metadata: { slot: '1234', format: 'auto' },
        } as never)

        expect(html).toContain('data-ad-format="auto"')
        expect(adapter.getAdUnitConfig('1234')).toEqual({
            clientId: 'ca-pub-1234567890123456',
            slot: '1234',
        })
    })
})

describe('createAdSenseAdapter', () => {
    it('creates adapter with built-in metadata', () => {
        const adapter = createAdSenseAdapter()

        expect(adapter).toBeInstanceOf(AdSenseAdapter)
        expect(adapter.id).toBe('adsense')
        expect(adapter.name).toBe('Google AdSense')
        expect(adapter.supportedLocales).toEqual(['*'])
    })
})
