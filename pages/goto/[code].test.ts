import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import GotoPage from './[code].vue'

const { responseRef, pendingRef, errorRef, routeMock, routerBackMock, navigateToMock } = vi.hoisted(() => ({
    responseRef: {
        __v_isRef: true,
        value: null as any,
    },
    pendingRef: {
        __v_isRef: true,
        value: false,
    },
    errorRef: {
        __v_isRef: true,
        value: null as any,
    },
    routeMock: {
        params: {
            code: 'test-code',
        },
    },
    routerBackMock: vi.fn(),
    navigateToMock: vi.fn(),
}))

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal<any>()

    return {
        ...actual,
        useRoute: () => routeMock,
        useRouter: () => ({
            back: routerBackMock,
            afterEach: vi.fn(),
            beforeEach: vi.fn(),
            beforeResolve: vi.fn(),
            push: vi.fn(),
            replace: vi.fn(),
            onError: vi.fn(),
        }),
    }
})

vi.mock('#i18n', async (importOriginal) => {
    const actual = await importOriginal<any>()

    return {
        ...actual,
        useLocalePath: () => (path: string) => path,
    }
})

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: () => ({
            value: {
                data: null,
            },
        }),
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string, params?: { seconds?: number }) => {
        switch (key) {
            case 'redirect.loading':
                return 'Preparing redirect...'
            case 'redirect.error.title':
                return 'Link unavailable'
            case 'redirect.error.message':
                return 'The requested link does not exist or has been disabled.'
            case 'redirect.back_home':
                return 'Back home'
            case 'redirect.leaving_site':
                return 'Leaving this site'
            case 'redirect.auto_continue':
                return `Continue in ${params?.seconds ?? 0}s`
            case 'redirect.continue_now':
                return 'Continue now'
            case 'redirect.cancel':
                return 'Cancel'
            case 'redirect.disclaimer':
                return 'External links may lead to third-party content.'
            default:
                return key
        }
    },
}))

mockNuxtImport('useFetch', () => () => ({
    data: responseRef,
    pending: pendingRef,
    error: errorRef,
}))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.stubGlobal('navigateTo', navigateToMock)

const stubs = {
    Button: {
        props: ['label'],
        emits: ['click'],
        template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>',
    },
    ProgressSpinner: {
        template: '<div class="progress-spinner" />',
    },
}

describe('pages/goto/[code].vue', () => {
    beforeEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
        routeMock.params.code = 'test-code'
        pendingRef.value = false
        errorRef.value = null
        responseRef.value = {
            code: 200,
            message: 'Success',
            data: {
                url: 'https://example.com/redirect-target',
                favicon: '',
                title: 'Example',
                showRedirectPage: true,
            },
        }
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                href: 'http://localhost/goto/test-code',
            },
        })
        Object.defineProperty(window.history, 'length', {
            configurable: true,
            value: 1,
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('shows the loading state while the redirect metadata is pending', async () => {
        pendingRef.value = true
        responseRef.value = null

        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/test-code',
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.loading').exists()).toBe(true)
        expect(wrapper.text()).toContain('加载链接信息中...')
    })

    it('should render redirect target from api response data', async () => {
        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/test-code',
            global: {
                stubs,
            },
        })

        expect(wrapper.text()).toContain('https://example.com/redirect-target')
        expect(wrapper.text()).toContain('您即将离开本站')

        wrapper.unmount()
    })

    it('should render error state when api returns non-200 response', async () => {
        responseRef.value = {
            code: 404,
            message: 'Link not found',
        }

        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/missing-code',
            global: {
                stubs,
            },
        })

        expect(wrapper.text()).toContain('链接不可用')
        expect(wrapper.text()).toContain('The requested link does not exist or has been disabled.')

        wrapper.unmount()
    })

    it('sends readers home from the error state when they click the fallback action', async () => {
        errorRef.value = {
            message: 'Gateway timeout',
        }
        responseRef.value = null

        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/test-code',
            global: {
                stubs,
            },
        })

        await wrapper.get('.error button').trigger('click')

        expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('redirects immediately when the server disables the interstitial page', async () => {
        responseRef.value = {
            code: 200,
            message: 'Success',
            data: {
                url: 'https://example.com/direct-target',
                favicon: '',
                title: 'Example',
                showRedirectPage: false,
            },
        }

        await mountSuspended(GotoPage, {
            route: '/goto/test-code',
            global: {
                stubs,
            },
        })

        expect(window.location.href).toBe('https://example.com/direct-target')
    })

    it('supports continuing immediately and cancelling back to history or home', async () => {
        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/test-code',
            global: {
                stubs,
            },
        })

        const buttons = wrapper.findAll('.actions button')
        await buttons[0]?.trigger('click')
        expect(window.location.href).toBe('https://example.com/redirect-target')

        Object.defineProperty(window.history, 'length', {
            configurable: true,
            value: 2,
        })
        await buttons[1]?.trigger('click')
        expect(routerBackMock).toHaveBeenCalledTimes(1)

        Object.defineProperty(window.history, 'length', {
            configurable: true,
            value: 1,
        })
        await buttons[1]?.trigger('click')
        expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('counts down and auto redirects after three seconds', async () => {
        vi.useFakeTimers()

        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/test-code',
            global: {
                stubs,
            },
        })

        expect(wrapper.text()).toContain('将在 3 秒后自动跳转...')

        await vi.advanceTimersByTimeAsync(3000)

        expect(window.location.href).toBe('https://example.com/redirect-target')
    })
})
