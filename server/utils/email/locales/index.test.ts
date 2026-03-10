import { describe, expect, it } from 'vitest'
import { resolveEmailLocale } from './index'

describe('email locale registry', () => {
    it('should accept newly introduced ui-ready locales', () => {
        expect(resolveEmailLocale('zh-TW')).toBe('zh-TW')
        expect(resolveEmailLocale('ko-KR')).toBe('ko-KR')
    })

    it('should fallback to default email locale for unsupported locales', () => {
        expect(resolveEmailLocale('fr-FR')).toBe('zh-CN')
        expect(resolveEmailLocale()).toBe('zh-CN')
    })
})
