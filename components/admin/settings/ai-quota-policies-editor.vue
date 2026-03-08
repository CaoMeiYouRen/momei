<template>
    <SettingFormField
        field-key="ai_quota_policies"
        input-id="ai_quota_policies"
        :label="$t('pages.admin.settings.system.keys.ai_quota_policies')"
        :description="$t('pages.admin.settings.system.hints.ai_quota_policies_description')"
        :metadata="metadata"
    >
        <div class="ai-quota-policies-editor">
            <template v-if="!quotaPoliciesParseError">
                <div class="ai-quota-policies-editor__section-header">
                    <div>
                        <h4 class="ai-quota-policies-editor__section-title">
                            {{ $t('pages.admin.settings.system.ai_editor.basic_quota_title') }}
                        </h4>
                        <p class="ai-quota-policies-editor__section-description">
                            {{ $t('pages.admin.settings.system.ai_editor.basic_quota_description') }}
                        </p>
                    </div>
                    <Button
                        icon="pi pi-plus"
                        :label="$t('pages.admin.settings.system.ai_editor.add_basic_policy')"
                        size="small"
                        :disabled="isLocked"
                        @click="addBasicQuotaPolicy"
                    />
                </div>

                <div v-if="!basicQuotaPolicies.length" class="ai-quota-policies-editor__empty-state">
                    {{ $t('pages.admin.settings.system.ai_editor.basic_quota_empty') }}
                </div>

                <div
                    v-for="(policy, index) in basicQuotaPolicies"
                    :key="`quota-policy-${index}`"
                    class="ai-quota-policies-editor__policy-card"
                >
                    <div class="ai-quota-policies-editor__policy-card-header">
                        <div>
                            <h5 class="ai-quota-policies-editor__policy-card-title">
                                {{ $t('pages.admin.settings.system.ai_editor.basic_policy_label', {index: index + 1}) }}
                            </h5>
                            <p class="ai-quota-policies-editor__policy-card-description">
                                {{ $t('pages.admin.settings.system.ai_editor.basic_policy_help') }}
                            </p>
                        </div>
                        <Button
                            icon="pi pi-trash"
                            severity="secondary"
                            text
                            size="small"
                            :disabled="isLocked"
                            @click="removeBasicQuotaPolicy(index)"
                        />
                    </div>

                    <div class="ai-quota-policies-editor__policy-grid">
                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.subject_type') }}
                            </label>
                            <Select
                                v-model="policy.subjectType"
                                :options="basicSubjectTypeOptions"
                                option-label="label"
                                option-value="value"
                                :disabled="isLocked"
                                fluid
                                @update:model-value="onBasicPolicySubjectTypeChange(policy)"
                            />
                        </div>

                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.subject_value') }}
                            </label>
                            <Select
                                v-if="policy.subjectType === 'role'"
                                v-model="policy.subjectValue"
                                :options="roleOptions"
                                option-label="label"
                                option-value="value"
                                :disabled="isLocked"
                                fluid
                            />
                            <InputText
                                v-else
                                v-model="policy.subjectValue"
                                :disabled="true"
                                fluid
                            />
                        </div>

                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.scope') }}
                            </label>
                            <Select
                                v-model="policy.scope"
                                :options="quotaScopeOptions"
                                option-label="label"
                                option-value="value"
                                :disabled="isLocked"
                                fluid
                            />
                        </div>

                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.period') }}
                            </label>
                            <Select
                                v-model="policy.period"
                                :options="quotaPeriodOptions"
                                option-label="label"
                                option-value="value"
                                :disabled="isLocked"
                                fluid
                            />
                        </div>

                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.max_requests') }}
                            </label>
                            <InputNumber
                                v-model="policy.maxRequests"
                                :disabled="isLocked"
                                :min="0"
                                fluid
                                show-buttons
                                :use-grouping="false"
                            />
                        </div>

                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.max_quota_units') }}
                            </label>
                            <InputNumber
                                v-model="policy.maxQuotaUnits"
                                :disabled="isLocked"
                                :min="0"
                                fluid
                                show-buttons
                                :use-grouping="false"
                            />
                        </div>

                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.max_actual_cost') }}
                            </label>
                            <InputNumber
                                v-model="policy.maxActualCost"
                                :disabled="isLocked"
                                :min="0"
                                :min-fraction-digits="2"
                                :max-fraction-digits="2"
                                fluid
                                :use-grouping="false"
                            />
                        </div>

                        <div class="ai-quota-policies-editor__field">
                            <label class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.max_concurrent_heavy_tasks') }}
                            </label>
                            <InputNumber
                                v-model="policy.maxConcurrentHeavyTasks"
                                :disabled="isLocked"
                                :min="0"
                                fluid
                                show-buttons
                                :use-grouping="false"
                            />
                        </div>
                    </div>

                    <div class="ai-quota-policies-editor__policy-flags">
                        <div class="ai-quota-policies-editor__toggle-field">
                            <span class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.enabled') }}
                            </span>
                            <ToggleSwitch
                                v-model="policy.enabled"
                                :disabled="isLocked"
                            />
                        </div>

                        <div class="ai-quota-policies-editor__toggle-field">
                            <span class="ai-quota-policies-editor__field-label">
                                {{ $t('pages.admin.settings.system.ai_editor.is_exempt') }}
                            </span>
                            <ToggleSwitch
                                v-model="policy.isExempt"
                                :disabled="isLocked"
                            />
                        </div>
                    </div>
                </div>

                <Accordion value="advanced-json">
                    <AccordionPanel value="advanced-json">
                        <AccordionHeader>
                            {{ $t('pages.admin.settings.system.ai_editor.advanced_json_title') }}
                        </AccordionHeader>
                        <AccordionContent>
                            <p class="ai-quota-policies-editor__section-description ai-quota-policies-editor__section-description--spaced">
                                {{ $t('pages.admin.settings.system.ai_editor.advanced_json_description') }}
                            </p>
                            <Textarea
                                id="ai_quota_policies"
                                v-model="advancedQuotaPoliciesJson"
                                :disabled="isLocked"
                                rows="12"
                                auto-resize
                                fluid
                            />
                            <p v-if="advancedQuotaPoliciesError" class="ai-quota-policies-editor__error">
                                {{ advancedQuotaPoliciesError }}
                            </p>
                        </AccordionContent>
                    </AccordionPanel>
                </Accordion>
            </template>

            <template v-else>
                <p class="ai-quota-policies-editor__error">
                    {{ quotaPoliciesParseError }}
                </p>
                <Textarea
                    id="ai_quota_policies"
                    v-model="quotaPolicies"
                    :disabled="isLocked"
                    rows="14"
                    auto-resize
                    fluid
                />
            </template>
        </div>
    </SettingFormField>
