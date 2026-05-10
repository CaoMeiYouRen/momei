<template>
    <div class="admin-dashboard__panel" :class="{'admin-dashboard__panel--loading': loading}">
        <!-- Hero Section: always shown so users can change range -->
        <div class="admin-content-card admin-dashboard__hero">
            <div class="admin-dashboard__hero-copy">
                <p class="admin-dashboard__eyebrow">
                    {{ $t('pages.admin.dashboard.tab_creator') }}
                </p>
                <h2 class="admin-dashboard__headline">
                    {{ $t('pages.admin.dashboard.creator_headline') }}
                </h2>
                <p class="admin-dashboard__summary">
                    {{ $t('pages.admin.dashboard.creator_summary', {days: selectedRange}) }}
                </p>
            </div>

            <div class="admin-dashboard__controls">
                <div class="admin-dashboard__ranges admin-dashboard__ranges--creator">
                    <button
                        v-for="rangeOpt in rangeOptions"
                        :key="rangeOpt.value"
                        type="button"
                        class="admin-dashboard__range-button"
                        :class="{'admin-dashboard__range-button--active': selectedRange === rangeOpt.value}"
                        @click="selectedRange = rangeOpt.value"
                    >
                        <span class="admin-dashboard__range-label">
                            {{ $t('pages.admin.dashboard.range_label', {days: rangeOpt.value}) }}
                        </span>
                        <template v-if="selectedRange === rangeOpt.value && stats">
                            <strong class="admin-dashboard__range-value">
                                {{ numberFormatter.format(stats.publishing.totalPublished) }}
                            </strong>
                            <small class="admin-dashboard__range-caption">
                                {{ $t('pages.admin.dashboard.metrics.posts') }}
                            </small>
                        </template>
                    </button>
                </div>
            </div>
        </div>

        <!-- Notes Section -->
        <div class="admin-dashboard__notes">
            <Tag
                :value="$t('pages.admin.dashboard.notes.timezone', {timezone: stats?.timezone || timezone})"
                severity="secondary"
            />
        </div>

        <!-- Loading State -->
        <div v-if="loading && !stats" class="admin-dashboard__loading-state">
            <ProgressSpinner stroke-width="4" />
        </div>

        <!-- Content -->
        <template v-else-if="stats">
            <div class="admin-dashboard__metrics admin-dashboard__metrics--creator">
                <CreatorMetricCard
                    :label="$t('pages.admin.dashboard.creator_published')"
                    :value="stats.publishing.totalPublished"
                    icon="pi pi-file-check"
                    tone="neutral"
                />
                <CreatorMetricCard
                    :label="$t('pages.admin.dashboard.creator_drafts')"
                    :value="stats.publishing.draftCount"
                    icon="pi pi-pen-to-square"
                    tone="warm"
                />
                <CreatorMetricCard
                    v-if="stats.distribution.wechatsync"
                    :label="$t('pages.admin.dashboard.creator_wechat_sync')"
                    :value="stats.distribution.wechatsync.overallSuccessRate"
                    icon="pi pi-share-alt"
                    tone="cool"
                    format="percent"
                />
                <CreatorMetricCard
                    v-if="stats.distribution.hexoRepositorySync"
                    :label="$t('pages.admin.dashboard.creator_hexo_sync')"
                    :value="stats.distribution.hexoRepositorySync.overallSuccessRate"
                    icon="pi pi-code-branch"
                    tone="cool"
                    format="percent"
                />
            </div>

            <div v-if="hasTrendData || hasDistributionData" class="admin-dashboard__rankings">
                <!-- Publishing Trend Card -->
                <Card
                    v-if="hasTrendData"
                    class="admin-dashboard__ranking-card admin-dashboard__ranking-card--wide"
                >
                    <template #title>
                        <span class="admin-dashboard__title-with-badge">
                            {{ $t('pages.admin.dashboard.creator_publish_trend') }}
                            <Tag
                                :value="granularityLabel"
                                severity="info"
                            />
                        </span>
                    </template>
                    <template #content>
                        <ol class="admin-dashboard__ranking-list admin-dashboard__ranking-list--compact">
                            <li
                                v-for="point in stats.publishing.trend"
                                :key="point.periodStart"
                                class="admin-dashboard__ranking-item"
                            >
                                <div class="admin-dashboard__ranking-copy">
                                    <strong>{{ formatPeriodLabel(point, stats.aggregationGranularity) }}</strong>
                                </div>
                                <div class="admin-dashboard__ranking-stats">
                                    <span>
                                        <i class="pi pi-file-edit" />
                                        {{ $t('pages.admin.dashboard.creator_post_count', {count: point.count}) }}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </template>
                </Card>

                <!-- Distribution Trend Card -->
                <Card
                    v-if="hasDistributionData"
                    class="admin-dashboard__ranking-card admin-dashboard__ranking-card--wide"
                >
                    <template #title>
                        {{ $t('pages.admin.dashboard.creator_distribution_trend') }}
                    </template>
                    <template #content>
                        <div
                            v-if="stats.distribution.wechatsync?.trend.length"
                            class="admin-dashboard__trend-subsection"
                        >
                            <h4 class="admin-dashboard__trend-subtitle">
                                {{ $t('pages.admin.dashboard.creator_wechat_sync') }}
                            </h4>
                            <ol class="admin-dashboard__ranking-list admin-dashboard__ranking-list--compact">
                                <li
                                    v-for="point in stats.distribution.wechatsync.trend"
                                    :key="point.periodStart"
                                    class="admin-dashboard__ranking-item"
                                >
                                    <div class="admin-dashboard__ranking-copy">
                                        <strong>{{ point.periodStart }}</strong>
                                    </div>
                                    <div class="admin-dashboard__ranking-stats">
                                        <Tag
                                            :value="`${point.succeeded} / ${point.total}`"
                                            :severity="point.failed === 0 ? 'success' : point.succeeded > 0 ? 'warn' : 'danger'"
                                        />
                                    </div>
                                </li>
                            </ol>
                        </div>
                        <div
                            v-if="stats.distribution.hexoRepositorySync?.trend.length"
                            class="admin-dashboard__trend-subsection"
                        >
                            <h4 class="admin-dashboard__trend-subtitle">
                                {{ $t('pages.admin.dashboard.creator_hexo_sync') }}
                            </h4>
                            <ol class="admin-dashboard__ranking-list admin-dashboard__ranking-list--compact">
                                <li
                                    v-for="point in stats.distribution.hexoRepositorySync.trend"
                                    :key="point.periodStart"
                                    class="admin-dashboard__ranking-item"
                                >
                                    <div class="admin-dashboard__ranking-copy">
                                        <strong>{{ point.periodStart }}</strong>
                                    </div>
                                    <div class="admin-dashboard__ranking-stats">
                                        <Tag
                                            :value="`${point.succeeded} / ${point.total}`"
                                            :severity="point.failed === 0 ? 'success' : point.succeeded > 0 ? 'warn' : 'danger'"
                                        />
                                    </div>
                                </li>
                            </ol>
                        </div>
                    </template>
                </Card>
            </div>
        </template>

        <!-- Empty State -->
        <div v-else class="admin-content-card admin-dashboard__empty-state">
            {{ $t('pages.admin.dashboard.empty') }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useCreatorStatsPage } from '@/composables/use-creator-stats-page'
