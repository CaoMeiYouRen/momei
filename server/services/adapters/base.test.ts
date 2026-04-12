import { describe, expect, it } from 'vitest'
import { AdError, BaseAdAdapter } from './base'

class TestAdapter extends BaseAdAdapter {
    override async verifyCredentials() {
        return true
    }

    override getScript() {
        return '<script></script>'
    }

    override getPlacementHtml() {
        return '<div>ad</div>'
    }

    exposeEscapeHtml(value: string) {
        return this.escapeHtml(value)
    }
}

describe('AdError', () => {
    it('sets name and optional code', () => {
        const error = new AdError('boom', 'E_AD')

        expect(error.name).toBe('AdError')
        expect(error.message).toBe('boom')
        expect(error.code).toBe('E_AD')
    })
})

describe('BaseAdAdapter', () => {
    it('initializes config and returns it back', async () => {
        const adapter = new TestAdapter('test', 'Test Adapter', ['zh-CN'])

        await adapter.initialize({ token: 'abc' })

        expect(adapter.getConfig()).toEqual({ token: 'abc' })
    })

    it('supports wildcard and explicit locales', () => {
        const wildcardAdapter = new TestAdapter('wild', 'Wildcard')
        const localeAdapter = new TestAdapter('locale', 'Locale', ['zh-CN', 'en-US'])

        expect(wildcardAdapter.supportsLocale('ja-JP')).toBe(true)
        expect(localeAdapter.supportsLocale('zh-CN')).toBe(true)
        expect(localeAdapter.supportsLocale('ko-KR')).toBe(false)
    })

    it('escapes html special characters', () => {
        const adapter = new TestAdapter('test', 'Test')

        expect(adapter.exposeEscapeHtml(`<div class="x">Tom & 'Jerry'</div>`)).toBe(
            '&lt;div class=&quot;x&quot;&gt;Tom &amp; &#039;Jerry&#039;&lt;/div&gt;',
        )
    })
})
