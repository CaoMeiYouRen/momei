import { describe, expect, it, vi } from 'vitest'
import { ensureLocaleMessageModules, ensureRouteLocaleMessages } from './locale-runtime-loader'

describe('i18n locale runtime loader', () => {
    it('should progressively load route modules for locale fallback chain', async () => {
        const mergeLocaleMessage = vi.fn()

        await ensureRouteLocaleMessages({
            i18n: { mergeLocaleMessage },
            locale: 'en-US',
            path: '/en-US/login',
        })

        expect(mergeLocaleMessage).toHaveBeenCalledTimes(2)
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            1,
            'en-US',
            expect.objectContaining({
                pages: expect.objectContaining({
                    login: expect.any(Object),
                }),
            }),
        )
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            2,
            'zh-CN',
            expect.objectContaining({
                pages: expect.objectContaining({
                    login: expect.any(Object),
                }),
            }),
        )
    })

    it('should load explicitly requested locale modules for locale fallback chain', async () => {
        const mergeLocaleMessage = vi.fn()

        await ensureLocaleMessageModules({
            i18n: { mergeLocaleMessage },
            locale: 'en-US',
            modules: ['auth', 'admin'],
        })

        expect(mergeLocaleMessage).toHaveBeenCalledTimes(4)
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            1,
            'en-US',
            expect.objectContaining({
                pages: expect.objectContaining({
                    login: expect.any(Object),
                }),
            }),
        )
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            2,
            'en-US',
            expect.objectContaining({
                pages: expect.objectContaining({
                    admin: expect.any(Object),
                }),
            }),
        )
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            3,
            'zh-CN',
            expect.objectContaining({
                pages: expect.objectContaining({
                    login: expect.any(Object),
                }),
            }),
        )
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            4,
            'zh-CN',
            expect.objectContaining({
                pages: expect.objectContaining({
                    admin: expect.any(Object),
                }),
            }),
        )
    })

    it('should avoid reloading the same modules for the same i18n instance', async () => {
        const mergeLocaleMessage = vi.fn()
        const i18n = { mergeLocaleMessage }

        await ensureRouteLocaleMessages({
            i18n,
            locale: 'en-US',
            path: '/',
            demoMode: true,
        })

        expect(mergeLocaleMessage).toHaveBeenCalledTimes(4)
        mergeLocaleMessage.mockClear()

        await ensureRouteLocaleMessages({
            i18n,
            locale: 'en-US',
            path: '/',
            demoMode: true,
        })

        expect(mergeLocaleMessage).not.toHaveBeenCalled()
    })

    it('should avoid reloading explicitly requested modules for the same i18n instance', async () => {
        const mergeLocaleMessage = vi.fn()
        const i18n = { mergeLocaleMessage }

        await ensureLocaleMessageModules({
            i18n,
            locale: 'en-US',
            modules: ['auth', 'admin'],
        })

        expect(mergeLocaleMessage).toHaveBeenCalledTimes(4)
        mergeLocaleMessage.mockClear()

        await ensureLocaleMessageModules({
            i18n,
            locale: 'en-US',
            modules: ['auth', 'admin'],
        })

        expect(mergeLocaleMessage).not.toHaveBeenCalled()
    })

    it('should support composers exposed via i18n.global', async () => {
        const mergeLocaleMessage = vi.fn()

        await ensureRouteLocaleMessages({
            i18n: {
                global: { mergeLocaleMessage },
            },
            locale: 'zh-CN',
            path: '/installation',
        })

        expect(mergeLocaleMessage).toHaveBeenCalledTimes(2)
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            1,
            'zh-CN',
            expect.objectContaining({
                pages: expect.objectContaining({
                    admin: expect.any(Object),
                }),
            }),
        )
        expect(mergeLocaleMessage).toHaveBeenNthCalledWith(
            2,
            'zh-CN',
            expect.objectContaining({
                installation: expect.any(Object),
            }),
        )
    })

    it('should safely noop when no composer is available', async () => {
        await expect(ensureRouteLocaleMessages({
            i18n: {},
            locale: 'en-US',
            path: '/admin',
        })).resolves.toBeUndefined()
    })
})
