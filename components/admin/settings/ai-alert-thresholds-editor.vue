<template>
    <SettingFormField
        field-key="ai_alert_thresholds"
        input-id="ai_alert_thresholds"
        :label="$t('pages.admin.settings.system.keys.ai_alert_thresholds')"
        :description="$t('pages.admin.settings.system.hints.ai_alert_thresholds_description')"
        :metadata="metadata"
    >
        <div class="ai-alert-thresholds-editor">
            <template v-if="!alertThresholdsParseError">
                <div class="ai-alert-thresholds-editor__toggle-field ai-alert-thresholds-editor__toggle-field--panel">
                    <div>
                        <h4 class="ai-alert-thresholds-editor__section-title">
                            {{ $t('pages.admin.settings.system.ai_editor.alerts_title') }}
                        </h4>
                        <p class="ai-alert-thresholds-editor__section-description">
                            {{ $t('pages.admin.settings.system.ai_editor.alerts_description') }}
                        </p>
                    </div>
                    <ToggleSwitch
                        v-model="alertThresholdForm.enabled"
                        :disabled="isLocked"
                    />
                </div>

                <div class="ai-alert-thresholds-editor__policy-grid">
                    <div class="ai-alert-thresholds-editor__field ai-alert-thresholds-editor__field--wide">
                        <label class="ai-alert-thresholds-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.quota_usage_ratios') }}
                        </label>
                        <MultiSelect
                            v-model="alertThresholdForm.quotaUsageRatios"
                            :options="quotaRatioOptions"
                            option-label="label"
                            option-value="value"
                            display="chip"
                            append-to="body"
                            :disabled="isLocked || !alertThresholdForm.enabled"
                            fluid
                        />
                    </div>

                    <div class="ai-alert-thresholds-editor__field ai-alert-thresholds-editor__field--wide">
                        <label class="ai-alert-thresholds-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.cost_usage_ratios') }}
                        </label>
                        <MultiSelect
                            v-model="alertThresholdForm.costUsageRatios"
                            :options="costRatioOptions"
                            option-label="label"
                            option-value="value"
                            display="chip"
                            append-to="body"
                            :disabled="isLocked || !alertThresholdForm.enabled"
                            fluid
                        />
                    </div>

                    <div class="ai-alert-thresholds-editor__field">
                        <label class="ai-alert-thresholds-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.dedupe_window_minutes') }}
                        </label>
                        <InputNumber
                            v-model="alertThresholdForm.dedupeWindowMinutes"
                            :disabled="isLocked || !alertThresholdForm.enabled"
                            :min="1"
                            :max="44640"
                            fluid
                            show-buttons
                            :use-grouping="false"
                        />
                    </div>

                    <div class="ai-alert-thresholds-editor__field">
                        <label class="ai-alert-thresholds-editor__field-label">
                            {{ $t('pages.admin.settings.system.ai_editor.max_alerts') }}
                        </label>
                        <InputNumber
                            v-model="alertThresholdForm.maxAlerts"
                            :disabled="isLocked || !alertThresholdForm.enabled"
                            :min="1"
                            :max="100"
                            fluid
                            show-buttons
                            :use-grouping="false"
                        />
                    </div>
                </div>

                <div class="ai-alert-thresholds-editor__subsection">
                    <div class="ai-alert-thresholds-editor__toggle-field ai-alert-thresholds-editor__toggle-field--panel">
                        <div>
                            <h5 class="ai-alert-thresholds-editor__policy-card-title">
                                {{ $t('pages.admin.settings.system.ai_editor.failure_burst_title') }}
                            </h5>
                            <p class="ai-alert-thresholds-editor__policy-card-description">
                                {{ $t('pages.admin.settings.system.ai_editor.failure_burst_description') }}
                            </p>
                        </div>
                        <ToggleSwitch
                            v-model="alertThresholdForm.failureBurst.enabled"
                            :disabled="isLocked || !alertThresholdForm.enabled"
                        />
                    </div>

                    <div class="ai-alert-thresholds-editor__policy-grid">
                        <div class="ai-alert-thresholds-editor__field">
                            <label class="ai-alert-thresholds-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.window_minutes') }}
                            </label>
                            <InputNumber
                                v-model="alertThresholdForm.failureBurst.windowMinutes"
                                :disabled="isLocked || !alertThresholdForm.enabled || !alertThresholdForm.failureBurst.enabled"
                                :min="1"
                                :max="1440"
                                fluid
                                show-buttons
                                :use-grouping="false"
                            />
                        </div>

                        <div class="ai-alert-thresholds-editor__field">
                            <label class="ai-alert-thresholds-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.max_failures') }}
                            </label>
                            <InputNumber
                                v-model="alertThresholdForm.failureBurst.maxFailures"
                                :disabled="isLocked || !alertThresholdForm.enabled || !alertThresholdForm.failureBurst.enabled"
                                :min="1"
                                :max="1000"
                                fluid
                                show-buttons
                                :use-grouping="false"
                            />
                        </div>

                        <div class="ai-alert-thresholds-editor__field ai-alert-thresholds-editor__field--wide">
                            <label class="ai-alert-thresholds-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.failure_categories') }}
                            </label>
                            <MultiSelect
                                v-model="alertThresholdForm.failureBurst.categories"
                                :options="alertCategoryOptions"
                                option-label="label"
                                option-value="value"
                                display="chip"
                                append-to="body"
                                :disabled="isLocked || !alertThresholdForm.enabled || !alertThresholdForm.failureBurst.enabled"
                                fluid
                            />
                        </div>
                    </div>
                </div>
            </template>

            <template v-else>
                <p class="ai-alert-thresholds-editor__error">
                    {{ alertThresholdsParseError }}
                </p>
                <Textarea
                    id="ai_alert_thresholds"
                    v-model="alertThresholds"
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
import { aiAlertThresholdsSchema } from '@/utils/schemas/ai'

