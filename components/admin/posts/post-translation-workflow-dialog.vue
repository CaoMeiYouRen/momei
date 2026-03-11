<template>
    <Dialog
        v-model:visible="visible"
        modal
        :header="dialogTitle"
        :style="{width: '40rem'}"
        class="translation-workflow-dialog"
        :closable="!isBusy"
        :dismissable-mask="!isBusy"
    >
        <div class="translation-workflow">
            <p class="translation-workflow__intro">
                {{ introText }}
            </p>

            <Message
                v-if="!hasSourceOptions"
                severity="warn"
                :closable="false"
            >
                {{ noSourcesText }}
            </Message>

            <div class="translation-workflow__grid">
                <div class="translation-workflow__field">
                    <label for="translation_source" class="translation-workflow__label">
                        {{ sourcePostLabel }}
                    </label>
                    <Select
                        id="translation_source"
                        v-model="sourcePostId"
                        :options="sourceOptions"
                        option-label="title"
                        option-value="id"
                        :disabled="isBusy || !hasSourceOptions"
                        class="w-full"
                    >
                        <template #value="slotProps">
                            <span v-if="slotProps.value && selectedSource">
                                {{ selectedSource.title }}
                                <small class="translation-workflow__value-meta">{{ selectedSource.language }}</small>
                            </span>
                            <span v-else>
                                {{ selectSourceLabel }}
                            </span>
                        </template>
                        <template #option="slotProps">
                            <div class="translation-workflow__option">
                                <span class="translation-workflow__option-title">{{ slotProps.option.title }}</span>
                                <small class="translation-workflow__option-meta">{{ slotProps.option.language }}</small>
                            </div>
                        </template>
                    </Select>
                </div>

                <div class="translation-workflow__field">
                    <label for="translation_target_language" class="translation-workflow__label">
                        {{ targetLanguageLabelText }}
                    </label>
                    <Select
                        id="translation_target_language"
                        v-model="targetLanguage"
                        :options="targetLanguageOptions"
                        option-label="label"
                        option-value="value"
                        :disabled="isBusy"
                        class="w-full"
                    />
                </div>
            </div>

            <div class="translation-workflow__meta">
                <Tag
                    v-if="selectedSource"
                    severity="secondary"
                    :value="sourceLanguageValue"
                />
                <Tag
                    severity="info"
                    :value="targetLanguageValue"
                />
            </div>

            <div v-if="selectedTargetStatus" class="translation-workflow__target-summary">
                <div class="translation-workflow__target-summary-row">
                    <span class="translation-workflow__target-summary-label">
                        {{ targetStatusTitle }}
                    </span>
                    <Tag
                        :severity="targetStateSeverity"
                        :value="targetStatusValue"
                    />
                </div>
                <div class="translation-workflow__target-summary-row">
                    <span class="translation-workflow__target-summary-label">
                        {{ targetActionTitle }}
                    </span>
                    <Tag
                        :severity="actionTagSeverity"
                        :value="startLabel"
                    />
                </div>
                <p class="translation-workflow__target-summary-description">
                    {{ targetActionDescription }}
                </p>
            </div>

            <Message
                v-if="switchTargetHint"
                severity="info"
                :closable="false"
            >
                {{ switchTargetHint }}
            </Message>

            <Message
                v-if="sameLanguageWarning"
                severity="warn"
                :closable="false"
            >
                {{ sameLanguageWarning }}
            </Message>

            <div class="translation-workflow__field">
                <div class="translation-workflow__scope-header">
                    <label class="translation-workflow__label">
                        {{ scopeTitle }}
                    </label>
                    <small class="translation-workflow__hint">
                        {{ scopeHint }}
                    </small>
                </div>
                <div class="translation-workflow__scopes">
                    <label
                        v-for="scope in scopeOptions"
                        :key="scope.value"
                        class="translation-workflow__scope-item"
                    >
                        <Checkbox
                            :model-value="selectedScopes.includes(scope.value)"
                            binary
                            :disabled="isBusy"
                            @update:model-value="toggleScope(scope.value)"
                        />
                        <span>{{ scope.label }}</span>
                    </label>
                </div>
            </div>

            <div
                v-if="isBusy || translationStatus === 'completed' || translationStatus === 'failed'"
                class="translation-workflow__progress"
            >
                <div class="translation-workflow__progress-header">
                    <span>{{ progressLabel }}</span>
                    <span>{{ Math.round(progress) }}%</span>
                </div>
                <ProgressBar :value="progress" class="translation-workflow__progress-bar" />
                <small v-if="activeField" class="translation-workflow__hint">
                    {{ currentFieldText }}
                </small>
                <small v-if="translationStatus === 'failed' && errorText" class="p-error">
                    {{ errorText }}
                </small>
            </div>
        </div>

        <template #footer>
            <Button
                :label="$t('common.cancel')"
                text
                severity="secondary"
                :disabled="isBusy"
                @click="visible = false"
            />
            <Button
                :label="startLabel"
                :severity="startButtonSeverity"
                :loading="isBusy"
                :disabled="!canStart"
                @click="handleStart"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
    PostTranslationSourceOption,
    PostTranslationTargetState,
    PostTranslationTargetStatus,
    PostTranslationWorkflowRequest,
    PostTranslationWorkflowAction,
    TranslationScopeField,
    TranslationTextField,
} from '@/types/post-translation'

