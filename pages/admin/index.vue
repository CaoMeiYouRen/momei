<template>
    <div class="admin-dashboard admin-page-container" :class="{'admin-dashboard--loading': loading}">
        <AdminPageHeader :title="$t('pages.admin.dashboard.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('common.refresh')"
                    icon="pi pi-refresh"
                    severity="secondary"
                    :loading="loading"
                    @click="refresh"
                />
            </template>
        </AdminPageHeader>

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
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ADMIN_CONTENT_INSIGHT_RANGES } from '@/types/admin-content-insights'
import { useI18nDate } from '@/composables/use-i18n-date'
import { useAdminContentInsightsPage } from '@/composables/use-admin-content-insights-page'

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
</style>
