<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import RadioButton from 'primevue/radiobutton'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import { useTTSTask } from '~/composables/use-tts-task'
import type {
    AICostDisplay,
    TTSConfigResponse,
    TTSEstimateResponse,
    TTSSynthesisMode,
    TTSTaskCreateResponse,
    TTSVoiceOption,
} from '~/types/ai'
import type { ApiResponse } from '~/types/api'
import { cleanTextForTTS } from '~/utils/shared/tts-cleaner'
import { formatDecimal } from '~/utils/shared/number'
import { normalizeAICostDisplay } from '~/utils/shared/ai-cost'

const props = defineProps<{
    postId?: string
    content: string
}>()

const emit = defineEmits<{
    (e: 'completed', audioUrl: string): void
}>()

const { t } = useI18n()
const visible = defineModel<boolean>('visible', { default: false })

interface TTSDialogConfig {
    provider: string
    mode: TTSSynthesisMode
    voice: string
}

const config = ref<TTSDialogConfig>({
    provider: '',
    mode: 'speech',
    voice: '',
})

const availableProviders = ref<string[]>([])
const providerModes = ref<Record<string, TTSSynthesisMode[]>>({})
const showProviderSelect = computed(() => availableProviders.value.length > 1)

const { $appFetch } = useAppApi()

async function fetchConfig() {
    try {
        const response = await $appFetch<ApiResponse<TTSConfigResponse>>('/api/ai/tts/config')
        const data = response.data
        availableProviders.value = data.availableProviders
        providerModes.value = data.providerModes || {}
        if (!config.value.provider) {
            config.value.provider = data.defaultProvider
        }
    } catch (error) {
        console.error('Failed to fetch TTS config:', error)
        // Fallback
        config.value.provider = 'openai'
    }
}

const modes = computed(() => {
    const currentProvider = config.value.provider
    const enabledModes = providerModes.value[currentProvider] || ['speech']

    return enabledModes.map((mode) => ({
        label: mode === 'podcast'
            ? t('pages.admin.posts.tts.mode_podcast')
            : t('pages.admin.posts.tts.mode_speech'),
        value: mode,
    }))
})

const providers = computed(() => {
    return availableProviders.value.map((p) => ({
        label: t(`pages.admin.posts.tts.providers.${p.toLowerCase()}`),
        value: p,
    }))
})

const voices = ref<TTSVoiceOption[]>([])
const loadingVoices = ref(false)

const script = ref('')
const optimizing = ref(false)

async function optimizeManuscript() {
    if (!props.content || optimizing.value) return
    optimizing.value = true
    try {
        const response = await $appFetch<ApiResponse<{ manuscript: string }>>('/api/ai/tts/manuscript', {
            method: 'POST',
            body: {
                content: props.content,
                mode: config.value.mode,
            },
        })
        script.value = response.data.manuscript
    } catch (error) {
        console.error('Failed to optimize manuscript:', error)
    } finally {
        optimizing.value = false
    }
}

async function fetchVoices() {
    if (!config.value.provider) return
    loadingVoices.value = true
    try {
        const response = await $appFetch<ApiResponse<TTSVoiceOption[]>>('/api/ai/tts/voices', {
            query: {
                provider: config.value.provider,
                mode: config.value.mode,
            },
        })
        voices.value = response.data
        // 如果当前音色不在新列表中，重置为空
        if (!voices.value.find((v) => v.id === config.value.voice)) {
            config.value.voice = voices.value[0]?.id || ''
        }
    } catch (error) {
        console.error('Failed to fetch voices:', error)
    } finally {
        loadingVoices.value = false
    }
}

// 监听提供商变化，重新获取音色列表
watch(() => config.value.provider, () => {
    const enabledModes = providerModes.value[config.value.provider] || ['speech']
    if (!enabledModes.includes(config.value.mode)) {
        config.value.mode = 'speech'
    }
    fetchVoices()
}, { immediate: true })

watch(() => config.value.mode, () => {
    fetchVoices()
})

// 监听 visible 变化，初始化文稿
watch(visible, (val) => {
    if (val && !script.value) {
        script.value = cleanTextForTTS(props.content)
    }
})

onMounted(() => {
    fetchConfig()
})

const currentTaskId = ref<string | null>(null)
const { status, progress, audioUrl, error, startPolling } = useTTSTask(currentTaskId)
const hasGeneratedAudio = computed(() => Boolean(audioUrl.value))
const { resolveErrorMessage } = useRequestFeedback()

