<template>
    <CaomeiDialog
        :close-on-overlay="false"
        :open="visible"
        :title="$t('pages.admin.posts.ai.cover_generator.title')"
        modal
        class="ai-generator-dialog"
        :style="{width: '500px'}"
        @update:open="visible = $event"
    >
        <div class="ai-generator__container">
            <div v-if="showUsageSelector" class="ai-generator__section">
                <label class="ai-generator__label">{{ $t('pages.admin.posts.ai.cover_generator.usage_label') }}</label>
                <CaomeiSelectButton
                    :model-value="currentAssetUsage"
                    :options="usageOptions"
                    option-label="label"
                    option-value="value"
                    :disabled="generating"
                    @update:model-value="onAssetUsageChange"
                />
                <small class="ai-generator__section-hint">{{ $t('pages.admin.posts.ai.cover_generator.usage_hint') }}</small>
            </div>

            <div class="ai-generator__section">
                <div class="ai-generator__label-row">
                    <label class="ai-generator__label">
                        {{ $t('pages.admin.posts.ai.cover_generator.dimension_title') }}
                    </label>
                    <AppTooltip :content="$t('pages.admin.posts.ai.cover_generator.magic_hint')">
                        <CaomeiButton
                            variant="ghost"
                            tone="neutral"
                            size="sm"
                            :loading="magicLoading"
                            @click="generateMagicPrompt"
                        >
                            <template #icon>
                                <Sparkles :size="14" />
                            </template>
                            {{ $t('pages.admin.posts.ai.cover_generator.magic_btn') }}
                        </CaomeiButton>
                    </AppTooltip>
                </div>
                <div class="ai-generator__dimension-grid">
                    <div
                        v-for="field in dimensionFields"
                        :key="field.key"
                        class="ai-generator__dimension-field"
                    >
                        <label :for="`dimension-${field.key}`" class="ai-generator__dimension-label">
                            {{ field.label }}
                        </label>
                        <CaomeiInput
                            :id="`dimension-${field.key}`"
                            v-model="promptDimensions[field.key]"
                            :placeholder="field.placeholder"
                            :disabled="generating"
                        />
                    </div>
                </div>
            </div>

            <div class="ai-generator__section">
                <label for="prompt-preview" class="ai-generator__label">
                    {{ $t('pages.admin.posts.ai.cover_generator.prompt_preview') }}
                </label>
                <CaomeiTextarea
                    id="prompt-preview"
                    :model-value="composedPrompt"
                    :rows="7"
                    class="ai-generator__textarea"
                    readonly
                />
                <small class="ai-generator__section-hint">{{ $t('pages.admin.posts.ai.cover_generator.confirm_candidate_notice') }}</small>
            </div>

            <div class="ai-generator__options">
                <div class="ai-generator__option-item">
                    <label class="ai-generator__label">{{ $t('pages.admin.posts.ai.cover_generator.images_count') }}</label>
                    <CaomeiSelectButton
                        :model-value="imageCount"
                        :options="imageCountOptions"
                        option-label="label"
                        option-value="value"
                        aria-labelledby="image-count"
                        :disabled="generating"
                        @update:model-value="onImageCountChange"
                    />
                </div>
                <div class="ai-generator__option-item">
                    <label class="ai-generator__label">{{ $t('pages.admin.posts.ai.cover_generator.resolution') }}</label>
                    <CaomeiSelectButton
                        :model-value="resolution"
                        :options="resolutionOptions"
                        option-label="label"
                        option-value="value"
                        aria-labelledby="resolution"
                        :disabled="generating"
                        @update:model-value="onResolutionChange"
                    />
                </div>
            </div>

            <div v-if="generating" class="ai-generator__status">
                <CaomeiProgressSpinner
                    size="lg"
                    :stroke-width="4"
                />
                <div class="ai-generator__status-content">
                    <p class="ai-generator__status-text">
                        {{ statusText }}
                    </p>
                    <p class="ai-generator__status-sub">
                        {{ $t('pages.admin.posts.ai.cover_generator.polling', {step: pollCount}) }}
                    </p>
                </div>
            </div>

            <!-- Generated Images Preview -->
            <div v-if="generatedImages.length > 0" class="ai-generator__preview">
                <div class="ai-generator__preview-header">
                    <ImageIcon :size="16" class="text-primary" />
                    {{ $t('common.preview') }}
                </div>
                <div class="ai-generator__images-grid">
                    <div
                        v-for="(img, index) in generatedImages"
                        :key="index"
                        class="ai-generator__image-card"
                        :class="{'ai-generator__image-card--selected': selectedImageIndex === index}"
                        @click="selectedImageIndex = index"
                    >
                        <div class="ai-generator__image">
                            <CaomeiImage
                                :src="img.url"
                                alt="Generated Cover"
                            />
                        </div>
                        <div v-if="selectedImageIndex === index" class="ai-generator__selected-badge">
                            <Check :size="14" />
                        </div>
                    </div>
                </div>
                <div class="ai-generator__image-hint">
                    {{ $t('pages.admin.posts.ai.cover_generator.success') }}
                </div>
            </div>
        </div>

        <template #footer>
            <div class="ai-generator__footer">
                <CaomeiButton
                    v-if="generatedImages.length > 0"
                    variant="ghost"
                    tone="warning"
                    class="ai-generator__btn-retry"
                    :disabled="generating"
                    @click="resetGenerator"
                >
                    <template #icon>
                        <RefreshCw :size="16" />
                    </template>
                    {{ $t('common.retry') }}
                </CaomeiButton>
                <div v-else />

                <div class="ai-generator__actions">
                    <CaomeiButton
                        variant="ghost"
                        tone="neutral"
                        class="ai-generator__btn-cancel"
                        @click="visible = false"
                    >
                        {{ $t('common.cancel') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="generatedImages.length > 0"
                        tone="success"
                        class="ai-generator__btn-apply"
                        @click="applyImage"
                    >
                        <template #icon>
                            <Check :size="16" />
                        </template>
                        {{ $t('common.confirm') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-else
                        class="ai-generator__btn-generate"
                        :loading="generating"
                        :disabled="!composedPrompt"
                        @click="generateImage"
                    >
                        <template #icon>
                            <WandSparkles :size="16" />
                        </template>
                        {{ $t('pages.admin.posts.ai.cover_generator.generate_btn') }}
                    </CaomeiButton>
                </div>
            </div>
        </template>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { Check, Image as ImageIcon, RefreshCw, Sparkles, WandSparkles } from '@lucide/vue'
import { ref, computed, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useToast } from 'caomei-ui'
import { useI18n } from 'vue-i18n'
import {
    composeVisualPrompt,
    extractVisualPromptDimensions,
    getVisualAssetPreset,
    resolveVisualPromptDimensions,
} from '@/utils/shared/ai-visual-asset'
import type {
    AIVisualAssetApplyMode,
    AIVisualAssetUsage,
    AIVisualPromptDimensions,
    AIVisualPromptSuggestion,
} from '@/types/ai'

const props = defineProps<{
    articleTitle?: string
    articleSummary?: string
    articleContent?: string
    language?: string
    postId?: string
    translationId?: string | null
    assetUsage?: AIVisualAssetUsage
    applyMode?: AIVisualAssetApplyMode
    allowUsageSelection?: boolean
    allowedUsages?: AIVisualAssetUsage[]
}>()

const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits<{
    (e: 'generated', payload: {
        url: string
        prompt: string
        promptDimensions: AIVisualPromptDimensions
        assetUsage: AIVisualAssetUsage
        applyMode: AIVisualAssetApplyMode
    }): void
}>()

const { t, locale } = useI18n()
const toast = useToast()

const generating = ref(false)
const magicLoading = ref(false)
const pollCount = ref(0)
const statusText = ref('')
const generatedImages = ref<{ url: string }[]>([])
const selectedImageIndex = ref(0)
const currentTaskId = ref<string | null>(null)
const currentAssetUsage = ref<AIVisualAssetUsage>(props.assetUsage || 'post-cover')
const currentApplyMode = ref<AIVisualAssetApplyMode>(props.applyMode || getVisualAssetPreset(currentAssetUsage.value).applyMode)

type PromptDimensionKey = keyof AIVisualPromptDimensions

const promptDimensions = ref<AIVisualPromptDimensions>(extractVisualPromptDimensions(
    resolveVisualPromptDimensions(currentAssetUsage.value, {
        title: props.articleTitle,
        summary: props.articleSummary,
        content: props.articleContent,
        language: props.language || locale.value,
    }),
))

const onAssetUsageChange = (value: string | number | Array<string | number> | undefined) => {
    if (typeof value === 'string') {
        currentAssetUsage.value = value as AIVisualAssetUsage
    }
}

const onImageCountChange = (value: string | number | Array<string | number> | undefined) => {
    if (typeof value === 'number') {
        imageCount.value = value
    }
}

const onResolutionChange = (value: string | number | Array<string | number> | undefined) => {
    if (typeof value === 'string') {
        resolution.value = value
    }
}

const imageCount = ref(1)
const imageCountOptions = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
]

const resolution = ref('2K')
const resolutionOptions = [
    { label: '1K', value: '1K' },
    { label: '2K', value: '2K' },
    { label: '4K', value: '4K' },
]

const statusMessages = computed(() => [
    t('pages.admin.posts.ai.cover_generator.generating'),
    t('pages.admin.posts.ai.cover_generator.status_preparing'),
    t('pages.admin.posts.ai.cover_generator.status_lighting'),
    t('pages.admin.posts.ai.cover_generator.status_polishing'),
    t('pages.admin.posts.ai.cover_generator.status_finishing'),
])

const usageCandidates = computed<AIVisualAssetUsage[]>(() => {
    if (props.allowedUsages && props.allowedUsages.length > 0) {
        return props.allowedUsages
    }

    return ['post-cover', 'post-illustration', 'topic-hero', 'event-poster']
})

const showUsageSelector = computed(() => props.allowUsageSelection === true && usageCandidates.value.length > 1)

const usageOptions = computed(() => usageCandidates.value.map((usage) => ({
    value: usage,
    label: t(`pages.admin.posts.ai.cover_generator.usage_options.${usage}`),
})))

const dimensionFields = computed<Array<{ key: PromptDimensionKey, label: string, placeholder: string }>>(() => [
    { key: 'type', label: t('pages.admin.posts.ai.cover_generator.dimensions.type'), placeholder: t('pages.admin.posts.ai.cover_generator.placeholders.type') },
    { key: 'palette', label: t('pages.admin.posts.ai.cover_generator.dimensions.palette'), placeholder: t('pages.admin.posts.ai.cover_generator.placeholders.palette') },
    { key: 'rendering', label: t('pages.admin.posts.ai.cover_generator.dimensions.rendering'), placeholder: t('pages.admin.posts.ai.cover_generator.placeholders.rendering') },
    { key: 'text', label: t('pages.admin.posts.ai.cover_generator.dimensions.text'), placeholder: t('pages.admin.posts.ai.cover_generator.placeholders.text') },
    { key: 'mood', label: t('pages.admin.posts.ai.cover_generator.dimensions.mood'), placeholder: t('pages.admin.posts.ai.cover_generator.placeholders.mood') },
])

const composedPrompt = computed(() => composeVisualPrompt(currentAssetUsage.value, {
    title: props.articleTitle,
    summary: props.articleSummary,
    content: props.articleContent,
    language: props.language || locale.value,
}, promptDimensions.value))

const resetPromptDimensions = (usage: AIVisualAssetUsage) => {
    promptDimensions.value = extractVisualPromptDimensions(resolveVisualPromptDimensions(usage, {
        title: props.articleTitle,
        summary: props.articleSummary,
        content: props.articleContent,
        language: props.language || locale.value,
    }))
    resolution.value = getVisualAssetPreset(usage).size
    currentApplyMode.value = props.applyMode || getVisualAssetPreset(usage).applyMode
}

// 智能联想 Prompt
const generateMagicPrompt = async () => {
    if (!props.articleTitle && !props.articleContent) {
        toast.show({ tone: 'warning', title: t('common.warn'), description: t('common.no_source_content'), duration: 3000 })
        return
    }

    magicLoading.value = true
    try {
        const { data } = await $fetch<any>('/api/ai/suggest-image-prompt', {
            method: 'POST',
            body: {
                title: props.articleTitle || '',
                summary: props.articleSummary || '',
                content: props.articleContent || '',
                language: props.language || locale.value,
                assetUsage: currentAssetUsage.value,
                applyMode: currentApplyMode.value,
            },
        })

        const suggestion = data as AIVisualPromptSuggestion
        if (suggestion?.dimensions) {
            promptDimensions.value = { ...suggestion.dimensions }
        }
    } catch (error: any) {
        console.error('Magic prompt error:', error)
        toast.show({ tone: 'danger', title: t('common.error'), description: t('pages.admin.posts.ai_error'), duration: 3000 })
    } finally {
        magicLoading.value = false
    }
}

// 重置状态
const resetGenerator = () => {
    generatedImages.value = []
    selectedImageIndex.value = 0
    generating.value = false
    pollCount.value = 0
}

// 应用图片
const applyImage = () => {
    const selectedImage = generatedImages.value[selectedImageIndex.value]
    if (selectedImage?.url) {
        emit('generated', {
            url: selectedImage.url,
            prompt: composedPrompt.value,
            promptDimensions: { ...promptDimensions.value },
            assetUsage: currentAssetUsage.value,
            applyMode: currentApplyMode.value,
        })
        visible.value = false
        resetGenerator()
    }
}

const { pause, resume } = useIntervalFn(async () => {
    if (!currentTaskId.value || !generating.value) {
        pause()
        return
    }

    pollCount.value++

    // 更新趣味状态文案
    const idx = Math.min(pollCount.value, statusMessages.value.length - 1)
    statusText.value = statusMessages.value[idx] || ''

    try {
        const { data } = await $fetch<any>(`/api/ai/task/status/${currentTaskId.value}`)

        if (data.status === 'completed') {
            toast.show({ tone: 'success', title: t('common.success'), description: t('pages.admin.posts.ai.cover_generator.success'), duration: 3000 })

            if (data.result && data.result.images && data.result.images.length > 0) {
                generatedImages.value = data.result.images
                selectedImageIndex.value = 0
            } else {
                throw new Error('Result structure invalid')
            }
            generating.value = false
            pause()
        } else if (data.status === 'failed') {
            throw new Error(data.error || 'Task failed')
        }
    } catch (error: any) {
        generating.value = false
        pause()
        console.error('Poll task error:', error)
        toast.show({ tone: 'danger', title: t('common.error'), description: error.data?.message || t('pages.admin.posts.ai.cover_generator.error'), duration: 5000 })
    }
}, 10000, { immediate: false })

// 生成图像流程
const generateImage = async () => {
    resetGenerator()
    generating.value = true
    statusText.value = statusMessages.value[0] || ''

    try {
        // 1. 发起任务
        const { data: task } = await $fetch<any>('/api/ai/image/generate', {
            method: 'POST',
            body: {
                prompt: composedPrompt.value,
                promptDimensions: promptDimensions.value,
                postId: props.postId,
                targetLanguage: props.language || locale.value,
                translationId: props.translationId || null,
                applyToPost: currentApplyMode.value === 'auto-apply',
                overwriteExistingCover: currentAssetUsage.value === 'post-cover',
                assetUsage: currentAssetUsage.value,
                applyMode: currentApplyMode.value,
                aspectRatio: getVisualAssetPreset(currentAssetUsage.value).aspectRatio,
                size: resolution.value,
                n: imageCount.value,
            },
        })

        if (!task?.taskId) throw new Error('Task ID not returned')

        // 2. 启动轮询
        currentTaskId.value = task.taskId
        resume()
    } catch (error: any) {
        console.error('Generate image error:', error)
        toast.show({ tone: 'danger', title: t('common.error'), description: error.data?.message || t('pages.admin.posts.ai.cover_generator.error'), duration: 5000 })
        generating.value = false
    }
}

// 当对话框关闭时重置状态
watch(visible, (val) => {
    if (!val && !generating.value) {
        resetGenerator()
        resetPromptDimensions(currentAssetUsage.value)
    }
})

watch(() => props.assetUsage, (nextUsage) => {
    if (nextUsage) {
        currentAssetUsage.value = nextUsage
        resetPromptDimensions(nextUsage)
    }
}, { immediate: true })

watch(currentAssetUsage, (usage, previousUsage) => {
    if (usage !== previousUsage) {
        resetPromptDimensions(usage)
    }
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.ai-generator-dialog {
}

.ai-generator {
    &__container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    &__section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    &__section-hint {
        color: var(--p-surface-500);
        font-size: 0.75rem;
    }

    &__label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__label {
        font-weight: 700;
        color: var(--p-text-color);
    }

    &__textarea {
        resize: none;
        border-radius: $border-radius-md;
    }

    &__dimension-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    &__dimension-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    &__dimension-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--p-text-color);
    }

    &__options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    @media (width <= 768px) {
        &__dimension-grid {
            grid-template-columns: 1fr;
        }
    }

    &__option-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;

        label {
            white-space: nowrap;
        }

        :deep(.caomei-select-button) {
            flex-shrink: 0;
        }
    }

    &__status {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        padding: 1.5rem 0;
    }

    &__status-content {
        text-align: center;
    }

    &__status-text {
        font-weight: 700;
        color: $color-primary;
        margin: 0;
    }

    &__status-sub {
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: var(--p-surface-500);
    }

    &__preview {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        padding: 0.5rem 0;
    }

    &__preview-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 700;
        font-size: 1.125rem;
    }

    &__images-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        width: 100%;
    }

    &__image-card {
        position: relative;
        cursor: pointer;
        border-radius: $border-radius-md;
        border: 2px solid transparent;
        overflow: hidden;
        transition: $transition-base;
        aspect-ratio: 16 / 9;

        &:hover {
            transform: scale(1.02);
            box-shadow: $shadow-md;
        }

        &--selected {
            border-color: $color-primary;
            box-shadow: 0 0 0 2px rgba($color-primary, 0.2);
        }

        :deep(.caomei-image) {
            display: block;
            width: 100%;
            height: 100%;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
        }
    }

    &__selected-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background-color: $color-primary;
        color: white;
        border-radius: 50%;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        box-shadow: $shadow-sm;
    }

    &__image {
        border-radius: $border-radius-md;
        border: 1px solid var(--p-surface-200);
        overflow: hidden;
        box-shadow: $shadow-md;
    }

    &__image-hint {
        margin-top: 0.75rem;
        text-align: center;
        color: var(--p-surface-500);
        font-size: 0.75rem;
    }

    &__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-top: 0.5rem;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 1rem; /* Increased gap for better clarity */
    }

    &__btn-cancel {
        transition: $transition-base;
        font-weight: 500;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 1.25rem;

        &:hover {
            background-color: var(--p-surface-100);
            color: var(--p-surface-700);
        }
    }

    &__btn-generate {
        background: linear-gradient(135deg, $color-primary 0%, #a855f7 100%);
        border: 1px solid transparent;
        color: white;
        font-weight: 600;
        height: 40px;
        padding: 0 1.5rem;
        transition: $transition-base;
        box-shadow: 0 4px 12px rgba($color-primary, 0.2);

        &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba($color-primary, 0.3);
            background: linear-gradient(135deg, $color-primary-hover 0%, #9333ea 100%);
        }

        &:active:not(:disabled) {
            transform: translateY(0);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: var(--p-surface-200) !important;
            color: var(--p-surface-500) !important;
            border-color: var(--p-surface-300) !important;
            box-shadow: none;
        }

        /* 确保按钮内容（图标+文字）完美居中 */
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    &__btn-retry {
        font-weight: normal;
        opacity: 0.8;
        transition: $transition-fast;
        height: 40px;
        display: inline-flex;
        align-items: center;

        &:hover {
            opacity: 1;
            text-decoration: underline;
        }
    }

    &__btn-apply {
        font-weight: 600;
        height: 40px;
        padding: 0 1.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba($color-success, 0.2);
        transition: $transition-base;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba($color-success, 0.3);
        }
    }
}
</style>
