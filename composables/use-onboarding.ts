interface TourStep {
    element: string
    popover: {
        title: string
        description: string
        side?: 'top' | 'bottom' | 'left' | 'right'
        align?: 'start' | 'center' | 'end'
    }
    onHighlighted?: () => void
}

type DemoTourStage = 'public' | 'login' | 'editor'

export const DEMO_TOUR_QUEUE_KEY = 'momei_demo_next_stage'
const DEMO_TOUR_SEEN_PREFIX = 'momei_demo_tour_seen:'

let driverModulePromise: Promise<typeof import('driver.js')> | null = null
let driverStylePromise: Promise<unknown> | null = null
let onboardingStylePromise: Promise<unknown> | null = null

async function loadDriverAssets() {
    if (!driverModulePromise) {
        driverModulePromise = import('driver.js')
    }
    if (!driverStylePromise) {
        driverStylePromise = import('driver.js/dist/driver.css')
    }
    if (!onboardingStylePromise) {
        onboardingStylePromise = import('@/styles/onboarding-driver.scss')
    }

    const [driverModule] = await Promise.all([
        driverModulePromise,
        driverStylePromise,
        onboardingStylePromise,
    ])

    return driverModule
}

function isDemoTourStage(value: string | null): value is DemoTourStage {
    return value === 'public' || value === 'login' || value === 'editor'
}

