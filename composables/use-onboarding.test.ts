import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockRoute = reactive({
    path: '/',
})

const mockRuntimeConfig = {
    app: {
        baseURL: '/',
    },
    public: {
        demoMode: true,
        testMode: false,
        demoUserEmail: 'demo@example.com',
        demoPassword: 'demo-password',
    },
}

const { mockDriverFactory, mockDriverApi } = vi.hoisted(() => ({
    mockDriverApi: {
        setSteps: vi.fn(),
        drive: vi.fn(),
    },
    mockDriverFactory: vi.fn(() => ({
        setSteps: vi.fn((steps) => {
            mockDriverApi.setSteps(steps)
        }),
        drive: vi.fn(() => {
            mockDriverApi.drive()
        }),
    })),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useRuntimeConfig', () => () => mockRuntimeConfig)

vi.mock('vue-router', async () => {
    const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

    return {
        ...actual,
        useRouter: () => ({
            afterEach: vi.fn(),
        }),
    }
})

vi.mock('driver.js', () => ({
    driver: mockDriverFactory,
}))

vi.mock('driver.js/dist/driver.css', () => ({}))

import { DEMO_TOUR_QUEUE_KEY, useOnboarding } from './use-onboarding'

describe('useOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        document.body.innerHTML = ''
        mockRoute.path = '/'
        mockRuntimeConfig.public.demoMode = true
        mockRuntimeConfig.public.testMode = false
    })

    it('startTour 应构建 public steps 并标记已读', async () => {
        document.body.innerHTML = `
            <div class="demo-banner"></div>
            <div class="app-header__logo"></div>
            <div class="article-card"></div>
        `

        const { startTour } = useOnboarding()
        await expect(startTour('public')).resolves.toBe(true)

        expect(mockDriverFactory).toHaveBeenCalledTimes(1)
        const steps = mockDriverApi.setSteps.mock.calls[0][0] as { element: string }[]
        expect(steps.map((step) => step.element)).toEqual([
            '.demo-banner',
            '.app-header__logo',
            '.article-card',
        ])
        expect(mockDriverApi.drive).toHaveBeenCalledTimes(1)
        expect(localStorage.getItem('momei_demo_tour_seen:public')).toBe('true')
    })

    it('login tour 的高亮步骤应自动填充 demo 账号', async () => {
        mockRoute.path = '/login'
        document.body.innerHTML = `
            <form>
                <input type="email" />
                <input type="password" />
                <button type="submit"></button>
            </form>
        `

        const { startTour } = useOnboarding()
        await expect(startTour('login')).resolves.toBe(true)

        const steps = mockDriverApi.setSteps.mock.calls[0][0] as { onHighlighted?: () => void }[]
        steps[0]?.onHighlighted?.()

        expect((document.querySelector('input[type="email"]') as HTMLInputElement).value).toBe('demo@example.com')
        expect((document.querySelector('input[type="password"]') as HTMLInputElement).value).toBe('demo-password')
    })

    it('maybeAutoStartTour 应在匹配 queued stage 时移除队列并按阶段延时启动', async () => {
        vi.useFakeTimers()
        mockRoute.path = '/login'
        localStorage.setItem(DEMO_TOUR_QUEUE_KEY, 'login')
        document.body.innerHTML = `
            <form>
                <input type="email" />
                <input type="password" />
                <button type="submit"></button>
            </form>
        `

        try {
            const { maybeAutoStartTour } = useOnboarding()
            maybeAutoStartTour()

            expect(localStorage.getItem(DEMO_TOUR_QUEUE_KEY)).toBeNull()
            expect(mockDriverFactory).not.toHaveBeenCalled()

            await vi.advanceTimersByTimeAsync(500)
            expect(mockDriverFactory).toHaveBeenCalledTimes(1)
            expect(localStorage.getItem('momei_demo_tour_seen:login')).toBe('true')
        } finally {
            vi.useRealTimers()
        }
    })

    it('demo 关闭或 testMode 开启时应跳过导览', async () => {
        mockRuntimeConfig.public.demoMode = false
        const { startTour, maybeAutoStartTour } = useOnboarding()

        await expect(startTour('public')).resolves.toBe(false)

        maybeAutoStartTour()
        expect(mockDriverFactory).not.toHaveBeenCalled()

        mockRuntimeConfig.public.demoMode = true
        mockRuntimeConfig.public.testMode = true
        await expect(startTour('public')).resolves.toBe(false)
    })
})