type AlertThresholdFormState = {
    enabled: boolean
    quotaUsageRatios: number[]
    costUsageRatios: number[]
    failureBurst: {
        enabled: boolean
        windowMinutes: number | null
        maxFailures: number | null
        categories: Array<'all' | 'text' | 'image' | 'asr' | 'tts' | 'podcast'>
    }
    dedupeWindowMinutes: number | null
    maxAlerts: number | null
}

interface SettingFieldMetadata {
    isLocked?: boolean
}

const alertThresholds = defineModel<string | null | undefined>({ required: true })

const props = withDefaults(defineProps<{
    metadata?: SettingFieldMetadata | null
}>(), {
    metadata: null,
})

const { t } = useI18n()

const defaultAlertThresholds = aiAlertThresholdsSchema.parse({})

const alertThresholdsParseError = ref('')
const syncingAlertEditors = ref(false)
const writingAlertSettings = ref(false)

const alertThresholdForm = ref<AlertThresholdFormState>(createDefaultAlertThresholdForm())

const isLocked = computed(() => props.metadata?.isLocked ?? false)

const quotaRatioOptions = computed(() => createRatioOptions([0.5, 0.8, 0.9, 1], alertThresholdForm.value.quotaUsageRatios))
const costRatioOptions = computed(() => createRatioOptions([0.5, 0.8, 0.9, 1], alertThresholdForm.value.costUsageRatios))

const alertCategoryOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.scope_all'), value: 'all' },
    { label: t('pages.admin.settings.system.ai_editor.scope_text'), value: 'text' },
    { label: t('pages.admin.settings.system.ai_editor.scope_image'), value: 'image' },
    { label: t('pages.admin.settings.system.ai_editor.scope_asr'), value: 'asr' },
    { label: t('pages.admin.settings.system.ai_editor.scope_tts'), value: 'tts' },
    { label: t('pages.admin.settings.system.ai_editor.scope_podcast'), value: 'podcast' },
])

function createDefaultAlertThresholdForm(): AlertThresholdFormState {
    return {
        enabled: defaultAlertThresholds.enabled ?? true,
        quotaUsageRatios: [...(defaultAlertThresholds.quotaUsageRatios ?? [0.5, 0.8, 1])],
        costUsageRatios: [...(defaultAlertThresholds.costUsageRatios ?? [0.8, 1])],
        failureBurst: {
            enabled: defaultAlertThresholds.failureBurst?.enabled ?? true,
            windowMinutes: defaultAlertThresholds.failureBurst?.windowMinutes ?? 10,
            maxFailures: defaultAlertThresholds.failureBurst?.maxFailures ?? 3,
            categories: [...(defaultAlertThresholds.failureBurst?.categories ?? ['image', 'asr', 'tts', 'podcast'])],
        },
        dedupeWindowMinutes: defaultAlertThresholds.dedupeWindowMinutes ?? 1440,
        maxAlerts: defaultAlertThresholds.maxAlerts ?? 10,
    }
}

function sanitizeRatioValues(values: number[], fallback: number[]): number[] {
    const normalized = Array.from(new Set(values.filter((value) => value > 0 && value <= 1))).sort((left, right) => left - right)
    return normalized.length ? normalized : [...fallback]
}

function createRatioOptions(baseValues: number[], selectedValues: number[]) {
    const values = Array.from(new Set([...baseValues, ...selectedValues])).sort((left, right) => left - right)
    return values.map((value) => ({
        label: `${Math.round(value * 100)}%`,
        value,
    }))
}

