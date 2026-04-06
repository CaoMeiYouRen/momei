import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ArticleSponsor from './article-sponsor.vue'

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
