import { computed, ref } from 'vue'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import FeedbackPage from './feedback.vue'

const mockCurrentTitle = ref('Momei Blog')
const mockSiteConfig = ref({
    siteOperator: '',
    feedbackUrl: '',
    contactEmail: '',
})

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
}))

mockNuxtImport('useHead', () => vi.fn())
mockNuxtImport('useMomeiConfig', () => () => ({
    siteConfig: mockSiteConfig,
    currentTitle: computed(() => mockCurrentTitle.value),
}))

describe('feedback page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCurrentTitle.value = 'Momei Blog'
        mockSiteConfig.value = {
            siteOperator: '',
            feedbackUrl: '',
            contactEmail: '',
        }
    })

    it('should render deployment support link from shared site config without page-level fetch', async () => {
        mockSiteConfig.value = {
            siteOperator: '墨梅运维',
            feedbackUrl: 'https://support.example.com',
            contactEmail: 'support@example.com',
        }

        const wrapper = await mountSuspended(FeedbackPage)
        const deploymentLink = wrapper.findAll('.feedback-page__action')[1]
        expect(deploymentLink).toBeDefined()
        if (!deploymentLink) {
            throw new Error('Expected deployment action link to exist')
        }

        expect(wrapper.text()).toContain('联系 墨梅运维 的站点管理员')
        expect(deploymentLink.attributes('href')).toBe('https://support.example.com')
        expect(deploymentLink.attributes('target')).toBe('_blank')
        expect(deploymentLink.text()).toContain('pages.feedback.deployment.action_link')
    })

    it('should fall back to current title and mailto action when feedback url is absent', async () => {
        mockCurrentTitle.value = '备用站点标题'
        mockSiteConfig.value = {
            siteOperator: '',
            feedbackUrl: '',
            contactEmail: 'contact@example.com',
        }

        const wrapper = await mountSuspended(FeedbackPage)
        const deploymentLink = wrapper.findAll('.feedback-page__action')[1]
        expect(deploymentLink).toBeDefined()
        if (!deploymentLink) {
            throw new Error('Expected deployment action link to exist')
        }

        expect(wrapper.text()).toContain('联系 备用站点标题 的站点管理员')
        expect(deploymentLink.attributes('href')).toBe('mailto:contact@example.com')
        expect(deploymentLink.attributes('target')).toBeUndefined()
        expect(deploymentLink.text()).toContain('pages.feedback.deployment.action_email')
    })
})
