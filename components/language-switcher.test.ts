import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import LanguageSwitcher from './language-switcher.vue'

const toggleSpy = vi.fn()
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
    Button: {
        template: '<button class="lang-btn" @click="$emit(\'click\', $event)"><slot /></button>',
    },
    Menu: {
        name: 'Menu',
        props: ['model'],
        created() {
            capturedMenuModel = (this as { model?: Record<string, any>[] }).model ?? []
        },
        template: '<div class="lang-menu" />',
        methods: {
            toggle: toggleSpy,
        },
    },
}

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localeRef.value = 'zh-CN'
        capturedMenuModel = []
    })

    it('点击按钮会打开语言菜单', async () => {
        const wrapper = await mountSuspended(LanguageSwitcher, {
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        await wrapper.find('.lang-btn').trigger('click')
        expect(toggleSpy).toHaveBeenCalled()
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
})
