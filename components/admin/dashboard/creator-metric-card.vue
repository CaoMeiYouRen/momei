<template>
    <Card class="dashboard-metric-card" :class="`dashboard-metric-card--${tone}`">
        <template #content>
            <div class="dashboard-metric-card__content">
                <div class="dashboard-metric-card__copy">
                    <p class="dashboard-metric-card__label">
                        {{ label }}
                    </p>
                    <strong class="dashboard-metric-card__value">
                        {{ displayValue }}
                    </strong>
                </div>
                <div class="dashboard-metric-card__icon-wrap">
                    <i :class="[icon, 'dashboard-metric-card__icon']" />
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    label: string
    value: number | string
    icon: string
    tone?: 'neutral' | 'warm' | 'cool'
    format?: 'number' | 'percent'
}>(), {
    tone: 'neutral',
    format: 'number',
})

const { locale } = useI18n()

const displayValue = computed(() => {
    if (props.format === 'percent') {
        const num = typeof props.value === 'string' ? Number.parseFloat(props.value) : props.value
        if (Number.isNaN(num)) {
            return '—'
        }
        return `${Math.round(num * 100)}%`
    }

    if (typeof props.value === 'number') {
        return new Intl.NumberFormat(locale.value).format(props.value)
    }

    return props.value
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/components/dashboard-metric-card" as *;
</style>
