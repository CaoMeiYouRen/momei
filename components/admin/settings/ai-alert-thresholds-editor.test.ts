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
            isSelected(this: { modelValue?: unknown[] }, value: unknown) {
                return Array.isArray(this.modelValue) && this.modelValue.includes(value)
            },
            handleChange(this: {
                options?: Record<string, unknown>[]
                optionValue?: string
                $emit: (event: 'update:modelValue', values: unknown[]) => void
            }, event: Event) {
                const values = Array.from((event.target as HTMLSelectElement).selectedOptions).map((option) => {
                    const matchedOption = this.options?.find((item: Record<string, unknown>) => String(item[this.optionValue || 'value']) === option.value)
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
        expect(multiSelects).toHaveLength(3)
        const quotaRatiosSelect = multiSelects.at(0)
        const costRatiosSelect = multiSelects.at(1)
        const categoriesSelect = multiSelects.at(2)

        if (!quotaRatiosSelect || !costRatiosSelect || !categoriesSelect) {
            throw new Error('expected multi-select stubs to be rendered')
        }

        await quotaRatiosSelect.setValue(['0.9', '1'])
        await costRatiosSelect.setValue(['0.5', '1'])
        await categoriesSelect.setValue(['all', 'podcast'])

        const numberInputs = wrapper.findAll('.input-number-stub')
        expect(numberInputs).toHaveLength(4)
        const dedupeWindowInput = numberInputs.at(0)
        const maxAlertsInput = numberInputs.at(1)
        const failureWindowInput = numberInputs.at(2)
        const failureCountInput = numberInputs.at(3)

        if (!dedupeWindowInput || !maxAlertsInput || !failureWindowInput || !failureCountInput) {
            throw new Error('expected number input stubs to be rendered')
        }

        await dedupeWindowInput.setValue('240')
        await maxAlertsInput.setValue('9')
        await failureWindowInput.setValue('18')
        await failureCountInput.setValue('6')

        const toggles = wrapper.findAll('.toggle-switch-stub')
        expect(toggles).toHaveLength(2)
        const alertToggle = toggles.at(0)
        const failureBurstToggle = toggles.at(1)

        if (!alertToggle || !failureBurstToggle) {
            throw new Error('expected toggle stubs to be rendered')
        }

        await failureBurstToggle.setValue(false)
        await alertToggle.setValue(false)

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

        const toggle = wrapper.findAll('.toggle-switch-stub').at(0)
        const multiSelect = wrapper.findAll('.multi-select-stub').at(0)
        const numberInput = wrapper.findAll('.input-number-stub').at(0)

        if (!toggle || !multiSelect || !numberInput) {
            throw new Error('expected locked editor controls to be rendered')
        }

        expect(toggle.attributes('disabled')).toBeDefined()
        expect(multiSelect.attributes('disabled')).toBeDefined()
        expect(numberInput.attributes('disabled')).toBeDefined()
    })
})
