import { describe, expect, it } from 'vitest'
import { EMAIL_SUPPORTED_LOCALES, resolveEmailLocale } from './index'

describe('email locale registry', () => {
    it('should accept newly introduced ui-ready locales', () => {
        expect(resolveEmailLocale('zh-TW')).toBe('zh-TW')
        expect(resolveEmailLocale('ko-KR')).toBe('ko-KR')
    })

    it('should fallback to default email locale for unsupported locales', () => {
        expect(resolveEmailLocale('fr-FR')).toBe('zh-CN')
        expect(resolveEmailLocale()).toBe('zh-CN')
    })

    it('should provide dedicated locale packs for zh-TW and ko-KR', () => {
        expect(EMAIL_SUPPORTED_LOCALES['zh-TW']).not.toBe(EMAIL_SUPPORTED_LOCALES['zh-CN'])
        expect(EMAIL_SUPPORTED_LOCALES['ko-KR']).not.toBe(EMAIL_SUPPORTED_LOCALES['en-US'])

        expect(EMAIL_SUPPORTED_LOCALES['zh-TW'].verification.title).toContain('電子郵件地址')
        expect(EMAIL_SUPPORTED_LOCALES['ko-KR'].verification.title).toContain('이메일 주소')
    })
})
