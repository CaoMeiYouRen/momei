<template>
    <ClientOnly>
        <template v-if="isVoiceSupported">
            <Button
                v-tooltip="tooltipText"
                :icon="isListening ? 'pi pi-stop-circle' : 'pi pi-microphone'"
                :text="buttonText"
                :outlined="buttonOutlined"
                :rounded="buttonRounded"
                :severity="isListening ? 'danger' : buttonSeverity"
                :size="buttonSize"
                :disabled="disabled"
                :aria-label="ariaLabelText"
                :class="[buttonClass, {'pulse-animation': isListening}]"
                @click="handleVoiceClick"
            />
            <AppVoiceInputOverlay
                ref="voiceOp"
                v-model:mode="voiceMode"
                :is-listening="isListening"
                :interim-transcript="interimTranscript"
                :final-transcript="finalTranscript"
                :error="voiceError"
                :refining="processingVoice"
                :is-loading-model="isLoadingModel"
                :model-progress="modelProgress"
                :is-model-ready="isModelReady"
                :cloud-config="cloudConfig"
                :show-refine-action="showRefineAction"
                @start="startListening(language)"
                @stop="stopListening()"
                @retry="handleRetry"
                @insert="handleVoiceInsert"
                @refine="handleVoiceRefine"
                @hide="stopListening()"
            />
        </template>
    </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVoiceInput } from '@/composables/use-voice-input'
import { insertVoiceText, type VoiceTextInsertStrategy } from '@/utils/web/voice-text'

type MaybeTextareaTarget = HTMLTextAreaElement | HTMLElement | { $el?: HTMLElement } | null | undefined

const props = withDefaults(defineProps<{
    modelValue: string
    language?: string
    targetRef?: MaybeTextareaTarget | { value: MaybeTextareaTarget }
    insertStrategy?: VoiceTextInsertStrategy
    showRefineAction?: boolean
    directMode?: boolean
    disabled?: boolean
    buttonText?: boolean
    buttonOutlined?: boolean
    buttonRounded?: boolean
    buttonSeverity?: 'secondary' | 'info' | 'success' | 'warn' | 'help' | 'contrast'
    buttonSize?: 'small' | 'large'
    buttonClass?: string
}>(), {
    language: 'zh-CN',
    insertStrategy: 'append-paragraph',
    showRefineAction: false,
    directMode: true,
    disabled: false,
    buttonText: true,
    buttonOutlined: true,
    buttonRounded: false,
    buttonSeverity: 'secondary',
    buttonSize: undefined,
    buttonClass: '',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()

const voiceOp = ref<{ show: (event: Event) => void, hide: () => void } | null>(null)
const processingVoice = ref(false)

const {
    isListening,
    isSupported: isVoiceSupported,
    interimTranscript,
    finalTranscript,
    error: voiceError,
    mode: voiceMode,
    isLoadingModel,
    modelProgress,
    isModelReady,
    cloudConfig,
    startListening,
    stopListening,
    reset: resetVoice,
} = useVoiceInput({
    directMode: props.directMode,
})

const tooltipText = computed(() => {
    return isListening.value ? t('common.voice.stop') : t('common.voice.input')
})

const ariaLabelText = computed(() => {
    return isListening.value ? t('common.voice.aria_button_stop') : t('common.voice.aria_button_start')
})

const isTextareaTargetRef = (value: unknown): value is { value: MaybeTextareaTarget } => {
    return value !== null && typeof value === 'object' && 'value' in value
}

const isTextareaComponentTarget = (value: unknown): value is { $el?: HTMLElement } => {
    return value !== null && typeof value === 'object' && '$el' in value
}

const resolveTextareaElement = () => {
    const candidate = props.targetRef as unknown
    const rawTarget = isTextareaTargetRef(candidate)
        ? candidate.value
        : candidate

    if (!rawTarget) {
        return null
    }

    if (rawTarget instanceof HTMLTextAreaElement) {
        return rawTarget
    }

    if (rawTarget instanceof HTMLElement) {
        if (rawTarget.tagName === 'TEXTAREA') {
            return rawTarget as HTMLTextAreaElement
        }

        return rawTarget.querySelector('textarea')
    }

    if (isTextareaComponentTarget(rawTarget) && rawTarget.$el instanceof HTMLElement) {
        if (rawTarget.$el.tagName === 'TEXTAREA') {
            return rawTarget.$el as HTMLTextAreaElement
        }

        return rawTarget.$el.querySelector('textarea')
    }

    return null
}

const updateValue = async (text: string) => {
    const textarea = resolveTextareaElement()
    const result = insertVoiceText({
        currentValue: props.modelValue,
        text,
        strategy: textarea ? props.insertStrategy : 'append-paragraph',
        selectionStart: textarea?.selectionStart,
        selectionEnd: textarea?.selectionEnd,
    })

    emit('update:modelValue', result.value)
    await nextTick()

    if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(result.caret, result.caret)
    }
}

const closeAndReset = () => {
    voiceOp.value?.hide()
    resetVoice()
}

const handleRetry = () => {
    resetVoice()
    startListening(props.language)
}

const handleVoiceClick = (event: Event) => {
    if (isListening.value) {
        stopListening()
        return
    }

    voiceOp.value?.show(event)
}

const handleVoiceInsert = async (text: string) => {
    if (!text) {
        return
    }

    await updateValue(text)
    closeAndReset()
}

const handleVoiceRefine = async (text: string) => {
    if (!text) {
        return
    }

    processingVoice.value = true
    try {
        const { data } = await $fetch<{ data: string }>('/api/ai/refine-voice', {
            method: 'POST',
            body: {
                content: text,
                language: props.language,
            },
        })

        await handleVoiceInsert(data)
    } catch (error) {
        console.error('Refine voice error:', error)
        await handleVoiceInsert(text)
    } finally {
        processingVoice.value = false
    }
}
</script>

<style lang="scss" scoped>
.pulse-animation {
    animation: pulse-voice-trigger 1.5s infinite;
}

@keyframes pulse-voice-trigger {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.08);
    }

    100% {
        transform: scale(1);
    }
}
</style>
