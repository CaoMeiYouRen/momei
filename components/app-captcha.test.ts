import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppCaptcha from './app-captcha.vue'

const { runtimeConfigState, routerState, routeState } = vi.hoisted(() => ({
    runtimeConfigState: {
        app: {
            baseURL: '/',
        },
        public: {
            authCaptcha: {
                provider: undefined as 'cloudflare-turnstile' | 'google-recaptcha' | 'hcaptcha' | 'captchafox' | undefined,
                siteKey: undefined as string | undefined,
            },
        },
    },
    routerState: {
        push: vi.fn(() => Promise.resolve(undefined)),
        replace: vi.fn(() => Promise.resolve(undefined)),
        afterEach: vi.fn(),
        beforeEach: vi.fn(),
        beforeResolve: vi.fn(),
        onError: vi.fn(),
        currentRoute: { value: undefined as any },
    },
    routeState: {
        path: '/',
        fullPath: '/',
        query: {},
        params: {},
        name: 'index',
        meta: {},
        hash: '',
        matched: [],
    },
}))

mockNuxtImport('useRuntimeConfig', () => () => runtimeConfigState)
mockNuxtImport('useRouter', () => () => routerState)
mockNuxtImport('useRoute', () => () => routeState)

function callExposedReset(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
    const rootInstance = (wrapper.vm).$
    const reset = rootInstance?.exposed?.reset
        ?? rootInstance?.subTree?.component?.exposed?.reset
        ?? rootInstance?.subTree?.component?.subTree?.component?.exposed?.reset
    reset?.()
}

function setCaptchaConfig(provider?: 'cloudflare-turnstile' | 'google-recaptcha' | 'hcaptcha' | 'captchafox', siteKey = 'site-key') {
    runtimeConfigState.public.authCaptcha = provider
        ? { provider, siteKey }
        : { provider: undefined, siteKey: undefined }
}