import CreatorMetricCard from './creator-metric-card.vue'

const props = defineProps<{
    refreshSignal?: number
}>()

const { locale } = useI18n()

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const {
    stats,
    loading,
    selectedRange,
    timezone,
    refresh,
} = useCreatorStatsPage()

// 当父组件通过 refreshSignal 触发刷新时，调用 refresh
watch(() => props.refreshSignal, (next, prev) => {
    if (next !== undefined && next !== prev) {
        void refresh()
    }
})

const rangeOptions = [
    { value: 7 as const },
    { value: 30 as const },
    { value: 90 as const },
]

const hasTrendData = computed(() => (stats.value?.publishing.trend.length ?? 0) > 0)

const hasDistributionData = computed(() => Boolean(
    (stats.value?.distribution.wechatsync?.trend.length ?? 0) > 0
    || (stats.value?.distribution.hexoRepositorySync?.trend.length ?? 0) > 0,
))

const granularityLabel = computed(() => {
    const g = stats.value?.aggregationGranularity
    if (g === 'day') {
        return useI18n().t('pages.admin.dashboard.creator_daily')
    }
    if (g === 'week') {
        return useI18n().t('pages.admin.dashboard.creator_weekly')
    }
    return useI18n().t('pages.admin.dashboard.creator_monthly')
})

