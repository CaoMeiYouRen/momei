<template>
    <Popover
        ref="op"
        class="voice-popover"
        @hide="$emit('hide')"
    >
        <div class="voice-popover__card">
            <div class="voice-popover__header">
                <span class="voice-popover__title">
                    <i
                        class="pi pi-microphone voice-popover__icon"
                        :class="{'voice-popover__icon--listening': isListening}"
                    />
                    {{ isListening ? $t('common.voice.listening') : $t('common.voice.input') }}
                </span>
                <SelectButton
                    v-model="internalMode"
                    :options="modeOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    :disabled="isListening"
                    :aria-label="$t('common.voice.input')"
                />
            </div>

            <div class="voice-popover__content" aria-live="polite">
                <div v-if="isLoadingModel" class="voice-popover__loading">
                    <span class="mb-2 text-sm">{{ $t('common.voice.model_loading') }}</span>
                    <ProgressBar
                        :value="Math.round(modelProgress)"
                        class="w-full"
                        style="height: 6px"
                    />
                </div>
                <div v-else-if="error" class="voice-popover__error">
                    <i class="pi pi-exclamation-circle" />
                    <span>{{ errorText }}</span>
                    <Button
                        :label="$t('common.voice.retry')"
                        size="small"
                        text
                        @click="$emit('retry')"
                    />
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
                    <Button
                        :label="$t('common.voice.stop')"
                        severity="danger"
                        icon="pi pi-stop-circle"
                        @click="$emit('stop')"
                    />
                </template>
                <template v-else-if="finalTranscript">
                    <div class="voice-popover__result-actions">
                        <Button
                            v-tooltip="$t('common.voice.retry')"
                            icon="pi pi-refresh"
                            severity="secondary"
                            text
                            class="voice-popover__retry-btn"
                            @click="$emit('retry')"
                        />
                        <div
                            class="voice-popover__primary-actions"
                            :class="{'voice-popover__primary-actions--single': !showRefineAction}"
                        >
                            <Button
                                :label="$t('common.voice.insert')"
                                severity="secondary"
                                outlined
                                class="voice-popover__action-btn"
                                @click="$emit('insert', finalTranscript)"
                            />
                            <Button
                                v-if="showRefineAction"
                                :label="$t('common.voice.refine_insert')"
                                severity="primary"
                                :loading="refining"
                                icon="pi pi-sparkles"
                                class="voice-popover__action-btn"
                                @click="$emit('refine', finalTranscript)"
                            />
                        </div>
                    </div>
                </template>
                <template v-else>
                    <Button
                        :label="$t('common.voice.start_record')"
                        icon="pi pi-microphone"
                        :loading="isLoadingModel"
                        :disabled="isLoadingModel || (mode !== 'web-speech' && !isModelReady)"
                        @click="$emit('start')"
                    />
                </template>
            </div>
        </div>
    </Popover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VoiceInputMode } from '@/composables/use-voice-input'

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
const op = ref<{ toggle: (event: Event) => void, show: (event: Event) => void, hide: () => void } | null>(null)

const internalMode = ref<VoiceInputMode>(props.mode)

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

const toggle = (event: Event) => {
    op.value?.toggle(event)
}

const show = (event: Event) => {
    op.value?.show(event)
}

const hide = () => {
    op.value?.hide()
}

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
