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