const DEFAULT_SCOPES: TranslationScopeField[] = ['title', 'content', 'summary', 'category', 'tags', 'coverImage']

const visible = defineModel<boolean>('visible', { default: false })

const props = withDefaults(defineProps<{
    locales: Array<{ code: string, name?: string }>
    sourceOptions: PostTranslationSourceOption[]
    targetStatuses: PostTranslationTargetStatus[]
    defaultSourcePostId?: string | null
    defaultTargetLanguage: string
    defaultScopes?: TranslationScopeField[]
    progress?: number
    translationStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
    activeField?: TranslationTextField | null
    errorText?: string | null
}>(), {
    defaultSourcePostId: null,
    defaultScopes: () => ['title', 'content', 'summary', 'category', 'tags', 'coverImage'],
    progress: 0,
    translationStatus: 'idle',
    activeField: null,
    errorText: null,
})

const emit = defineEmits<{
    (e: 'start', payload: PostTranslationWorkflowRequest): void
}>()

const { t } = useI18n()
const tt = (key: string, params?: Record<string, string>) => t(key as never, params as never)

const sourcePostId = ref('')
const targetLanguage = ref(props.defaultTargetLanguage)
const selectedScopes = ref<TranslationScopeField[]>([...(props.defaultScopes || DEFAULT_SCOPES)])

const hasSourceOptions = computed(() => props.sourceOptions.length > 0)
const isBusy = computed(() => props.translationStatus === 'pending' || props.translationStatus === 'processing')
const selectedSource = computed(() => props.sourceOptions.find((item) => item.id === sourcePostId.value) || null)
const selectedTargetStatus = computed(() => props.targetStatuses.find((item) => item.language === targetLanguage.value) || null)
const sameLanguageSelection = computed(() => Boolean(selectedSource.value && selectedSource.value.language === targetLanguage.value))

const dialogTitle = computed(() => tt('pages.admin.posts.translation_workflow.title'))
const introText = computed(() => tt('pages.admin.posts.translation_workflow.intro'))
const noSourcesText = computed(() => tt('pages.admin.posts.translation_workflow.no_sources'))
const sourcePostLabel = computed(() => tt('pages.admin.posts.translation_workflow.source_post'))
const selectSourceLabel = computed(() => tt('pages.admin.posts.translation_workflow.select_source'))
const targetLanguageLabelText = computed(() => tt('pages.admin.posts.translation_workflow.target_language'))
const targetStatusTitle = computed(() => tt('pages.admin.posts.translation_workflow.target_status_title'))
const targetActionTitle = computed(() => tt('pages.admin.posts.translation_workflow.action_title'))
const scopeTitle = computed(() => tt('pages.admin.posts.translation_workflow.scope_title'))
const scopeHint = computed(() => tt('pages.admin.posts.translation_workflow.scope_hint'))
const sameLanguageWarning = computed(() => sameLanguageSelection.value
    ? tt('pages.admin.posts.translation_workflow.same_language_warning')
    : '')

