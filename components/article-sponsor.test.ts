import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ArticleSponsor from './article-sponsor.vue'
import { getCommercialPlatformIcon } from '@/utils/shared/commercial'

const { mockT, mockUseAppFetch } = vi.hoisted(() => ({
    mockT: vi.fn((key: string) => key),
    mockUseAppFetch: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: mockT,
    locale: { value: 'zh-CN' },
}))

mockNuxtImport('useAppFetch', () => mockUseAppFetch)

const ButtonStub = defineComponent({
    inheritAttrs: false,
    props: {
        as: { type: String, default: 'button' },
        href: { type: String, default: undefined },
    },
    template: `
        <a v-if="as === 'a'" :href="href" v-bind="$attrs">
            <slot />
        </a>
        <button v-else type="button" v-bind="$attrs">
            <slot />
        </button>
    `,
})

const DialogStub = defineComponent({
    inheritAttrs: false,
    template: '<div><slot /></div>',
})

describe('ArticleSponsor', () => {
    beforeEach(() => {
        mockT.mockClear()
        mockUseAppFetch.mockReset()
        mockUseAppFetch.mockResolvedValue({
            data: ref({
                data: {
                    enabled: true,
                    socialLinks: [],
                    donationLinks: [],
                },
            }),
        })
    })

    it('renders both url and qr entries for social platforms in both mode', async () => {
        const wrapper = await mountSuspended(ArticleSponsor, {
            props: {
                socialLinks: [{
                    platform: 'xiaohongshu',
                    url: 'https://www.xiaohongshu.com/user/profile/example',
                    image: '/uploads/xiaohongshu-qr.png',
                }],
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        expect(wrapper.find('a.article-sponsor__btn[href="https://www.xiaohongshu.com/user/profile/example"]').exists()).toBe(true)
        expect(wrapper.findAll('button.article-sponsor__btn')).toHaveLength(1)
        expect(wrapper.find('button.article-sponsor__btn i.iconfont.icon-xiaohongshu').exists()).toBe(true)
        expect(getCommercialPlatformIcon('xiaohongshu', 'social')).toBe('iconfont icon-xiaohongshu')
    })

    it('renders both url and qr entries for donation platforms in both mode', async () => {
        const wrapper = await mountSuspended(ArticleSponsor, {
            props: {
                donationLinks: [{
                    platform: 'custom',
                    label: 'Sponsor Me',
                    url: 'https://example.com/sponsor',
                    image: '/uploads/sponsor-qr.png',
                }],
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        expect(wrapper.find('a.article-sponsor__btn[href="https://example.com/sponsor"]').exists()).toBe(true)
        expect(wrapper.findAll('button.article-sponsor__btn')).toHaveLength(1)
        expect(wrapper.find('button.article-sponsor__btn i.pi.pi-qrcode').exists()).toBe(true)
    })

    it('uses platform icons for known qr donation platforms', async () => {
        const wrapper = await mountSuspended(ArticleSponsor, {
            props: {
                donationLinks: [{
                    platform: 'wechat_pay',
                    image: '/uploads/wechat-pay-qr.png',
                }],
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        expect(wrapper.find('button.article-sponsor__btn i.iconfont.icon-weixinzhifu').exists()).toBe(true)
        expect(wrapper.find('button.article-sponsor__btn i.pi.pi-qrcode').exists()).toBe(false)
    })

    it('uses iconfont mappings for corrected commercial platforms', () => {
        expect(getCommercialPlatformIcon('juejin', 'social')).toBe('iconfont icon-juejin')
        expect(getCommercialPlatformIcon('weibo', 'social')).toBe('iconfont icon-weibo')
        expect(getCommercialPlatformIcon('wechat_pay', 'donation')).toBe('iconfont icon-weixinzhifu')
        expect(getCommercialPlatformIcon('buymeacoffee', 'donation')).toBe('iconfont icon-a-BuyMeACoffee')
    })

    it('falls back to global links when author links do not match the current locale', async () => {
        mockUseAppFetch.mockResolvedValue({
            data: ref({
                data: {
                    enabled: true,
                    socialLinks: [{
                        platform: 'github',
                        url: 'https://github.com/CaoMeiYouRen',
                        locales: ['zh-CN'],
                    }],
                    donationLinks: [],
                },
            }),
        })

        const wrapper = await mountSuspended(ArticleSponsor, {
            props: {
                socialLinks: [{
                    platform: 'x',
                    url: 'https://x.com/example',
                    locales: ['en-US'],
                }],
            },
            global: {
                stubs: {
                    Button: ButtonStub,
                    Dialog: DialogStub,
                },
            },
        })

        expect(wrapper.find('a.article-sponsor__btn[href="https://github.com/CaoMeiYouRen"]').exists()).toBe(true)
        expect(wrapper.find('a.article-sponsor__btn[href="https://x.com/example"]').exists()).toBe(false)
    })
})
