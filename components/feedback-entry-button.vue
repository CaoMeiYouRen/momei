<template>
    <div v-if="shouldShowFeedbackEntry" class="feedback-entry-button">
        <Button
            :label="$t('common.feedback')"
            icon="pi pi-question-circle"
            severity="secondary"
            outlined
            rounded
            class="feedback-entry-button__action"
            @click="openFeedbackEntry"
        />
    </div>
</template>

<script setup lang="ts">
const { openFeedbackEntry, shouldShowFeedbackEntry } = useFeedbackEntry()
</script>

<style lang="scss" scoped>
.feedback-entry-button {
    position: fixed;
    left: calc(1rem + env(safe-area-inset-left));
    bottom: calc(1rem + env(safe-area-inset-bottom));
    z-index: 90;
    pointer-events: none;

    &__action {
        pointer-events: auto;
        box-shadow: 0 18px 36px rgb(15 23 42 / 0.12);
        backdrop-filter: blur(12px);
        border-width: 1px;
        min-height: 2.75rem;
    }
}

@media (width <= 768px) {
    .feedback-entry-button {
        left: calc(0.75rem + env(safe-area-inset-left));
        bottom: calc(0.75rem + env(safe-area-inset-bottom));

        &__action {
            :deep(.p-button-label) {
                display: none;
            }
        }
    }
}
</style>
