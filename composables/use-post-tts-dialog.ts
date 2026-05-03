import { watchDebounced } from '@vueuse/core'
import type { Ref } from 'vue'
import { useTTSTask } from '~/composables/use-tts-task'
import { useTTSVolcengineDirect } from '~/composables/use-tts-volcengine-direct'
import type {
    AICostDisplay,
    TTSConfigResponse,
    TTSEstimateResponse,
    TTSSynthesisMode,
    TTSVoiceOption,
} from '~/types/ai'
import type { ApiResponse } from '~/types/api'
import { normalizeAICostDisplay } from '~/utils/shared/ai-cost'
import { formatDecimal } from '~/utils/shared/number'
import { cleanTextForTTS } from '~/utils/shared/tts-cleaner'

interface TTSDialogConfig {
    provider: string
    mode: TTSSynthesisMode
    voice: string
}

/**
 * TTS 对话框状态管理
 *
 * 双模式支持:
 *   - 传统轮询模式: 调用 POST /api/ai/tts/task 创建后台任务 → useTTSTask 轮询
 *   - 火山前端直连: 跳过任务端点，通过 credentials + 直调火山 API + 直传 OSS 完成
 *
 * 直连触发条件:
 *   - Provider 为 volcengine
 *   - Mode 为 speech（播客模式暂不支持直连）
 */
