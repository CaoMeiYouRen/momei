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
@use "@/styles/pages/admin-dashboard" as *;

.admin-dashboard {
    &__panel {
        display: flex;
        flex-direction: column;
        gap: $spacing-lg;

        &--loading {
            pointer-events: none;
        }
    }

    &__ranges--creator {
        max-width: 480px;
    }

    &__metrics--creator {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
</style>
