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
    provider: '',
    mode: 'speech',
    voice: '',
})

const availableProviders = ref<string[]>([])
const showProviderSelect = computed(() => availableProviders.value.length > 1)

async function fetchConfig() {
    try {
        const { data } = await $appFetch('/api/admin/tts/config')
        availableProviders.value = data.availableProviders
        if (!config.value.provider) {
            config.value.provider = data.defaultProvider
        }
    } catch (e) {
        console.error('Failed to fetch TTS config:', e)
        // Fallback
        config.value.provider = 'openai'
    }
}

const modes = computed(() => [
    { label: t('pages.admin.posts.tts.mode_speech'), value: 'speech' },
    { label: t('pages.admin.posts.tts.mode_podcast'), value: 'podcast' },
])

const providers = computed(() => {
    const labels: Record<string, string> = {
        openai: 'OpenAI',
        siliconflow: 'SiliconFlow',
    }
    return availableProviders.value.map((p) => ({
        label: labels[p.toLowerCase()] || p,
        value: p,
    }))
})

const voices = ref<any[]>([])
const loadingVoices = ref(false)

const { $appFetch } = useAppApi()

// 初始化加载配置
fetchConfig()

async function fetchVoices() {
    if (!config.value.provider) return
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
const { status, progress, audioUrl, error, startPolling } = useTTSTask(currentTaskId)

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
        emit('completed', audioUrl.value || '')
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
        <div class="tts-dialog">
            <div class="tts-dialog__body">
                <!-- Mode Selection -->
                <div class="tts-field">
                    <label class="tts-field__label">{{ t('pages.admin.posts.tts.mode') }}</label>
                    <div class="tts-field__content tts-field__content--radio">
                        <div
                            v-for="m in modes"
                            :key="m.value"
                            class="tts-radio-item"
                        >
                            <RadioButton
                                v-model="config.mode"
                                :input-id="m.value"
                                name="mode"
                                :value="m.value"
                            />
                            <label :for="m.value" class="tts-radio-item__label">{{ m.label }}</label>
                        </div>
                    </div>
                </div>

                <!-- Provider Selection (Optional) -->
                <div v-if="showProviderSelect" class="tts-field">
                    <label class="tts-field__label">{{ t('pages.admin.posts.tts.provider') }}</label>
                    <div class="tts-field__content">
                        <Dropdown
                            v-model="config.provider"
                            :options="providers"
                            option-label="label"
                            option-value="value"
                            :placeholder="t('pages.admin.posts.tts.select_provider')"
                        />
                    </div>
                </div>

                <!-- Voice Selection -->
                <div class="tts-field">
                    <label class="tts-field__label">{{ t('pages.admin.posts.tts.voice') }}</label>
                    <div class="tts-field__content">
                        <Dropdown
                            v-model="config.voice"
                            :options="voices"
                            option-label="name"
                            option-value="id"
                            :loading="loadingVoices"
                            :placeholder="t('pages.admin.posts.tts.select_voice')"
                        />
                    </div>
                </div>

                <!-- Cost Info -->
                <div v-if="estimatedCost > 0 || loadingCost" class="tts-cost">
                    <div class="tts-cost__inner">
                        <span class="tts-cost__label">{{ t('pages.admin.posts.tts.estimated_cost') }}:</span>
                        <div class="tts-cost__value">
                            <i v-if="loadingCost" class="pi pi-spin pi-spinner" />
                            <template v-else>
                                <span class="tts-cost__amount">{{ estimatedCost.toFixed(4) }}</span>
                                <span class="tts-cost__currency">{{ config.provider === 'openai' ? '$' : '¥' }}</span>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Progress Section -->
                <div v-if="status === 'processing' || status === 'pending'" class="tts-progress">
                    <ProgressBar
                        :value="progress"
                        :show-value="false"
                        class="tts-progress__bar"
                    />
                    <p class="tts-progress__text">
                        {{ status === 'pending' ? t('pages.admin.posts.tts.pending') : t('pages.admin.posts.tts.processing') }}
                    </p>
                </div>

                <div v-if="status === 'completed'" class="tts-status tts-status--success">
                    <Message severity="success" :closable="false">
                        {{ t('pages.admin.posts.tts.completed') }}
                    </Message>
                </div>

                <!-- Error Section -->
                <div v-if="error" class="tts-status tts-status--error">
                    <Message severity="error" :closable="false">
                        {{ error }}
                    </Message>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="tts-dialog__footer">
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
            </div>
        </template>
    </Dialog>
</template>

<style scoped lang="scss">
.post-tts-dialog {
    :deep(.p-dialog-content) {
        padding-top: 0.5rem;
    }
}

.tts-dialog {
    &__body {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        width: 100%;
    }
}

.tts-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__label {
        font-weight: 700;
        color: var(--surface-900);
        font-size: 0.935rem;
    }

    &__content {
        &--radio {
            display: flex;
            gap: 1.5rem;
            align-items: center;
            padding: 0.25rem 0;
        }
    }
}

.tts-radio-item {
    display: flex;
    align-items: center;
    cursor: pointer;

    &__label {
        margin-left: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--surface-700);
    }
}

.tts-cost {
    background-color: var(--primary-50);
    border: 1px solid var(--primary-100);
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-top: 0.5rem;

    &__inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__label {
        font-size: 0.875rem;
        color: var(--primary-700);
    }

    &__value {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 1rem;
        color: var(--primary-900);
    }

    &__amount {
        font-weight: 700;
        font-family: var(--font-family-monospace, monospace);
    }

    &__currency {
        font-size: 0.75rem;
        opacity: 0.8;
    }
}

.tts-progress {
    margin-top: 0.5rem;

    &__bar {
        height: 0.5rem;
        border-radius: 4px;
    }

    &__text {
        margin-top: 0.5rem;
        text-align: center;
        font-size: 0.8125rem;
        color: var(--surface-500);
    }
}

.tts-status {
    margin-top: 0.5rem;

    :deep(.p-message) {
        margin: 0;
    }
}
</style>
