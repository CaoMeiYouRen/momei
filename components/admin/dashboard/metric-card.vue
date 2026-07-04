<template>
    <Card class="dashboard-metric-card" :class="`dashboard-metric-card--${tone}`">
        <template #content>
            <div class="dashboard-metric-card__content">
                <div class="dashboard-metric-card__copy">
                    <p class="dashboard-metric-card__label">
                        {{ label }}
                    </p>
                    <strong class="dashboard-metric-card__value">
                        {{ numberFormatter.format(metric.total) }}
                    </strong>
                    <div class="dashboard-metric-card__delta-row">
                        <Tag
                            :value="deltaText"
                            :severity="deltaSeverity"
                            rounded
                        />
                        <span class="dashboard-metric-card__previous">
                            {{ $t('pages.admin.dashboard.previous_window_total', {total: numberFormatter.format(metric.previousTotal)}) }}
                        </span>
                        <span v-if="rateText" class="dashboard-metric-card__rate">
                            {{ rateText }}
                        </span>
                    </div>
                </div>
                <div class="dashboard-metric-card__icon-wrap">
                    <i :class="[icon, 'dashboard-metric-card__icon']" />
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import type { AdminContentInsightsMetric } from '@/types/admin-content-insights'

const props = withDefaults(defineProps<{
    label: string
    icon: string
    metric: AdminContentInsightsMetric
    tone?: 'neutral' | 'warm' | 'cool'
}>(), {
    tone: 'neutral',
})

const { locale } = useI18n()

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const deltaText = computed(() => {
    const prefix = props.metric.delta > 0 ? '+' : ''
    return `${prefix}${numberFormatter.value.format(props.metric.delta)}`
})

const deltaSeverity = computed(() => {
    if (props.metric.delta > 0) {
        return 'success'
    }

    if (props.metric.delta < 0) {
        return 'warn'
    }

    return 'secondary'
})

const rateText = computed(() => {
    if (props.metric.deltaRate === null) {
        return ''
    }

    const prefix = props.metric.deltaRate > 0 ? '+' : ''
    return `${prefix}${props.metric.deltaRate.toFixed(2)}%`
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/components/dashboard-metric-card" as *;

.dashboard-metric-card {
  &__delta-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
    color: var(--p-text-muted-color);
    font-size: 0.85rem;
  }

  &__previous,
  &__rate {
    white-space: nowrap;
  }
}
</style>
