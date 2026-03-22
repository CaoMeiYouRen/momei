<template>
    <section class="email-template-settings-panel">
        <Divider align="left">
            <b>{{ t('pages.admin.settings.system.email_templates.title') }}</b>
        </Divider>

        <p class="email-template-settings-panel__description">
            {{ t('pages.admin.settings.system.email_templates.description') }}
        </p>

        <div class="email-template-settings-panel__selectors">
            <SettingFormField
                :label="t('pages.admin.settings.system.email_templates.selector_label')"
                :description="t('pages.admin.settings.system.email_templates.selector_hint')"
            >
                <Select
                    v-model="selectedTemplateId"
                    :options="templateOptions"
                    option-label="label"
                    option-value="value"
                    fluid
                />
            </SettingFormField>
        </div>

        <Message
            severity="secondary"
            :closable="false"
            class="email-template-settings-panel__template-note"
        >
            <strong>{{ selectedTemplateLabel }}</strong>
            <div>{{ selectedTemplateDescription }}</div>
        </Message>

        <SettingFormField
            :label="t('pages.admin.settings.system.email_templates.custom_enabled')"
            :description="t('pages.admin.settings.system.email_templates.custom_enabled_hint')"
            inline
        >
            <ToggleSwitch v-model="selectedTemplateEnabled" />
        </SettingFormField>

        <div class="email-template-settings-panel__variables">
            <h4>{{ t('pages.admin.settings.system.email_templates.variables_title') }}</h4>

            <ul
                v-if="selectedTemplateVariables.length > 0"
                class="email-template-settings-panel__variable-list"
            >
                <li
                    v-for="variable in selectedTemplateVariables"
                    :key="variable"
                    class="email-template-settings-panel__variable-item"
                >
                    <code>{{ '{' + variable + '}' }}</code>
                    <span>{{ variableDescription(variable) }}</span>
                </li>
            </ul>

            <p v-else class="email-template-settings-panel__empty-copy">
                {{ t('pages.admin.settings.system.email_templates.no_variables') }}
            </p>
        </div>

        <div class="email-template-settings-panel__fields">
            <LocalizedSettingEditor
                v-for="fieldId in selectedTemplateDefinition.editableFields"
                :key="fieldId"
                :model-value="getFieldValue(fieldId)"
                :label="fieldLabel(fieldId)"
                :field-key="`email-template-${selectedTemplateId}-${fieldId}`"
                :input-id="`email-template-${selectedTemplateId}-${fieldId}`"
                :description="fieldDescription(fieldId)"
                :multiline="isMultilineField(fieldId)"
                :rows="isMultilineField(fieldId) ? 4 : 2"
                @update:model-value="setFieldValue(fieldId, $event as unknown)"
            />
        </div>

        <div class="email-template-settings-panel__preview-actions">
            <div class="email-template-settings-panel__preview-locale">
                <span class="email-template-settings-panel__preview-locale-label">
                    {{ t('pages.admin.settings.system.email_templates.preview_locale_label') }}
                </span>
                <Select
                    v-model="previewLocale"
                    :options="localeOptions"
                    option-label="label"
                    option-value="value"
                    fluid
                />
                <small class="email-template-settings-panel__preview-locale-hint">
                    {{ t('pages.admin.settings.system.email_templates.preview_locale_hint') }}
                </small>
            </div>

            <Button
                icon="pi pi-eye"
                :label="t('pages.admin.settings.system.email_templates.preview_action')"
                :loading="previewLoading"
                @click="loadPreview"
            />
        </div>

        <div v-if="preview" class="email-template-settings-panel__preview">
            <div class="email-template-settings-panel__preview-meta">
                <span class="email-template-settings-panel__preview-label">
                    {{ t('pages.admin.settings.system.email_templates.preview_subject') }}
                </span>
                <strong>{{ preview.subject }}</strong>
            </div>

            <div class="email-template-settings-panel__preview-context">
                <div class="email-template-settings-panel__preview-context-item">
                    <span class="email-template-settings-panel__preview-label">
                        {{ t('pages.admin.settings.system.email_templates.preview_locale_label') }}
                    </span>
                    <strong>{{ localeLabel(preview.meta.locale) }}</strong>
                </div>

                <div class="email-template-settings-panel__preview-context-item">
                    <span class="email-template-settings-panel__preview-label">
                        {{ t('pages.admin.settings.system.email_templates.preview_app_name') }}
                    </span>

                    <div class="email-template-settings-panel__preview-context-value">
                        <strong>{{ preview.meta.appName.value }}</strong>
                        <Tag
                            :severity="sourceSeverity[preview.meta.appName.source]"
                            :value="t(`pages.admin.settings.system.source_badges.${preview.meta.appName.source}`)"
                        />
                    </div>
                </div>
            </div>

            <ul class="email-template-settings-panel__preview-sources">
                <li
                    v-for="fieldId in selectedTemplateDefinition.editableFields"
                    :key="`preview-source-${fieldId}`"
                    class="email-template-settings-panel__preview-source-item"
                >
                    <div class="email-template-settings-panel__preview-source-copy">
                        <span>{{ fieldLabel(fieldId) }}</span>
                        <small v-if="getPreviewFieldSourceNote(fieldId)" class="email-template-settings-panel__preview-source-note">
                            {{ getPreviewFieldSourceNote(fieldId) }}
                        </small>
                    </div>

                    <Tag
                        :severity="sourceSeverity[getPreviewFieldSource(fieldId)]"
                        :value="t(`pages.admin.settings.system.source_badges.${getPreviewFieldSource(fieldId)}`)"
                    />
                </li>
            </ul>

            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="email-template-settings-panel__preview-frame" v-html="preview.html" />

            <details class="email-template-settings-panel__preview-text">
                <summary>{{ t('pages.admin.settings.system.email_templates.preview_text') }}</summary>
                <pre>{{ preview.text }}</pre>
            </details>
        </div>
    </section>