export const useOnboarding = () => {
    const { t } = useI18n()
    const route = useRoute()
    const config = useRuntimeConfig()
    const isTestMode = computed(() => Boolean(config.public.testMode))

    const createDriver = (driverFactory: (options: Record<string, unknown>) => any) => driverFactory({
        showProgress: true,
        animate: true,
        doneBtnText: t('common.done') || '完成',
        nextBtnText: t('common.next') || '下一步',
        prevBtnText: t('common.prev') || '上一步',
        progressText: t('common.progress_text', { current: '{{current}}', total: '{{total}}' }) || '{{current}} / {{total}}',
        steps: [],
    })

    const getCurrentStage = (): DemoTourStage => {
        if (route.path.includes('/admin/posts/')) {
            return 'editor'
        }

        if (route.path.includes('/login')) {
            return 'login'
        }

        return 'public'
    }

    const getStageSeenKey = (stage: DemoTourStage) => `${DEMO_TOUR_SEEN_PREFIX}${stage}`

    const hasSeenStage = (stage: DemoTourStage) => localStorage.getItem(getStageSeenKey(stage)) === 'true'

    const markStageSeen = (stage: DemoTourStage) => {
        localStorage.setItem(getStageSeenKey(stage), 'true')
    }

    const pushStepIfExists = (
        steps: TourStep[],
        element: string,
        popover: TourStep['popover'],
        onHighlighted?: () => void,
    ) => {
        if (document.querySelector(element)) {
            steps.push({
                element,
                popover,
                onHighlighted,
            })
        }
    }

    const buildPublicSteps = () => {
        const steps: TourStep[] = []

        pushStepIfExists(steps, '.demo-banner', {
            title: t('demo.tour.welcome_title'),
            description: t('demo.banner_text'),
            side: 'bottom',
            align: 'start',
        })

        pushStepIfExists(steps, '.app-header__logo', {
            title: t('app.name'),
            description: t('demo.tour.welcome_desc'),
            side: 'bottom',
            align: 'start',
        })

        pushStepIfExists(steps, '.app-header__nav', {
            title: t('demo.tour.nav_title'),
            description: t('demo.tour.nav_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '#search-btn', {
            title: t('demo.tour.search_title'),
            description: t('demo.tour.search_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '#theme-switcher', {
            title: t('demo.tour.theme_title'),
            description: t('demo.tour.theme_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '#lang-switcher', {
            title: t('demo.tour.lang_title'),
            description: t('demo.tour.lang_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '.article-card', {
            title: t('demo.tour.article_title'),
            description: t('demo.tour.article_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '#login-btn', {
            title: t('demo.tour.login_title'),
            description: t('demo.tour.login_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '#user-menu-btn', {
            title: t('demo.tour.user_title'),
            description: t('demo.tour.user_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '#admin-menu-btn', {
            title: t('demo.tour.admin_title'),
            description: t('demo.tour.admin_desc'),
            side: 'bottom',
        })

        return steps
    }

    const buildLoginSteps = () => {
        const steps: TourStep[] = []

        pushStepIfExists(
            steps,
            'form',
            {
                title: t('demo.tour.login_title'),
                description: t('demo.tour.login_desc'),
                side: 'top',
            },
            () => {
                const emailInput = document.querySelector('input[type="email"]')
                const passwordInput = document.querySelector('input[type="password"]')

                if (emailInput instanceof HTMLInputElement && passwordInput instanceof HTMLInputElement) {
                    emailInput.value = config.public.demoUserEmail
                    passwordInput.value = config.public.demoPassword
                    emailInput.dispatchEvent(new Event('input'))
                    emailInput.dispatchEvent(new Event('change'))
                    passwordInput.dispatchEvent(new Event('input'))
                    passwordInput.dispatchEvent(new Event('change'))
                }
            },
        )

        pushStepIfExists(steps, 'button[type="submit"]', {
            title: t('demo.tour.login_action_title'),
            description: t('demo.tour.login_action_desc'),
            side: 'top',
        })

        return steps
    }

    const buildEditorSteps = () => {
        const steps: TourStep[] = []

        pushStepIfExists(steps, '.editor-area', {
            title: t('demo.tour.editor_title'),
            description: t('demo.tour.editor_desc'),
            side: 'right',
        })

        pushStepIfExists(steps, '#ai-title-btn', {
            title: t('demo.tour.ai_title'),
            description: t('demo.tour.ai_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '#ai-translate-btn', {
            title: t('demo.tour.translate_title'),
            description: t('demo.tour.translate_desc'),
            side: 'bottom',
        })

        pushStepIfExists(steps, '.top-bar-right', {
            title: t('demo.tour.publish_title'),
            description: t('demo.tour.publish_desc'),
            side: 'left',
        })

        return steps
    }

    const buildSteps = (stage: DemoTourStage) => {
        switch (stage) {
            case 'login':
                return buildLoginSteps()
            case 'editor':
                return buildEditorSteps()
            case 'public':
            default:
                return buildPublicSteps()
        }
    }

    const startTour = async (stage = getCurrentStage()) => {
        if (!import.meta.client || !config.public.demoMode || isTestMode.value) {
            return false
        }

        await nextTick()

        const steps = buildSteps(stage)
        if (!steps.length) {
            return false
        }

        const { driver } = await loadDriverAssets()
        const d = createDriver(driver)
        d.setSteps(steps)
        d.drive()

        markStageSeen(stage)

        return true
    }

    const maybeAutoStartTour = () => {
        if (!import.meta.client || !config.public.demoMode || isTestMode.value) {
            return
        }

        const currentStage = getCurrentStage()
        const queuedStage = localStorage.getItem(DEMO_TOUR_QUEUE_KEY)
        const normalizedQueuedStage = isDemoTourStage(queuedStage) ? queuedStage : null
        const shouldStartQueued = normalizedQueuedStage === currentStage && !hasSeenStage(currentStage)
        const shouldStartInitialPublic = currentStage === 'public' && !normalizedQueuedStage && !hasSeenStage('public')

        if (!shouldStartQueued && !shouldStartInitialPublic) {
            return
        }

        if (shouldStartQueued) {
            localStorage.removeItem(DEMO_TOUR_QUEUE_KEY)
        }

        window.setTimeout(() => {
            void startTour(currentStage)
        }, currentStage === 'public' ? 1200 : 500)
    }

    return { startTour, maybeAutoStartTour }
}
