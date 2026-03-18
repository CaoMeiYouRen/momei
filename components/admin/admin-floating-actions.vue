<template>
    <div class="admin-floating-actions">
        <div
            v-if="statusLabel"
            class="admin-floating-actions__status"
            :class="`admin-floating-actions__status--${statusTone}`"
        >
            <i :class="statusIcon" aria-hidden="true" />
            <span>{{ statusLabel }}</span>
        </div>

        <div class="admin-floating-actions__panel">
            <slot name="before-actions" />

            <Button
                v-if="secondaryLabel"
                :label="secondaryLabel"
                :icon="secondaryIcon"
                severity="secondary"
                outlined
                rounded
                class="admin-floating-actions__button admin-floating-actions__button--secondary"
                @click="$emit('secondary-click')"
            />

            <Button
                v-if="primaryLabel"
                :label="primaryLabel"
                :icon="primaryIcon"
                :loading="primaryLoading"
                :disabled="primaryDisabled"
                rounded
                class="admin-floating-actions__button admin-floating-actions__button--primary"
                @click="$emit('primary-click')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    primaryLabel?: string
    primaryIcon?: string
    primaryLoading?: boolean
    primaryDisabled?: boolean
    secondaryLabel?: string
    secondaryIcon?: string
    statusLabel?: string
    statusTone?: 'muted' | 'warn' | 'success'
}>(), {
    primaryLabel: '',
    primaryIcon: 'pi pi-check',
    primaryLoading: false,
    primaryDisabled: false,
    secondaryLabel: '',
    secondaryIcon: 'pi pi-question-circle',
    statusLabel: '',
    statusTone: 'muted',
})

defineEmits<{
    (e: 'primary-click'): void
    (e: 'secondary-click'): void
}>()

const statusIcon = computed(() => {
    if (props.statusTone === 'warn') {
        return 'pi pi-exclamation-circle'
    }

    if (props.statusTone === 'success') {
        return 'pi pi-check-circle'
    }

    return 'pi pi-info-circle'
})
</script>

<style lang="scss" scoped>
.admin-floating-actions {
    position: fixed;
    right: calc(1rem + env(safe-area-inset-right));
    bottom: calc(1rem + env(safe-area-inset-bottom));
    z-index: 110;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.65rem;
    pointer-events: none;

    &__status,
    &__panel {
        pointer-events: auto;
    }

    &__status {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.55rem 0.85rem;
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 600;
        backdrop-filter: blur(12px);
        box-shadow: 0 12px 28px rgb(15 23 42 / 0.08);
        border: 1px solid var(--p-content-border-color);
        background: color-mix(in srgb, var(--p-surface-0) 92%, white 8%);
        color: var(--p-text-muted-color);

        &--warn {
            color: var(--p-orange-700);
            background: color-mix(in srgb, var(--p-orange-50) 88%, white 12%);
            border-color: color-mix(in srgb, var(--p-orange-300) 72%, white 28%);
        }

        &--success {
            color: var(--p-green-700);
            background: color-mix(in srgb, var(--p-green-50) 88%, white 12%);
            border-color: color-mix(in srgb, var(--p-green-300) 72%, white 28%);
        }
    }

    &__panel {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: flex-end;
        padding: 0.75rem;
        border-radius: 1.25rem;
        border: 1px solid color-mix(in srgb, var(--p-content-border-color) 88%, white 12%);
        background: color-mix(in srgb, var(--p-surface-0) 90%, white 10%);
        box-shadow: 0 20px 40px rgb(15 23 42 / 0.14);
        backdrop-filter: blur(16px);
        max-width: min(100%, 34rem);
    }

    &__button {
        min-height: 2.75rem;
        white-space: nowrap;
    }
}

@media (width <= 768px) {
    .admin-floating-actions {
        right: calc(0.75rem + env(safe-area-inset-right));
        left: calc(0.75rem + env(safe-area-inset-left));
        align-items: stretch;

        &__panel {
            justify-content: stretch;
        }

        &__button {
            flex: 1 1 auto;
            justify-content: center;
        }
    }
}
</style>
