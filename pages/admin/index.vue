<template>
    <div class="admin-dashboard admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.dashboard.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('common.refresh')"
                    icon="pi pi-refresh"
                    severity="secondary"
                    :loading="loading"
                    @click="handleRefresh"
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
                    <CreatorStatsPanel :refresh-signal="creatorRefreshSignal" />
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
import CreatorStatsPanel from '@/components/admin/dashboard/creator-stats-panel.vue'

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

const activeTab = ref<'insights' | 'creator'>('insights')
const creatorRefreshSignal = ref(0)

function handleRefresh() {
    if (activeTab.value === 'creator') {
        creatorRefreshSignal.value++
    } else {
        refresh()
    }
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
@use "@/styles/pages/admin-dashboard" as *;

.admin-dashboard {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;

    &--loading {
        pointer-events: none;
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

    &__ranking-link {
        font-weight: 600;
        color: inherit;
        text-decoration: none;

        &:hover {
            color: var(--p-primary-color);
        }
    }

    &__ranking-meta {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        flex-wrap: wrap;
        color: var(--p-text-muted-color);
        font-size: 0.85rem;
    }

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

@media (width <= 640px) {
    .admin-dashboard {
        &__filters,
        &__filter-field {
            width: 100%;
        }
    }
}
</style>
