<template>
    <div class="admin-dashboard admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.dashboard.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('common.refresh')"
                    icon="pi pi-refresh"
                    severity="secondary"
                    :loading="loading || creatorLoading"
                    @click="activeTab === 'insights' ? refresh() : creatorRefresh()"
                />
            </template>
        </AdminPageHeader>

        <Tabs v-model:value="activeTab">
            <TabList>
                <Tab value="insights">
                    <i class="pi pi-chart-bar" />
                    <span>{{ $t('pages.admin.dashboard.tab_insights') }}</span>
                </Tab>
                <Tab value="creator">
                    <i class="pi pi-user-edit" />
                    <span>{{ $t('pages.admin.dashboard.tab_creator') }}</span>
                </Tab>
            </TabList>

            <TabPanels>
                <TabPanel value="insights">
                    <div class="admin-dashboard__panel" :class="{'admin-dashboard__panel--loading': loading}">
                        <div class="admin-content-card admin-dashboard__hero">
                            <div class="admin-dashboard__hero-copy">
                                <p class="admin-dashboard__eyebrow">
                                    {{ $t('pages.admin.dashboard.title') }}
                                </p>
                                <h2 class="admin-dashboard__headline">
                                    {{ $t('pages.admin.dashboard.subtitle') }}
                                </h2>
                                <p class="admin-dashboard__summary">
                                    {{ $t('pages.admin.dashboard.selection_summary', {days: selectedRange}) }}
                                </p>
                            </div>

                            <div class="admin-dashboard__controls">
                                <div class="admin-dashboard__ranges">
                                    <button
                                        v-for="summary in rangeSummaries"
                                        :key="summary.days"
                                        type="button"
                                        class="admin-dashboard__range-button"
                                        :class="{'admin-dashboard__range-button--active': selectedRange === summary.days}"
                                        @click="selectedRange = summary.days"
                                    >
                                        <span class="admin-dashboard__range-label">
                                            {{ $t('pages.admin.dashboard.range_label', {days: summary.days}) }}
                                        </span>
                                        <strong class="admin-dashboard__range-value">
                                            {{ numberFormatter.format(summary.metrics.posts.total) }}
                                        </strong>
                                        <small class="admin-dashboard__range-caption">
                                            {{ $t('pages.admin.dashboard.metrics.posts') }}
                                        </small>
                                    </button>
                                </div>

                                <div class="admin-dashboard__filters">
                                    <div class="admin-dashboard__filter-field">
                                        <label class="admin-dashboard__filter-label" for="dashboard-scope-select">
                                            {{ $t('pages.admin.dashboard.scope_label') }}
                                        </label>
                                        <Select
                                            id="dashboard-scope-select"
                                            v-model="scope"
                                            :options="scopeOptions"
                                            option-label="label"
                                            option-value="value"
                                            class="admin-dashboard__scope-select"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="admin-dashboard__notes">
                            <Tag :value="$t('pages.admin.dashboard.notes.timezone', {timezone: dashboard?.timezone || timezone})" severity="secondary" />
                            <Tag
                                :value="scope === 'public'
                                    ? $t('pages.admin.dashboard.notes.public_scope')
                                    : $t('pages.admin.dashboard.notes.all_scope')"
                                severity="info"
                            />
                            <Tag :value="$t('pages.admin.dashboard.notes.cohort_metrics', {days: selectedRange})" severity="warn" />
                            <Tag :value="$t('pages.admin.dashboard.notes.representative')" severity="contrast" />
                        </div>

                        <div v-if="loading && !dashboard" class="admin-dashboard__loading-state">
                            <ProgressSpinner stroke-width="4" />
                        </div>

                        <template v-else-if="selectedSummary">
                            <div class="admin-dashboard__metrics">
                                <AdminDashboardMetricCard
                                    v-for="metric in metricCards"
                                    :key="metric.key"
                                    :label="metric.label"
                                    :icon="metric.icon"
                                    :metric="metric.metric"
                                    :tone="metric.tone"
                                />
                            </div>

                            <div v-if="hasRankingData" class="admin-dashboard__rankings">
                                <Card class="admin-dashboard__ranking-card admin-dashboard__ranking-card--wide">
                                    <template #title>
                                        {{ $t('pages.admin.dashboard.rankings.posts') }}
                                    </template>
                                    <template #content>
                                        <ol class="admin-dashboard__ranking-list">
                                            <li
                                                v-for="post in dashboard?.rankings.posts || []"
                                                :key="post.id"
                                                class="admin-dashboard__ranking-item"
                                            >
                                                <div class="admin-dashboard__ranking-copy">
                                                    <NuxtLink
                                                        :to="localePath(`/admin/posts/${post.id}`)"
                                                        class="admin-dashboard__ranking-link"
                                                    >
                                                        {{ post.title }}
                                                    </NuxtLink>
                                                    <div class="admin-dashboard__ranking-meta">
                                                        <Tag :value="post.language.toUpperCase()" severity="secondary" />
                                                        <span v-if="post.category">{{ post.category.name }}</span>
                                                        <span>{{ formatDateTime(post.publishedAt || post.createdAt) }}</span>
                                                    </div>
                                                </div>
                                                <div class="admin-dashboard__ranking-stats">
                                                    <span>
                                                        <i class="pi pi-eye" />
                                                        {{ numberFormatter.format(post.views) }}
                                                    </span>
                                                    <span>
                                                        <i class="pi pi-comments" />
                                                        {{ numberFormatter.format(post.commentCount) }}
                                                    </span>
                                                </div>
                                            </li>
                                        </ol>
                                    </template>
                                </Card>

                                <Card class="admin-dashboard__ranking-card">
                                    <template #title>
                                        {{ $t('pages.admin.dashboard.rankings.tags') }}
                                    </template>
                                    <template #content>
                                        <ol class="admin-dashboard__ranking-list admin-dashboard__ranking-list--compact">
                                            <li
                                                v-for="tag in dashboard?.rankings.tags || []"
                                                :key="tag.clusterId"
                                                class="admin-dashboard__ranking-item"
                                            >
                                                <div class="admin-dashboard__ranking-copy">
                                                    <strong>{{ tag.name }}</strong>
                                                    <small>{{ $t('pages.admin.dashboard.ranking_post_count', {count: tag.postCount}) }}</small>
                                                </div>
                                                <div class="admin-dashboard__ranking-stats">
                                                    <span>
                                                        <i class="pi pi-eye" />
                                                        {{ numberFormatter.format(tag.views) }}
                                                    </span>
                                                    <span>
                                                        <i class="pi pi-comments" />
                                                        {{ numberFormatter.format(tag.commentCount) }}
                                                    </span>
                                                </div>
                                            </li>
                                        </ol>
                                    </template>
                                </Card>

                                <Card class="admin-dashboard__ranking-card">
                                    <template #title>
                                        {{ $t('pages.admin.dashboard.rankings.categories') }}
                                    </template>
                                    <template #content>
                                        <ol class="admin-dashboard__ranking-list admin-dashboard__ranking-list--compact">
                                            <li
                                                v-for="category in dashboard?.rankings.categories || []"
                                                :key="category.clusterId"
                                                class="admin-dashboard__ranking-item"
                                            >
                                                <div class="admin-dashboard__ranking-copy">
                                                    <strong>{{ category.name }}</strong>
                                                    <small>{{ $t('pages.admin.dashboard.ranking_post_count', {count: category.postCount}) }}</small>
                                                </div>
                                                <div class="admin-dashboard__ranking-stats">
                                                    <span>
                                                        <i class="pi pi-eye" />
                                                        {{ numberFormatter.format(category.views) }}
                                                    </span>
                                                    <span>
                                                        <i class="pi pi-comments" />
                                                        {{ numberFormatter.format(category.commentCount) }}
                                                    </span>
                                                </div>
                                            </li>
                                        </ol>
                                    </template>
                                </Card>
                            </div>

                            <div v-else class="admin-content-card admin-dashboard__empty-state">
                                {{ $t('pages.admin.dashboard.empty') }}
                            </div>
                        </template>

                        <div v-else class="admin-content-card admin-dashboard__empty-state">
                            {{ $t('pages.admin.dashboard.empty') }}
                        </div>
                    </div><!-- end panel -->
                </TabPanel>

                <TabPanel value="creator">
                    <div class="admin-dashboard__panel" :class="{'admin-dashboard__panel--loading': creatorLoading}">
                        <!-- 创作者统计: Range 选择 -->
                        <div class="admin-dashboard__ranges admin-dashboard__ranges--creator">
                            <button
                                v-for="rangeOpt in creatorRangeOptions"
                                :key="rangeOpt.value"
                                type="button"
                                class="admin-dashboard__range-button"
                                :class="{'admin-dashboard__range-button--active': creatorSelectedRange === rangeOpt.value}"
                                @click="creatorSelectedRange = rangeOpt.value"
                            >
                                <span class="admin-dashboard__range-label">
                                    {{ $t('pages.admin.dashboard.range_label', {days: rangeOpt.value}) }}
                                </span>
                            </button>
                        </div>

                        <div v-if="creatorLoading && !creatorStats" class="admin-dashboard__loading-state">
                            <ProgressSpinner stroke-width="4" />
                        </div>

                        <template v-else-if="creatorStats">
                            <!-- 产出概览卡片 -->
                            <div class="admin-dashboard__metrics admin-dashboard__metrics--creator">
                                <CreatorMetricCard
                                    :label="$t('pages.admin.dashboard.creator_published')"
                                    :value="creatorStats.publishing.totalPublished"
                                    icon="pi pi-file-check"
                                    tone="neutral"
                                />
                                <CreatorMetricCard
                                    :label="$t('pages.admin.dashboard.creator_drafts')"
                                    :value="creatorStats.publishing.draftCount"
                                    icon="pi pi-pen-to-square"
                                    tone="warm"
                                />
                                <CreatorMetricCard
                                    v-if="creatorStats.distribution.wechatsync"
                                    :label="$t('pages.admin.dashboard.creator_wechat_sync')"
                                    :value="creatorStats.distribution.wechatsync.overallSuccessRate"
                                    icon="pi pi-share-alt"
                                    tone="cool"
                                    format="percent"
                                />
                                <CreatorMetricCard
                                    v-if="creatorStats.distribution.hexoRepositorySync"
                                    :label="$t('pages.admin.dashboard.creator_hexo_sync')"
                                    :value="creatorStats.distribution.hexoRepositorySync.overallSuccessRate"
                                    icon="pi pi-code-branch"
                                    tone="cool"
                                    format="percent"
                                />
                            </div>

                            <!-- 发文趋势 -->
                            <div v-if="creatorStats.publishing.trend.length > 0" class="admin-dashboard__trend-section">
                                <h3 class="admin-dashboard__trend-title">
                                    {{ $t('pages.admin.dashboard.creator_publish_trend') }}
                                    <Tag
                                        :value="creatorStats.aggregationGranularity === 'day'
                                            ? $t('pages.admin.dashboard.creator_daily')
                                            : creatorStats.aggregationGranularity === 'week'
                                                ? $t('pages.admin.dashboard.creator_weekly')
                                                : $t('pages.admin.dashboard.creator_monthly')"
                                        severity="info"
                                    />
                                </h3>
                                <div class="admin-dashboard__trend-list">
                                    <div
                                        v-for="point in creatorStats.publishing.trend"
                                        :key="point.periodStart"
                                        class="admin-dashboard__trend-row"
                                    >
                                        <span class="admin-dashboard__trend-period">
                                            {{ formatPeriodLabel(point, creatorStats.aggregationGranularity) }}
                                        </span>
                                        <span class="admin-dashboard__trend-count">
                                            {{ $t('pages.admin.dashboard.creator_post_count', {count: point.count}) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- 分发趋势 -->
                            <div v-if="hasDistributionData" class="admin-dashboard__trend-section">
                                <h3 class="admin-dashboard__trend-title">
                                    {{ $t('pages.admin.dashboard.creator_distribution_trend') }}
                                </h3>
                                <div v-if="creatorStats.distribution.wechatsync?.trend.length" class="admin-dashboard__trend-subsection">
                                    <h4 class="admin-dashboard__trend-subtitle">
                                        {{ $t('pages.admin.dashboard.creator_wechat_sync') }}
                                    </h4>
                                    <div
                                        v-for="point in creatorStats.distribution.wechatsync.trend"
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
                                <div v-if="creatorStats.distribution.hexoRepositorySync?.trend.length" class="admin-dashboard__trend-subsection">
                                    <h4 class="admin-dashboard__trend-subtitle">
                                        {{ $t('pages.admin.dashboard.creator_hexo_sync') }}
                                    </h4>
                                    <div
                                        v-for="point in creatorStats.distribution.hexoRepositorySync.trend"
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
                    </div><!-- end panel -->
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ADMIN_CONTENT_INSIGHT_RANGES } from '@/types/admin-content-insights'
import { useI18nDate } from '@/composables/use-i18n-date'
import { useAdminContentInsightsPage } from '@/composables/use-admin-content-insights-page'
import { useCreatorStatsPage } from '@/composables/use-creator-stats-page'

definePageMeta({
    middleware: 'author',
    layout: 'default',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { formatDateTime } = useI18nDate()

const {
    dashboard,
    loading,
    selectedRange,
    selectedSummary,
    scope,
    scopeOptions,
    timezone,
    refresh,
} = useAdminContentInsightsPage()

// 创作者统计
const activeTab = ref<'insights' | 'creator'>('insights')
const {
    stats: creatorStats,
    loading: creatorLoading,
    selectedRange: creatorSelectedRange,
    refresh: creatorRefresh,
} = useCreatorStatsPage()

const creatorRangeOptions = [
    { value: 7 as const },
    { value: 30 as const },
    { value: 90 as const },
]

const hasDistributionData = computed(() => Boolean(
    creatorStats.value
    && (
        (creatorStats.value.distribution.wechatsync?.trend.length ?? 0) > 0
        || (creatorStats.value.distribution.hexoRepositorySync?.trend.length ?? 0) > 0
    ),
))

function formatPeriodLabel(point: { periodStart: string, periodEnd?: string }, granularity: string): string {
    if (granularity === 'day') {
        // 显示 MM-DD
        return point.periodStart.slice(5)
    }
    if (granularity === 'week' && point.periodEnd) {
        // 显示 04-27 ~ 05-03
        return `${point.periodStart.slice(5)} ~ ${point.periodEnd}`
    }
    if (granularity === 'month') {
        // 显示 2026-05 → 5月
        const m = Number.parseInt(point.periodStart.slice(5), 10)
        return `${m}月`
    }
    return point.periodStart
}

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const rangeSummaries = computed(() => dashboard.value?.summaries || ADMIN_CONTENT_INSIGHT_RANGES.map((days) => ({
    days,
    metrics: {
        views: { total: 0, previousTotal: 0, delta: 0, deltaRate: null },
        comments: { total: 0, previousTotal: 0, delta: 0, deltaRate: null },
        posts: { total: 0, previousTotal: 0, delta: 0, deltaRate: null },
    },
    currentWindow: { start: '', end: '' },
    previousWindow: { start: '', end: '' },
    trend: [],
})))

const metricCards = computed(() => {
    if (!selectedSummary.value) {
        return []
    }

    return [
        {
            key: 'views',
            label: t('pages.admin.dashboard.metrics.views'),
            icon: 'pi pi-eye',
            tone: 'warm' as const,
            metric: selectedSummary.value.metrics.views,
        },
        {
            key: 'comments',
            label: t('pages.admin.dashboard.metrics.comments'),
            icon: 'pi pi-comments',
            tone: 'cool' as const,
            metric: selectedSummary.value.metrics.comments,
        },
        {
            key: 'posts',
            label: t('pages.admin.dashboard.metrics.posts'),
            icon: 'pi pi-file-edit',
            tone: 'neutral' as const,
            metric: selectedSummary.value.metrics.posts,
        },
    ]
})

const hasRankingData = computed(() => Boolean(
    dashboard.value
    && (
        dashboard.value.rankings.posts.length > 0
        || dashboard.value.rankings.tags.length > 0
        || dashboard.value.rankings.categories.length > 0
    ),
))
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.admin-dashboard {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;

    &--loading {
        pointer-events: none;
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

    &__filters {
        display: flex;
        justify-content: flex-end;
    }

    &__filter-field {
        min-width: 220px;
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__filter-label {
        font-size: 0.85rem;
        color: var(--p-text-muted-color);
    }

    &__scope-select {
        width: 100%;
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

    &__ranking-link {
        font-weight: 600;
        color: inherit;
        text-decoration: none;

        &:hover {
            color: var(--p-primary-color);
        }
    }

    &__ranking-meta,
    &__ranking-stats {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        flex-wrap: wrap;
        color: var(--p-text-muted-color);
        font-size: 0.85rem;
    }

    &__ranking-stats {
        justify-content: flex-end;
        flex-shrink: 0;

        span {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            white-space: nowrap;
        }
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

        &__filters,
        &__filter-field {
            width: 100%;
        }
    }
}

// Creator stats panel
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

    &__trend-section {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
    }

    &__trend-title,
    &__trend-subtitle {
        margin: 0;
        display: flex;
        align-items: center;
        gap: $spacing-sm;
    }

    &__trend-subtitle {
        font-size: 0.95rem;
        color: var(--p-text-muted-color);
        margin-top: $spacing-sm;
    }

    &__trend-subsection {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;
    }

    &__trend-list {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;
    }

    &__trend-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $spacing-sm $spacing-md;
        background: color-mix(in srgb, var(--p-surface-100) 50%, transparent);
        border-radius: $border-radius-md;
    }

    &__trend-period {
        font-weight: 600;
        font-size: 0.9rem;
    }

    &__trend-count {
        color: var(--p-text-muted-color);
    }
}
</style>