const estimatedCost = ref(0)
const estimatedCostDisplay = ref<AICostDisplay>(normalizeAICostDisplay())
const normalizedEstimatedCostDisplay = computed(() => normalizeAICostDisplay(estimatedCostDisplay.value))
const formattedEstimatedCost = computed(() => formatDecimal(estimatedCost.value, 2))
const loadingCost = ref(false)

// 监听配置变化，重新计算预估成本
watchDebounced([() => config.value.provider, () => config.value.voice, () => config.value.mode, script], async () => {
    if (!config.value.voice || !script.value) {
        estimatedCost.value = 0
        return
    }

    loadingCost.value = true
    try {
        const response = await $appFetch<ApiResponse<TTSEstimateResponse>>('/api/ai/tts/estimate', {
            method: 'POST',
            body: {
                provider: config.value.provider,
                voice: config.value.voice,
                text: script.value,
                mode: config.value.mode,
            },
        })
        const data = response.data
        estimatedCost.value = data.displayCost
        estimatedCostDisplay.value = normalizeAICostDisplay(data.costDisplay)
    } catch (error) {
        console.error('Failed to fetch estimated cost:', error)
    } finally {
        loadingCost.value = false
    }
}, { immediate: true, debounce: 1500 })

async function startGenerate() {
    try {
        error.value = null
        const data = await $appFetch<TTSTaskCreateResponse>('/api/ai/tts/task', {
            method: 'POST',
            body: {
                ...config.value,
                postId: props.postId,
                script: script.value,
            },
        })
        currentTaskId.value = data.taskId
        startPolling()
    } catch (requestError) {
        error.value = resolveErrorMessage(requestError, {
            fallbackKey: 'pages.admin.posts.tts.failed',
        })
    }
}

watch(status, (newStatus) => {
    if (newStatus === 'completed') {
        // 完成后不再自动通知，等待用户点击确认
    }
})

