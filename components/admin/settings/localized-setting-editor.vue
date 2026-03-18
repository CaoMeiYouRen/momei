<template>
    <SettingFormField
        :field-key="fieldKey"
        :input-id="inputId"
        :metadata="metadata"
        :description="description"
    >
        <div class="localized-setting-editor">
            <div class="localized-setting-editor__toolbar">
                <div class="localized-setting-editor__toolbar-copy">
                    <span class="localized-setting-editor__badge">{{ localizedBadgeLabel }}</span>
                    <span class="localized-setting-editor__helper">{{ localizedHelperLabel }}</span>
                </div>

                <div class="localized-setting-editor__toolbar-actions">
                    <Select
                        v-model="activeLocale"
                        :options="localeOptions"
                        option-label="label"
                        option-value="value"
                        :disabled="metadata?.isLocked"
                        class="localized-setting-editor__locale-select"
                    />

                    <Button
                        v-tooltip.top="aiDraftButtonLabel"
                        icon="pi pi-sparkles"
                        size="small"
                        text
                        rounded
                        :aria-label="aiDraftButtonLabel"
                        :disabled="metadata?.isLocked || !hasDraftSource || generatingDraft"
                        :loading="generatingDraft"
                        @click="generateLocalizedDraft"
                    />
                </div>
            </div>

            <Message
                v-if="showEnvOverrideNotice"
                severity="info"
                :closable="false"
            >
                <strong>{{ envOverrideNoticeTitle }}</strong>
                <div>{{ envOverrideNoticeDescription }}</div>
            </Message>

            <Message
                v-if="showLegacyNotice"
                severity="warn"
                :closable="false"
            >
                <strong>{{ legacyNoticeTitle }}</strong>
                <div>{{ legacyNoticeDescription }}</div>
            </Message>

            <Message
                v-if="showMissingTranslationNotice"
                severity="secondary"
                :closable="false"
            >
                {{ missingTranslationNotice }}
            </Message>

            <Textarea
                v-if="usesTextarea"
                :id="inputId"
                :model-value="currentInputValue"
                :disabled="metadata?.isLocked"
                :rows="rows"
                fluid
                @update:model-value="handleInputUpdate"
            />

            <InputText
                v-else
                :id="inputId"
                :model-value="currentInputValue"
                :disabled="metadata?.isLocked"
                fluid
                @update:model-value="handleInputUpdate"
            />

            <small class="localized-setting-editor__hint">{{ editorHint }}</small>
        </div>
    </SettingFormField>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import { APP_ENABLED_LOCALES, type AppLocaleCode } from '@/i18n/config/locale-registry'
import {
    createEmptyLocalizedSettingValue,
    getLocalizedFallbackChain,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    normalizeLocalizedStringList,
    serializeLocalizedStringList,
} from '@/utils/shared/localized-settings'
import type {
    LocalizedSettingMetadata,
    LocalizedSettingType,
    LocalizedStringListSettingFormValue,
    LocalizedTextSettingFormValue,
    LocalizedSettingValueV1,
    SettingFieldMetadata,
} from '@/types/setting'

type LocalizedEditorModelValue = LocalizedTextSettingFormValue | LocalizedStringListSettingFormValue | undefined
type LocalizedStructuredValue = LocalizedSettingValueV1<string> | LocalizedSettingValueV1<string[]>

const model = defineModel<LocalizedEditorModelValue>()

const props = withDefaults(defineProps<{
    fieldKey: string
    inputId: string
    metadata?: SettingFieldMetadata | null
    description?: string
    multiline?: boolean
    rows?: number
    stringList?: boolean
}>(), {
    metadata: null,
    description: '',
    multiline: false,
    rows: 4,
    stringList: false,
})

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()
const tt = (key: string, params?: Record<string, string>) => t(key as never, params as never)

const activeLocale = ref<AppLocaleCode>(APP_ENABLED_LOCALES[0]?.code ?? 'zh-CN')
const generatingDraft = ref(false)

