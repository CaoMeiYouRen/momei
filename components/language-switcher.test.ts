import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import LanguageSwitcher from './language-switcher.vue'

const setLocaleSpy = vi.fn()
let capturedMenuModel: Record<string, any>[] = []

const localeRef = ref('zh-CN')
const localesRef = ref([
    { code: 'zh-CN', name: '简体中文' },
    { code: 'en-US', name: 'English' },
])

mockNuxtImport('useI18n', () => () => ({
    locale: localeRef,
    locales: localesRef,
    setLocale: setLocaleSpy,
}))

mockNuxtImport('useSwitchLocalePath', () => () => vi.fn())

const stubs = {
    CaomeiButton: {
        inheritAttrs: false,
        template: '<button class="lang-btn" v-bind="$attrs"><slot /></button>',
    },
    CaomeiDropdownMenu: {
        template: '<div class="lang-menu-root"><slot /></div>',
    },
    CaomeiDropdownMenuTrigger: {
        template: '<div class="lang-trigger"><slot /></div>',
    },
    CaomeiDropdownMenuContent: {
        name: 'CaomeiDropdownMenuContent',
        props: ['model'],
        created() {
            capturedMenuModel = (this as { model?: Record<string, any>[] }).model ?? []
        },
        template: '<div class="lang-menu" />',
    },
}

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localeRef.value = 'zh-CN'
        capturedMenuModel = []
    })

    it('渲染触发器与语言菜单内容', async () => {
        const wrapper = await mountSuspended(LanguageSwitcher, {
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        expect(wrapper.find('.lang-trigger .lang-btn').exists()).toBe(true)
        expect(wrapper.find('.lang-menu').exists()).toBe(true)
    })

    it('当前语言菜单项应带激活 class', async () => {
        await mountSuspended(LanguageSwitcher, {
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        expect(capturedMenuModel[0]?.class).toBe('is-active-locale')
        expect(capturedMenuModel[1]?.class).toBe('')
    })

    it('执行语言菜单命令会调用 setLocale', async () => {
        await mountSuspended(LanguageSwitcher, {
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        await capturedMenuModel[1]?.command?.()

        expect(setLocaleSpy).toHaveBeenCalledWith('en-US')
    })

    it('应将外部 class 透传给按钮根节点', async () => {
        const wrapper = await mountSuspended(LanguageSwitcher, {
            attrs: {
                class: 'language-switcher-host',
            },
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        expect(wrapper.find('.lang-btn').classes()).toContain('language-switcher-host')
    })
})
