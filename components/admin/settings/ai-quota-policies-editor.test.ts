import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useI18n', () => () => ({
    t: (key: string, params?: Record<string, unknown>) => {
        if (key === 'pages.admin.settings.system.ai_editor.basic_policy_label' && typeof params?.index === 'number') {
            return `Policy ${params.index}`
        }

        return key
    },
}))

const stubs = {
    SettingFormField: {
        template: '<div class="setting-form-field-stub" :data-field-key="fieldKey"><slot /></div>',
        props: ['fieldKey', 'inputId', 'label', 'description', 'metadata'],
    },
    Button: {
        template: '<button class="button-stub" type="button" :data-icon="icon" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
        props: ['icon', 'label', 'size', 'severity', 'text', 'disabled'],
        emits: ['click'],
    },
    Select: {
        template: `
            <select class="select-stub" :value="modelValue ?? ''" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)">
                <option
                    v-for="option in options"
                    :key="option[optionValue || 'value']"
                    :value="option[optionValue || 'value']"
                >
                    {{ option[optionLabel || 'label'] }}
                </option>
            </select>
        `,
        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'disabled', 'fluid'],
        emits: ['update:modelValue'],
    },
    InputText: {
        template: `<input class="input-text-stub" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['modelValue', 'disabled', 'fluid'],
        emits: ['update:modelValue'],
    },
    InputNumber: {
        template: `<input class="input-number-stub" type="number" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))" />`,
        props: ['modelValue', 'disabled', 'min', 'max', 'fluid', 'showButtons', 'useGrouping', 'minFractionDigits', 'maxFractionDigits'],
        emits: ['update:modelValue'],
    },
    ToggleSwitch: {
        template: '<input class="toggle-switch-stub" type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
    },
    Textarea: {
        template: `<textarea :id="id" class="textarea-stub" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['id', 'modelValue', 'disabled', 'rows', 'autoResize', 'fluid'],
        emits: ['update:modelValue'],
    },
    Accordion: {
        template: '<div class="accordion-stub"><slot /></div>',
        props: ['value'],
    },
    AccordionPanel: {
        template: '<div class="accordion-panel-stub"><slot /></div>',
        props: ['value'],
    },
    AccordionHeader: {
        template: '<div class="accordion-header-stub"><slot /></div>',
    },
    AccordionContent: {
        template: '<div class="accordion-content-stub"><slot /></div>',
    },
}

async function mountComponent(
    modelValue: string,
    onUpdateModelValue = vi.fn(),
    metadata: { isLocked?: boolean } = { isLocked: false },
) {
    const { default: AiQuotaPoliciesEditor } = await import('./ai-quota-policies-editor.vue')

    return mountSuspended(AiQuotaPoliciesEditor, {
        props: {
            modelValue,
            metadata,
            'onUpdate:modelValue': onUpdateModelValue,
        },
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('AiQuotaPoliciesEditor', () => {
    it('auto-creates a basic policy and serializes edits from both editors', async () => {
        const updateModelValue = vi.fn()
        const wrapper = await mountComponent('[]', updateModelValue)

        await flushPromises()

        expect(wrapper.findAll('.ai-quota-policies-editor__policy-card')).toHaveLength(1)
        expect(wrapper.find('.ai-quota-policies-editor__empty-state').exists()).toBe(false)

        let selects = wrapper.findAll('.select-stub')
        await selects[0].setValue('role')
        await flushPromises()

        selects = wrapper.findAll('.select-stub')
        await selects[1].setValue('admin')
        await selects[2].setValue('tts')
        await selects[3].setValue('month')

        const numberInputs = wrapper.findAll('.input-number-stub')
        await numberInputs[0].setValue('12')
        await numberInputs[1].setValue('34')
        await numberInputs[2].setValue('56.78')
        await numberInputs[3].setValue('2')

        const toggles = wrapper.findAll('.toggle-switch-stub')
        await toggles[0].setValue(false)
        await toggles[1].setValue(true)

        await wrapper.get('#ai_quota_policies').setValue(JSON.stringify([
            {
                subjectType: 'user',
                subjectValue: '42',
                scope: 'type:post',
                period: 'day',
                enabled: true,
            },
        ], null, 2))
        await flushPromises()

        const latestPayload = updateModelValue.mock.calls.at(-1)?.[0] as string

        expect(latestPayload).toContain('"subjectType": "role"')
        expect(latestPayload).toContain('"subjectValue": "admin"')
        expect(latestPayload).toContain('"scope": "tts"')
        expect(latestPayload).toContain('"period": "month"')
        expect(latestPayload).toContain('"maxRequests": 12')
        expect(latestPayload).toContain('"maxQuotaUnits": 34')
        expect(latestPayload).toContain('"maxActualCost": 56.78')
        expect(latestPayload).toContain('"maxConcurrentHeavyTasks": 2')
        expect(latestPayload).toContain('"enabled": false')
        expect(latestPayload).toContain('"isExempt": true')
        expect(latestPayload).toContain('"subjectType": "user"')
        expect(latestPayload).toContain('"scope": "type:post"')

        await wrapper.get('.button-stub[data-icon="pi pi-plus"]').trigger('click')
        await flushPromises()
        expect(wrapper.findAll('.ai-quota-policies-editor__policy-card')).toHaveLength(2)

        await wrapper.findAll('.button-stub[data-icon="pi pi-trash"]')[0].trigger('click')
        await flushPromises()
        expect(wrapper.findAll('.ai-quota-policies-editor__policy-card')).toHaveLength(1)
    })

    it('falls back to raw JSON editing when the current value cannot be parsed', async () => {
        const updateModelValue = vi.fn()
        const wrapper = await mountComponent('{invalid json', updateModelValue)

        await flushPromises()

        expect(wrapper.text()).toContain('pages.admin.settings.system.ai_editor.invalid_quota_json')
        expect(wrapper.findAll('.ai-quota-policies-editor__policy-card')).toHaveLength(0)

        const rawTextarea = wrapper.get('#ai_quota_policies')
        await rawTextarea.setValue('[{"subjectType":"global","subjectValue":"default","scope":"all","period":"day"}]')

        expect(updateModelValue).toHaveBeenCalledWith('[{"subjectType":"global","subjectValue":"default","scope":"all","period":"day"}]')
    })

    it('keeps the editor empty when settings are locked and there are no policies', async () => {
        const wrapper = await mountComponent('[]', vi.fn(), { isLocked: true })

        await flushPromises()

        expect(wrapper.findAll('.ai-quota-policies-editor__policy-card')).toHaveLength(0)
        expect(wrapper.find('.ai-quota-policies-editor__empty-state').exists()).toBe(true)
        expect(wrapper.get('.button-stub[data-icon="pi pi-plus"]').attributes('disabled')).toBeDefined()
    })
})
