<template>
    <div class="admin-dashboard__panel" :class="{'admin-dashboard__panel--loading': loading}">
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
            </button>
        </div>

        <div v-if="loading && !stats" class="admin-dashboard__loading-state">
            <ProgressSpinner stroke-width="4" />
        </div>

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

            <div v-if="hasTrendData" class="admin-dashboard__trend-section">
                <h3 class="admin-dashboard__trend-title">
                    {{ $t('pages.admin.dashboard.creator_publish_trend') }}
                    <Tag
                        :value="granularityLabel"
                        severity="info"
                    />
                </h3>
                <div class="admin-dashboard__trend-list">
                    <div
                        v-for="point in stats.publishing.trend"
                        :key="point.periodStart"
                        class="admin-dashboard__trend-row"
                    >
                        <span class="admin-dashboard__trend-period">
                            {{ formatPeriodLabel(point, stats.aggregationGranularity) }}
                        </span>
                        <span class="admin-dashboard__trend-count">
                            {{ $t('pages.admin.dashboard.creator_post_count', {count: point.count}) }}
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="hasDistributionData" class="admin-dashboard__trend-section">
                <h3 class="admin-dashboard__trend-title">
                    {{ $t('pages.admin.dashboard.creator_distribution_trend') }}
                </h3>
                <div v-if="stats.distribution.wechatsync?.trend.length" class="admin-dashboard__trend-subsection">
                    <h4 class="admin-dashboard__trend-subtitle">
                        {{ $t('pages.admin.dashboard.creator_wechat_sync') }}
                    </h4>
                    <div
                        v-for="point in stats.distribution.wechatsync.trend"
                        :key="point.periodStart"
                        class="admin-dashboard__trend-row"
                    >
                        <span class="admin-dashboard__trend-period">{{ point.periodStart }}</span>
                        <Tag
                            :value="`${point.succeeded} / ${point.total}`"
                            :severity="point.failed === 0 ? 'success' : point.succeeded > 0 ? 'warn' : 'danger'"
                        />
                    </div>
                </div>
                <div v-if="stats.distribution.hexoRepositorySync?.trend.length" class="admin-dashboard__trend-subsection">
                    <h4 class="admin-dashboard__trend-subtitle">
                        {{ $t('pages.admin.dashboard.creator_hexo_sync') }}
                    </h4>
                    <div
                        v-for="point in stats.distribution.hexoRepositorySync.trend"
                        :key="point.periodStart"
                        class="admin-dashboard__trend-row"
                    >
                        <span class="admin-dashboard__trend-period">{{ point.periodStart }}</span>
                        <Tag
                            :value="`${point.succeeded} / ${point.total}`"
                            :severity="point.failed === 0 ? 'success' : point.succeeded > 0 ? 'warn' : 'danger'"
                        />
                    </div>
                </div>
            </div>
        </template>

        <div v-else class="admin-content-card admin-dashboard__empty-state">
            {{ $t('pages.admin.dashboard.empty') }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCreatorStatsPage } from '@/composables/use-creator-stats-page'
import CreatorMetricCard from './creator-metric-card.vue'

const {
    stats,
    loading,
    selectedRange,
    refresh,
} = useCreatorStatsPage()

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