</template>

<script setup lang="ts">
import LocalizedSettingEditor from '@/components/admin/settings/localized-setting-editor.vue'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import { APP_ENABLED_LOCALES, type AppLocaleCode } from '@/i18n/config/locale-registry'
import {
    EMAIL_TEMPLATE_DEFINITIONS,
    EMAIL_TEMPLATE_IDS,
    type EmailTemplateFieldId,
    type EmailTemplateId,
    type EmailTemplateSettingsConfigV1,
    type EmailTemplateSettingsFormValue,
    getEmailTemplateCustomConfig,
    parseEmailTemplateSettingsConfig,
    resolveEmailTemplateLocalizedField,
    updateEmailTemplateCustomConfig,
} from '@/utils/shared/email-template-config'
import { createEmptyLocalizedSettingValue, isLocalizedSettingValue } from '@/utils/shared/localized-settings'
import type { LocalizedSettingValueV1, SettingSource } from '@/types/setting'

interface EmailTemplatePreviewPayload {
    subject: string
    html: string
    text: string
    meta: {
        locale: AppLocaleCode
        appName: {
            value: string
            source: SettingSource
        }
        fieldSources: Partial<Record<EmailTemplateFieldId, {
            source: 'default' | 'db'
            resolvedLocale: AppLocaleCode | 'legacy' | null
            usedFallback: boolean
        }>>
    }
}

interface EmailTemplatePreviewResponse {
    data: EmailTemplatePreviewPayload
}

const model = defineModel<EmailTemplateSettingsFormValue>()

const { t } = useI18n()
const { $appFetch } = useAppApi()
const { showErrorToast } = useRequestFeedback()

const selectedTemplateId = ref<EmailTemplateId>(EMAIL_TEMPLATE_IDS[0])
const previewLocale = ref<AppLocaleCode>(APP_ENABLED_LOCALES[0]?.code ?? 'zh-CN')
const previewLoading = ref(false)
const preview = ref<EmailTemplatePreviewPayload | null>(null)

const sourceSeverity: Record<SettingSource, 'warn' | 'success' | 'info'> = {
    env: 'warn',
    db: 'success',
    default: 'info',
}

const localeOptions = computed(() => APP_ENABLED_LOCALES.map((locale) => ({
    label: locale.nativeName,
    value: locale.code,
})))

const templateOptions = computed(() => EMAIL_TEMPLATE_IDS.map((templateId) => ({
    label: t(`pages.admin.settings.system.email_templates.catalog.${templateId}.label`),
    value: templateId,
})))

const normalizedConfig = computed<EmailTemplateSettingsConfigV1>(() => parseEmailTemplateSettingsConfig(model.value))
const selectedTemplateDefinition = computed(() => EMAIL_TEMPLATE_DEFINITIONS[selectedTemplateId.value])
const selectedTemplateConfig = computed(() => getEmailTemplateCustomConfig(normalizedConfig.value, selectedTemplateId.value))
const selectedTemplateLabel = computed(() => t(`pages.admin.settings.system.email_templates.catalog.${selectedTemplateId.value}.label`))
const selectedTemplateDescription = computed(() => t(`pages.admin.settings.system.email_templates.catalog.${selectedTemplateId.value}.description`))
const selectedTemplateVariables = computed(() => [...selectedTemplateDefinition.value.variables])

const selectedTemplateEnabled = computed({
    get: () => selectedTemplateConfig.value.enabled === true,
    set(value: boolean) {
        model.value = updateEmailTemplateCustomConfig(normalizedConfig.value, selectedTemplateId.value, {
            ...selectedTemplateConfig.value,
            enabled: value,
        })
    },
})

watch([selectedTemplateId, previewLocale], () => {
    preview.value = null
})

function isMultilineField(fieldId: EmailTemplateFieldId) {
    return fieldId === 'message' || fieldId === 'preheader' || fieldId === 'reminderContent' || fieldId === 'securityTip'
}

