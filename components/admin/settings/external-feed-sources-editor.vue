<template>
    <div class="external-feed-sources-editor">
        <input
            ref="fileInputRef"
            class="external-feed-sources-editor__file-input"
            type="file"
            accept="application/json"
            :disabled="disabled"
            @change="handleImportFileSelection"
        >

        <div class="external-feed-sources-editor__toolbar">
            <div class="external-feed-sources-editor__toolbar-copy">
                <p class="external-feed-sources-editor__toolbar-title">
                    {{ $t('pages.admin.settings.system.external_feeds.editor.title') }}
                </p>
                <p class="external-feed-sources-editor__toolbar-hint">
                    {{ $t('pages.admin.settings.system.external_feeds.editor.hint') }}
                </p>
            </div>

            <div class="external-feed-sources-editor__toolbar-actions">
                <Button
                    icon="pi pi-plus"
                    severity="secondary"
                    :label="$t('common.add')"
                    :disabled="disabled"
                    @click="addSource"
                />
                <Button
                    icon="pi pi-upload"
                    severity="secondary"
                    :label="$t('pages.admin.settings.system.external_feeds.editor.import_json')"
                    :disabled="disabled"
                    @click="openImportFileDialog"
                />
                <Button
                    icon="pi pi-download"
                    severity="secondary"
                    :label="$t('common.export')"
                    :disabled="sourceDrafts.length === 0"
                    @click="exportSources"
                />
            </div>
        </div>

        <Message
            v-if="parseError"
            severity="warn"
            :closable="false"
            class="external-feed-sources-editor__message"
        >
            {{ parseError }}
        </Message>

        <div v-if="sourceDrafts.length === 0" class="external-feed-sources-editor__empty-state">
            <p class="external-feed-sources-editor__empty-title">
                {{ $t('pages.admin.settings.system.external_feeds.editor.empty_title') }}
            </p>
            <p class="external-feed-sources-editor__empty-hint">
                {{ $t('pages.admin.settings.system.external_feeds.editor.empty_hint') }}
            </p>
        </div>

        <div v-else class="external-feed-sources-editor__list">
            <section
                v-for="(source, index) in sourceDrafts"
                :key="`${source.id || 'draft'}-${index}`"
                class="external-feed-sources-editor__card"
            >
                <div class="external-feed-sources-editor__card-header">
                    <div>
                        <h4 class="external-feed-sources-editor__card-title">
                            {{ source.title || `${$t('pages.admin.settings.system.external_feeds.editor.source_label')} ${index + 1}` }}
                        </h4>
                        <p class="external-feed-sources-editor__card-subtitle">
                            {{ source.id || $t('pages.admin.settings.system.external_feeds.editor.pending_id') }}
                        </p>
                    </div>

                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        :label="$t('common.delete')"
                        :disabled="disabled"
                        @click="removeSource(index)"
                    />
                </div>

                <div class="external-feed-sources-editor__grid">
                    <div class="external-feed-sources-editor__field external-feed-sources-editor__field--toggle">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-enabled-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.enabled') }}
                        </label>
                        <ToggleSwitch
                            :input-id="`external-feed-source-enabled-${index}`"
                            :model-value="source.enabled"
                            :disabled="disabled"
                            @update:model-value="updateSourceField(index, 'enabled', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field external-feed-sources-editor__field--toggle">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-home-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.include_in_home') }}
                        </label>
                        <ToggleSwitch
                            :input-id="`external-feed-source-home-${index}`"
                            :model-value="source.includeInHome"
                            :disabled="disabled"
                            @update:model-value="updateSourceField(index, 'includeInHome', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-id-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.id') }}
                        </label>
                        <InputText
                            :id="`external-feed-source-id-${index}`"
                            :model-value="source.id"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateRequiredStringField(index, 'id', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-title-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.title') }}
                        </label>
                        <InputText
                            :id="`external-feed-source-title-${index}`"
                            :model-value="source.title"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateRequiredStringField(index, 'title', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-provider-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.provider') }}
                        </label>
                        <Select
                            :id="`external-feed-source-provider-${index}`"
                            :model-value="source.provider"
                            :options="providerOptions"
                            option-label="label"
                            option-value="value"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateSourceField(index, 'provider', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field external-feed-sources-editor__field--full">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-url-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.source_url') }}
                        </label>
                        <InputText
                            :id="`external-feed-source-url-${index}`"
                            :model-value="source.sourceUrl"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateRequiredStringField(index, 'sourceUrl', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-site-url-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.site_url') }}
                        </label>
                        <InputText
                            :id="`external-feed-source-site-url-${index}`"
                            :model-value="source.siteUrl ?? ''"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateNullableStringField(index, 'siteUrl', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-site-name-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.site_name') }}
                        </label>
                        <InputText
                            :id="`external-feed-source-site-name-${index}`"
                            :model-value="source.siteName ?? ''"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateNullableStringField(index, 'siteName', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-locale-strategy-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.locale_strategy') }}
                        </label>
                        <Select
                            :id="`external-feed-source-locale-strategy-${index}`"
                            :model-value="source.localeStrategy"
                            :options="localeStrategyOptions"
                            option-label="label"
                            option-value="value"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateSourceField(index, 'localeStrategy', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-default-locale-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.default_locale') }}
                        </label>
                        <Select
                            :id="`external-feed-source-default-locale-${index}`"
                            :model-value="source.defaultLocale"
                            :options="defaultLocaleOptions"
                            option-label="label"
                            option-value="value"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateNullableStringField(index, 'defaultLocale', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-badge-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.badge_label') }}
                        </label>
                        <InputText
                            :id="`external-feed-source-badge-${index}`"
                            :model-value="source.badgeLabel ?? ''"
                            :disabled="disabled"
                            fluid
                            @update:model-value="updateNullableStringField(index, 'badgeLabel', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-priority-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.priority') }}
                        </label>
                        <InputNumber
                            :input-id="`external-feed-source-priority-${index}`"
                            :model-value="source.priority"
                            :disabled="disabled"
                            :min="-100"
                            :max="100"
                            fluid
                            @update:model-value="updateNumericField(index, 'priority', $event, 0)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-timeout-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.timeout_ms') }}
                        </label>
                        <InputNumber
                            :input-id="`external-feed-source-timeout-${index}`"
                            :model-value="source.timeoutMs"
                            :disabled="disabled"
                            :min="1000"
                            :max="60000"
                            show-buttons
                            fluid
                            @update:model-value="updateNullableNumberField(index, 'timeoutMs', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-cache-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.cache_ttl_seconds') }}
                        </label>
                        <InputNumber
                            :input-id="`external-feed-source-cache-${index}`"
                            :model-value="source.cacheTtlSeconds"
                            :disabled="disabled"
                            :min="60"
                            :max="86400"
                            show-buttons
                            fluid
                            @update:model-value="updateNullableNumberField(index, 'cacheTtlSeconds', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-stale-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.stale_while_error_seconds') }}
                        </label>
                        <InputNumber
                            :input-id="`external-feed-source-stale-${index}`"
                            :model-value="source.staleWhileErrorSeconds"
                            :disabled="disabled"
                            :min="60"
                            :max="604800"
                            show-buttons
                            fluid
                            @update:model-value="updateNullableNumberField(index, 'staleWhileErrorSeconds', $event)"
                        />
                    </div>

                    <div class="external-feed-sources-editor__field">
                        <label class="external-feed-sources-editor__label" :for="`external-feed-source-max-items-${index}`">
                            {{ $t('pages.admin.settings.system.external_feeds.editor.fields.max_items') }}
                        </label>
                        <InputNumber
                            :input-id="`external-feed-source-max-items-${index}`"
                            :model-value="source.maxItems"
                            :disabled="disabled"
                            :min="1"
                            :max="20"
                            show-buttons
                            fluid
                            @update:model-value="updateNullableNumberField(index, 'maxItems', $event)"
                        />
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { APP_LOCALE_CODES, type AppLocaleCode } from '@/i18n/config/locale-registry'
import type { ExternalFeedLocaleStrategy, ExternalFeedProvider } from '@/types/external-feed'
import { externalFeedSourcesSchema, type ExternalFeedSourceConfigInput } from '@/utils/schemas/external-feed'

const props = withDefaults(defineProps<{
    modelValue?: unknown
    disabled?: boolean
}>(), {
    modelValue: () => [],
    disabled: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: ExternalFeedSourceConfigInput[]]
}>()

const { t } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const fileInputRef = ref<HTMLInputElement | null>(null)
const parseError = ref<string | null>(null)
const sourceDrafts = ref<ExternalFeedSourceConfigInput[]>([])

function cloneSource(source: ExternalFeedSourceConfigInput): ExternalFeedSourceConfigInput {
    return {
        ...source,
        siteUrl: source.siteUrl ?? null,
        siteName: source.siteName ?? null,
        defaultLocale: source.defaultLocale ?? null,
        badgeLabel: source.badgeLabel ?? null,
        timeoutMs: source.timeoutMs ?? null,
        cacheTtlSeconds: source.cacheTtlSeconds ?? null,
        staleWhileErrorSeconds: source.staleWhileErrorSeconds ?? null,
        maxItems: source.maxItems ?? null,
    }
}

function parseSourcesValue(value: unknown) {
    if (Array.isArray(value)) {
        return externalFeedSourcesSchema.parse(value).map(cloneSource)
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim()
        if (!trimmedValue) {
            return []
        }

        return externalFeedSourcesSchema.parse(JSON.parse(trimmedValue)).map(cloneSource)
    }

    return []
}

function normalizeNullableString(value: string | null | undefined) {
    const trimmedValue = value?.trim() ?? ''
    return trimmedValue.length > 0 ? trimmedValue : null
}

function emitSources() {
    emit('update:modelValue', sourceDrafts.value.map(cloneSource))
}

function createEmptySource(): ExternalFeedSourceConfigInput {
    return {
        id: `feed-${sourceDrafts.value.length + 1}`,
        enabled: true,
        provider: 'rss',
        title: '',
        sourceUrl: '',
        siteUrl: null,
        siteName: null,
        defaultLocale: null,
        localeStrategy: 'inherit-current',
        includeInHome: true,
        badgeLabel: null,
        priority: 0,
        timeoutMs: null,
        cacheTtlSeconds: null,
        staleWhileErrorSeconds: null,
        maxItems: 10,
    }
}

function syncFromModelValue(value: unknown) {
    try {
        sourceDrafts.value = parseSourcesValue(value)
        parseError.value = null
    } catch {
        sourceDrafts.value = []
        parseError.value = t('pages.admin.settings.system.external_feeds.editor.invalid_current_value')
    }
}

function updateSourceField<K extends keyof ExternalFeedSourceConfigInput>(index: number, key: K, value: ExternalFeedSourceConfigInput[K]) {
    const source = sourceDrafts.value[index]
    if (!source) {
        return
    }

    source[key] = value
    emitSources()
}

function updateRequiredStringField<K extends 'id' | 'title' | 'sourceUrl'>(index: number, key: K, value: string | null | undefined) {
    updateSourceField(index, key, (value ?? '') as ExternalFeedSourceConfigInput[K])
}

function updateNullableStringField<K extends 'siteUrl' | 'siteName' | 'defaultLocale' | 'badgeLabel'>(
    index: number,
    key: K,
    value: string | null | undefined,
) {
    updateSourceField(index, key, normalizeNullableString(value) as ExternalFeedSourceConfigInput[K])
}

function updateNumericField<K extends 'priority'>(index: number, key: K, value: number | null | undefined, fallback: number) {
    updateSourceField(index, key, (typeof value === 'number' ? value : fallback) as ExternalFeedSourceConfigInput[K])
}

function updateNullableNumberField<K extends 'timeoutMs' | 'cacheTtlSeconds' | 'staleWhileErrorSeconds' | 'maxItems'>(
    index: number,
    key: K,
    value: number | null | undefined,
) {
    updateSourceField(index, key, (typeof value === 'number' ? value : null) as ExternalFeedSourceConfigInput[K])
}

function addSource() {
    sourceDrafts.value = [...sourceDrafts.value, createEmptySource()]
    emitSources()
}

function removeSource(index: number) {
    sourceDrafts.value = sourceDrafts.value.filter((_, currentIndex) => currentIndex !== index)
    emitSources()
}

function openImportFileDialog() {
    if (props.disabled) {
        return
    }

    fileInputRef.value?.click()
}

async function handleImportFileSelection(event: Event) {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]

    if (!file) {
        return
    }

    try {
        const content = await file.text()
        const importedSources = externalFeedSourcesSchema.parse(JSON.parse(content)).map(cloneSource)
        sourceDrafts.value = importedSources
        parseError.value = null
        emitSources()
        showSuccessToast('pages.admin.settings.system.external_feeds.editor.import_success')
    } catch (error) {
        showErrorToast(error, {
            fallbackKey: 'pages.admin.settings.system.external_feeds.editor.import_failed',
        })
    } finally {
        if (input) {
            input.value = ''
        }
    }
}

function exportSources() {
    if (!import.meta.client || sourceDrafts.value.length === 0) {
        return
    }

    const payload = JSON.stringify(sourceDrafts.value, null, 2)
    const blob = new Blob([payload], {
        type: 'application/json;charset=utf-8',
    })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `external-feed-sources-${new Date().toISOString().split('T')[0]}.json`
    anchor.click()
    URL.revokeObjectURL(href)
    showSuccessToast('pages.admin.settings.system.external_feeds.editor.export_success')
}

const providerOptions = computed<Array<{ label: string, value: ExternalFeedProvider }>>(() => [
    { label: 'RSS', value: 'rss' },
    { label: 'RSSHub', value: 'rsshub' },
])

const localeStrategyOptions = computed<Array<{ label: string, value: ExternalFeedLocaleStrategy }>>(() => [
    {
        label: t('pages.admin.settings.system.external_feeds.editor.locale_strategy_options.inherit-current'),
        value: 'inherit-current',
    },
    {
        label: t('pages.admin.settings.system.external_feeds.editor.locale_strategy_options.fixed'),
        value: 'fixed',
    },
    {
        label: t('pages.admin.settings.system.external_feeds.editor.locale_strategy_options.all'),
        value: 'all',
    },
])

const defaultLocaleOptions = computed<Array<{ label: string, value: AppLocaleCode | null }>>(() => [
    {
        label: t('pages.admin.settings.system.external_feeds.editor.use_runtime_locale'),
        value: null,
    },
    ...APP_LOCALE_CODES.map((locale) => ({
        label: t(`common.languages.${locale}`),
        value: locale,
    })),
])

watch(() => props.modelValue, (value) => {
    syncFromModelValue(value)
}, { immediate: true })
</script>

<style lang="scss" scoped>
.external-feed-sources-editor {
    &__file-input {
        display: none;
    }

    &__toolbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    &__toolbar-copy {
        display: grid;
        gap: 0.35rem;
    }

    &__toolbar-title,
    &__toolbar-hint,
    &__empty-title,
    &__empty-hint,
    &__card-subtitle {
        margin: 0;
    }

    &__toolbar-title,
    &__card-title,
    &__empty-title {
        font-weight: 600;
    }

    &__toolbar-hint,
    &__empty-hint,
    &__card-subtitle {
        color: var(--p-text-muted-color);
        line-height: 1.5;
    }

    &__toolbar-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    &__message {
        margin-bottom: 1rem;
    }

    &__empty-state,
    &__card {
        border: 1px solid var(--p-surface-border);
        border-radius: 1rem;
        background: linear-gradient(180deg, var(--p-surface-0) 0%, color-mix(in srgb, var(--p-surface-0) 92%, var(--p-primary-50)) 100%);
    }

    &__empty-state {
        padding: 1.25rem;
        display: grid;
        gap: 0.4rem;
    }

    &__list {
        display: grid;
        gap: 1rem;
    }

    &__card {
        padding: 1rem;
        display: grid;
        gap: 1rem;
    }

    &__card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    &__field {
        display: grid;
        gap: 0.4rem;
    }

    &__field--full {
        grid-column: 1 / -1;
    }

    &__field--toggle {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
    }

    &__label {
        font-weight: 500;
        line-height: 1.4;
    }
}

:global(.dark) {
    .external-feed-sources-editor {
        &__empty-state,
        &__card {
            background: linear-gradient(180deg, color-mix(in srgb, var(--p-surface-900) 90%, var(--p-primary-900)) 0%, var(--p-surface-900) 100%);
        }

        &__toolbar-hint,
        &__empty-hint,
        &__card-subtitle {
            color: var(--p-surface-400);
        }
    }
}

@media (width <= 768px) {
    .external-feed-sources-editor {
        &__toolbar,
        &__card-header {
            flex-direction: column;
        }

        &__toolbar-actions {
            width: 100%;
            justify-content: flex-start;
        }

        &__grid {
            grid-template-columns: 1fr;
        }

        &__field--toggle {
            grid-template-columns: 1fr;
        }
    }
}
</style>
