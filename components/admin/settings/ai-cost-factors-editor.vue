<template>
    <SettingFormField
        field-key="ai_cost_factors"
        input-id="ai_cost_factors"
        :label="$t('pages.admin.settings.system.keys.ai_cost_factors')"
        :description="$t('pages.admin.settings.system.hints.ai_cost_factors_description')"
        :metadata="metadata"
    >
        <div class="ai-cost-factors-editor">
            <template v-if="!costFactorsParseError">
                <div class="ai-cost-factors-editor__panel">
                    <div>
                        <h4 class="ai-cost-factors-editor__section-title">
                            {{ $t('pages.admin.settings.system.ai_editor.cost_mapping_title') }}
                        </h4>
                        <p class="ai-cost-factors-editor__section-description">
                            {{ $t('pages.admin.settings.system.ai_editor.cost_mapping_description') }}
                        </p>
                    </div>
                </div>

                <div class="ai-cost-factors-editor__grid">
                    <div class="ai-cost-factors-editor__field">
                        <label class="ai-cost-factors-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.currency_code') }}
                        </label>
                        <InputText
                            v-model="costFactorForm.currencyCode"
                            :disabled="isLocked"
                            fluid
                        />
                    </div>

                    <div class="ai-cost-factors-editor__field">
                        <label class="ai-cost-factors-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.currency_symbol') }}
                        </label>
                        <InputText
                            v-model="costFactorForm.currencySymbol"
                            :disabled="isLocked"
                            fluid
                        />
                    </div>

                    <div class="ai-cost-factors-editor__field">
                        <label class="ai-cost-factors-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.quota_unit_price') }}
                        </label>
                        <InputNumber
                            v-model="costFactorForm.quotaUnitPrice"
                            :disabled="isLocked"
                            :min="0"
                            :min-fraction-digits="2"
                            :max-fraction-digits="4"
                            :use-grouping="false"
                            fluid
                        />
                    </div>

                    <div class="ai-cost-factors-editor__field">
                        <label class="ai-cost-factors-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.usd_exchange_rate') }}
                        </label>
                        <InputNumber
                            v-model="costFactorForm.usdExchangeRate"
                            :disabled="isLocked"
                            :min="0.0001"
                            :min-fraction-digits="2"
                            :max-fraction-digits="6"
                            :use-grouping="false"
                            fluid
                        />
                    </div>

                    <div class="ai-cost-factors-editor__field">
                        <label class="ai-cost-factors-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.cny_exchange_rate') }}
                        </label>
                        <InputNumber
                            v-model="costFactorForm.cnyExchangeRate"
                            :disabled="isLocked"
                            :min="0.0001"
                            :min-fraction-digits="2"
                            :max-fraction-digits="6"
                            :use-grouping="false"
                            fluid
                        />
                    </div>
                </div>

                <p class="ai-cost-factors-editor__hint">
                    {{ $t('pages.admin.settings.system.ai_editor.cost_mapping_hint') }}
                </p>
            </template>

            <template v-else>
                <p class="ai-cost-factors-editor__error">
                    {{ costFactorsParseError }}
                </p>
                <Textarea
                    id="ai_cost_factors"
                    v-model="costFactors"
                    :disabled="isLocked"
                    rows="10"
                    auto-resize
                    fluid
                />
            </template>
        </div>
    </SettingFormField>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import { aiCostFactorsSchema } from '@/utils/schemas/ai'

type CostFactorFormState = {
    currencyCode: string
    currencySymbol: string
    quotaUnitPrice: number | null
    usdExchangeRate: number | null
    cnyExchangeRate: number | null
    providerCurrencies: Record<string, string>
}

interface SettingFieldMetadata {
    isLocked?: boolean
}

const costFactors = defineModel<string | null | undefined>({ required: true })

const props = withDefaults(defineProps<{
    metadata?: SettingFieldMetadata | null
}>(), {
    metadata: null,
})

const { t } = useI18n()

