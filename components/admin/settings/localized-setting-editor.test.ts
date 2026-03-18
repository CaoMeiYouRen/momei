import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LocalizedSettingEditor from './localized-setting-editor.vue'

const mockToast = {
    add: vi.fn(),
}

const translations: Record<string, string> = {
    'pages.admin.settings.system.localized.badge': '多语言配置',
    'pages.admin.settings.system.localized.helper': '按语种分别维护，公开页会走统一回退链。',
    'pages.admin.settings.system.localized.ai_generate': 'AI 生成当前语种',
    'pages.admin.settings.system.localized.legacy_title': '当前仍在使用旧单值格式',
    'pages.admin.settings.system.localized.legacy_description': '首次按语种保存后会切换到结构化多语言格式。',
    'pages.admin.settings.system.localized.env_override_legacy_title': '当前由环境变量接管且仍是旧单值格式',
    'pages.admin.settings.system.localized.env_override_legacy_description': '{envKey} 目前提供的是单字符串值，因此所有语言都会共享这份内容。若要启用真正的多语言，请移除该环境变量改由后台保存，或把它改成结构化多语言 JSON。',
    'pages.admin.settings.system.localized.env_override_structured_title': '当前由环境变量接管',
    'pages.admin.settings.system.localized.env_override_structured_description': '{envKey} 当前提供的是结构化多语言 JSON。后台编辑器仅作只读预览，若要修改各语言内容，请直接更新该环境变量。',
    'pages.admin.settings.system.localized.missing_translation': '{locale} 尚未填写，将按回退链使用 {fallbackChain}。',
    'pages.admin.settings.system.localized.text_hint': '当前语种留空时由统一回退链解析。',
}

function translate(key: string, params?: Record<string, string>) {
    const template = translations[key] || key

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
        useAppApi: () => ({
            $appFetch: vi.fn(),
        }),
        useI18n: () => ({
            t: translate,
        }),
    }
})

vi.stubGlobal('useI18n', () => ({
    t: translate,
}))
vi.stubGlobal('useAppApi', () => ({
    $appFetch: vi.fn(),
}))
vi.stubGlobal('useToast', () => mockToast)

describe('LocalizedSettingEditor', () => {
    const global = {
        stubs: {
            SettingFormField: {
                template: '<div><slot /></div>',
            },
            Message: {
                template: '<div class="message"><slot /></div>',
            },
            Select: {
                props: ['modelValue'],
                template: '<div class="select-stub">{{ modelValue }}</div>',
            },
            Button: {
                props: ['label', 'disabled', 'loading'],
                template: '<button class="button-stub" :disabled="disabled" @click="$emit(\'click\')">{{ label ?? "" }}</button>',
            },
            InputText: {
                props: ['modelValue', 'disabled'],
                template: '<input class="input-stub" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            },
            Textarea: {
                props: ['modelValue', 'disabled'],
                template: '<textarea class="textarea-stub" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            },
        },
    }

    it('converts legacy single values into structured localized payloads on edit', async () => {
        const updateSpy = vi.fn()

        const wrapper = await mountSuspended(LocalizedSettingEditor, {
            props: {
                modelValue: '旧站点标题',
                'onUpdate:modelValue': updateSpy,
                fieldKey: 'site_title',
                inputId: 'site_title',
                metadata: {
                    isLocked: false,
                    localized: {
                        valueType: 'localized-text',
                        structured: false,
                        legacyFormat: true,
                        legacyValuePresent: true,
                        availableLocales: [],
                    },
                },
            },
            global,
        })

        await wrapper.find('.input-stub').setValue('简体标题')

        expect(updateSpy).toHaveBeenCalledWith({
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '简体标题',
            },
            legacyValue: '旧站点标题',
        })
        expect(wrapper.text()).toContain('当前仍在使用旧单值格式')
    })

    it('shows readonly env fallback value for locked legacy overrides', async () => {
        const wrapper = await mountSuspended(LocalizedSettingEditor, {
            props: {
                modelValue: '全站旧值',
                fieldKey: 'site_description',
                inputId: 'site_description',
                metadata: {
                    isLocked: true,
                    source: 'env',
                    envKey: 'NUXT_PUBLIC_SITE_DESCRIPTION',
                    localized: {
                        valueType: 'localized-text',
                        structured: false,
                        legacyFormat: true,
                        legacyValuePresent: true,
                        availableLocales: [],
                    },
                },
            },
            global,
        })

        expect((wrapper.find('.input-stub').element as HTMLInputElement).value).toBe('全站旧值')
        expect(wrapper.text()).toContain('当前由环境变量接管且仍是旧单值格式')
        expect(wrapper.text()).toContain('NUXT_PUBLIC_SITE_DESCRIPTION')
        expect(wrapper.text()).not.toContain('当前仍在使用旧单值格式')
    })

    it('renders the AI draft action as an icon-only button when localized content has a reusable source', async () => {
        const wrapper = await mountSuspended(LocalizedSettingEditor, {
            props: {
                modelValue: {
                    version: 1,
                    type: 'localized-text',
                    locales: {
                        'zh-CN': '中文标题',
                    },
                    legacyValue: '旧标题',
                },
                fieldKey: 'site_title',
                inputId: 'site_title',
                metadata: {
                    isLocked: false,
                    localized: {
                        valueType: 'localized-text',
                        structured: true,
                        legacyFormat: false,
                        legacyValuePresent: true,
                        availableLocales: ['zh-CN'],
                    },
                },
            },
            global,
        })

        const actionButton = wrapper.find('.button-stub')
        expect(actionButton.exists()).toBe(true)
        expect(actionButton.text()).toBe('')
        expect(actionButton.attributes('disabled')).toBeUndefined()
    })
})