const localeOptions = computed(() => APP_ENABLED_LOCALES.map((locale) => ({
    label: locale.nativeName,
    value: locale.code,
})))

const localeLabelMap = computed<Record<AppLocaleCode, string>>(() => Object.fromEntries(
    localeOptions.value.map((locale) => [locale.value, locale.label]),
) as Record<AppLocaleCode, string>)

const localizedMetadata = computed<LocalizedSettingMetadata | null>(() => props.metadata?.localized ?? null)
const localizedType = computed<LocalizedSettingType>(() => props.stringList ? 'localized-string-list' : 'localized-text')
const usesTextarea = computed(() => props.multiline)

const normalizedValue = computed<LocalizedStructuredValue>({
    get() {
        if (isLocalizedSettingValue(model.value, localizedType.value)) {
            return model.value
        }

        const legacyValue = typeof model.value === 'string'
            ? (props.stringList ? normalizeLocalizedStringList(model.value) : model.value)
            : null

        return createEmptyLocalizedSettingValue(localizedType.value, legacyValue) as LocalizedStructuredValue
    },
    set(value: LocalizedTextSettingFormValue | LocalizedStringListSettingFormValue) {
        model.value = value
    },
})

const localizedBadgeLabel = computed(() => tt('pages.admin.settings.system.localized.badge'))
const localizedHelperLabel = computed(() => tt('pages.admin.settings.system.localized.helper'))
const aiDraftButtonLabel = computed(() => tt('pages.admin.settings.system.localized.ai_generate'))
const legacyNoticeTitle = computed(() => tt('pages.admin.settings.system.localized.legacy_title'))
const legacyNoticeDescription = computed(() => tt('pages.admin.settings.system.localized.legacy_description'))
const isEnvOverrideLocked = computed(() => props.metadata?.isLocked === true && props.metadata?.source === 'env')

const showEnvOverrideNotice = computed(() => isEnvOverrideLocked.value)

const envOverrideNoticeTitle = computed(() => tt(
    localizedMetadata.value?.structured
        ? 'pages.admin.settings.system.localized.env_override_structured_title'
        : 'pages.admin.settings.system.localized.env_override_legacy_title',
))

const envOverrideNoticeDescription = computed(() => tt(
    localizedMetadata.value?.structured
        ? 'pages.admin.settings.system.localized.env_override_structured_description'
        : 'pages.admin.settings.system.localized.env_override_legacy_description',
    {
        envKey: props.metadata?.envKey ?? props.fieldKey.toUpperCase(),
    },
))

const fallbackChainLabel = computed(() => getLocalizedFallbackChain(activeLocale.value)
    .map((locale) => localeLabelMap.value[locale] ?? locale)
    .join(' -> '))

const showLegacyNotice = computed(() => localizedMetadata.value?.legacyFormat === true && !isEnvOverrideLocked.value)

const showMissingTranslationNotice = computed(() => {
    const localeValue = normalizedValue.value.locales[activeLocale.value]
    return !hasMeaningfulLocalizedValue(localeValue)
})
const hasDraftSource = computed(() => {
    const fallbackLocales = getLocalizedFallbackChain(activeLocale.value)

    for (const locale of fallbackLocales) {
        if (locale === activeLocale.value) {
            continue
        }

        if (hasMeaningfulLocalizedValue(normalizedValue.value.locales[locale])) {
            return true
        }
    }

    return hasMeaningfulLocalizedValue(normalizedValue.value.legacyValue)
})

const missingTranslationNotice = computed(() => tt('pages.admin.settings.system.localized.missing_translation', {
    locale: localeLabelMap.value[activeLocale.value] ?? activeLocale.value,
    fallbackChain: fallbackChainLabel.value,
}))

const editorHint = computed(() => {
    if (props.stringList) {
        return tt('pages.admin.settings.system.localized.string_list_hint')
    }

    return tt('pages.admin.settings.system.localized.text_hint')
})

