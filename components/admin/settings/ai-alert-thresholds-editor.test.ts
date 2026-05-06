import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

const stubs = {
    SettingFormField: {
        template: '<div class="setting-form-field-stub" :data-field-key="fieldKey"><slot /></div>',
        props: ['fieldKey', 'inputId', 'label', 'description', 'metadata'],
    },
    ToggleSwitch: {
        template: '<input class="toggle-switch-stub" type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
    },
    MultiSelect: {
        template: `
            <select class="multi-select-stub" multiple :disabled="disabled" @change="handleChange">
                <option
                    v-for="option in options"
                    :key="option[optionValue || 'value']"
                    :value="option[optionValue || 'value']"
                    :selected="isSelected(option[optionValue || 'value'])"
                >
                    {{ option[optionLabel || 'label'] }}
                </option>
            </select>
        `,
        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'disabled', 'display', 'appendTo', 'fluid'],
        emits: ['update:modelValue'],
        methods: {
            isSelected(value: unknown) {
                return Array.isArray(this.modelValue) && this.modelValue.includes(value)
            },
            handleChange(event: Event) {
                const values = Array.from((event.target as HTMLSelectElement).selectedOptions).map((option) => {
                    const matchedOption = this.options.find((item: Record<string, unknown>) => String(item[this.optionValue || 'value']) === option.value)
                    return matchedOption?.[this.optionValue || 'value'] ?? option.value
                })

                this.$emit('update:modelValue', values)
            },
        },
    },
    InputNumber: {
        template: `<input class="input-number-stub" type="number" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))" />`,
        props: ['modelValue', 'disabled', 'min', 'max', 'fluid', 'showButtons', 'useGrouping'],
        emits: ['update:modelValue'],
    },
    Textarea: {
        template: `<textarea :id="id" class="textarea-stub" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['id', 'modelValue', 'disabled', 'rows', 'autoResize', 'fluid'],
        emits: ['update:modelValue'],
    },
}

async function mountComponent(
    modelValue: string,
    metadata: { isLocked?: boolean } = { isLocked: false },
) {
    const { default: AiAlertThresholdsEditor } = await import('./ai-alert-thresholds-editor.vue')

    return mountSuspended(AiAlertThresholdsEditor, {
        props: {
            modelValue,
            metadata,
        },
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('AiAlertThresholdsEditor', () => {
    it('parses alert settings and serializes editor changes back to JSON', async () => {
        const wrapper = await mountComponent(JSON.stringify({
            enabled: true,
            quotaUsageRatios: [0.5, 0.8],
            costUsageRatios: [0.8],
            failureBurst: {
                enabled: true,
                windowMinutes: 12,
                maxFailures: 4,
                categories: ['image', 'tts'],
            },
            dedupeWindowMinutes: 120,
            maxAlerts: 5,
        }))

        await flushPromises()

        expect(wrapper.find('.ai-alert-thresholds-editor__error').exists()).toBe(false)

        const multiSelects = wrapper.findAll('.multi-select-stub')
        await multiSelects[0].setValue(['0.9', '1'])
        await multiSelects[1].setValue(['0.5', '1'])
        await multiSelects[2].setValue(['all', 'podcast'])

        const numberInputs = wrapper.findAll('.input-number-stub')
        await numberInputs[0].setValue('240')
        await numberInputs[1].setValue('9')
        await numberInputs[2].setValue('18')
        await numberInputs[3].setValue('6')

        const toggles = wrapper.findAll('.toggle-switch-stub')
        await toggles[1].setValue(false)
        await toggles[0].setValue(false)

        const latestModel = JSON.parse(String(wrapper.emitted('update:modelValue')?.at(-1)?.[0]))

        expect(latestModel).toEqual({
            enabled: false,
            quotaUsageRatios: [0.9, 1],
            costUsageRatios: [0.5, 1],
            failureBurst: {
                enabled: false,
                windowMinutes: 18,
                maxFailures: 6,
                categories: ['all', 'podcast'],
            },
            dedupeWindowMinutes: 240,
            maxAlerts: 9,
        })
    })

    it('falls back to raw JSON editing when the current value is invalid', async () => {
        const wrapper = await mountComponent('{invalid json')

        await flushPromises()

        expect(wrapper.text()).toContain('pages.admin.settings.system.ai_editor.invalid_alert_json')
        expect(wrapper.findAll('.toggle-switch-stub')).toHaveLength(0)

        await wrapper.get('#ai_alert_thresholds').setValue('{"enabled":false}')

        expect(JSON.parse(String(wrapper.emitted('update:modelValue')?.at(-1)?.[0]))).toEqual({
            enabled: false,
            quotaUsageRatios: [0.5, 0.8, 1],
            costUsageRatios: [0.8, 1],
            failureBurst: {
                enabled: true,
                windowMinutes: 10,
                maxFailures: 3,
                categories: ['image', 'asr', 'tts', 'podcast'],
            },
            dedupeWindowMinutes: 1440,
            maxAlerts: 10,
        })
    })

    it('disables interactive controls when metadata marks the setting as locked', async () => {
        const wrapper = await mountComponent('{}', { isLocked: true })

        await flushPromises()

        expect(wrapper.findAll('.toggle-switch-stub')[0].attributes('disabled')).toBeDefined()
        expect(wrapper.findAll('.multi-select-stub')[0].attributes('disabled')).toBeDefined()
        expect(wrapper.findAll('.input-number-stub')[0].attributes('disabled')).toBeDefined()
    })
})
