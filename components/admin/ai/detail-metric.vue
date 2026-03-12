<template>
    <div class="detail-metric">
        <span class="detail-metric__label">{{ label }}:</span>
        <span class="detail-metric__value">{{ displayValue }}</span>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    label: string
    value: string | number | null | undefined
}>()

const displayValue = computed(() => {
    if (props.value === null || props.value === undefined || props.value === '') {
        return '-'
    }

    return props.value
})
</script>

<style lang="scss" scoped>
.detail-metric {
    display: flex;
    align-items: flex-start;

    &__label {
        font-weight: bold;
        margin-right: 0.75rem;
        color: var(--text-color-secondary);
        white-space: nowrap;
    }

    &__value {
        flex: 1;
    }
}
</style>
