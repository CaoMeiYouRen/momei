import { computed, ref } from 'vue'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppFooter from './app-footer.vue'

const mockFetch = vi.fn()
const mockSiteConfig = ref({
    siteOperator: '',
    siteCopyrightOwner: '',
    siteCopyrightStartYear: '',
})
const mockCurrentTitle = ref('Momei Blog')

vi.stubGlobal('$fetch', mockFetch)

mockNuxtImport('useMomeiConfig', () => () => ({
    currentTitle: computed(() => mockCurrentTitle.value),
    siteLogo: computed(() => ''),
    siteConfig: mockSiteConfig,
}))

mockNuxtImport('useAsyncData', () => async (_key: string, handler: () => Promise<unknown>) => ({
    data: ref(await handler()),
}))

describe('AppFooter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockResolvedValue({ data: { items: [] } })
        mockCurrentTitle.value = 'Momei Blog'
        mockSiteConfig.value = {
            siteOperator: '',
            siteCopyrightOwner: '',
            siteCopyrightStartYear: '',
        }
    })

    it('should render footer with logo and title', async () => {
        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                    TravellingsLink: true,
                },
            },
        })

        expect(wrapper.find('.app-logo').exists()).toBe(true)
        expect(wrapper.find('.app-logo__img').exists()).toBe(true)
        expect(wrapper.find('.app-logo__title').exists()).toBe(true)
    })

    it('should render navigation links', async () => {
        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                    TravellingsLink: true,
                },
            },
        })

        const links = wrapper.findAll('.footer__link')
        expect(links.length).toBeGreaterThan(0)
        expect(links.some((link) => link.attributes('href')?.includes('/feedback'))).toBe(true)
    })

    it('should render translated footer copy without leaking raw keys', async () => {
        mockFetch.mockResolvedValue({
            data: {
                items: [
                    {
                        id: 'friend-link-1',
                        name: 'Momei Partner',
                        url: 'https://partner.example.com',
                        logo: 'https://partner.example.com/logo.png',
                    },
                ],
            },
        })

        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                    TravellingsLink: true,
                },
            },
        })

        await vi.waitFor(() => {
            expect(wrapper.find('.footer__friend-links').exists()).toBe(true)
        })

        const text = wrapper.text()

        expect(text).toMatch(/精选友链|Featured Links/u)
        expect(text).toMatch(/查看全部|View All/u)
        expect(text).toMatch(/文档|Docs/u)
        expect(text).toMatch(/用户协议|User Agreement/u)
        expect(text).toMatch(/隐私政策|Privacy Policy/u)
        expect(text).toMatch(/由\s*(墨梅博客|Momei Blog)\s*强力驱动|Powered by\s*(墨梅博客|Momei Blog)/u)
        expect(text).toContain('Momei Partner')
        expect(text).not.toContain('common.featured_friend_links')
        expect(text).not.toContain('common.view_all')
        expect(text).not.toContain('components.footer.docs')
        expect(text).not.toContain('components.footer.powered_by')
        expect(text).not.toContain('legal.user_agreement')
        expect(text).not.toContain('legal.privacy_policy')
    })

    it('should render copyright text', async () => {
        const currentYear = new Date().getFullYear()
        mockCurrentTitle.value = 'My Blog'
        mockSiteConfig.value = {
            siteOperator: 'My Studio',
            siteCopyrightOwner: 'My Studio',
            siteCopyrightStartYear: String(currentYear - 2),
        }

        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                    TravellingsLink: true,
                },
            },
        })

        expect(wrapper.find('.footer__copyright').text()).toContain(`© ${currentYear - 2}-${currentYear} My Studio`)
        expect(wrapper.find('.footer__copyright a').attributes('href')).toBe('https://momei.app/')
    })

    it('should fall back to site title when footer owner is empty', async () => {
        const currentYear = new Date().getFullYear()
        mockCurrentTitle.value = 'Fallback Site'

        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                    TravellingsLink: true,
                },
            },
        })

        expect(wrapper.find('.footer__copyright').text()).toContain(`© ${currentYear} Fallback Site`)
    })

    it('should render ComplianceInfo component', async () => {
        const wrapper = await mountSuspended(AppFooter, {
            global: {
                stubs: {
                    ComplianceInfo: true,
                    TravellingsLink: true,
                },
            },
        })

        expect(wrapper.findComponent({ name: 'ComplianceInfo' }).exists()).toBe(true)
    })
})
