import { describe, expect, it, vi } from 'vitest'
import { getLocale } from '../../../server/utils/i18n'

const { detectRequestAuthLocale, mapAuthLocaleToAppLocale, resolveAppLocaleCode } = vi.hoisted(() => ({
    detectRequestAuthLocale: vi.fn(() => 'en-US'),
    mapAuthLocaleToAppLocale: vi.fn((locale: string) => locale),
    resolveAppLocaleCode: vi.fn((locale: string) => locale),
}))

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')

    return {
        ...actual,
        defineEventHandler: (handler: unknown) => handler,
    }
})

vi.mock('../../../server/utils/locale', () => ({
    AUTH_DEFAULT_LOCALE: 'zh-CN',
    detectRequestAuthLocale,
    mapAuthLocaleToAppLocale,
}))

vi.mock('@/i18n/config/locale-registry', () => ({
    resolveAppLocaleCode,
}))

const { default: i18nMiddleware } = await import('../../../server/middleware/i18n')

describe('server/middleware/i18n', () => {
    it('把请求语言写入 event.context.locale', () => {
        const event = { context: {}, path: '/posts/hello' } as unknown as Parameters<typeof i18nMiddleware>[0]

        i18nMiddleware(event)

        expect(detectRequestAuthLocale).toHaveBeenCalledWith(event)
        expect(mapAuthLocaleToAppLocale).toHaveBeenCalledWith('en-US')
        expect(resolveAppLocaleCode).toHaveBeenCalledWith('en-US')
        expect((event.context as { locale?: string }).locale).toBe('en-US')
    })

    it('跳过内部构建产物与 favicon 请求', () => {
        for (const path of ['/_nuxt/entry.js', '/favicon.ico']) {
            const event = { context: {}, path } as unknown as Parameters<typeof i18nMiddleware>[0]

            i18nMiddleware(event)

            expect((event.context as { locale?: string }).locale).toBeUndefined()
        }
    })

    it('不向 AsyncLocalStorage 注入请求上下文，getLocale() 仍按既有口径回退', () => {
        const event = { context: {}, path: '/posts/hello' } as unknown as Parameters<typeof i18nMiddleware>[0]

        i18nMiddleware(event)

        expect((event.context as { locale?: string }).locale).toBe('en-US')
        expect(getLocale()).toBe('zh-CN')
    })
})
