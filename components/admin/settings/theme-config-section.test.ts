import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ThemeConfigSection from './theme-config-section.vue'

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useI18n: () => ({ t: (key: string) => key }),
    }
})

const settings = ref({
    themePreset: 'default',
    themePrimaryColor: null,
    themeAccentColor: null,
    themeSurfaceColor: null,
    themeTextColor: null,
    themeDarkPrimaryColor: null,
    themeDarkAccentColor: null,
    themeDarkSurfaceColor: null,
    themeDarkTextColor: null,
    themeBorderRadius: null,
    themeLogoUrl: null,
    themeFaviconUrl: null,
    themeMourningMode: false,
})

vi.mock('@/composables/use-theme', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useTheme: () => ({ settings, isLocked: () => false }),
    }
})

vi.mock('@/composables/use-theme-mode', () => ({
    useThemeMode: () => ref(false),
}))

const stubs = {
    CaomeiCard: { template: '<div><slot /></div>' },
    CaomeiSelect: { template: '<div />' },
    CaomeiSwitch: { template: '<div />' },
    CaomeiDivider: { template: '<hr>' },
    SettingInput: { template: '<input>' },
    AdminSettingsThemeColorField: { template: '<div class="color-field" />' },
    ClientOnly: { template: '<div><slot /></div>' },
    CaomeiTabs: {
        props: ['defaultValue', 'unmountOnHide'],
        template: '<div class="tabs" :data-default="defaultValue" :data-unmount="String(unmountOnHide)"><slot /></div>',
    },
    CaomeiTabList: { template: '<div><slot /></div>' },
    CaomeiTabTrigger: { props: ['value'], template: '<button class="trigger"><slot /></button>' },
    CaomeiTabContent: { template: '<div class="content"><slot /></div>' },
}

/**
 * 主题配置面板的结构契约：三个页签 + 默认页签 + 全量挂载（unmount-on-hide=false）。
 * 迁移前 PrimeVue `TabPanel` 用 `v-show` 保留所有面板；caomei 默认卸载隐藏面板，故显式关闭。
 */
describe('ThemeConfigSection', () => {
    it('渲染三个页签并保持默认页签与全量挂载', async () => {
        const wrapper = await mountSuspended(ThemeConfigSection, {
            global: {
                stubs,
                mocks: { $t: (key: string) => key },
            },
        })

        const triggers = wrapper.findAll('.trigger')
        expect(triggers).toHaveLength(3)
        expect(triggers.map((item) => item.text())).toEqual([
            'pages.admin.settings.theme.color_group_light',
            'pages.admin.settings.theme.color_group_dark',
            'common.settings',
        ])

        const tabs = wrapper.get('.tabs')
        expect(tabs.attributes('data-default')).toBe('0')
        expect(tabs.attributes('data-unmount')).toBe('false')

        // 浅色 / 深色页签各 4 个色彩字段
        expect(wrapper.findAll('.color-field')).toHaveLength(8)
    })
})
