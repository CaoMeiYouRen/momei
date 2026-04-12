import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdSenseAdapterMock, createBaiduAdapterMock, createTencentAdapterMock } = vi.hoisted(() => ({
    createAdSenseAdapterMock: vi.fn(),
    createBaiduAdapterMock: vi.fn(),
    createTencentAdapterMock: vi.fn(),
}))

function createAdapter(id: string, name: string, supportedLocales: string[]) {
    let storedConfig: Record<string, unknown> = {}
    return {
        id,
        name,
        supportedLocales,
        initialize: vi.fn((config: Record<string, unknown>) => {
            storedConfig = config
        }),
        verifyCredentials: vi.fn(() => true),
        getScript: vi.fn(() => '<script></script>'),
        getPlacementHtml: vi.fn(() => '<div></div>'),
        getConfig: vi.fn(() => storedConfig),
        supportsLocale: vi.fn((locale: string) => supportedLocales.includes('*') || supportedLocales.includes(locale)),
    }
}

vi.mock('./adsense', () => ({
    createAdSenseAdapter: createAdSenseAdapterMock,
}))

vi.mock('./baidu', () => ({
    createBaiduAdapter: createBaiduAdapterMock,
}))

vi.mock('./tencent', () => ({
    createTencentAdapter: createTencentAdapterMock,
}))

describe('AdAdapterFactory and registry', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        createAdSenseAdapterMock.mockReturnValue(createAdapter('adsense', 'AdSense', ['*']))
        createBaiduAdapterMock.mockReturnValue(createAdapter('baidu', 'Baidu', ['zh-CN']))
        createTencentAdapterMock.mockReturnValue(createAdapter('tencent', 'Tencent', ['zh-CN', 'en-US']))
    })

    it('creates initialized adapter instance without sharing state', async () => {
        const { AdAdapterFactory } = await import('./index')

        const adapter = await AdAdapterFactory.create('adsense', { clientId: 'ca-pub-1' }) as unknown as { getConfig: () => { clientId: string }, name: string }

        expect(adapter.name).toBe('AdSense')
        expect(adapter.getConfig()).toEqual({ clientId: 'ca-pub-1' })
    })

    it('throws when adapter id does not exist', async () => {
        const { AdAdapterFactory } = await import('./index')

        await expect(AdAdapterFactory.create('missing', {})).rejects.toThrow('Ad adapter \'missing\' not found')
    })

    it('lists available adapters', async () => {
        const { AdAdapterFactory } = await import('./index')

        expect(AdAdapterFactory.getAvailableAdapters()).toEqual([
            { id: 'adsense', name: 'AdSense', supportedLocales: ['*'] },
            { id: 'baidu', name: 'Baidu', supportedLocales: ['zh-CN'] },
            { id: 'tencent', name: 'Tencent', supportedLocales: ['zh-CN', 'en-US'] },
        ])
    })

    it('checks locale support through the registry', async () => {
        const { AdAdapterFactory } = await import('./index')

        expect(AdAdapterFactory.supportsLocale('tencent', 'en-US')).toBe(true)
        expect(AdAdapterFactory.supportsLocale('baidu', 'en-US')).toBe(false)
        expect(AdAdapterFactory.supportsLocale('missing', 'zh-CN')).toBe(false)
    })
})
