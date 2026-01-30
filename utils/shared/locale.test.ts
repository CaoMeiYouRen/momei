import { describe, it, expect } from 'vitest'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE, type SupportedLocale, type BetterAuthLocale } from './locale'

describe('locale.ts', () => {
    describe('SUPPORTED_LOCALES', () => {
        it('should contain all expected locales', () => {
            expect(SUPPORTED_LOCALES).toContain('zh-Hans')
            expect(SUPPORTED_LOCALES).toContain('zh-Hant')
            expect(SUPPORTED_LOCALES).toContain('en-US')
            expect(SUPPORTED_LOCALES).toContain('default')
            expect(SUPPORTED_LOCALES).toContain('pt-BR')
            expect(SUPPORTED_LOCALES).toContain('pt-PT')
            expect(SUPPORTED_LOCALES).toContain('es-ES')
            expect(SUPPORTED_LOCALES).toContain('fr-FR')
            expect(SUPPORTED_LOCALES).toContain('de-DE')
            expect(SUPPORTED_LOCALES).toContain('ja-JP')
            expect(SUPPORTED_LOCALES).toContain('ko-KR')
            expect(SUPPORTED_LOCALES).toContain('ru-RU')
            expect(SUPPORTED_LOCALES).toContain('ar-SA')
            expect(SUPPORTED_LOCALES).toContain('hi-HI')
            expect(SUPPORTED_LOCALES).toContain('it-IT')
            expect(SUPPORTED_LOCALES).toContain('nl-NL')
            expect(SUPPORTED_LOCALES).toContain('sv-SE')
            expect(SUPPORTED_LOCALES).toContain('da-DK')
            expect(SUPPORTED_LOCALES).toContain('pl-PL')
            expect(SUPPORTED_LOCALES).toContain('tr-TR')
        })

        it('should have correct length', () => {
            expect(SUPPORTED_LOCALES).toHaveLength(20)
        })

        it('should be readonly array', () => {
            expect(Object.isFrozen(SUPPORTED_LOCALES)).toBe(false) // const assertion doesn't freeze
            // But TypeScript will prevent modification at compile time
        })

        it('should include Chinese locales', () => {
            const chineseLocales = SUPPORTED_LOCALES.filter((locale) => locale.startsWith('zh'))
            expect(chineseLocales).toHaveLength(2)
            expect(chineseLocales).toContain('zh-Hans')
            expect(chineseLocales).toContain('zh-Hant')
        })

        it('should include European locales', () => {
            const europeanLocales = ['fr-FR', 'de-DE', 'it-IT', 'nl-NL', 'sv-SE', 'da-DK', 'pl-PL']
            europeanLocales.forEach((locale) => {
                expect(SUPPORTED_LOCALES).toContain(locale as SupportedLocale)
            })
        })
    })

    describe('DEFAULT_LOCALE', () => {
        it('should be zh-Hans', () => {
            expect(DEFAULT_LOCALE).toBe('zh-Hans')
        })

        it('should be in SUPPORTED_LOCALES', () => {
            expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE)
        })
    })

    describe('FALLBACK_LOCALE', () => {
        it('should be default', () => {
            expect(FALLBACK_LOCALE).toBe('default')
        })

        it('should be in SUPPORTED_LOCALES', () => {
            expect(SUPPORTED_LOCALES).toContain(FALLBACK_LOCALE)
        })
    })

    describe('Type definitions', () => {
        it('should allow valid SupportedLocale values', () => {
            const locale1: SupportedLocale = 'zh-Hans'
            const locale2: SupportedLocale = 'en-US'
            const locale3: SupportedLocale = 'default'

            expect(locale1).toBe('zh-Hans')
            expect(locale2).toBe('en-US')
            expect(locale3).toBe('default')
        })

        it('should allow valid BetterAuthLocale values', () => {
            const locale1: BetterAuthLocale = 'zh-Hans'
            const locale2: BetterAuthLocale = 'en-US'

            expect(locale1).toBe('zh-Hans')
            expect(locale2).toBe('en-US')
        })
    })
})
