<template>
    <CaomeiDialog
        :open="visible"
        :title="t('pages.admin.snippets.aggregate')"
        modal
        class="aggregate-dialog"
        :style="{width: '50vw'}"
        :breakpoints="{'1199px': '75vw', '575px': '90vw'}"
        @update:open="visible = $event"
    >
        <div v-if="aggregating" class="aggregating-state">
            <CaomeiProgressSpinner :stroke-width="3" class="spinner" />
            <p class="aggregating-text">
                AI {{ t('pages.admin.snippets.ai_thinking') }}
            </p>
        </div>
        <div v-else-if="scaffold" class="scaffold-preview-container">
            <div class="scaffold-header">
                <h3 class="scaffold-title">
                    <Sparkles :size="16" />
                    {{ t('pages.admin.snippets.ai_scaffold') }}
                </h3>
                <div class="flex gap-2">
                    <CaomeiButton
                        variant="ghost"
                        tone="neutral"
                        size="sm"
                        @click="scaffold = ''"
                    >
                        <template #icon>
                            <RefreshCw :size="16" />
                        </template>
                        {{ t('common.regenerate') }}
                    </CaomeiButton>
                    <CaomeiButton
                        variant="ghost"
                        tone="neutral"
                        size="sm"
                        @click="copyScaffold"
                    >
                        <template #icon>
                            <Copy :size="16" />
                        </template>
                        {{ t('common.copy') }}
                    </CaomeiButton>
                </div>
            </div>
            <div class="dark:prose-invert prose scaffold-content-box">
                <!-- eslint-disable vue/no-v-html -->
                <div v-html="renderMarkdown(scaffold)" />
            </div>

            <!-- Expansion Tool -->
            <div class="expansion-tool">
                <CaomeiDivider />
                <h4 class="expansion-title">
                    <ZoomIn :size="16" />
                    {{ t('pages.admin.snippets.expand_section') }}
                </h4>
                <div class="expansion-fields">
                    <div class="field-item">
                        <label>{{ t('common.title') }}</label>
                        <CaomeiInput
                            v-model="expansionForm.sectionTitle"
                            :placeholder="t('pages.admin.snippets.expand_title')"
                            class="field-input"
                        />
                    </div>
                    <div class="field-item">
                        <label>{{ t('pages.admin.snippets.expand_type') }}</label>
                        <CaomeiSelect
                            v-model="expansionForm.expandType"
                            :options="expandTypeOptions"
                            option-label="label"
                            option-value="value"
                            class="field-input"
                        />
                    </div>
                    <div class="field-item full-width">
                        <CaomeiButton
                            class="expand-action-btn"
                            :loading="expandingSection"
                            :disabled="!expansionForm.sectionTitle.trim()"
                            @click="performExpand"
                        >
                            <template #icon>
                                <Zap :size="16" />
                            </template>
                            {{ t('pages.admin.snippets.expand_btn') }}
                        </CaomeiButton>
                    </div>
                </div>

                <transition name="fade">
                    <div v-if="expansionResult" class="expansion-result-box">
                        <div class="result-header">
                            <span>{{ t('pages.admin.snippets.expansion_result') }}</span>
                            <CaomeiButton
                                variant="ghost"
                                tone="neutral"
                                size="sm"
                                @click="applyExpansion"
                            >
                                <template #icon>
                                    <Copy :size="16" />
                                </template>
                                {{ t('pages.admin.snippets.apply_expansion') }}
                            </CaomeiButton>
                        </div>
                        <div class="dark:prose-invert prose result-content">
                            <div v-html="renderMarkdown(expansionResult)" />
                        </div>
                    </div>
                </transition>
            </div>

            <div class="dialog-actions-footer">
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    @click="visible = false; scaffold = ''"
                >
                    {{ t('common.close') }}
                </CaomeiButton>
                <CaomeiButton @click="convertToPostFromScaffold">
                    <template #icon>
                        <FileOutput :size="16" />
                    </template>
                    {{ t('pages.admin.snippets.convert_to_post') }}
                </CaomeiButton>
            </div>
        </div>
        <div v-else class="aggregate-options">
            <div class="mode-selector">
                <CaomeiSelectButton
                    v-model="aggregateMode"
                    :options="[
                        {label: t('pages.admin.snippets.mode_snippets'), value: 'snippets'},
                        {label: t('pages.admin.snippets.mode_topic'), value: 'topic'}
                    ]"
                    option-label="label"
                    option-value="value"
                    aria-labelledby="basic"
                />
            </div>

            <div class="options-form">
                <div v-if="aggregateMode === 'topic'" class="option-field">
                    <label class="field-label">{{ t('pages.admin.snippets.topic') }}</label>
                    <CaomeiInput
                        v-model="aggregateForm.topic"
                        class="field-input"
                        :placeholder="t('pages.admin.snippets.topic_placeholder')"
                    />
                </div>

                <div v-if="aggregateMode === 'snippets'" class="compact info-alert">
                    <Info :size="16" />
                    <span>{{ t('pages.admin.snippets.aggregate_hint_detailed', {count: selectedSnippetIds.length}) }}</span>
                </div>

                <div class="option-row">
                    <div class="option-field">
                        <label class="field-label">{{ t('pages.admin.snippets.template') }}</label>
                        <CaomeiSelect
                            v-model="aggregateForm.template"
                            :options="templateOptions"
                            option-label="label"
                            option-value="value"
                            class="field-input"
                        />
                    </div>
                    <div class="option-field">
                        <label class="field-label">{{ t('pages.admin.snippets.section_count') }}</label>
                        <CaomeiInputNumber
                            v-model="aggregateForm.sectionCount"
                            :controls="true"
                            :min="3"
                            :max="8"
                            class="field-input"
                        />
                    </div>
                </div>

                <div class="option-field">
                    <label class="field-label">{{ t('pages.admin.snippets.audience') }}</label>
                    <CaomeiSelectButton
                        v-model="aggregateForm.audience"
                        :options="audienceOptions"
                        option-label="label"
                        option-value="value"
                        class="field-select-button"
                    />
                </div>

                <div class="inline-field option-field">
                    <CaomeiCheckbox
                        id="intro-conclusion"
                        v-model="aggregateForm.includeIntroConclusion"
                    />
                    <label for="intro-conclusion" class="inline-label">{{ t('pages.admin.snippets.include_intro_conclusion') }}</label>
                </div>
            </div>

            <CaomeiDivider />

            <div class="dialog-actions">
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    @click="visible = false"
                >
                    {{ t('common.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    :loading="aggregating"
                    @click="performAggregate"
                >
                    <template #icon>
                        <Sparkles :size="16" />
                    </template>
                    {{ t('pages.admin.snippets.generate_scaffold') }}
                </CaomeiButton>
            </div>
        </div>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { Copy, FileOutput, Info, RefreshCw, Sparkles, Zap, ZoomIn } from '@lucide/vue'
import markdownit from 'markdown-it'
import type { ApiResponse } from '@/types/api'
import type { Post } from '@/types/post'

const props = defineProps<{
    visible: boolean
    selectedSnippetIds: string[]
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const { t, locale } = useI18n()
const toast = useToast()
const md = markdownit()

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const aggregating = ref(false)
const scaffold = ref('')
const scaffoldMetadata = ref<Record<string, any> | null>(null)

const aggregateMode = ref<'snippets' | 'topic'>('snippets')
const aggregateForm = ref({
    topic: '',
    template: 'blog',
    sectionCount: 5,
    audience: 'intermediate',
    includeIntroConclusion: true,
})

const expansionForm = ref({
    sectionTitle: '',
    sectionContent: '',
    expandType: 'argument' as 'argument' | 'case' | 'question' | 'reference' | 'data',
})
const expandingSection = ref(false)
const expansionResult = ref('')

const expandTypeOptions = computed(() => [
    { label: t('pages.admin.snippets.expand_argument'), value: 'argument' },
    { label: t('pages.admin.snippets.expand_case'), value: 'case' },
    { label: t('pages.admin.snippets.expand_question'), value: 'question' },
    { label: t('pages.admin.snippets.expand_reference'), value: 'reference' },
    { label: t('pages.admin.snippets.expand_data'), value: 'data' },
])

const templateOptions = computed(() => [
    { label: t('pages.admin.snippets.template_blog'), value: 'blog' },
    { label: t('pages.admin.snippets.template_tutorial'), value: 'tutorial' },
    { label: t('pages.admin.snippets.template_note'), value: 'note' },
    { label: t('pages.admin.snippets.template_report'), value: 'report' },
])

const audienceOptions = computed(() => [
    { label: t('pages.admin.snippets.audience_beginner'), value: 'beginner' },
    { label: t('pages.admin.snippets.audience_intermediate'), value: 'intermediate' },
    { label: t('pages.admin.snippets.audience_advanced'), value: 'advanced' },
])

const performAggregate = async () => {
    if (aggregateMode.value === 'snippets' && props.selectedSnippetIds.length < 1) {
        toast.show({ tone: 'warning', title: t('common.warn'), description: t('pages.admin.snippets.aggregate_hint'), duration: 3000 })
        return
    }
    if (aggregateMode.value === 'topic' && !aggregateForm.value.topic.trim()) {
        toast.show({ tone: 'warning', title: t('common.warn'), description: t('pages.admin.snippets.topic_required'), duration: 3000 })
        return
    }

    aggregating.value = true
    try {
        const res = await $fetch<ApiResponse<{ scaffold: string, metadata: Record<string, any> }>>('/api/ai/scaffold/generate', {
            method: 'POST',
            body: {
                ...aggregateForm.value,
                snippetIds: aggregateMode.value === 'snippets' ? props.selectedSnippetIds : [],
                language: locale.value || 'zh-CN',
            },
        })
        scaffold.value = res.data.scaffold
        scaffoldMetadata.value = res.data.metadata
    } catch (e: any) {
        toast.show({ tone: 'danger', title: t('common.error'), description: e.data?.message || t('common.unexpected_error'), duration: 3000 })
    } finally {
        aggregating.value = false
    }
}

const performExpand = async () => {
    if (!expansionForm.value.sectionTitle.trim()) return
    expandingSection.value = true
    expansionResult.value = ''
    try {
        const currentLanguage = locale.value || 'zh-CN'
        const res = await $fetch<ApiResponse<{ expansion: string }>>('/api/ai/scaffold/expand-section', {
            method: 'POST',
            body: {
                topic: aggregateMode.value === 'topic' ? aggregateForm.value.topic : (scaffoldMetadata.value?.topic || ''),
                sectionTitle: expansionForm.value.sectionTitle,
                sectionContent: expansionForm.value.sectionContent,
                expandType: expansionForm.value.expandType,
                language: currentLanguage,
            },
        })
        expansionResult.value = res.data.expansion
    } catch (e: any) {
        toast.show({ tone: 'danger', title: t('common.error'), description: e.data?.message || t('common.unexpected_error'), duration: 3000 })
    } finally {
        expandingSection.value = false
    }
}

const applyExpansion = async () => {
    if (!expansionResult.value) return
    try {
        await navigator.clipboard.writeText(expansionResult.value)
        toast.show({ tone: 'success', title: t('common.success'), description: t('common.copy_success'), duration: 2000 })
    } catch (err) {
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.copy_failed'), duration: 2000 })
    }
}

const convertToPostFromScaffold = async () => {
    if (!scaffold.value) return
    aggregating.value = true
    try {
        const res = await $fetch<ApiResponse<{ post: Post }>>('/api/admin/snippets/scaffold-to-post', {
            method: 'POST',
            body: { scaffold: scaffold.value },
        })
        toast.show({ tone: 'success', title: t('common.success'), description: t('pages.admin.snippets.convert_success'), duration: 3000 })
        if (res.data.post.id) {
            navigateTo(`/admin/posts/${res.data.post.id}`)
        }
    } catch (e: any) {
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.unexpected_error'), duration: 3000 })
    } finally {
        aggregating.value = false
    }
}

const copyScaffold = async () => {
    if (!scaffold.value) return
    try {
        await navigator.clipboard.writeText(scaffold.value)
        toast.show({ tone: 'success', title: t('common.success'), description: t('common.copy_success'), duration: 2000 })
    } catch (err) {
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.copy_failed'), duration: 2000 })
    }
}

const renderMarkdown = (content: string) => md.render(content)
</script>

<style lang="scss" scoped>
.aggregate-dialog {
    .aggregating-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        gap: 1.5rem;

        .spinner {
            width: 50px;
            height: 50px;
        }

        .aggregating-text {
            color: var(--caomei-color-text-muted);
            font-size: 1.125rem;
            animation: pulse 2s infinite;
        }
    }

    .scaffold-preview-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .scaffold-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid var(--caomei-color-border);

            .scaffold-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin: 0;
                font-size: 1.25rem;
                color: var(--caomei-color-primary);
            }
        }

        .scaffold-content-box {
            background-color: var(--m-surface-50);
            border-radius: 0.75rem;
            padding: 1.5rem;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--caomei-color-border);

            :global(.dark) & {
                background-color: var(--m-surface-900);
            }
        }

        .expansion-tool {
            .expansion-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0;
                margin-bottom: 1.25rem;
                font-size: 1.125rem;
            }

            .expansion-fields {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;

                .field-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;

                    label {
                        font-size: 0.875rem;
                        font-weight: 600;
                    }

                    &.full-width {
                        grid-column: span 2;
                    }

                    .expand-action-btn {
                        margin-top: 0.5rem;
                        width: 100%;
                    }
                }
            }

            .expansion-result-box {
                margin-top: 1.5rem;
                border: 1px solid var(--m-primary-200);
                border-radius: 0.75rem;
                overflow: hidden;
                background-color: var(--m-primary-50);

                :global(.dark) & {
                    background-color: var(--m-primary-950);
                    border-color: var(--m-primary-900);
                }

                .result-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem 1rem;
                    background-color: var(--m-primary-100);
                    font-weight: 600;
                    font-size: 0.875rem;

                    :global(.dark) & {
                        background-color: var(--m-primary-900);
                    }
                }

                .result-content {
                    padding: 1rem;
                    max-height: 250px;
                    overflow-y: auto;
                    font-size: 0.9375rem;
                }
            }
        }

        .dialog-actions-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 0.5rem;
        }
    }

    .aggregate-options {
        .mode-selector {
            display: flex;
            justify-content: center;
            margin-bottom: 2rem;
        }

        .options-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;

            .field-label {
                display: block;
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
            }

            .field-input {
                width: 100%;
            }

            .field-select-button {
                width: 100%;
            }

            .option-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
            }

            .info-alert {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                background-color: var(--m-blue-50);
                color: var(--m-blue-700);
                border-radius: 0.5rem;
                font-size: 0.875rem;

                :global(.dark) & {
                    background-color: var(--m-blue-950);
                    color: var(--m-blue-300);
                }
            }

            .inline-field {
                display: flex;
                align-items: center;
                gap: 0.75rem;

                .inline-label {
                    margin: 0;
                    font-weight: 500;
                    cursor: pointer;
                }
            }
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 0.5rem;
        }
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
</style>