function syncAlertEditorFromSettings(rawValue: unknown) {
    syncingAlertEditors.value = true

    try {
        const source = typeof rawValue === 'string' && rawValue.trim()
            ? rawValue
            : '{}'
        const parsed = JSON.parse(source)
        const result = aiAlertThresholdsSchema.safeParse(parsed)

        if (!result.success) {
            alertThresholdsParseError.value = t('pages.admin.settings.system.ai_editor.invalid_alert_json')
            alertThresholdForm.value = createDefaultAlertThresholdForm()
            return
        }

        alertThresholdsParseError.value = ''

        alertThresholdForm.value = {
            enabled: result.data.enabled ?? true,
            quotaUsageRatios: sanitizeRatioValues(result.data.quotaUsageRatios ?? [], defaultAlertThresholds.quotaUsageRatios ?? [0.5, 0.8, 1]),
            costUsageRatios: sanitizeRatioValues(result.data.costUsageRatios ?? [], defaultAlertThresholds.costUsageRatios ?? [0.8, 1]),
            failureBurst: {
                enabled: result.data.failureBurst?.enabled ?? true,
                windowMinutes: result.data.failureBurst?.windowMinutes ?? 10,
                maxFailures: result.data.failureBurst?.maxFailures ?? 3,
                categories: [...(result.data.failureBurst?.categories ?? ['image', 'asr', 'tts', 'podcast'])],
            },
            dedupeWindowMinutes: result.data.dedupeWindowMinutes ?? 1440,
            maxAlerts: result.data.maxAlerts ?? 10,
        }
    } catch {
        alertThresholdsParseError.value = t('pages.admin.settings.system.ai_editor.invalid_alert_json')
        alertThresholdForm.value = createDefaultAlertThresholdForm()
    } finally {
        syncingAlertEditors.value = false
    }
}

function updateAlertSettingsFromEditor() {
    if (syncingAlertEditors.value) {
        return
    }

    writingAlertSettings.value = true
    alertThresholds.value = JSON.stringify({
        enabled: alertThresholdForm.value.enabled,
        quotaUsageRatios: sanitizeRatioValues(alertThresholdForm.value.quotaUsageRatios, defaultAlertThresholds.quotaUsageRatios ?? [0.5, 0.8, 1]),
        costUsageRatios: sanitizeRatioValues(alertThresholdForm.value.costUsageRatios, defaultAlertThresholds.costUsageRatios ?? [0.8, 1]),
        failureBurst: {
            enabled: alertThresholdForm.value.failureBurst.enabled,
            windowMinutes: alertThresholdForm.value.failureBurst.windowMinutes ?? 10,
            maxFailures: alertThresholdForm.value.failureBurst.maxFailures ?? 3,
            categories: alertThresholdForm.value.failureBurst.categories.length
                ? alertThresholdForm.value.failureBurst.categories
                : [...(defaultAlertThresholds.failureBurst?.categories ?? ['image', 'asr', 'tts', 'podcast'])],
        },
        dedupeWindowMinutes: alertThresholdForm.value.dedupeWindowMinutes ?? 1440,
        maxAlerts: alertThresholdForm.value.maxAlerts ?? 10,
    }, null, 2)
}

watch(() => alertThresholds.value, (value) => {
    if (writingAlertSettings.value) {
        writingAlertSettings.value = false
        return
    }

    syncAlertEditorFromSettings(value)
}, { immediate: true })

watch(alertThresholdForm, () => {
    updateAlertSettingsFromEditor()
}, { deep: true })
</script>

<style lang="scss" scoped>
.ai-alert-thresholds-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__section-title,
    &__policy-card-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    &__section-description,
    &__policy-card-description {
        margin: 0.35rem 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__policy-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__field--wide {
        grid-column: 1 / -1;
    }

    &__field-label {
        font-size: 0.9rem;
        font-weight: 600;
    }

    &__subsection {
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-surface-0) 92%, var(--p-primary-100));
    }

    &__toggle-field {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 0.875rem;
        background: var(--p-surface-0);
    }

    &__toggle-field--panel {
        padding: 1rem;
        align-items: flex-start;
    }

    &__error {
        margin: 0;
        color: var(--p-red-500);
        line-height: 1.5;
    }
}

@media (width <= 768px) {
    .ai-alert-thresholds-editor {
        &__toggle-field,
        &__toggle-field--panel {
            flex-direction: column;
            align-items: stretch;
        }

        &__policy-grid {
            grid-template-columns: 1fr;
        }
    }
}
</style>