function handleConfirm() {
    if (audioUrl.value) {
        emit('completed', audioUrl.value)
        visible.value = false
    }
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        :header="t('pages.admin.posts.tts.generate_title')"
        :modal="true"
        class="post-tts-dialog"
        style="width: 32rem"
    >
        <div class="tts-dialog">
            <div class="tts-dialog__body">
                <!-- Mode Selection -->
                <div v-if="modes.length > 1" class="tts-field">
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
                            <i
                                v-if="m.value === 'podcast'"
                                v-tooltip.top="t('pages.admin.posts.tts.podcast_manuscript_notice')"
                                class="pi pi-info-circle tts-radio-item__hint"
                            />
                        </div>
                    </div>
                </div>

                <!-- Provider Selection (Optional) -->
                <div v-if="showProviderSelect" class="tts-field">
                    <label class="tts-field__label">{{ t('pages.admin.posts.tts.provider') }}</label>
                    <div class="tts-field__content">
                        <Select
                            v-model="config.provider"
                            :options="providers"
                            option-label="label"
                            option-value="value"
                            class="w-full"
                            :placeholder="t('pages.admin.posts.tts.select_provider')"
                        />
                    </div>
                </div>

                <!-- Voice Selection -->
                <div class="tts-field">
                    <label class="tts-field__label">{{ t('pages.admin.posts.tts.voice') }}</label>
                    <div class="tts-field__content">
                        <Select
                            v-model="config.voice"
                            :options="voices"
                            option-label="name"
                            option-value="id"
                            class="w-full"
                            :loading="loadingVoices"
                            :placeholder="t('pages.admin.posts.tts.select_voice')"
                        />
                    </div>
                </div>

                <!-- Manuscript -->
                <div class="tts-field">
                    <div class="tts-field__header">
                        <label class="tts-field__label">{{ t('pages.admin.posts.tts.manuscript') }}</label>
                        <Button
                            icon="pi pi-sparkles"
                            :label="t('pages.admin.posts.tts.optimize_manuscript')"
                            size="small"
                            text
                            rounded
                            :loading="optimizing"
                            @click="optimizeManuscript"
                        />
                    </div>
                    <div class="tts-field__content">
                        <Textarea
                            v-model="script"
                            auto-resize
                            rows="5"
                            class="tts-manuscript w-full"
                            :placeholder="t('pages.admin.posts.tts.manuscript_hint')"
                        />
                        <small class="text-gray-500 text-xs tts-field__hint">{{ t('pages.admin.posts.tts.manuscript_hint') }}</small>
                    </div>
                </div>

                <!-- Cost Info -->
                <div v-if="estimatedCost > 0 || loadingCost" class="tts-cost">
                    <div class="tts-cost__inner">
                        <span class="tts-cost__label">{{ t('pages.admin.posts.tts.estimated_cost') }}:</span>
                        <div class="tts-cost__value">
                            <i v-if="loadingCost" class="pi pi-spin pi-spinner" />
                            <template v-else>
                                <span class="tts-cost__amount">{{ formattedEstimatedCost }}</span>
                                <span class="tts-cost__unit">
                                    <span class="tts-cost__currency">{{ normalizedEstimatedCostDisplay.currencySymbol }}</span>
                                    <span class="tts-cost__code">{{ normalizedEstimatedCostDisplay.currencyCode }}</span>
                                </span>
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
                    <div class="tts-preview">
                        <label class="tts-preview__label">{{ t('pages.admin.posts.tts.preview_audio') }}</label>
                        <audio
                            v-if="audioUrl"
                            :src="audioUrl"
                            controls
                            class="tts-preview__audio"
                        />
                    </div>
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
            <div
                class="tts-dialog__footer"
                :class="{'tts-dialog__footer--with-retry': hasGeneratedAudio}"
            >
                <Button
                    v-if="hasGeneratedAudio"
                    icon="pi pi-refresh"
                    severity="contrast"
                    outlined
                    :label="t('pages.admin.posts.tts.regenerate')"
                    :loading="status === 'processing' || status === 'pending'"
                    :disabled="!config.voice || optimizing || status === 'processing' || status === 'pending'"
                    @click="startGenerate"
                />

                <div class="tts-dialog__actions">
                    <Button
                        :label="t('common.cancel')"
                        severity="secondary"
                        outlined
                        :disabled="status === 'processing'"
                        @click="visible = false"
                    />
                    <Button
                        v-if="hasGeneratedAudio"
                        :label="t('common.confirm')"
                        :disabled="status === 'processing' || status === 'pending'"
                        @click="handleConfirm"
                    />
                    <Button
                        v-else
                        :label="t('pages.admin.posts.tts.start_generate')"
                        :loading="status === 'processing' || status === 'pending'"
                        :disabled="!config.voice || optimizing || status === 'processing' || status === 'pending'"
                        @click="startGenerate"
                    />
                </div>
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
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        width: 100%;

        &--with-retry {
            justify-content: space-between;
        }
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
}

.tts-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .p-button {
            padding: 0 0.5rem;
            height: 1.5rem;
            font-size: 0.8125rem;

            :deep(.p-button-icon) {
                font-size: 0.75rem;
                margin-right: 0.25rem;
            }
        }
    }

    &__label {
        font-weight: 700;
        color: var(--surface-900);
        font-size: 0.935rem;
    }

    &__hint {
        display: block;
        margin-top: 0.375rem;
        color: var(--surface-500);
        line-height: 1.4;
    }

    &__content {
        &--radio {
            display: flex;
            gap: 1.5rem;
            align-items: center;
            padding: 0.25rem 0;
        }

        .p-select, .p-textarea {
            width: 100%;
        }
    }
}

.tts-manuscript {
    font-family: var(--font-family, sans-serif);
    font-size: 0.875rem;
    line-height: 1.6;
    background: var(--surface-50);
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

    &__hint {
        margin-left: 0.375rem;
        color: var(--surface-500);
        font-size: 0.875rem;
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
        align-items: baseline;
        gap: 0.5rem;
        font-size: 1rem;
        color: var(--primary-900);
    }

    &__amount {
        font-weight: 700;
        font-size: 1.125rem;
        line-height: 1;
        font-family: var(--font-family-monospace, monospace);
    }

    &__unit {
        display: inline-flex;
        align-items: baseline;
        gap: 0.25rem;
        line-height: 1;
    }

    &__currency {
        font-size: 0.875rem;
        font-weight: 600;
        opacity: 0.9;
    }

    &__code {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-color-secondary);
        opacity: 0.8;
        letter-spacing: 0.04em;
        text-transform: uppercase;
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

.tts-preview {
    margin-top: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__label {
        font-weight: 700;
        color: var(--surface-900);
        font-size: 0.935rem;
    }

    &__audio {
        width: 100%;
    }
}
</style>
