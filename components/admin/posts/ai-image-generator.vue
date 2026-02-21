<template>
    <Dialog
        v-model:visible="visible"
        :header="$t('pages.admin.posts.ai.cover_generator.title')"
        modal
        class="ai-generator-dialog"
    >
        <div class="ai-generator__container">
            <div class="ai-generator__section">
                <div class="ai-generator__label-row">
                    <label for="prompt" class="ai-generator__label">
                        {{ $t('pages.admin.posts.ai.cover_generator.prompt_label') }}
                    </label>
                    <Button
                        v-tooltip="$t('pages.admin.posts.ai.cover_generator.magic_hint')"
                        icon="pi pi-sparkles"
                        :label="$t('pages.admin.posts.ai.cover_generator.magic_btn')"
                        size="small"
                        text
                        :loading="magicLoading"
                        @click="generateMagicPrompt"
                    />
                </div>
                <Textarea
                    id="prompt"
                    v-model="prompt"
                    rows="5"
                    :placeholder="$t('pages.admin.posts.ai.cover_generator.prompt_placeholder')"
                    fluid
                    class="ai-generator__textarea"
                    :disabled="generating"
                />
            </div>

            <div v-if="generating" class="ai-generator__status">
                <ProgressSpinner
                    style="width: 50px; height: 50px"
                    stroke-width="4"
                    fill="transparent"
                    animation-duration=".5s"
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

            <!-- Generated Image Preview -->
            <div v-if="generatedUrl" class="ai-generator__preview">
                <div class="ai-generator__preview-header">
                    <i class="pi pi-image text-primary" />
                    {{ $t('common.preview') }}
                </div>
                <div class="ai-generator__image-wrapper">
                    <Image
                        :src="generatedUrl"
                        alt="Generated Cover"
                        width="400"
                        preview
                        class="ai-generator__image"
                    />
                    <div class="ai-generator__image-hint">
                        {{ $t('pages.admin.posts.ai.cover_generator.success') }}
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="ai-generator__footer">
                <Button
                    v-if="generatedUrl"
                    :label="$t('common.retry')"
                    icon="pi pi-refresh"
                    text
                    severity="warn"
                    class="ai-generator__btn-retry"
                    :disabled="generating"
                    @click="resetGenerator"
                />
                <div v-else />

                <div class="ai-generator__actions">
                    <Button
                        :label="$t('common.cancel')"
                        text
                        severity="secondary"
                        class="ai-generator__btn-cancel"
                        @click="visible = false"
                    />
                    <Button
                        v-if="generatedUrl"
                        :label="$t('common.confirm')"
                        icon="pi pi-check"
                        severity="success"
                        class="ai-generator__btn-apply"
                        @click="applyImage"
                    />
                    <Button
                        v-else
                        :label="$t('pages.admin.posts.ai.cover_generator.generate_btn')"
                        icon="pi pi-wand-lines"
                        class="ai-generator__btn-generate"
                        :loading="generating"
                        :disabled="!prompt"
                        @click="generateImage"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    articleTitle?: string
    articleContent?: string
}>()

const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits<{
    (e: 'generated', url: string): void
}>()

const { t, locale } = useI18n()
const toast = useToast()

const prompt = ref('')
const generating = ref(false)
const magicLoading = ref(false)
const pollCount = ref(0)
const statusText = ref('')
const generatedUrl = ref('')
const currentTaskId = ref<string | null>(null)

const statusMessages = computed(() => [
    t('pages.admin.posts.ai.cover_generator.generating'),
    t('pages.admin.posts.ai.cover_generator.status_preparing'),
    t('pages.admin.posts.ai.cover_generator.status_lighting'),
    t('pages.admin.posts.ai.cover_generator.status_polishing'),
    t('pages.admin.posts.ai.cover_generator.status_finishing'),
])

// 智能联想 Prompt
const generateMagicPrompt = async () => {
    if (!props.articleTitle && !props.articleContent) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.no_source_content'), life: 3000 })
        return
    }

    magicLoading.value = true
    try {
        const { data } = await $fetch<any>('/api/ai/suggest-image-prompt', {
            method: 'POST',
            body: {
                title: props.articleTitle || '',
                content: props.articleContent || '',
                language: locale.value,
            },
        })
        prompt.value = data
    } catch (error: any) {
        console.error('Magic prompt error:', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.admin.posts.ai_error'), life: 3000 })
    } finally {
        magicLoading.value = false
    }
}

// 重置状态
const resetGenerator = () => {
    generatedUrl.value = ''
    generating.value = false
    pollCount.value = 0
}

// 应用图片
const applyImage = () => {
    if (generatedUrl.value) {
        emit('generated', generatedUrl.value)
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
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.posts.ai.cover_generator.success'), life: 3000 })

            if (data.result && data.result.images && data.result.images[0]) {
                generatedUrl.value = data.result.images[0].url
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
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || t('pages.admin.posts.ai.cover_generator.error'), life: 5000 })
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
                prompt: prompt.value,
                aspectRatio: '16:9',
            },
        })

        if (!task?.taskId) throw new Error('Task ID not returned')

        // 2. 启动轮询
        currentTaskId.value = task.taskId
        resume()
    } catch (error: any) {
        console.error('Generate image error:', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || t('pages.admin.posts.ai.cover_generator.error'), life: 5000 })
        generating.value = false
    }
}

// 当对话框关闭时重置状态
watch(visible, (val) => {
    if (!val && !generating.value) {
        resetGenerator()
        prompt.value = ''
    }
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.ai-generator-dialog {
    :deep(.p-dialog) {
        width: 500px;
    }
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

    &__image-wrapper {
        position: relative;
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

        :deep(.p-button-label) {
            flex: none;
            line-height: 1;
            display: inline-block;
        }

        :deep(.p-button-icon) {
            margin: 0 !important; /* 取消默认 margin，使用 gap 控制 */
            color: white;
            font-size: 1rem;
        }
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

        :deep(.p-button-icon) {
            margin-right: 0.5rem;
        }
    }
}
</style>
