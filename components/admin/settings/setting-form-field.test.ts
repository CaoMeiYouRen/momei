import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SettingFormField from './setting-form-field.vue'

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string, params?: Record<string, string>) => {
                if (params?.envKey) {
                    return `${key}:${params.envKey}`
                }

                return key
            },
        }),
    }
})

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