</template>

<script setup lang="ts">
import type {
    AIQuotaPolicy,
    AIQuotaPolicyPeriod,
    AIQuotaPolicyScope,
    AIQuotaPolicySubjectType,
} from '@/types/ai'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import { aiQuotaPoliciesSchema } from '@/utils/schemas/ai'

type BasicQuotaPolicy = {
    subjectType: Extract<AIQuotaPolicySubjectType, 'global' | 'role'>
    subjectValue: string
    scope: AIQuotaPolicyScope
    period: AIQuotaPolicyPeriod
    maxRequests: number | null
    maxQuotaUnits: number | null
    maxActualCost: number | null
    maxConcurrentHeavyTasks: number | null
    isExempt: boolean
    enabled: boolean
}

type ParsedQuotaPolicy = Omit<AIQuotaPolicy, 'scope'> & {
    scope: string
}

interface SettingFieldMetadata {
    isLocked?: boolean
}

const quotaPolicies = defineModel<string | null | undefined>({ required: true })

const props = withDefaults(defineProps<{
    metadata?: SettingFieldMetadata | null
}>(), {
    metadata: null,
})

const { t } = useI18n()

const basicQuotaPolicies = ref<BasicQuotaPolicy[]>([])
const advancedQuotaPoliciesJson = ref('[]')
const advancedQuotaPoliciesError = ref('')
const quotaPoliciesParseError = ref('')
const syncingQuotaEditors = ref(false)
const writingQuotaSettings = ref(false)

const isLocked = computed(() => props.metadata?.isLocked ?? false)

const basicSubjectTypeOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.subject_type_global'), value: 'global' },
    { label: t('pages.admin.settings.system.ai_editor.subject_type_role'), value: 'role' },
])

const roleOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.role_user'), value: 'user' },
    { label: t('pages.admin.settings.system.ai_editor.role_author'), value: 'author' },
    { label: t('pages.admin.settings.system.ai_editor.role_admin'), value: 'admin' },
    { label: t('pages.admin.settings.system.ai_editor.role_editor'), value: 'editor' },
    { label: t('pages.admin.settings.system.ai_editor.role_subscriber'), value: 'subscriber' },
])

const quotaScopeOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.scope_all'), value: 'all' },
    { label: t('pages.admin.settings.system.ai_editor.scope_text'), value: 'text' },
    { label: t('pages.admin.settings.system.ai_editor.scope_image'), value: 'image' },
    { label: t('pages.admin.settings.system.ai_editor.scope_asr'), value: 'asr' },
    { label: t('pages.admin.settings.system.ai_editor.scope_tts'), value: 'tts' },
    { label: t('pages.admin.settings.system.ai_editor.scope_podcast'), value: 'podcast' },
])

const quotaPeriodOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.period_day'), value: 'day' },
    { label: t('pages.admin.settings.system.ai_editor.period_month'), value: 'month' },
])

function createDefaultBasicQuotaPolicy(): BasicQuotaPolicy {
    return {
        subjectType: 'global',
        subjectValue: 'default',
        scope: 'all',
        period: 'day',
        maxRequests: null,
        maxQuotaUnits: null,
        maxActualCost: null,
        maxConcurrentHeavyTasks: null,
        isExempt: false,
        enabled: true,
    }
}

function normalizeNumber(value?: number | null): number | null {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return null
    }

    return value
}

function serializeQuotaPolicies(basicPolicies: BasicQuotaPolicy[], advancedPolicies: AIQuotaPolicy[]) {
    const basic = basicPolicies.map((policy) => {
        const serialized: AIQuotaPolicy = {
            subjectType: policy.subjectType,
            subjectValue: policy.subjectType === 'global' ? 'default' : policy.subjectValue,
            scope: policy.scope,
            period: policy.period,
            enabled: policy.enabled,
            isExempt: policy.isExempt,
        }

        if (policy.maxRequests !== null) {
            serialized.maxRequests = policy.maxRequests
        }

        if (policy.maxQuotaUnits !== null) {
            serialized.maxQuotaUnits = policy.maxQuotaUnits
        }

        if (policy.maxActualCost !== null) {
            serialized.maxActualCost = policy.maxActualCost
        }

        if (policy.maxConcurrentHeavyTasks !== null) {
            serialized.maxConcurrentHeavyTasks = policy.maxConcurrentHeavyTasks
        }

        return serialized
    })

    return JSON.stringify([...basic, ...advancedPolicies], null, 2)
}

function normalizeParsedQuotaPolicy(policy: ParsedQuotaPolicy): AIQuotaPolicy {
    return {
        ...policy,
        scope: policy.scope as AIQuotaPolicyScope,
    }
}

function syncQuotaEditorsFromSettings(rawValue: unknown) {
    syncingQuotaEditors.value = true

    try {
        const source = typeof rawValue === 'string' && rawValue.trim()
            ? rawValue
            : '[]'
        const parsed = JSON.parse(source)
        const result = aiQuotaPoliciesSchema.safeParse(parsed)

        if (!result.success) {
            quotaPoliciesParseError.value = t('pages.admin.settings.system.ai_editor.invalid_quota_json')
            basicQuotaPolicies.value = []
            advancedQuotaPoliciesJson.value = source
            return
        }

        quotaPoliciesParseError.value = ''
        advancedQuotaPoliciesError.value = ''

        const normalizedPolicies = result.data.map((policy) => normalizeParsedQuotaPolicy(policy as ParsedQuotaPolicy))
        const basicPolicies = normalizedPolicies.filter((policy) => policy.subjectType === 'global' || policy.subjectType === 'role')
        const advancedPolicies = normalizedPolicies.filter((policy) => {
            return policy.subjectType === 'user'
                || policy.subjectType === 'trust_level'
                || String(policy.scope).startsWith('type:')
        })

        basicQuotaPolicies.value = basicPolicies.map((policy) => ({
            subjectType: policy.subjectType as BasicQuotaPolicy['subjectType'],
            subjectValue: policy.subjectType === 'global' ? 'default' : policy.subjectValue,
            scope: policy.scope,
            period: policy.period,
            maxRequests: normalizeNumber(policy.maxRequests),
            maxQuotaUnits: normalizeNumber(policy.maxQuotaUnits),
            maxActualCost: normalizeNumber(policy.maxActualCost),
            maxConcurrentHeavyTasks: normalizeNumber(policy.maxConcurrentHeavyTasks),
            isExempt: policy.isExempt ?? false,
            enabled: policy.enabled ?? true,
        }))
        advancedQuotaPoliciesJson.value = JSON.stringify(advancedPolicies, null, 2)
    } catch {
        quotaPoliciesParseError.value = t('pages.admin.settings.system.ai_editor.invalid_quota_json')
        basicQuotaPolicies.value = []
        advancedQuotaPoliciesJson.value = typeof rawValue === 'string' ? rawValue : '[]'
    } finally {
        syncingQuotaEditors.value = false
    }
}

