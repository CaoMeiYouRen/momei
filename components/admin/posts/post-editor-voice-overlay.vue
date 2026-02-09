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
            </div>

            <div class="voice-popover__content">
                <div v-if="error" class="voice-popover__error">
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
                </template>
                <template v-else>
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_retry')"
                        icon="pi pi-refresh"
                        @click="$emit('retry')"
                    />
                </template>
            </div>
        </div>
    </Popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    isListening: boolean
    interimTranscript: string
    finalTranscript: string
    error: string
    refining: boolean
}>()

defineEmits(['stop', 'retry', 'insert', 'refine', 'hide'])

const { t } = useI18n()
const op = ref<any>(null)

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
