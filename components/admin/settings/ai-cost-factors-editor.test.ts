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
    InputText: {
        template: `<input class="input-text-stub" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['modelValue', 'disabled', 'fluid'],
        emits: ['update:modelValue'],
    },
    InputNumber: {
        template: `<input class="input-number-stub" type="number" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))" />`,
        props: ['modelValue', 'disabled', 'min', 'minFractionDigits', 'maxFractionDigits', 'useGrouping', 'fluid'],
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
    const { default: AiCostFactorsEditor } = await import('./ai-cost-factors-editor.vue')

    return mountSuspended(AiCostFactorsEditor, {
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

describe('AiCostFactorsEditor', () => {
    it('parses cost factors and serializes normalized editor updates', async () => {
        const wrapper = await mountComponent(JSON.stringify({
            currencyCode: 'usd',
            currencySymbol: '$',
            quotaUnitPrice: 0.2,
            exchangeRates: {
                USD: 1,
                CNY: 7.2,
            },
            providerCurrencies: {
                openai: 'USD',
                siliconflow: 'CNY',
            },
        }))

        await flushPromises()

        expect(wrapper.find('.ai-cost-factors-editor__error').exists()).toBe(false)

        const textInputs = wrapper.findAll('.input-text-stub')
        await textInputs[0].setValue(' eur ')
        await textInputs[1].setValue(' € ')

        const numberInputs = wrapper.findAll('.input-number-stub')
        await numberInputs[0].setValue('0.35')
        await numberInputs[1].setValue('1.08')
        await numberInputs[2].setValue('7.88')

        const latestModel = JSON.parse(String(wrapper.emitted('update:modelValue')?.at(-1)?.[0]))

        expect(latestModel).toEqual({
            currencyCode: 'EUR',
            currencySymbol: '€',
            quotaUnitPrice: 0.35,
            exchangeRates: {
                USD: 1.08,
                CNY: 7.88,
                EUR: 1,
            },
            providerCurrencies: expect.objectContaining({
                openai: 'USD',
                siliconflow: 'CNY',
            }),
        })
    })

    it('falls back to raw JSON editing when the current value is invalid', async () => {
        const wrapper = await mountComponent('{invalid json')

        await flushPromises()

        expect(wrapper.text()).toContain('pages.admin.settings.system.ai_editor.invalid_cost_json')
        expect(wrapper.findAll('.input-text-stub')).toHaveLength(0)

        await wrapper.get('#ai_cost_factors').setValue('{"currencyCode":"GBP"}')

        expect(JSON.parse(String(wrapper.emitted('update:modelValue')?.at(-1)?.[0]))).toEqual({
            currencyCode: 'GBP',
            currencySymbol: '¥',
            quotaUnitPrice: 0.1,
            exchangeRates: {
                USD: 7.2,
                CNY: 1,
                GBP: 1,
            },
            providerCurrencies: expect.objectContaining({
                openai: 'USD',
                siliconflow: 'CNY',
            }),
        })
    })

    it('disables editor controls when the field is locked', async () => {
        const wrapper = await mountComponent('{}', { isLocked: true })

        await flushPromises()

        expect(wrapper.findAll('.input-text-stub')[0].attributes('disabled')).toBeDefined()
        expect(wrapper.findAll('.input-number-stub')[0].attributes('disabled')).toBeDefined()
    })
})
