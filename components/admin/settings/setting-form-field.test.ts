import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SettingFormField from './setting-form-field.vue'

const translations: Record<string, string> = {
    'pages.admin.settings.system.smart_mode.messages.db_active': '当前值来自数据库配置。',
    'pages.admin.settings.system.smart_mode.messages.env_override': '当前值由环境变量 {envKey} 接管，后台保存不会立即生效。',
}

function translate(key: string, params?: Record<string, string>) {
    const template = translations[key]

    if (!template) {
        return key
    }

    if (!params) {
        return template
    }

    return template.replace(/\{(\w+)\}/g, (_, token: string) => params[token] ?? `{${token}}`)
}

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
        }),
    }
})

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
        }),
    }
})

vi.stubGlobal('useI18n', () => ({
    t: translate,
}))

describe('SettingFormField', () => {
    it('uses badge tooltip for db source without rendering inline message', async () => {
        const wrapper = await mountSuspended(SettingFormField, {
            props: {
                fieldKey: 'site_title',
                inputId: 'site_title',
                metadata: {
                    source: 'db',
                    isLocked: false,
                    defaultUsed: false,
                    lockReason: null,
                    requiresRestart: false,
                    envKey: null,
                },
            },
            slots: {
                default: '<input id="site_title" />',
            },
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: {
                    Tag: {
                        props: ['value'],
                        template: '<span class="tag">{{ value }}</span>',
                    },
                },
            },
        })

        expect(wrapper.find('.setting-form-field__message').exists()).toBe(false)

        const statusItem = wrapper.find('.setting-form-field__status-item')
        expect(statusItem.exists()).toBe(true)
        expect(statusItem.attributes('title')).toBe('当前值来自数据库配置。')
    })

    it('applies the same tooltip to env badge and lock icon', async () => {
        const wrapper = await mountSuspended(SettingFormField, {
            props: {
                fieldKey: 'site_title',
                inputId: 'site_title',
                metadata: {
                    source: 'env',
                    isLocked: true,
                    defaultUsed: false,
                    lockReason: 'env_override',
                    requiresRestart: false,
                    envKey: 'NUXT_PUBLIC_APP_NAME',
                },
            },
            slots: {
                default: '<input id="site_title" />',
            },
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: {
                    Tag: {
                        props: ['value'],
                        template: '<span class="tag">{{ value }}</span>',
                    },
                },
            },
        })

        const statusItems = wrapper.findAll('.setting-form-field__status-item')
        expect(statusItems).toHaveLength(2)
        expect(statusItems[0]?.attributes('title')).toBe('当前值由环境变量 NUXT_PUBLIC_APP_NAME 接管，后台保存不会立即生效。')
        expect(statusItems[1]?.attributes('title')).toBe('当前值由环境变量 NUXT_PUBLIC_APP_NAME 接管，后台保存不会立即生效。')
        expect(wrapper.find('.setting-form-field__message').exists()).toBe(false)
    })
})