const getActionLabel = (action: PostTranslationWorkflowAction) => tt(`pages.admin.posts.translation_workflow.actions.${action}`)
const getTargetStateLabel = (state: PostTranslationTargetState) => tt(`pages.admin.posts.translation_workflow.target_states.${state}`)

const startLabel = computed(() => {
    if (!selectedTargetStatus.value) {
        return tt('pages.admin.posts.translation_workflow.start')
    }

    return getActionLabel(selectedTargetStatus.value.action)
})

const targetLanguageOptions = computed(() => props.locales.map((locale) => ({
    label: locale.name || locale.code,
    value: locale.code,
})))

const targetLanguageLabel = computed(() => {
    return targetLanguageOptions.value.find((item) => item.value === targetLanguage.value)?.label || targetLanguage.value
})

const sourceLanguageValue = computed(() => {
    if (!selectedSource.value) {
        return ''
    }

    return tt('pages.admin.posts.translation_workflow.source_language_value', { language: selectedSource.value.language })
})

const targetLanguageValue = computed(() => tt('pages.admin.posts.translation_workflow.target_language_value', { language: targetLanguageLabel.value }))
const targetStatusValue = computed(() => {
    if (!selectedTargetStatus.value) {
        return ''
    }

    return getTargetStateLabel(selectedTargetStatus.value.state)
})
const targetActionDescription = computed(() => {
    if (!selectedTargetStatus.value) {
        return ''
    }

    return tt(`pages.admin.posts.translation_workflow.action_descriptions.${selectedTargetStatus.value.action}`)
})
const switchTargetHint = computed(() => {
    if (!selectedTargetStatus.value || selectedTargetStatus.value.isCurrentEditor) {
        return ''
    }

    return tt('pages.admin.posts.translation_workflow.switch_target_hint')
})
const targetStateSeverity = computed(() => {
    if (!selectedTargetStatus.value) {
        return 'secondary'
    }

    if (selectedTargetStatus.value.state === 'published') {
        return 'danger'
    }

    if (selectedTargetStatus.value.state === 'draft') {
        return 'warn'
    }

    return 'info'
})
const actionTagSeverity = computed(() => {
    if (!selectedTargetStatus.value) {
        return 'secondary'
    }

    if (selectedTargetStatus.value.action === 'overwrite') {
        return 'danger'
    }

    if (selectedTargetStatus.value.action === 'continue') {
        return 'warn'
    }

    return 'info'
})
const startButtonSeverity = computed(() => {
    if (!selectedTargetStatus.value) {
        return 'contrast'
    }

    if (selectedTargetStatus.value.action === 'overwrite') {
        return 'danger'
    }

    if (selectedTargetStatus.value.action === 'continue') {
        return 'warn'
    }

    return 'contrast'
})

const scopeOptions = computed(() => ([
    { value: 'title' as const, label: tt('pages.admin.posts.translation_workflow.fields.title') },
    { value: 'content' as const, label: tt('pages.admin.posts.translation_workflow.fields.content') },
    { value: 'summary' as const, label: tt('pages.admin.posts.translation_workflow.fields.summary') },
    { value: 'category' as const, label: tt('pages.admin.posts.translation_workflow.fields.category') },
    { value: 'tags' as const, label: tt('pages.admin.posts.translation_workflow.fields.tags') },
    { value: 'coverImage' as const, label: tt('pages.admin.posts.translation_workflow.fields.coverImage') },
    { value: 'audio' as const, label: tt('pages.admin.posts.translation_workflow.fields.audio') },
]))