function formatScalarValue(value: unknown) {
    if (props.stringList) {
        return serializeLocalizedStringList(Array.isArray(value) ? value : [])
    }

    return typeof value === 'string' ? value : ''
}

const readonlyFallbackPreviewValue = computed(() => {
    for (const locale of getLocalizedFallbackChain(activeLocale.value)) {
        const localeValue = normalizedValue.value.locales[locale]
        if (hasMeaningfulLocalizedValue(localeValue)) {
            return formatScalarValue(localeValue)
        }
    }

    if (hasMeaningfulLocalizedValue(normalizedValue.value.legacyValue)) {
        return formatScalarValue(normalizedValue.value.legacyValue)
    }

    return ''
})

const currentInputValue = computed(() => {
    const localeValue = normalizedValue.value.locales[activeLocale.value]

    if (hasMeaningfulLocalizedValue(localeValue)) {
        return formatScalarValue(localeValue)
    }

    if (props.metadata?.isLocked) {
        return readonlyFallbackPreviewValue.value
    }

    return ''
})

function handleInputUpdate(nextValue?: string) {
    const safeNextValue = nextValue ?? ''

    if (props.stringList) {
        const currentValue = normalizedValue.value as LocalizedSettingValueV1<string[]>
        const nextLocalizedValue: LocalizedSettingValueV1<string[]> = {
            version: 1,
            type: 'localized-string-list',
            locales: { ...(currentValue.locales as Partial<Record<AppLocaleCode, string[]>>) },
            legacyValue: Array.isArray(currentValue.legacyValue) ? [...currentValue.legacyValue] : currentValue.legacyValue,
        }
        const normalizedList = normalizeLocalizedStringList(safeNextValue)
        if (normalizedList.length > 0) {
            nextLocalizedValue.locales[activeLocale.value] = normalizedList
        } else {
            delete nextLocalizedValue.locales[activeLocale.value]
        }

        normalizedValue.value = nextLocalizedValue
        return
    }

    const currentValue = normalizedValue.value as LocalizedSettingValueV1<string>
    const nextLocalizedValue: LocalizedSettingValueV1<string> = {
        version: 1,
        type: 'localized-text',
        locales: { ...(currentValue.locales as Partial<Record<AppLocaleCode, string>>) },
        legacyValue: typeof currentValue.legacyValue === 'string' ? currentValue.legacyValue : currentValue.legacyValue ?? null,
    }

    if (safeNextValue.trim().length > 0) {
        nextLocalizedValue.locales[activeLocale.value] = safeNextValue
    } else {
        delete nextLocalizedValue.locales[activeLocale.value]
    }

    normalizedValue.value = nextLocalizedValue
}

async function generateLocalizedDraft() {
    if (props.metadata?.isLocked || !hasDraftSource.value) {
        return
    }

    generatingDraft.value = true
    try {
        const response = await $appFetch<{ data: { value: LocalizedStructuredValue } }>('/api/admin/settings/ai-localized-draft', {
            method: 'POST',
            body: {
                key: props.fieldKey,
                targetLocale: activeLocale.value,
                value: normalizedValue.value,
            },
        })

        normalizedValue.value = response.data.value
        toast.add({
            severity: 'success',
            summary: tt('common.success'),
            detail: tt('pages.admin.settings.system.localized.ai_generate_success'),
            life: 2500,
        })
    } catch (error) {
        const detail = error instanceof Error ? error.message : tt('pages.admin.settings.system.localized.ai_generate_failed')
        toast.add({
            severity: 'error',
            summary: tt('common.error'),
            detail,
            life: 3000,
        })
    } finally {
        generatingDraft.value = false
    }
}
</script>

<style lang="scss" scoped>
.localized-setting-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &__toolbar {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    &__toolbar-copy {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    &__toolbar-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    &__badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
        color: var(--p-primary-color);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    &__helper {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }

    &__locale-select {
        min-width: 12rem;
    }

    &__hint {
        color: var(--p-text-muted-color);
        line-height: 1.5;
    }
}
</style>
