<template>
    <div v-if="visible" class="voice-overlay">
        <div class="voice-overlay__card">
            <div class="voice-overlay__header">
                <span class="voice-overlay__title">
                    <i class="pi pi-microphone voice-overlay__icon" :class="{'voice-overlay__icon--listening': isListening}" />
                    {{ isListening ? $t('pages.admin.posts.ai.voice_listening') : $t('pages.admin.posts.ai.voice_input') }}
                </span>
                <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="secondary"
                    @click="$emit('close')"
                />
            </div>

            <div class="voice-overlay__content">
                <div v-if="error" class="voice-overlay__error">
                    <i class="pi pi-exclamation-circle" />
                    <span>{{ errorText }}</span>
                    <Button
                        :label="$t('pages.admin.posts.ai.voice_retry')"
                        size="small"
                        text
                        @click="$emit('retry')"
                    />
                </div>
                <div v-else class="voice-overlay__transcript">
                    <span class="voice-overlay__final">{{ finalTranscript }}</span>
                    <span class="voice-overlay__interim">{{ interimTranscript }}</span>
                    <div v-if="!finalTranscript && !interimTranscript && isListening" class="voice-overlay__placeholder">
                        ...
                    </div>
                </div>
            </div>

            <div class="voice-overlay__footer">
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
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    visible: boolean
    isListening: boolean
    interimTranscript: string
    finalTranscript: string
    error: string
    refining: boolean
}>()

defineEmits(['close', 'stop', 'retry', 'insert', 'refine'])

const { t } = useI18n()

const errorText = computed(() => {
    if (props.error === 'permission_denied') {
        return t('pages.admin.posts.ai.voice_permission_denied')
    }
    return t('pages.admin.posts.ai.voice_error')
})
</script>

<style lang="scss" scoped>
.voice-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgb(0 0 0 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(4px);

    &__card {
        background: var(--surface-card);
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        padding: 1.5rem;
        box-shadow: 0 10px 25px rgb(0 0 0 / 0.2);
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__title {
        font-weight: 600;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__icon {
        color: var(--primary-color);

        &--listening {
            animation: pulse 1.5s infinite;
            color: var(--red-500);
        }
    }

    &__content {
        min-height: 120px;
        max-height: 300px;
        overflow-y: auto;
        padding: 1rem;
        background: var(--surface-ground);
        border-radius: 8px;
        border: 1px inset var(--surface-border);
    }

    &__transcript {
        line-height: 1.6;
        word-break: break-all;
    }

    &__final {
        color: var(--text-color);
    }

    &__interim {
        color: var(--text-color-secondary);
        font-style: italic;
    }

    &__placeholder {
        color: var(--text-color-secondary);
        display: flex;
        justify-content: center;
        padding: 2rem;
    }

    &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: var(--red-500);
        padding: 1rem;
    }

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
