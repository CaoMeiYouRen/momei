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
                    {{ isListening ? $t('pages.admin.posts.ai.voice_listening') : $t('pages.admin.posts.ai.voice_input') }}
                </span>
                <SelectButton
                    v-model="internalMode"
                    :options="modeOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    :disabled="isListening"
                />
            </div>

            <div class="voice-popover__content">
                <div v-if="isLoadingModel" class="voice-popover__loading">
                    <span class="mb-2 text-sm">{{ $t('pages.admin.posts.ai.voice_model_loading') }}</span>
                    <ProgressBar
                        :value="Math.round(modelProgress)"
                        class="w-full"
                        style="height: 6px"
                    />
                </div>
                <!-- 模型确认对话框区域 -->
                <div v-else-if="showLoadConfirm" class="voice-popover__confirm-panel">
                    <div class="flex font-bold gap-2 items-center mb-2 text-orange-500">
                        <i class="pi pi-info-circle" />
                        <span>{{ $t('pages.admin.posts.ai.voice_load_confirm_title') }}</span>
                    </div>
                    <p class="leading-relaxed mb-4 opacity-80 text-sm">
                        {{ confirmMessage }}
                    </p>
                    <div class="flex gap-2 justify-end">
                        <Button
                            :label="$t('common.cancel')"
                            size="small"
                            text
                            @click="internalMode = 'web-speech'"
                        />
                        <Button
                            :label="$t('pages.admin.posts.ai.voice_load_confirm_btn')"
                            size="small"
                            severity="primary"
                            @click="handleLoadModel"
                        />
                    </div>
                </div>
                <div v-else-if="error" class="voice-popover__error">
                    <i class="pi pi-exclamation-circle" />
                    <span>{{ errorText }}</span>
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_retry')"
                        size="small"
                        text
                        @click="$emit('retry')"
                    />
                </div>
                <div v-else class="voice-popover__transcript">
                    <span class="voice-popover__final">{{ finalTranscript }}</span>
                    <span class="voice-popover__interim">{{ interimTranscript }}</span>
                    <div
                        v-if="!finalTranscript && !interimTranscript && isListening"
                        class="voice-popover__placeholder"
                    >
                        ...
                    </div>
                    <div
                        v-if="!isListening && !finalTranscript && !interimTranscript && mode !== 'web-speech'"
                        class="voice-popover__placeholder"
                    >
                        {{ $t('pages.admin.posts.ai.voice_model_ready') }}
                    </div>
                </div>
            </div>

            <div class="voice-popover__footer">
                <template v-if="isListening">
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_stop')"
                        severity="danger"
                        icon="pi pi-stop-circle"
                        @click="$emit('stop')"
                    />
                </template>
                <template v-else-if="finalTranscript">
                    <Button
                        v-tooltip="$t('pages.admin.posts.ai.voice_retry')"
                        icon="pi pi-refresh"
                        severity="secondary"
                        text
                        @click="$emit('retry')"
                    />
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_insert')"
                        severity="secondary"
                        outlined
                        @click="$emit('insert', finalTranscript)"
                    />
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_refine_insert')"
                        severity="primary"
                        :loading="refining"
                        icon="pi pi-sparkles"
                        @click="$emit('refine', finalTranscript)"
                    />
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_scaffold_insert')"
                        severity="info"
                        :loading="refining"
                        icon="pi pi-list"
                        @click="$emit('scaffold', finalTranscript)"
                    />
                </template>
                <template v-else>
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_start_record')"
                        icon="pi pi-microphone"
                        :loading="isLoadingModel"
                        :disabled="isLoadingModel || (mode !== 'web-speech' && !isModelReady) || showLoadConfirm"
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

const props = defineProps<{
    isListening: boolean
    interimTranscript: string
    finalTranscript: string
    error: string
    refining: boolean
    mode: 'web-speech' | 'cloud-batch' | 'cloud-stream'
    isLoadingModel: boolean
    modelProgress: number
    isModelReady: boolean
    cloudConfig: {
        siliconflow: boolean
        volcengine: boolean
    }
}>()

const emit = defineEmits(['stop', 'retry', 'insert', 'refine', 'scaffold', 'hide', 'update:mode', 'start', 'load-model'])

const { t } = useI18n()
const op = ref<any>(null)

const internalMode = ref(props.mode)
watch(() => props.mode, (newMode) => {
    internalMode.value = newMode as any
})
watch(internalMode, (newMode) => {
    emit('update:mode', newMode)
})

const modeOptions = computed(() => {
    const options = [
        { label: t('pages.admin.posts.ai.voice_mode_basic'), value: 'web-speech' },
    ]

    if (props.cloudConfig?.siliconflow) {
        options.push({ label: t('pages.admin.posts.ai.voice_mode_cloud_batch'), value: 'cloud-batch' })
    }

    if (props.cloudConfig?.volcengine) {
        options.push({ label: t('pages.admin.posts.ai.voice_mode_cloud_stream'), value: 'cloud-stream' })
    }

    return options
})

const showLoadConfirm = computed(() => {
    return false // No longer need local model loading confirm
})

const confirmMessage = computed(() => {
    return ''
})

const handleLoadModel = () => {
    emit('load-model')
}

const toggle = (event: any) => {
    op.value?.toggle(event)
}

const show = (event: any) => {
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

const errorText = computed(() => {
    if (props.error === 'permission_denied') {
        return t('pages.admin.posts.ai.voice_permission_denied')
    }
    return t('pages.admin.posts.ai.voice_error')
})
</script>

<style lang="scss" scoped>
.voice-popover {
    &__card {
        width: 350px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--p-surface-border);
    }

    &__title {
        font-weight: 600;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__icon {
        color: var(--p-primary-color);
        font-size: 1rem;

        &--listening {
            animation: pulse-mic 1.5s infinite;
            color: var(--p-red-500);
        }
    }

    &__content {
        min-height: 80px;
        max-height: 200px;
        overflow-y: auto;
        padding: 0.75rem;
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius-md);
        border: 1px inset var(--p-surface-border);
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    &__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding: 0.5rem;
    }

    &__confirm-panel {
        padding: 0.25rem;
        display: flex;
        flex-direction: column;
    }

    &__transcript {
        line-height: 1.5;
        font-size: 0.875rem;
        word-break: break-all;
    }

    &__final {
        color: var(--p-text-color);
    }

    &__interim {
        color: var(--p-text-muted-color);
        font-style: italic;
    }

    &__placeholder {
        color: var(--p-text-muted-color);
        display: flex;
        justify-content: center;
        padding: 1rem;
    }

    &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: var(--p-red-500);
        padding: 0.5rem;
        font-size: 0.875rem;
    }

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding-top: 0.25rem;
    }
}

@keyframes pulse-mic {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.15);
        opacity: 0.7;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

:global(.dark) {
    .voice-popover__content {
        background: var(--p-surface-900);
    }
}
</style>