const activeFieldLabel = computed(() => {
    if (!props.activeField) {
        return ''
    }

    return tt(`pages.admin.posts.translation_workflow.fields.${props.activeField}`)
})

const currentFieldText = computed(() => {
    if (!props.activeField) {
        return ''
    }

    return tt('pages.admin.posts.translation_workflow.current_field', { field: activeFieldLabel.value })
})

const progressLabel = computed(() => {
    if (props.translationStatus === 'completed') {
        return tt('pages.admin.posts.translation_workflow.progress_completed')
    }

    if (props.translationStatus === 'failed') {
        return tt('pages.admin.posts.translation_workflow.progress_failed')
    }

    return tt('pages.admin.posts.translation_workflow.progress_running')
})

const canStart = computed(() => {
    return hasSourceOptions.value
        && Boolean(sourcePostId.value)
        && Boolean(targetLanguage.value)
        && selectedScopes.value.length > 0
        && !sameLanguageSelection.value
        && !isBusy.value
})

const resetForm = () => {
    sourcePostId.value = props.defaultSourcePostId || props.sourceOptions[0]?.id || ''
    targetLanguage.value = props.defaultTargetLanguage
    selectedScopes.value = [...(props.defaultScopes?.length ? props.defaultScopes : DEFAULT_SCOPES)]
}

watch(() => visible.value, (isVisible) => {
    if (isVisible) {
        resetForm()
    }
}, { immediate: true })

watch(() => props.defaultTargetLanguage, (value) => {
    if (!visible.value) {
        targetLanguage.value = value
    }
})

watch(() => props.defaultSourcePostId, (value) => {
    if (!visible.value) {
        sourcePostId.value = value || props.sourceOptions[0]?.id || ''
    }
})

watch(() => props.defaultScopes, (value) => {
    if (!visible.value) {
        selectedScopes.value = [...(value?.length ? value : DEFAULT_SCOPES)]
    }
})

const toggleScope = (scope: TranslationScopeField) => {
    if (selectedScopes.value.includes(scope)) {
        selectedScopes.value = selectedScopes.value.filter((item) => item !== scope)
        return
    }

    selectedScopes.value = [...selectedScopes.value, scope]
}

const handleStart = () => {
    if (!selectedSource.value || !canStart.value || sameLanguageSelection.value) {
        return
    }

    emit('start', {
        sourcePostId: selectedSource.value.id,
        sourceLanguage: selectedSource.value.language,
        targetLanguage: targetLanguage.value,
        scopes: [...selectedScopes.value],
        action: selectedTargetStatus.value?.action || 'create',
        targetState: selectedTargetStatus.value?.state || 'missing',
        targetPostId: selectedTargetStatus.value?.postId || null,
    })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.translation-workflow {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__intro {
        margin: 0;
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

    &__label {
        font-weight: 600;
        color: var(--p-text-color);
    }

    &__hint,
    &__value-meta,
    &__option-meta {
        color: var(--p-text-muted-color);
    }

    &__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    &__target-summary {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: $border-radius-md;
        background: color-mix(in srgb, var(--p-primary-color) 3%, var(--p-content-background));
    }

    &__target-summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    &__target-summary-label {
        font-weight: 600;
        color: var(--p-text-muted-color);
    }

    &__target-summary-description {
        margin: 0;
        color: var(--p-text-color);
        line-height: 1.6;
    }

    &__scope-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    &__scopes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: $border-radius-md;
        background: var(--p-content-background);
    }

    &__scope-item {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    &__progress {
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: $border-radius-md;
        background: color-mix(in srgb, var(--p-primary-color) 4%, var(--p-content-background));
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
    }

    &__option {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    &__option-title {
        font-weight: 500;
    }
}

@media (width <= 768px) {
    .translation-workflow {
        &__grid,
        &__scopes {
            grid-template-columns: 1fr;
        }

        &__target-summary-row,
        &__scope-header {
            align-items: flex-start;
            flex-direction: column;
        }
    }
}
</style>