function formatPeriodLabel(point: { periodStart: string, periodEnd?: string }, granularity: string): string {
    if (granularity === 'day') {
        return point.periodStart.slice(5)
    }
    if (granularity === 'week' && point.periodEnd) {
        return `${point.periodStart.slice(5)} ~ ${point.periodEnd}`
    }
    if (granularity === 'month') {
        const m = Number.parseInt(point.periodStart.slice(5), 10)
        return `${m}月`
    }
    return point.periodStart
}

defineExpose({ refresh })
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.admin-dashboard {
    &__panel {
        display: flex;
        flex-direction: column;
        gap: $spacing-lg;

        &--loading {
            pointer-events: none;
        }
    }

    &__hero {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1fr);
        gap: $spacing-xl;
        border: 1px solid color-mix(in srgb, var(--p-primary-300) 24%, transparent);
        background:
            linear-gradient(135deg, color-mix(in srgb, #f8fafc 80%, transparent), color-mix(in srgb, #fff7ed 72%, transparent)),
            var(--p-surface-0);
    }

    &__hero-copy {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
    }

    &__eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #9a3412;
        font-size: 0.8rem;
        font-weight: 700;
    }

    &__headline {
        margin: 0;
        font-size: clamp(1.6rem, 3vw, 2.35rem);
        line-height: 1.15;
    }

    &__summary {
        margin: 0;
        color: var(--p-text-muted-color);
        max-width: 42rem;
    }

    &__controls {
        display: flex;
        flex-direction: column;
        gap: $spacing-lg;
    }

    &__ranges {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: $spacing-sm;
    }

    &__ranges--creator {
        max-width: 480px;
    }

    &__range-button {
        border: 1px solid color-mix(in srgb, var(--p-surface-400) 24%, transparent);
        background: color-mix(in srgb, var(--p-surface-0) 94%, transparent);
        border-radius: $border-radius-lg;
        padding: $spacing-md;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        text-align: left;
        transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgb(15 23 42 / 0.08);
        }

        &--active {
            border-color: color-mix(in srgb, #ea580c 58%, transparent);
            box-shadow: 0 0 0 1px color-mix(in srgb, #ea580c 14%, transparent);
            background: linear-gradient(180deg, color-mix(in srgb, #fff7ed 88%, transparent), var(--p-surface-0));
        }
    }

    &__range-label,
    &__range-caption {
        color: var(--p-text-muted-color);
    }

    &__range-value {
        font-size: 1.4rem;
        line-height: 1;
    }

    &__notes {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
    }

    &__loading-state,
    &__empty-state {
        min-height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: var(--p-text-muted-color);
    }

    &__metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: $spacing-md;
    }

    &__metrics--creator {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    &__rankings {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr));
        gap: $spacing-md;
    }

    &__ranking-card {
        border: 1px solid color-mix(in srgb, var(--p-surface-400) 18%, transparent);

        &--wide {
            min-width: 0;
        }
    }

    &__ranking-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: $spacing-md;

        &--compact {
            gap: $spacing-sm;
        }
    }

    &__ranking-item {
        display: flex;
        justify-content: space-between;
        gap: $spacing-md;
        align-items: center;
        padding-bottom: $spacing-sm;
        border-bottom: 1px solid color-mix(in srgb, var(--p-surface-300) 28%, transparent);

        &:last-child {
            padding-bottom: 0;
            border-bottom: none;
        }
    }

    &__ranking-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        strong,
        small {
            line-height: 1.4;
        }

        small {
            color: var(--p-text-muted-color);
        }
    }

    &__ranking-stats {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        flex-wrap: wrap;
        color: var(--p-text-muted-color);
        font-size: 0.85rem;
        justify-content: flex-end;
        flex-shrink: 0;

        span {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            white-space: nowrap;
        }
    }

    &__title-with-badge {
        display: inline-flex;
        align-items: center;
        gap: $spacing-sm;
    }

    &__trend-subsection {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;
    }

    &__trend-subtitle {
        margin: 0;
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        font-size: 0.95rem;
        color: var(--p-text-muted-color);
        margin-top: $spacing-sm;
    }
}

@include respond-to("md") {
    .admin-dashboard {
        &__hero,
        &__rankings,
        &__metrics {
            grid-template-columns: 1fr;
        }
    }
}

@media (width <= 640px) {
    .admin-dashboard {
        &__ranges {
            grid-template-columns: 1fr;
        }

        &__ranking-item {
            flex-direction: column;
            align-items: flex-start;
        }

        &__ranking-stats {
            justify-content: flex-start;
        }
    }
}
</style>
