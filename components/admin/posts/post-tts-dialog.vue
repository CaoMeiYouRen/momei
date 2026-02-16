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
    voice: '',
})

const modes = computed(() => [
    { label: t('pages.admin.posts.tts.mode_speech'), value: 'speech' },
    { label: t('pages.admin.posts.tts.mode_podcast'), value: 'podcast' },
])

const providers = computed(() => [
    { label: 'OpenAI', value: 'openai' },
    { label: 'SiliconFlow', value: 'siliconflow' },
])

const voices = ref<any[]>([])
const loadingVoices = ref(false)

const { $appFetch } = useAppApi()

async function fetchVoices() {
    loadingVoices.value = true
    try {
        const { data } = await $appFetch('/api/admin/tts/voices', {
            query: { provider: config.value.provider },
        })
        voices.value = data
        // 如果当前音色不在新列表中，重置为空
        if (!voices.value.find((v) => v.id === config.value.voice)) {
            config.value.voice = voices.value[0]?.id || ''
        }
    } catch (e) {
        console.error('Failed to fetch voices:', e)
    } finally {
        loadingVoices.value = false
    }
}

// 监听提供商变化，重新获取音色列表
watch(() => config.value.provider, () => {
    fetchVoices()
}, { immediate: true })

const currentTaskId = ref<string | null>(null)
const { status, progress, error, startPolling } = useTTSTask(currentTaskId)

const estimatedCost = ref(0)
const loadingCost = ref(false)

// 监听配置变化，重新计算预估成本
watch([() => config.value.provider, () => config.value.voice], async () => {
    if (!config.value.voice) {
        estimatedCost.value = 0
        return
    }

    loadingCost.value = true
    try {
        const { data } = await $appFetch('/api/admin/tts/estimate', {
            query: {
                provider: config.value.provider,
                voice: config.value.voice,
                post_id: props.postId,
            },
        })
        estimatedCost.value = data.cost
    } catch (e) {
        console.error('Failed to fetch estimated cost:', e)
    } finally {
        loadingCost.value = false
    }
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
        error.value = e.data?.message || e.message || t('pages.admin.posts.tts.failed')
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
        :header="t('pages.admin.posts.tts.generate_title')"
        :modal="true"
        class="post-tts-dialog"
        style="width: 25rem"
    >
        <div class="p-fluid tts-config">
            <!-- Mode Selection -->
            <div class="field">
                <label class="block font-bold mb-2">{{ t('pages.admin.posts.tts.mode') }}</label>
                <div class="flex gap-4">
                    <div
                        v-for="m in modes"
                        :key="m.value"
                        class="align-items-center flex"
                    >
                        <RadioButton
                            v-model="config.mode"
                            :input-id="m.value"
                            name="mode"
                            :value="m.value"
                        />
                        <label :for="m.value" class="ml-2">{{ m.label }}</label>
                    </div>
                </div>
            </div>

            <!-- Provider Selection -->
            <div class="field mt-4">
                <label class="block font-bold mb-2">{{ t('pages.admin.posts.tts.provider') }}</label>
                <Dropdown
                    v-model="config.provider"
                    :options="providers"
                    option-label="label"
                    option-value="value"
                    :placeholder="t('pages.admin.posts.tts.select_provider')"
                />
            </div>

            <!-- Voice Selection -->
            <div class="field mt-4">
                <label class="block font-bold mb-2">{{ t('pages.admin.posts.tts.voice') }}</label>
                <Dropdown
                    v-model="config.voice"
                    :options="voices"
                    option-label="name"
                    option-value="id"
                    :loading="loadingVoices"
                    :placeholder="t('pages.admin.posts.tts.select_voice')"
                />
            </div>

            <!-- Cost Info -->
            <div v-if="estimatedCost > 0 || loadingCost" class="mt-4 p-message p-message-info">
                <div class="flex gap-2 items-center">
                    <span>{{ t('pages.admin.posts.tts.estimated_cost') }}:</span>
                    <i v-if="loadingCost" class="pi pi-spin pi-spinner text-sm" />
                    <span v-else class="font-bold">
                        {{ estimatedCost.toFixed(4) }}
                        <span class="font-normal text-xs">({{ config.provider === 'openai' ? '$' : '¥' }})</span>
                    </span>
                </div>
            </div>

            <!-- Progress Section -->
            <div v-if="status === 'processing' || status === 'pending'" class="mt-4">
                <ProgressBar
                    :value="progress"
                    :show-value="false"
                    style="height: 0.5rem"
                />
                <p class="mt-2 text-500 text-center text-sm">
                    {{ status === 'pending' ? t('pages.admin.posts.tts.pending') : t('pages.admin.posts.tts.processing') }}
                </p>
            </div>

            <div v-if="status === 'completed'" class="mt-4">
                <Message severity="success" :closable="false">
                    {{ t('pages.admin.posts.tts.completed') }}
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
                :disabled="status === 'processing'"
                @click="visible = false"
            />
            <Button
                :label="t('pages.admin.posts.tts.start_generate')"
                :loading="status === 'processing' || status === 'pending'"
                :disabled="!config.voice || status === 'completed'"
                @click="startGenerate"
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
