import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

export const useOnboarding = () => {
    const { t } = useI18n()
    const route = useRoute()
    const config = useRuntimeConfig()

    const createDriver = () => driver({
        showProgress: true,
        animate: true,
        doneBtnText: t('common.done') || '完成',
        nextBtnText: t('common.next') || '下一步',
        prevBtnText: t('common.prev') || '上一步',
        steps: [], // Will be populated dynamically
    })

    const startTour = () => {
        const d = createDriver()
        const steps: DriveStep[] = []

        // 1. Welcome Step (Global)
        steps.push({
            element: '.app-header__logo',
            popover: {
                title: t('demo.tour.welcome_title'),
                description: t('demo.tour.welcome_desc'),
                side: 'bottom',
                align: 'start',
            },
        })

        // 2. Login Page Logic
        if (route.path.includes('/login')) {
            steps.push({
                element: 'form',
                popover: {
                    title: t('demo.tour.login_title'),
                    description: t('demo.tour.login_desc'),
                    side: 'top',
                },
                onHighlighted: () => {
                    // 自动填充演示账号
                    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
                    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
                    if (emailInput && passwordInput) {
                        emailInput.value = config.public.demoUserEmail as string
                        passwordInput.value = config.public.demoPassword as string
                        // 触发输入事件以更新 Vue 响应式状态
                        emailInput.dispatchEvent(new Event('input'))
                        emailInput.dispatchEvent(new Event('change'))
                        passwordInput.dispatchEvent(new Event('input'))
                        passwordInput.dispatchEvent(new Event('change'))
                    }
                },
            })
        }

        // 3. Editor Page Logic
        if (route.path.includes('/admin/posts/')) {
            steps.push({
                element: '.editor-area',
                popover: {
                    title: t('demo.tour.editor_title'),
                    description: t('demo.tour.editor_desc'),
                    side: 'right',
                },
            })
            steps.push({
                element: '#ai-title-btn',
                popover: {
                    title: t('demo.tour.ai_title'),
                    description: t('demo.tour.ai_desc'),
                    side: 'bottom',
                },
            })
            steps.push({
                element: '.top-bar-right', // 发布按钮所在区域
                popover: {
                    title: t('demo.tour.publish_title'),
                    description: t('demo.tour.publish_desc'),
                    side: 'left',
                },
            })
        }

        // If no specific page steps, add a hint to go to login
        if (steps.length === 1 && !config.public.demoMode) {
            // Not in demo, maybe do nothing
        }

        d.setSteps(steps)
        d.drive()
    }

    return { startTour }
}
