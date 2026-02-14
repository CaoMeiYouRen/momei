<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import RadioButton from 'primevue/radiobutton'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import { useTTSTask } from '~/composables/use-tts-task'

const props = defineProps<{
    postId: string
    content: string
}>()

const emit = defineEmits<{
    (e: 'completed', audioUrl: string): void
}>()

const { t } = useI18n()
const visible = defineModel<boolean>('visible', { default: false })

const config = ref({
    provider: 'openai',
    mode: 'speech',
    voice: 'alloy',
})

const modes = computed(() => [
    { label: t('admin.posts.tts.mode_speech'), value: 'speech' },
    { label: t('admin.posts.tts.mode_podcast'), value: 'podcast' },
])

const providers = computed(() => [
    { label: 'OpenAI', value: 'openai' },
    { label: 'SiliconFlow (OpenAI)', value: 'siliconflow' },
    // { label: 'Volcengine (Doubao)', value: 'volcengine' }, // TODO
])

// TODO: 从后端获取真实的音色列表
const voicesMap: Record<string, any[]> = {
    openai: [
        { id: 'alloy', name: 'Alloy', language: 'en', gender: 'neutral' },
        { id: 'echo', name: 'Echo', language: 'en', gender: 'male' },
        { id: 'fable', name: 'Fable', language: 'en', gender: 'neutral' },
        { id: 'onyx', name: 'Onyx', language: 'en', gender: 'male' },
        { id: 'nova', name: 'Nova', language: 'en', gender: 'female' },
        { id: 'shimmer', name: 'Shimmer', language: 'en', gender: 'female' },
    ],
    siliconflow: [
        { id: 'fishaudio/fish-speech-1.4', name: 'Fish Speech', language: 'zh-CN', gender: 'neutral' },
    ],
}

const availableVoices = computed(() => voicesMap[config.value.provider] || voicesMap.openai)

const currentTaskId = ref<string | null>(null)
const { status, progress, error, startPolling } = useTTSTask(currentTaskId)

const estimatedCost = ref(0)

// 监听配置变化，重新计算预估成本
watch([() => config.value.provider, () => config.value.voice], async () => {
    // TODO: 实现预估成本 API
}, { immediate: true })

async function startGenerate() {
    try {
        error.value = null
        const data = await $fetch<any>(`/api/posts/${props.postId}/tts`, {
            method: 'POST',
            body: config.value,
        })
        currentTaskId.value = data.taskId
        startPolling()
    } catch (e: any) {
        error.value = e.data?.message || e.message || '启动生成任务失败'
    }
}

watch(status, (newStatus) => {
    if (newStatus === 'completed') {
        // 完成后通知父组件
        // 获取最新的文章数据以更新 UI
        emit('completed', '') // 这里可以传空，由父组件刷新
        setTimeout(() => {
            visible.value = false
        }, 1500)
    }
})
</script>

<template>
    <Dialog
        v-model:visible="visible"
        :header="t('admin.posts.tts.generate_title')"
        :modal="true"
        class="post-tts-dialog"
        style="width: 25rem"
    >
        <div class="tts-config p-fluid">
            <!-- Mode Selection -->
            <div class="field">
                <label class="font-bold mb-2 block">{{ t('admin.posts.tts.mode') }}</label>
                <div class="flex gap-4">
                    <div v-for="m in modes" :key="m.value" class="flex align-items-center">
                        <RadioButton v-model="config.mode" :input-id="m.value" name="mode" :value="m.value" />
                        <label :for="m.value" class="ml-2">{{ m.label }}</label>
                    </div>
                </div>
            </div>

            <!-- Provider Selection -->
            <div class="field mt-4">
                <label class="font-bold mb-2 block">{{ t('admin.posts.tts.provider') }}</label>
                <Dropdown
                    v-model="config.provider"
                    :options="providers"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="t('admin.posts.tts.select_provider')"
                />
            </div>

            <!-- Voice Selection -->
            <div class="field mt-4">
                <label class="font-bold mb-2 block">{{ t('admin.posts.tts.voice') }}</label>
                <Dropdown
                    v-model="config.voice"
                    :options="availableVoices"
                    optionLabel="name"
                    optionValue="id"
                    :placeholder="t('admin.posts.tts.select_voice')"
                />
            </div>

            <!-- Cost Info -->
            <div v-if="estimatedCost > 0" class="mt-4 p-message p-message-info">
                <span>{{ t('admin.posts.tts.estimated_cost') }}: {{ estimatedCost.toFixed(4) }}</span>
            </div>

            <!-- Progress Section -->
            <div v-if="status === 'processing' || status === 'pending'" class="mt-4">
                <ProgressBar :value="progress" :show-value="false" style="height: 0.5rem" />
                <p class="text-center mt-2 text-sm text-500">
                    {{ status === 'pending' ? t('admin.posts.tts.pending') : t('admin.posts.tts.processing') }}
                </p>
            </div>

            <div v-if="status === 'completed'" class="mt-4">
                <Message severity="success" :closable="false">
                    {{ t('admin.posts.tts.completed') }}
                </Message>
            </div>

            <!-- Error Section -->
            <div v-if="error" class="mt-4">
                <Message severity="error" :closable="false">
                    {{ error }}
                </Message>
            </div>
        </div>

        <template #footer>
            <Button
                :label="t('common.cancel')"
                severity="secondary"
                outlined
                @click="visible = false"
                :disabled="status === 'processing'"
            />
            <Button
                :label="t('admin.posts.tts.start_generate')"
                :loading="status === 'processing' || status === 'pending'"
                @click="startGenerate"
                :disabled="!config.voice || status === 'completed'"
            />
        </template>
    </Dialog>
</template>

<style scoped lang="scss">
.post-tts-dialog {
    .field {
        margin-bottom: 1rem;
    }
}
</style>
