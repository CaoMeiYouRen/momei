import { watchDebounced } from '@vueuse/core'
import type { Ref } from 'vue'
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
import { normalizeAICostDisplay } from '~/utils/shared/ai-cost'
import { formatDecimal } from '~/utils/shared/number'
import { cleanTextForTTS } from '~/utils/shared/tts-cleaner'

interface TTSDialogConfig {
    provider: string
    mode: TTSSynthesisMode
    voice: string
}

export function usePostTtsDialog(options: {
    postId: Ref<string | undefined>
    content: Ref<string>
    visible: Ref<boolean>
}) {
    const { t } = useI18n()
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
    const currentTaskId = ref<string | null>(null)
    const { status, progress, audioUrl, error, startPolling } = useTTSTask(currentTaskId)
    const hasGeneratedAudio = computed(() => Boolean(audioUrl.value))
    const isGenerating = computed(() => status.value === 'processing' || status.value === 'pending')

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
                query: {
                    provider: config.value.provider,
                    mode: config.value.mode,
                },
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
        try {
            error.value = null
            const data = await $appFetch<TTSTaskCreateResponse>('/api/ai/tts/task', {
                method: 'POST',
                body: {
                    ...config.value,
                    postId: options.postId.value,
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
        startGenerate,
    }
}