function fieldLabel(fieldId: EmailTemplateFieldId) {
    return t(`pages.admin.settings.system.email_templates.fields.${fieldId}`)
}

function fieldDescription(fieldId: EmailTemplateFieldId) {
    return t(`pages.admin.settings.system.email_templates.field_hints.${fieldId}`)
}

function variableDescription(variable: string) {
    return t(`pages.admin.settings.system.email_templates.variables.${variable}`)
}

function localeLabel(locale: AppLocaleCode) {
    return localeOptions.value.find((item) => item.value === locale)?.label ?? locale
}

function getFieldValue(fieldId: EmailTemplateFieldId): LocalizedSettingValueV1<string> {
    const fieldValue = selectedTemplateConfig.value.fields?.[fieldId]
    if (isLocalizedSettingValue<string>(fieldValue, 'localized-text')) {
        return fieldValue
    }

    return createEmptyLocalizedSettingValue('localized-text', null) as LocalizedSettingValueV1<string>
}

function getPreviewFieldSource(fieldId: EmailTemplateFieldId): SettingSource {
    return preview.value?.meta.fieldSources[fieldId]?.source ?? 'default'
}

function getPreviewFieldSourceNote(fieldId: EmailTemplateFieldId) {
    const sourceMeta = preview.value?.meta.fieldSources[fieldId]

    if (!sourceMeta || sourceMeta.source !== 'db' || !sourceMeta.usedFallback) {
        return ''
    }

    if (sourceMeta.resolvedLocale === 'legacy') {
        return t('pages.admin.settings.system.email_templates.preview_source_legacy')
    }

    if (sourceMeta.resolvedLocale) {
        return t('pages.admin.settings.system.email_templates.preview_source_fallback', {
            locale: localeLabel(sourceMeta.resolvedLocale),
        })
    }

    return ''
}

function setFieldValue(fieldId: EmailTemplateFieldId, nextValue?: unknown) {
    const currentFields = { ...(selectedTemplateConfig.value.fields ?? {}) }

    if (isLocalizedSettingValue<string>(nextValue, 'localized-text')) {
        currentFields[fieldId] = nextValue
    } else if (typeof nextValue === 'string') {
        currentFields[fieldId] = createEmptyLocalizedSettingValue('localized-text', nextValue) as LocalizedSettingValueV1<string>
    } else {
        delete currentFields[fieldId]
    }

    model.value = updateEmailTemplateCustomConfig(normalizedConfig.value, selectedTemplateId.value, {
        ...selectedTemplateConfig.value,
        fields: currentFields,
    })
}

async function loadPreview() {
    previewLoading.value = true
    try {
        const response = await $appFetch<EmailTemplatePreviewResponse>('/api/admin/settings/email-templates-preview', {
            method: 'POST',
            body: {
                templateId: selectedTemplateId.value,
                locale: previewLocale.value,
                config: normalizedConfig.value,
            },
        })
        preview.value = response.data
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.error_loading' })
    } finally {
        previewLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.email-template-settings-panel {
    &__description {
        margin: 0 0 1rem;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__selectors {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 1rem;
    }

    &__template-note {
        margin-bottom: 1.5rem;
    }

    &__variables {
        margin-bottom: 1.5rem;

        h4 {
            margin: 0 0 0.75rem;
        }
    }

    &__variable-list {
        display: grid;
        gap: 0.75rem;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    &__variable-item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.75rem;
        align-items: start;

        code {
            padding: 0.15rem 0.4rem;
            border-radius: 0.4rem;
            background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
        }
    }

    &__empty-copy {
        margin: 0;
        color: var(--p-text-muted-color);
    }

    &__preview-actions {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    &__preview-locale {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: min(100%, 18rem);
        flex: 0 1 20rem;
    }

    &__preview-locale-label {
        font-weight: 600;
    }

    &__preview-locale-hint {
        color: var(--p-text-muted-color);
        line-height: 1.4;
    }

    &__preview {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        background: var(--p-content-background);
    }

    &__preview-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    &__preview-context {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    &__preview-context-item {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.75rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--p-primary-color) 6%, var(--p-content-background));
    }

    &__preview-context-value {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    &__preview-sources {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    &__preview-source-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--p-content-background) 90%, white);
    }

    &__preview-source-copy {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    &__preview-source-note {
        color: var(--p-text-muted-color);
        line-height: 1.4;
    }

    &__preview-label {
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
    }

    &__preview-frame {
        overflow: auto;
        padding: 0.5rem;
        border-radius: 0.75rem;
        background: #f8fafc;
    }

    &__preview-text {
        pre {
            margin: 0.75rem 0 0;
            white-space: pre-wrap;
        }
    }
}

@media (width <= 768px) {
    .email-template-settings-panel {
        &__preview-context,
        &__preview-sources {
            grid-template-columns: 1fr;
        }

        &__preview-locale {
            min-width: 100%;
            flex-basis: 100%;
        }
    }
}
</style>