export function usePostTtsDialog(options: {
    postId: Ref<string | undefined>
    content: Ref<string>
    language: Ref<string | undefined>
    translationId: Ref<string | null | undefined>
    visible: Ref<boolean>
}) {
    const { t, locale } = useI18n()
    const { $appFetch } = useAppApi()
    const { resolveErrorMessage } = useRequestFeedback()

    const config = ref<TTSDialogConfig>({
        provider: '',
        mode: 'speech',
        voice: '',
    })

    const availableProviders = ref<string[]>([])
    const providerModes = ref<Record<string, TTSSynthesisMode[]>>({})
    const showProviderSelect = computed(() => availableProviders.value.length > 1)
    const voices = ref<TTSVoiceOption[]>([])
    const loadingVoices = ref(false)

    const script = ref('')
    const optimizing = ref(false)

    // ---- 轮询模式状态 ----
    const currentTaskId = ref<string | null>(null)
    const {
        status: taskStatus,
        progress: taskProgress,
        audioUrl: taskAudioUrl,
        error: taskError,
        startPolling,
    } = useTTSTask(currentTaskId)

    // ---- 直连模式状态 ----
    const directTts = useTTSVolcengineDirect()
    const isDirectMode = ref(false)
    const directAudioUrl = ref<string | null>(null)

    // ---- 是否启用前端直连（volcengine，speech + podcast） ----
    const canUseDirect = computed(() =>
        config.value.provider === 'volcengine',
    )

    // ---- 合并状态 ----
    const status = computed(() => {
        if (!isDirectMode.value) {
            return taskStatus.value
        }
        if (directAudioUrl.value) {
            return 'completed'
        }
        if (directTts.isGenerating.value) {
            return 'processing'
        }
        return null
    })

    const progress = computed(() =>
        isDirectMode.value ? directTts.progress.value : taskProgress.value,
    )

    const audioUrl = computed(() =>
        isDirectMode.value ? directAudioUrl.value : (taskAudioUrl.value ?? null),
    )

    const error = computed(() =>
        isDirectMode.value ? directTts.error.value : taskError.value,
    )

    const hasGeneratedAudio = computed(() => Boolean(audioUrl.value))
    const isGenerating = computed(() => status.value === 'processing' || status.value === 'pending')

    // ---- 成本估算 ----
    const estimatedCost = ref(0)
    const estimatedCostDisplay = ref<AICostDisplay>(normalizeAICostDisplay())
    const normalizedEstimatedCostDisplay = computed(() => normalizeAICostDisplay(estimatedCostDisplay.value))
    const formattedEstimatedCost = computed(() => formatDecimal(estimatedCost.value, 2))
    const loadingCost = ref(false)

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

    const providers = computed(() => availableProviders.value.map((provider) => ({
        label: t(`pages.admin.posts.tts.providers.${provider.toLowerCase()}`),
        value: provider,
    })))

    // ---- API 调用 ----

    const fetchConfig = async () => {
        try {
            const response = await $appFetch<ApiResponse<TTSConfigResponse>>('/api/ai/tts/config')
            const data = response.data
            availableProviders.value = data.availableProviders
            providerModes.value = data.providerModes || {}
            if (!config.value.provider) {
                config.value.provider = data.defaultProvider
            }
        } catch (fetchError) {
            console.error('Failed to fetch TTS config:', fetchError)
            config.value.provider = 'openai'
        }
    }

    const fetchVoices = async () => {
        if (!config.value.provider) {
            return
        }
        loadingVoices.value = true
        try {
            const response = await $appFetch<ApiResponse<TTSVoiceOption[]>>('/api/ai/tts/voices', {
                query: { provider: config.value.provider, mode: config.value.mode },
            })
            voices.value = response.data
            if (!voices.value.find((voice) => voice.id === config.value.voice)) {
                config.value.voice = voices.value[0]?.id || ''
            }
        } catch (fetchError) {
            console.error('Failed to fetch voices:', fetchError)
        } finally {
            loadingVoices.value = false
        }
    }

    const optimizeManuscript = async () => {
        if (!options.content.value || optimizing.value) {
            return
        }
        optimizing.value = true
        try {
            const response = await $appFetch<ApiResponse<{ manuscript: string }>>('/api/ai/tts/manuscript', {
                method: 'POST',
                body: {
                    content: options.content.value,
                    mode: config.value.mode,
                    language: options.language.value || locale.value,
                },
            })
            script.value = response.data.manuscript
        } catch (optimizeError) {
            console.error('Failed to optimize manuscript:', optimizeError)
        } finally {
            optimizing.value = false
        }
    }

    const startGenerate = async () => {
        // 重置状态
        currentTaskId.value = null
        directAudioUrl.value = null

        // 火山引擎走前端直连
        if (canUseDirect.value) {
            isDirectMode.value = true
            try {
                const result = await directTts.generateAndUpload({
                    mode: config.value.mode,
                    text: script.value || options.content.value,
                    voice: config.value.voice,
                    speed: 1.0,
                    volume: 1.0,
                    language: options.language.value || locale.value,
                    postId: options.postId.value ?? null,
                })
                directAudioUrl.value = result.audioUrl
            } catch {
                // 错误已在 directTts 内部处理（toast + error ref）
            }
            return
        }

        // 传统轮询模式
        isDirectMode.value = false
        try {
            const data = await $appFetch<{ taskId: string }>('/api/ai/tts/task', {
                method: 'POST',
                body: {
                    ...config.value,
                    postId: options.postId.value,
                    language: options.language.value || locale.value,
                    translationId: options.translationId.value || null,
                    script: script.value,
                },
            })
            if (data.taskId) {
                currentTaskId.value = data.taskId
                startPolling()
            }
        } catch (requestError) {
            taskError.value = resolveErrorMessage(requestError, {
                fallbackKey: 'pages.admin.posts.tts.failed',
            })
        }
    }

    // ---- Watchers ----

    watch(() => config.value.provider, () => {
        const enabledModes = providerModes.value[config.value.provider] || ['speech']
        if (!enabledModes.includes(config.value.mode)) {
            config.value.mode = 'speech'
        }
        void fetchVoices()
    }, { immediate: true })

    watch(() => config.value.mode, () => {
        void fetchVoices()
    })

    watch(options.visible, (visible) => {
        if (visible && !script.value) {
            script.value = cleanTextForTTS(options.content.value)
        }
    })

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
        } catch (estimateError) {
            console.error('Failed to fetch estimated cost:', estimateError)
        } finally {
            loadingCost.value = false
        }
    }, { immediate: true, debounce: 1500 })

    onMounted(() => {
        void fetchConfig()
    })

    return {
        config,
        showProviderSelect,
        modes,
        providers,
        voices,
        loadingVoices,
        script,
        optimizing,
        optimizeManuscript,
        estimatedCost,
        formattedEstimatedCost,
        normalizedEstimatedCostDisplay,
        loadingCost,
        status,
        progress,
        audioUrl,
        error,
        hasGeneratedAudio,
        isGenerating,
        isDirectMode,
        startGenerate,
    }
}
