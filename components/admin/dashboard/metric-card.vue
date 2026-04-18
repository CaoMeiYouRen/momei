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

.dashboard-metric-card {
  height: 100%;
  border: 1px solid color-mix(in srgb, var(--p-surface-400) 20%, transparent);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--p-primary-300) 22%, transparent), transparent 45%),
    linear-gradient(180deg, color-mix(in srgb, var(--p-surface-0) 94%, transparent), var(--p-surface-0));

  &__content {
    display: flex;
    justify-content: space-between;
    gap: $spacing-lg;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    min-width: 0;
  }

  &__label {
    margin: 0;
    color: var(--p-text-muted-color);
    font-size: 0.95rem;
  }

  &__value {
    font-size: 2rem;
    line-height: 1;
    color: var(--p-text-color);
  }

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

  &__icon-wrap {
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--p-surface-200) 70%, transparent);
    flex-shrink: 0;
  }

  &__icon {
    font-size: 1.2rem;
  }

  &--warm {
    .dashboard-metric-card__icon-wrap {
      background: color-mix(in srgb, #f59e0b 18%, var(--p-surface-100));
      color: #b45309;
    }
  }

  &--cool {
    .dashboard-metric-card__icon-wrap {
      background: color-mix(in srgb, #0ea5e9 18%, var(--p-surface-100));
      color: #0369a1;
    }
  }

  &--neutral {
    .dashboard-metric-card__icon-wrap {
      background: color-mix(in srgb, #10b981 18%, var(--p-surface-100));
      color: #047857;
    }
  }
}
</style>