describe('AppCaptcha', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        setCaptchaConfig()
        Object.assign(routeState, {
            path: '/',
            fullPath: '/',
            query: {},
            params: {},
            name: 'index',
            meta: {},
            hash: '',
            matched: [],
        })
        routerState.currentRoute.value = routeState
        document.head.querySelectorAll('script').forEach((script) => script.remove())
        delete (window as any).turnstile
        delete (window as any).grecaptcha
        delete (window as any).hcaptcha
        delete (window as any).captchafox
    })

    it('renders nothing when captcha provider is not configured', async () => {
        const wrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        expect(wrapper.find('.app-captcha').exists()).toBe(false)
    })

    it('renders and controls a cloudflare turnstile widget', async () => {
        setCaptchaConfig('cloudflare-turnstile')

        let verifyCallback: ((token: string) => void) | undefined
        let expireCallback: (() => void) | undefined
        let errorCallback: ((error: unknown) => void) | undefined
        const removeMock = vi.fn()
        const resetMock = vi.fn()

        ;(window as any).turnstile = {
            render: vi.fn((_el: HTMLElement, options: Record<string, any>) => {
                verifyCallback = options.callback
                expireCallback = options['expired-callback']
                errorCallback = options['error-callback']
                return 'cf-widget'
            }),
            reset: resetMock,
            remove: removeMock,
        }

        const wrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        expect((window as any).turnstile.render).toHaveBeenCalledTimes(1)
        verifyCallback?.('token-123')
        expireCallback?.()
        errorCallback?.(new Error('network'))

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['token-123'])
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([''])
        expect(wrapper.emitted('expire')).toHaveLength(1)
        expect(wrapper.emitted('error')?.[0]?.[0]).toBeInstanceOf(Error)

        callExposedReset(wrapper)
        expect(resetMock).toHaveBeenCalledWith('cf-widget')

        wrapper.unmount()
        expect(removeMock).toHaveBeenCalledWith('cf-widget')
    })

    it('renders and resets a google recaptcha widget after ready callback', async () => {
        setCaptchaConfig('google-recaptcha')

        let verifyCallback: ((token: string) => void) | undefined
        let expireCallback: (() => void) | undefined
        let errorCallback: ((error: unknown) => void) | undefined
        const resetMock = vi.fn()

        ;(window as any).grecaptcha = {
            ready: (callback: () => void) => callback(),
            render: vi.fn((_el: HTMLElement, options: Record<string, any>) => {
                verifyCallback = options.callback
                expireCallback = options['expired-callback']
                errorCallback = options['error-callback']
                return 7
            }),
            reset: resetMock,
        }

        const wrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        expect((window as any).grecaptcha.render).toHaveBeenCalledTimes(1)
        verifyCallback?.('google-token')
        expireCallback?.()
        errorCallback?.('captcha failed')

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['google-token'])
        expect(wrapper.emitted('expire')).toHaveLength(1)
        expect(wrapper.emitted('error')?.[0]).toEqual(['captcha failed'])

        callExposedReset(wrapper)
        expect(resetMock).toHaveBeenCalledWith(7)
    })

    it('renders hcaptcha and captchafox widgets and forwards their reset hooks', async () => {
        setCaptchaConfig('hcaptcha')

        const hcaptchaResetMock = vi.fn()
        const hcaptchaRemoveMock = vi.fn()
        let hcaptchaVerify: ((token: string) => void) | undefined

        ;(window as any).hcaptcha = {
            render: vi.fn((_el: HTMLElement, options: Record<string, any>) => {
                hcaptchaVerify = options.callback
                return 'hc-widget'
            }),
            reset: hcaptchaResetMock,
            remove: hcaptchaRemoveMock,
        }

        const hcaptchaWrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        hcaptchaVerify?.('hc-token')
        expect(hcaptchaWrapper.emitted('update:modelValue')?.[0]).toEqual(['hc-token'])

        callExposedReset(hcaptchaWrapper)
        expect(hcaptchaResetMock).toHaveBeenCalledWith('hc-widget')
        hcaptchaWrapper.unmount()
        expect(hcaptchaRemoveMock).toHaveBeenCalledWith('hc-widget')

        setCaptchaConfig('captchafox')

        const captchafoxResetMock = vi.fn()
        let captchafoxVerify: ((token: string) => void) | undefined
        let captchafoxExpire: (() => void) | undefined
        let captchafoxError: ((error: unknown) => void) | undefined

        ;(window as any).captchafox = {
            render: vi.fn((_el: HTMLElement, options: Record<string, any>) => {
                captchafoxVerify = options.onVerify
                captchafoxExpire = options.onExpire
                captchafoxError = options.onError
                return 'cfx-widget'
            }),
            reset: captchafoxResetMock,
        }

        const captchafoxWrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        captchafoxVerify?.('fox-token')
        captchafoxExpire?.()
        captchafoxError?.('provider error')

        expect(captchafoxWrapper.emitted('update:modelValue')?.[0]).toEqual(['fox-token'])
        expect(captchafoxWrapper.emitted('expire')).toHaveLength(1)
        expect(captchafoxWrapper.emitted('error')?.[0]).toEqual(['provider error'])

        callExposedReset(captchafoxWrapper)
        expect(captchafoxResetMock).toHaveBeenCalledWith('cfx-widget')
    })

    it('loads provider scripts when sdk is missing and reuses existing script tags', async () => {
        setCaptchaConfig('cloudflare-turnstile')

        const firstWrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        const appendedScript = document.head.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]')
        expect(appendedScript).not.toBeNull()

        const turnstileRenderMock = vi.fn(() => 'loaded-widget')
        ;(window as any).turnstile = {
            render: turnstileRenderMock,
            reset: vi.fn(),
            remove: vi.fn(),
        }

        const turnstileScript = appendedScript as HTMLScriptElement | null
        turnstileScript?.onload?.(new Event('load'))
        await nextTick()
        expect(turnstileRenderMock).toHaveBeenCalledTimes(1)

        firstWrapper.unmount()

        document.head.querySelectorAll('script').forEach((script) => script.remove())

        const existingScript = document.createElement('script')
        existingScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        existingScript.setAttribute('data-loaded', 'true')
        document.head.appendChild(existingScript)

        const loadedRenderMock = vi.fn(() => 'existing-widget')
        ;(window as any).turnstile = {
            render: loadedRenderMock,
            reset: vi.fn(),
            remove: vi.fn(),
        }

        await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        expect(loadedRenderMock).toHaveBeenCalledTimes(1)

        document.head.querySelectorAll('script').forEach((script) => script.remove())
        delete (window as any).grecaptcha
        setCaptchaConfig('google-recaptcha')

        await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        expect(document.head.querySelector('script[src="https://www.google.com/recaptcha/api.js?render=explicit"]')).not.toBeNull()
    })

    it('loads hcaptcha and captchafox scripts when their sdk is unavailable', async () => {
        setCaptchaConfig('hcaptcha')

        const hcaptchaWrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        expect(document.head.querySelector('script[src="https://js.hcaptcha.com/1/api.js?render=explicit"]')).not.toBeNull()

        hcaptchaWrapper.unmount()
        document.head.querySelectorAll('script').forEach((script) => script.remove())

        setCaptchaConfig('captchafox')

        await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        expect(document.head.querySelector('script[src="https://cfox.app/js/api.js?render=explicit"]')).not.toBeNull()
    })

    it('warns when provider reset or removal fails', async () => {
        setCaptchaConfig('cloudflare-turnstile')

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        ;(window as any).turnstile = {
            render: vi.fn(() => 'warn-widget'),
            reset: vi.fn(() => {
                throw new Error('reset failed')
            }),
            remove: vi.fn(() => {
                throw new Error('remove failed')
            }),
        }

        const wrapper = await mountSuspended(AppCaptcha, {
            props: {
                modelValue: '',
            },
        })

        callExposedReset(wrapper)
        wrapper.unmount()

        expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to reset captcha widget:', expect.any(Error))
        expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to remove captcha widget:', expect.any(Error))

        consoleWarnSpy.mockRestore()
    })
})
