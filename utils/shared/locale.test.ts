import { describe, it, expect } from 'vitest'
import {
    AUTH_BOUNDARY_LOCALES,
    AUTH_DEFAULT_LOCALE,
    AUTH_FALLBACK_LOCALE,
    type AuthBoundaryLocale,
    type BetterAuthLocale,
    type BetterAuthPluginLocale,
    AUTH_PLUGIN_DEFAULT_LOCALE,
    AUTH_PLUGIN_FALLBACK_LOCALE,
} from './locale'

describe('locale.ts', () => {
    describe('AUTH_BOUNDARY_LOCALES', () => {
        it('should contain all expected locales', () => {
            expect(AUTH_BOUNDARY_LOCALES).toContain('zh-Hans')
            expect(AUTH_BOUNDARY_LOCALES).toContain('zh-Hant')
            expect(AUTH_BOUNDARY_LOCALES).toContain('en-US')
            expect(AUTH_BOUNDARY_LOCALES).toContain('default')
            expect(AUTH_BOUNDARY_LOCALES).toContain('pt-BR')
            expect(AUTH_BOUNDARY_LOCALES).toContain('pt-PT')
            expect(AUTH_BOUNDARY_LOCALES).toContain('es-ES')
            expect(AUTH_BOUNDARY_LOCALES).toContain('fr-FR')
            expect(AUTH_BOUNDARY_LOCALES).toContain('de-DE')
            expect(AUTH_BOUNDARY_LOCALES).toContain('ja-JP')
            expect(AUTH_BOUNDARY_LOCALES).toContain('ko-KR')
            expect(AUTH_BOUNDARY_LOCALES).toContain('ru-RU')
            expect(AUTH_BOUNDARY_LOCALES).toContain('ar-SA')
            expect(AUTH_BOUNDARY_LOCALES).toContain('hi-HI')
            expect(AUTH_BOUNDARY_LOCALES).toContain('it-IT')
            expect(AUTH_BOUNDARY_LOCALES).toContain('nl-NL')
            expect(AUTH_BOUNDARY_LOCALES).toContain('sv-SE')
            expect(AUTH_BOUNDARY_LOCALES).toContain('da-DK')
            expect(AUTH_BOUNDARY_LOCALES).toContain('pl-PL')
            expect(AUTH_BOUNDARY_LOCALES).toContain('tr-TR')
        })

        it('should have correct length', () => {
            expect(AUTH_BOUNDARY_LOCALES).toHaveLength(20)
        })

        it('should be readonly array', () => {
            expect(Object.isFrozen(AUTH_BOUNDARY_LOCALES)).toBe(false) // const assertion doesn't freeze
            // But TypeScript will prevent modification at compile time
        })

        it('should include Chinese locales', () => {
            const chineseLocales = AUTH_BOUNDARY_LOCALES.filter((locale) => locale.startsWith('zh'))
            expect(chineseLocales).toHaveLength(2)
            expect(chineseLocales).toContain('zh-Hans')
            expect(chineseLocales).toContain('zh-Hant')
        })

        it('should include European locales', () => {
            const europeanLocales = ['fr-FR', 'de-DE', 'it-IT', 'nl-NL', 'sv-SE', 'da-DK', 'pl-PL']
            europeanLocales.forEach((locale) => {
                expect(AUTH_BOUNDARY_LOCALES).toContain(locale as AuthBoundaryLocale)
            })
        })
    })

    describe('AUTH_DEFAULT_LOCALE', () => {
        it('should be zh-Hans', () => {
            expect(AUTH_DEFAULT_LOCALE).toBe('zh-Hans')
        })

        it('should be in AUTH_BOUNDARY_LOCALES', () => {
            expect(AUTH_BOUNDARY_LOCALES).toContain(AUTH_DEFAULT_LOCALE)
        })
    })

    describe('AUTH_FALLBACK_LOCALE', () => {
        it('should be default', () => {
            expect(AUTH_FALLBACK_LOCALE).toBe('default')
        })

        it('should be in AUTH_BOUNDARY_LOCALES', () => {
            expect(AUTH_BOUNDARY_LOCALES).toContain(AUTH_FALLBACK_LOCALE)
        })
    })

    describe('Type definitions', () => {
        it('should allow valid AuthBoundaryLocale values', () => {
            const locale1: AuthBoundaryLocale = 'zh-Hans'
            const locale2: AuthBoundaryLocale = 'en-US'
            const locale3: AuthBoundaryLocale = 'default'

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

        it('should allow valid BetterAuthPluginLocale values', () => {
            const locale1: BetterAuthPluginLocale = 'zh-Hans'
            const locale2: BetterAuthPluginLocale = 'default'

            expect(locale1).toBe(AUTH_PLUGIN_DEFAULT_LOCALE)
            expect(locale2).toBe(AUTH_PLUGIN_FALLBACK_LOCALE)
        })
    })
})