function updateQuotaSettingsFromEditors() {
    if (syncingQuotaEditors.value) {
        return
    }

    try {
        const parsedAdvanced = JSON.parse(advancedQuotaPoliciesJson.value || '[]')
        const result = aiQuotaPoliciesSchema.safeParse(parsedAdvanced)

        if (!result.success) {
            advancedQuotaPoliciesError.value = t('pages.admin.settings.system.ai_editor.invalid_advanced_json')
            writingQuotaSettings.value = true
            quotaPolicies.value = advancedQuotaPoliciesJson.value
            return
        }

        advancedQuotaPoliciesError.value = ''
        const advancedPolicies = result.data.map((policy) => normalizeParsedQuotaPolicy(policy as ParsedQuotaPolicy))
        writingQuotaSettings.value = true
        quotaPolicies.value = serializeQuotaPolicies(basicQuotaPolicies.value, advancedPolicies)
    } catch {
        advancedQuotaPoliciesError.value = t('pages.admin.settings.system.ai_editor.invalid_advanced_json')
        writingQuotaSettings.value = true
        quotaPolicies.value = advancedQuotaPoliciesJson.value
    }
}

function hasAdvancedPolicies() {
    try {
        const parsed = JSON.parse(advancedQuotaPoliciesJson.value || '[]')
        return Array.isArray(parsed) && parsed.length > 0
    } catch {
        return Boolean(advancedQuotaPoliciesJson.value.trim())
    }
}

function addBasicQuotaPolicy() {
    basicQuotaPolicies.value = [...basicQuotaPolicies.value, createDefaultBasicQuotaPolicy()]
}

function removeBasicQuotaPolicy(index: number) {
    basicQuotaPolicies.value = basicQuotaPolicies.value.filter((_, itemIndex) => itemIndex !== index)
}

function onBasicPolicySubjectTypeChange(policy: BasicQuotaPolicy) {
    if (policy.subjectType === 'global') {
        policy.subjectValue = 'default'
        return
    }

    if (!roleOptions.value.some((option) => option.value === policy.subjectValue)) {
        policy.subjectValue = 'user'
    }
}

watch(() => quotaPolicies.value, (value) => {
    if (writingQuotaSettings.value) {
        writingQuotaSettings.value = false
        return
    }

    syncQuotaEditorsFromSettings(value)
}, { immediate: true })

watch(basicQuotaPolicies, () => {
    updateQuotaSettingsFromEditors()
}, { deep: true })

watch(advancedQuotaPoliciesJson, () => {
    updateQuotaSettingsFromEditors()
})

onMounted(() => {
    if (!isLocked.value && !basicQuotaPolicies.value.length && !hasAdvancedPolicies()) {
        basicQuotaPolicies.value = [createDefaultBasicQuotaPolicy()]
    }
})
</script>

<style lang="scss" scoped>
.ai-quota-policies-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__section-header,
    &__policy-card-header,
    &__toggle-field {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
    }

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

    &__section-description--spaced {
        margin-bottom: 1rem;
    }

    &__empty-state,
    &__policy-card {
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-surface-0) 92%, var(--p-primary-100));
    }

    &__policy-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 1rem;
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

    &__policy-flags {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    &__toggle-field {
        padding: 0.875rem 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 0.875rem;
        background: var(--p-surface-0);
    }

    &__error {
        margin: 0;
        color: var(--p-red-500);
        line-height: 1.5;
    }
}

@media (width <= 768px) {
    .ai-quota-policies-editor {
        &__section-header,
        &__policy-card-header,
        &__toggle-field {
            flex-direction: column;
            align-items: stretch;
        }

        &__policy-grid {
            grid-template-columns: 1fr;
        }
    }
}
</style>
