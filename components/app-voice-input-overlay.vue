<template>
    <CaomeiPopover
        :open="open"
        @update:open="open = $event"
    >
        <CaomeiPopoverTrigger as-child>
            <span
                class="voice-popover-anchor"
                :style="anchorStyle"
                aria-hidden="true"
            />
        </CaomeiPopoverTrigger>
        <CaomeiPopoverContent
            side="bottom"
            align="end"
            class="voice-popover"
        >
            <div class="voice-popover__card">
                <div class="voice-popover__header">
                    <span class="voice-popover__title">
                        <Mic
                            class="voice-popover__icon"
                            :class="{'voice-popover__icon--listening': isListening}"
                            :size="16"
                        />
                        {{ isListening ? $t('common.voice.listening') : $t('common.voice.input') }}
                    </span>
                    <CaomeiSelectButton
                        v-model="internalMode"
                        :options="modeOptions"
                        option-label="label"
                        option-value="value"
                        size="sm"
                        :disabled="isListening"
                        :label="$t('common.voice.input')"
                    />
                </div>

                <div class="voice-popover__content" aria-live="polite">
                    <div v-if="isLoadingModel" class="voice-popover__loading">
                        <span class="mb-2 text-sm">{{ $t('common.voice.model_loading') }}</span>
                        <CaomeiProgressBar
                            :value="Math.round(modelProgress)"
                            class="w-full"
                            style="height: 6px"
                        />
                    </div>
                    <div v-else-if="error" class="voice-popover__error">
                        <CircleAlert :size="16" />
                        <span>{{ errorText }}</span>
                        <CaomeiButton
                            variant="ghost"
                            size="sm"
                            @click="$emit('retry')"
                        >
                            {{ $t('common.voice.retry') }}
                        </CaomeiButton>
                    </div>
                    <div v-else class="voice-popover__transcript">
                        <span class="voice-popover__final">{{ finalTranscript }}</span>
                        <span class="voice-popover__interim">{{ interimTranscript }}</span>
                        <div
                            v-if="!finalTranscript && !interimTranscript"
                            class="voice-popover__placeholder"
                        >
                            {{ idleText }}
                        </div>
                    </div>
                </div>

                <div class="voice-popover__footer">
                    <template v-if="isListening">
                        <CaomeiButton
                            tone="danger"
                            @click="$emit('stop')"
                        >
                            <template #icon>
                                <StopCircle :size="16" />
                            </template>
                            {{ $t('common.voice.stop') }}
                        </CaomeiButton>
                    </template>
                    <template v-else-if="finalTranscript">
                        <div class="voice-popover__result-actions">
                            <AppTooltip :content="$t('common.voice.retry')">
                                <CaomeiButton
                                    icon-only
                                    variant="ghost"
                                    :label="$t('common.voice.retry')"
                                    class="voice-popover__retry-btn"
                                    @click="$emit('retry')"
                                >
                                    <template #icon>
                                        <RotateCcw :size="16" />
                                    </template>
                                </CaomeiButton>
                            </AppTooltip>
                            <div
                                class="voice-popover__primary-actions"
                                :class="{'voice-popover__primary-actions--single': !showRefineAction}"
                            >
                                <CaomeiButton
                                    variant="secondary"
                                    class="voice-popover__action-btn"
                                    @click="$emit('insert', finalTranscript)"
                                >
                                    {{ $t('common.voice.insert') }}
                                </CaomeiButton>
                                <CaomeiButton
                                    v-if="showRefineAction"
                                    :loading="refining"
                                    class="voice-popover__action-btn"
                                    @click="$emit('refine', finalTranscript)"
                                >
                                    <template #icon>
                                        <Sparkles :size="16" />
                                    </template>
                                    {{ $t('common.voice.refine_insert') }}
                                </CaomeiButton>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <CaomeiButton
                            :loading="isLoadingModel"
                            :disabled="isLoadingModel || (mode !== 'web-speech' && !isModelReady)"
                            @click="$emit('start')"
                        >
                            <template #icon>
                                <Mic :size="16" />
                            </template>
                            {{ $t('common.voice.start_record') }}
                        </CaomeiButton>
                    </template>
                </div>
            </div>
        </CaomeiPopoverContent>
    </CaomeiPopover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CircleAlert, Mic, RotateCcw, Sparkles, StopCircle } from '@lucide/vue'
import { useAnchoredPopover } from '@/composables/use-anchored-popover'
import { useI18n } from 'vue-i18n'
import type { VoiceTranscriptionMode as VoiceInputMode } from '@/composables/use-post-editor-voice'

interface VoiceModeOption {
    label: string
    value: VoiceInputMode
}

const props = withDefaults(defineProps<{
    isListening: boolean
    interimTranscript: string
    finalTranscript: string
    error: string
    refining: boolean
    mode: VoiceInputMode
    isLoadingModel: boolean
    modelProgress: number
    isModelReady: boolean
    cloudConfig: {
        enabled: boolean
        siliconflow: boolean
        volcengine: boolean
    }
    showRefineAction?: boolean
}>(), {
    showRefineAction: false,
})

const emit = defineEmits<{
    (e: 'stop'): void
    (e: 'retry'): void
    (e: 'insert', value: string): void
    (e: 'refine', value: string): void
    (e: 'hide'): void
    (e: 'update:mode', value: VoiceInputMode): void
    (e: 'start'): void
}>()

const { t } = useI18n()
const { open, anchorStyle, show, hide, toggle } = useAnchoredPopover()

const internalMode = ref<VoiceInputMode>(props.mode)

watch(open, (value) => {
    if (!value) {
        emit('hide')
    }
})

watch(() => props.mode, (newMode) => {
    internalMode.value = newMode
})

watch(internalMode, (newMode) => {
    emit('update:mode', newMode)
})

const modeOptions = computed(() => {
    const options: VoiceModeOption[] = [
        { label: t('common.voice.mode_basic'), value: 'web-speech' as const },
    ]

    if (props.cloudConfig?.siliconflow) {
        options.push({ label: t('common.voice.mode_cloud_batch'), value: 'cloud-batch' as const })
    }

    if (props.cloudConfig?.volcengine) {
        options.push({ label: t('common.voice.mode_cloud_stream'), value: 'cloud-stream' as const })
    }

    return options
})

const idleText = computed(() => {
    if (props.isListening) {
        return '...'
    }
    if (props.mode !== 'web-speech') {
        return t('common.voice.model_ready')
    }
    return t('common.voice.permission_hint')
})

const errorText = computed(() => {
    if (props.error === 'permission_denied') {
        return t('common.voice.permission_denied')
    }
    if (props.error === 'not_supported') {
        return t('common.voice.unsupported')
    }
    return t('common.voice.error')
})

defineExpose({
    toggle,
    show,
    hide,
})
</script>

<style lang="scss" scoped>
@use "@/styles/voice-popover" as *;

.voice-popover {
    &__placeholder {
        text-align: center;
    }

    &__error {
        text-align: center;
    }

    &__result-actions {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: stretch;
        gap: 0.5rem;
        width: 100%;
    }

    &__primary-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
        min-width: 0;

        &--single {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    &__retry-btn {
        align-self: stretch;
        min-width: 2.75rem;
    }

    &__action-btn {
        width: 100%;
    }
}
</style>
