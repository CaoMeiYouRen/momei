import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import GeneralSettings from './general-settings.vue'
import type { GeneralSettingsModel, LocalizedSettingValueV1 } from '@/types/setting'

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
        }),
    }
})

const metadata = new Proxy({}, {
    get: () => ({ isLocked: false }),
})

describe('GeneralSettings', () => {
    it('renders branding and friend-link sections when related settings are enabled', () => {
        const localizedText = (zhCn: string, enUs: string): LocalizedSettingValueV1<string> => ({
            version: 1,
            type: 'localized-text',
            locales: { 'zh-CN': zhCn, 'en-US': enUs },
        })
        const localizedList = (zhCn: string[], enUs: string[]): LocalizedSettingValueV1<string[]> => ({
            version: 1,
            type: 'localized-string-list',
            locales: { 'zh-CN': zhCn, 'en-US': enUs },
        })

        const settings = reactive<GeneralSettingsModel>({
            site_title: localizedText('墨梅', 'Momei'),
            site_name: 'Momei Blog',
            site_description: localizedText('中文描述', 'English description'),
            site_keywords: localizedList(['技术'], ['tech']),
            post_copyright: 'cc-by-nc-sa-4.0',
            site_copyright_owner: localizedText('墨梅', 'Momei'),
            site_copyright_start_year: '2024',
            default_language: 'zh-CN',
            site_logo: '/logo.png',
            site_favicon: '/favicon.png',
            site_operator: localizedText('站长', 'Owner'),
            contact_email: 'owner@example.com',
            feedback_url: 'https://example.com/feedback',
            show_compliance_info: true,
            icp_license_number: 'ICP-123456',
            public_security_number: '公网安备 123456',
            footer_code: '<script>footer</script>',
            friend_links_enabled: true,
            friend_links_application_enabled: true,
            friend_links_footer_enabled: true,
            friend_links_footer_limit: 8,
            friend_links_application_guidelines: localizedText('指引', 'Guideline'),
            friend_links_check_interval_minutes: '1d',
        })

        const wrapper = mount(GeneralSettings, {
            props: {
                metadata,
                settings,
                'onUpdate:settings': (value: unknown) => value,
            },
            shallow: true,
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        const html = wrapper.html()
        expect(html).toContain('site_name')
        expect(html).toContain('friend_links_enabled')
        expect(html).toContain('friend_links_application_enabled')
        expect(html).toContain('friend_links_footer_limit')
    })
})
