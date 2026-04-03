import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'

const mockAppFetch = vi.fn()
const showSuccessToast = vi.fn()
const showErrorToast = vi.fn()

const translations: Record<string, string> = {
    'pages.admin.settings.system.sections.memos': 'Memos',
    'pages.admin.settings.system.sections.listmonk': 'listmonk',
    'pages.admin.settings.system.sections.external_feeds': '外部动态',
    'pages.admin.settings.system.hints.memos_instance_url': 'Memos URL',
    'pages.admin.settings.system.hints.memos_access_token': 'Memos Token',
    'pages.admin.settings.system.hints.listmonk_instance_url': 'listmonk URL',
    'pages.admin.settings.system.hints.listmonk_username': 'listmonk 用户名',
    'pages.admin.settings.system.hints.listmonk_access_token': 'listmonk Token',
    'pages.admin.settings.system.hints.listmonk_default_list_ids': '默认列表',
    'pages.admin.settings.system.hints.listmonk_category_list_map': '分类映射',
    'pages.admin.settings.system.hints.listmonk_tag_list_map': '标签映射',
    'pages.admin.settings.system.hints.listmonk_template_id': '模板',
    'pages.admin.settings.system.hints.external_feed_home_limit': '首页数量',
    'pages.admin.settings.system.hints.external_feed_cache_ttl_seconds': '缓存 TTL',
    'pages.admin.settings.system.hints.external_feed_stale_while_error_seconds': '失败回退窗口',
    'pages.admin.settings.system.hints.external_feed_sources': '来源配置',
    'pages.admin.settings.system.external_feeds.refresh_cache': '手动刷新缓存',
    'pages.admin.settings.system.external_feeds.refresh_cache_hint': '修改来源配置后，可立即拉取最新 RSS / RSSHub 快照。',
    'pages.admin.settings.system.external_feeds.refresh_cache_success': '外部动态缓存已刷新。',
    'pages.admin.settings.system.external_feeds.refresh_cache_failed': '刷新外部动态缓存失败。',
    'pages.admin.settings.system.memos.visibility.PUBLIC': 'Public',
    'pages.admin.settings.system.memos.visibility.PROTECTED': 'Protected',
    'pages.admin.settings.system.memos.visibility.PRIVATE': 'Private',
}

function translate(key: string) {
    return translations[key] || key
}

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
            locale: ref('zh-CN'),
        }),
    }
})

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useAppApi: () => ({
            $appFetch: mockAppFetch,
        }),
        useRequestFeedback: () => ({
            showSuccessToast,
            showErrorToast,
        }),
    }
})

vi.stubGlobal('useAppApi', () => ({
    $appFetch: mockAppFetch,
}))

vi.stubGlobal('useRequestFeedback', () => ({
    showSuccessToast,
    showErrorToast,
}))

describe('ThirdPartySettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows the manual refresh entry when external feeds are enabled', async () => {
        const { default: ThirdPartySettings } = await import('./third-party-settings.vue')

        const settings = {
            memos_enabled: false,
            listmonk_enabled: false,
            external_feed_enabled: true,
            external_feed_home_enabled: true,
            external_feed_home_limit: 6,
            external_feed_cache_ttl_seconds: 900,
            external_feed_stale_while_error_seconds: 86400,
            external_feed_sources: '[]',
        }

        const metadata = {
            memos_enabled: { isLocked: false },
            memos_instance_url: { isLocked: false },
            memos_access_token: { isLocked: false },
            memos_default_visibility: { isLocked: false },
            listmonk_enabled: { isLocked: false },
            listmonk_instance_url: { isLocked: false },
            listmonk_username: { isLocked: false },
            listmonk_access_token: { isLocked: false },
            listmonk_default_list_ids: { isLocked: false },
            listmonk_category_list_map: { isLocked: false },
            listmonk_tag_list_map: { isLocked: false },
            listmonk_template_id: { isLocked: false },
            external_feed_enabled: { isLocked: false },
            external_feed_home_enabled: { isLocked: false },
            external_feed_home_limit: { isLocked: false },
            external_feed_cache_ttl_seconds: { isLocked: false },
            external_feed_stale_while_error_seconds: { isLocked: false },
            external_feed_sources: { isLocked: false },
        }

        const wrapper = await mountSuspended(ThirdPartySettings, {
            props: {
                settings,
                metadata,
            },
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: {
                    SettingFormField: { template: '<div><slot /></div>', props: ['fieldKey', 'inputId', 'metadata', 'inline', 'description'] },
                    ToggleSwitch: { template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />', props: ['modelValue'], emits: ['update:modelValue'] },
                    InputText: { template: '<input />' },
                    Password: { template: '<input />' },
                    Select: { template: '<select />' },
                    InputNumber: { template: '<input />' },
                    Textarea: { template: '<textarea />' },
                    Button: { template: '<button class="refresh-cache-button" @click="$emit(\'click\')">{{ label }}</button>', props: ['label', 'icon', 'severity', 'loading'], emits: ['click'] },
                },
            },
        })

        expect(wrapper.find('.refresh-cache-button').exists()).toBe(true)
        expect(wrapper.text()).toContain('手动刷新缓存')
        expect(wrapper.text()).toContain('修改来源配置后，可立即拉取最新 RSS / RSSHub 快照。')
    })
})