const defaultCostFactors = aiCostFactorsSchema.parse({})
const defaultUsdExchangeRate = defaultCostFactors.exchangeRates.USD ?? 1
const defaultCnyExchangeRate = defaultCostFactors.exchangeRates.CNY ?? 1
const costFactorsParseError = ref('')
const syncingCostEditors = ref(false)
const writingCostSettings = ref(false)

const costFactorForm = ref<CostFactorFormState>(createDefaultCostFactorForm())

const isLocked = computed(() => props.metadata?.isLocked ?? false)

function createDefaultCostFactorForm(): CostFactorFormState {
    return {
        currencyCode: defaultCostFactors.currencyCode,
        currencySymbol: defaultCostFactors.currencySymbol,
        quotaUnitPrice: defaultCostFactors.quotaUnitPrice,
        usdExchangeRate: defaultUsdExchangeRate,
        cnyExchangeRate: defaultCnyExchangeRate,
        providerCurrencies: {
            ...defaultCostFactors.providerCurrencies,
        },
    }
}

function syncCostEditorsFromSettings(rawValue: unknown) {
    syncingCostEditors.value = true

    try {
        const source = typeof rawValue === 'string' && rawValue.trim()
            ? rawValue
            : '{}'
        const parsed = JSON.parse(source)
        const result = aiCostFactorsSchema.safeParse(parsed)

        if (!result.success) {
            costFactorsParseError.value = t('pages.admin.settings.system.ai_editor.invalid_cost_json')
            costFactorForm.value = createDefaultCostFactorForm()
            return
        }

        costFactorsParseError.value = ''
        costFactorForm.value = {
            currencyCode: result.data.currencyCode,
            currencySymbol: result.data.currencySymbol,
            quotaUnitPrice: result.data.quotaUnitPrice,
            usdExchangeRate: result.data.exchangeRates.USD ?? defaultUsdExchangeRate,
            cnyExchangeRate: result.data.exchangeRates.CNY ?? defaultCnyExchangeRate,
            providerCurrencies: {
                ...defaultCostFactors.providerCurrencies,
                ...result.data.providerCurrencies,
            },
        }
    } catch {
        costFactorsParseError.value = t('pages.admin.settings.system.ai_editor.invalid_cost_json')
        costFactorForm.value = createDefaultCostFactorForm()
    } finally {
        syncingCostEditors.value = false
    }
}

function updateCostSettingsFromEditor() {
    if (syncingCostEditors.value) {
        return
    }

    writingCostSettings.value = true

    const normalizedCurrencyCode = costFactorForm.value.currencyCode.trim().toUpperCase() || defaultCostFactors.currencyCode
    const normalizedCurrencySymbol = costFactorForm.value.currencySymbol.trim() || defaultCostFactors.currencySymbol

    costFactors.value = JSON.stringify({
        currencyCode: normalizedCurrencyCode,
        currencySymbol: normalizedCurrencySymbol,
        quotaUnitPrice: costFactorForm.value.quotaUnitPrice ?? defaultCostFactors.quotaUnitPrice,
        exchangeRates: {
            USD: costFactorForm.value.usdExchangeRate ?? defaultUsdExchangeRate,
            CNY: costFactorForm.value.cnyExchangeRate ?? defaultCnyExchangeRate,
            [normalizedCurrencyCode]: 1,
        },
        providerCurrencies: costFactorForm.value.providerCurrencies,
    }, null, 2)
}

watch(() => costFactors.value, (value) => {
    if (writingCostSettings.value) {
        writingCostSettings.value = false
        return
    }

    syncCostEditorsFromSettings(value)
}, { immediate: true })

watch(costFactorForm, () => {
    updateCostSettingsFromEditor()
}, { deep: true })
</script>

<style lang="scss" scoped>
.ai-cost-factors-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__panel {
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-surface-0) 92%, var(--p-primary-100));
    }

    &__section-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    &__section-description {
        margin: 0.35rem 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__field-label {
        font-size: 0.9rem;
        font-weight: 600;
    }

    &__hint {
        margin: 0;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__error {
        margin: 0;
        color: var(--p-red-500);
        line-height: 1.5;
    }
}

@media (width <= 768px) {
    .ai-cost-factors-editor {
        &__grid {
            grid-template-columns: 1fr;
        }
    }
}
</style>
