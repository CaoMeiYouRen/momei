<template>
    <Dialog
        v-model:visible="visible"
        :header="$t('pages.admin.posts.ai.cover_generator.title')"
        modal
        :style="{width: '500px'}"
        :closable="!generating"
    >
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <label for="prompt" class="font-bold">
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
                    class="resize-none"
                    :disabled="generating"
                />
            </div>

            <div v-if="generating" class="flex flex-col gap-3 items-center py-4">
                <ProgressSpinner
                    style="width: 50px; height: 50px"
                    stroke-width="4"
                    fill="transparent"
                    animation-duration=".5s"
                />
                <div class="text-center">
                    <p class="font-bold text-primary">
                        {{ statusText }}
                    </p>
                    <p class="mt-1 text-sm text-surface-500">
                        {{ $t('pages.admin.posts.ai.cover_generator.polling', {step: pollCount}) }}
                    </p>
                </div>
            </div>
        </div>

        <template #footer>
            <Button
                :label="$t('common.cancel')"
                text
                severity="secondary"
                :disabled="generating"
                @click="visible = false"
            />
            <Button
                :label="$t('pages.admin.posts.ai.cover_generator.generate_btn')"
                icon="pi pi-wand-lines"
                :loading="generating"
                :disabled="!prompt"
                @click="generateImage"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const { t } = useI18n()
const toast = useToast()

const prompt = ref('')
const generating = ref(false)
const magicLoading = ref(false)
const pollCount = ref(0)
const statusText = ref('')

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

// 生成图像流程
const generateImage = async () => {
    generating.value = true
    pollCount.value = 0
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

        // 2. 轮询状态
        await pollTask(task.taskId)
    } catch (error: any) {
        console.error('Generate image error:', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || t('pages.admin.posts.ai.cover_generator.error'), life: 5000 })
        generating.value = false
    }
}

const pollTask = async (taskId: string) => {
    pollCount.value++

    // 更新趣味状态文案
    if (pollCount.value % 3 === 0) {
        const idx = Math.min(Math.floor(pollCount.value / 3), statusMessages.value.length - 1)
        statusText.value = statusMessages.value[idx] || ''
    }

    try {
        const { data } = await $fetch<any>(`/api/ai/task/status/${taskId}`)

        if (data.status === 'completed') {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.posts.ai.cover_generator.success'), life: 3000 })
            if (data.result) {
                emit('generated', data.result) // 返回本地存储后的 URL
            }
            visible.value = false
            generating.value = false
        } else if (data.status === 'failed') {
            throw new Error(data.error || 'Task failed')
        } else {
            // 继续轮询，每 2 秒一次
            setTimeout(() => pollTask(taskId), 2000)
        }
    } catch (error) {
        throw error
    }
}

// 当对话框关闭时重置状态
watch(visible, (val) => {
    if (!val && !generating.value) {
        prompt.value = ''
        pollCount.value = 0
    }
})
</script>
