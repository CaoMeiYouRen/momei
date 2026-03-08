<template>
    <div v-if="stats" class="ai-stats-container">
        <Card v-if="stats.alerts?.length" class="ai-alert-card">
            <template #title>
                <div class="card-header">
                    <span class="card-title">{{ $t('pages.admin.ai.alerts.title') }}</span>
                    <i class="icon pi pi-bell" />
                </div>
            </template>
            <template #content>
                <div class="alert-list">
                    <div
                        v-for="alert in stats.alerts"
                        :key="alert.dedupeKey"
                        class="alert-item"
                    >
                        <div class="alert-copy">
                            <div class="alert-title">
                                {{ formatAlertMessage(alert) }}
                            </div>
                            <div class="alert-meta">
                                {{ formatAlertDetail(alert) }}
                            </div>
                        </div>

                        <div class="alert-tags">
                            <Tag :value="formatAlertSeverity(alert)" :severity="getAlertTagSeverity(alert)" />
                            <Tag :value="formatAlertPeriod(alert)" severity="secondary" />
                            <Tag :value="formatAlertScope(alert)" severity="contrast" />
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Stats Overview Cards -->
        <div class="ai-overview-grid">
            <Card class="ai-stat-card total">
                <template #title>
                    <div class="card-header">
                        <span class="card-title">{{ $t('pages.admin.ai.tasks') }}</span>
                        <i class="icon pi pi-list" />
                    </div>
                </template>
                <template #content>
                    <div class="card-value">
                        {{ getTotalTasks() }}
                    </div>
                </template>
            </Card>

            <Card class="ai-stat-card completed">
                <template #title>
                    <div class="card-header">
                        <span class="card-title">{{ $t('pages.admin.ai.statuses.completed') }}</span>
                        <i class="icon pi pi-check-circle" />
                    </div>
                </template>
                <template #content>
                    <div class="card-value">
                        {{ getStatusCount('completed') }}
                    </div>
                </template>
            </Card>

            <Card class="ai-stat-card failed">
                <template #title>
                    <div class="card-header">
                        <span class="card-title">{{ $t('pages.admin.ai.statuses.failed') }}</span>
                        <i class="icon pi pi-times-circle" />
                    </div>
                </template>
                <template #content>
                    <div class="card-value">
                        {{ getStatusCount('failed') }}
                    </div>
                </template>
            </Card>

            <Card class="ai-stat-card processing">
                <template #title>
                    <div class="card-header">
                        <span class="card-title">{{ $t('pages.admin.ai.statuses.processing') }}</span>
                        <i class="icon pi pi-sync" />
                    </div>
                </template>
                <template #content>
                    <div class="card-value">
                        {{ getStatusCount('processing') }}
                    </div>
                </template>
            </Card>

            <Card class="ai-stat-card quota">
                <template #title>
                    <div class="card-header">
                        <span class="card-title">{{ $t('pages.admin.ai.quota_units') }}</span>
                        <i class="icon pi pi-bolt" />
                    </div>
                </template>
                <template #content>
                    <div class="card-value card-value--compact">
                        {{ formatDecimal(stats.overview?.quotaUnits) }}
                    </div>
                </template>
            </Card>

            <Card class="ai-stat-card cost">
                <template #title>
                    <div class="card-header">
                        <span class="card-title">{{ $t('pages.admin.ai.actual_cost') }}</span>
                        <i class="icon pi pi-wallet" />
                    </div>
                </template>
                <template #content>
                    <div class="card-value card-value--compact">
                        {{ formatCurrency(stats.overview?.actualCost) }}
                    </div>
                </template>
            </Card>

            <Card class="ai-stat-card success-rate">
                <template #title>
                    <div class="card-header">
                        <span class="card-title">{{ $t('pages.admin.ai.success_rate') }}</span>
                        <i class="icon pi pi-chart-line" />
                    </div>
                </template>
                <template #content>
                    <div class="card-value card-value--compact">
                        {{ formatPercent(stats.overview?.successRate) }}
                    </div>
                </template>
            </Card>
        </div>

        <div class="ai-charts-grid">
            <Card class="ai-chart-card">
                <template #title>
                    <span class="card-title">{{ $t('pages.admin.ai.chart_status') }}</span>
                </template>
                <template #content>
                    <div class="stats-list">
                        <div
                            v-for="s in stats.statusStats"
                            :key="s.status"
                            class="stats-item"
                        >
                            <span class="label">{{ $t(`pages.admin.ai.statuses.${s.status}`) }}</span>
                            <Tag :value="s.count" severity="secondary" />
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="ai-chart-card">
                <template #title>
                    <span class="card-title">{{ $t('pages.admin.ai.chart_category') }}</span>
                </template>
                <template #content>
                    <div class="stats-list">
                        <div
                            v-for="categoryItem in stats.categoryStats || []"
                            :key="categoryItem.category"
                            class="stats-item"
                        >
                            <span class="label">{{ $t(`pages.admin.ai.types.${categoryItem.category}`) }}</span>
                            <Tag :value="formatDecimal(categoryItem.quotaUnits)" severity="info" />
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="ai-chart-card">
                <template #title>
                    <span class="card-title">{{ $t('pages.admin.ai.chart_charge_status') }}</span>
                </template>
                <template #content>
                    <div class="stats-list">
                        <div
                            v-for="chargeItem in stats.chargeStatusStats || []"
                            :key="chargeItem.chargeStatus"
                            class="stats-item"
                        >
                            <span class="label">{{ $t(`pages.admin.ai.charge_statuses.${chargeItem.chargeStatus}`) }}</span>
                            <Tag :value="chargeItem.count" severity="contrast" />
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="ai-chart-card">
                <template #title>
                    <span class="card-title">{{ $t('pages.admin.ai.chart_failure_stage') }}</span>
                </template>
                <template #content>
                    <div class="stats-list">
                        <div
                            v-for="failureItem in stats.failureStageStats || []"
                            :key="failureItem.failureStage"
                            class="stats-item"
                        >
                            <span class="label">{{ $t(`pages.admin.ai.failure_stages.${failureItem.failureStage}`) }}</span>
                            <Tag :value="failureItem.count" severity="warning" />
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
    <div v-else-if="loading" class="ai-loading-state">
        <i class="pi pi-spin pi-spinner" />
    </div>
    <div v-else class="ai-empty-state">
        {{ $t('pages.admin.ai.no_stats') }}
    </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDecimal } from '@/utils/shared/number'
import type { AIUsageAlert } from '@/types/ai'

const props = defineProps<{
    stats: any
    loading: boolean
}>()

const { t } = useI18n()

const getTotalTasks = () => {
    return props.stats?.overview?.totalTasks || props.stats?.statusStats?.reduce((acc: number, s: any) => acc + Number(s.count), 0) || 0
}

const getStatusCount = (status: string) => {
    return props.stats?.statusStats?.find((s: any) => s.status === status)?.count || 0
}

const formatPercent = (value: number) => {
    return `${((value || 0) * 100).toFixed(1)}%`
}

const resolveSubjectLabel = (alert: AIUsageAlert) => {
    return alert.subjectName || alert.subjectValue
}

const formatAlertSeverity = (alert: AIUsageAlert) => {
    return t(`pages.admin.ai.alerts.severity.${alert.severity}`)
}

const getAlertTagSeverity = (alert: AIUsageAlert) => {
    switch (alert.severity) {
        case 'critical':
            return 'danger'
        case 'warning':
            return 'warn'
        default:
            return 'info'
    }
}

const formatAlertPeriod = (alert: AIUsageAlert) => {
    return t(`pages.admin.ai.alerts.periods.${alert.period}`)
}

const formatAlertScope = (alert: AIUsageAlert) => {
    if (alert.scope === 'all') {
        return t('pages.admin.ai.all_scope')
    }

    return t(`pages.admin.ai.types.${alert.scope}`)
}

const formatAlertMessage = (alert: AIUsageAlert) => {
    if (alert.kind === 'failure_burst') {
        return t('pages.admin.ai.alerts.messages.failure_burst', {
            name: resolveSubjectLabel(alert),
            window: alert.windowMinutes || 0,
            count: alert.failureCount || alert.usedValue,
        })
    }

    return t(`pages.admin.ai.alerts.messages.${alert.kind}`, {
        name: resolveSubjectLabel(alert),
        period: formatAlertPeriod(alert),
        scope: formatAlertScope(alert),
        percent: formatPercent(alert.threshold),
    })
}

const formatAlertDetail = (alert: AIUsageAlert) => {
    if (alert.kind === 'cost_usage') {
        return t('pages.admin.ai.alerts.details.cost_usage', {
            used: formatCurrency(alert.usedValue),
            limit: formatCurrency(alert.limitValue),
        })
    }

    if (alert.kind === 'failure_burst') {
        return t('pages.admin.ai.alerts.details.failure_burst', {
            window: alert.windowMinutes || 0,
            limit: alert.limitValue,
        })
    }

    return t('pages.admin.ai.alerts.details.quota_usage', {
        used: formatDecimal(alert.usedValue),
        limit: formatDecimal(alert.limitValue),
    })
}
</script>

<style lang="scss" scoped>
.ai-stats-container {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.ai-alert-card {
    border-radius: 12px;
    border: 1px solid rgb(245 158 11 / 0.25);
    background: linear-gradient(135deg, rgb(255 251 235 / 0.95), rgb(255 247 237 / 0.98));

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .icon {
        color: var(--orange-500);
        font-size: 1.25rem;
    }
}

.alert-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.alert-item {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 10px;
    background: rgb(255 255 255 / 0.75);
    border: 1px solid rgb(251 191 36 / 0.2);

    @media (width <= 768px) {
        flex-direction: column;
    }
}

.alert-copy {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.alert-title {
    font-weight: 700;
    color: var(--text-color);
}

.alert-meta {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
}

.alert-tags {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.ai-overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;

    @media (width >= 1200px) {
        grid-template-columns: repeat(4, 1fr);
    }
}

.ai-stat-card {
    border: none;
    box-shadow: 0 4px 15px rgb(0 0 0 / 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    border-radius: 12px;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgb(0 0 0 / 0.1);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
            font-size: 1rem;
            color: var(--text-color-secondary);
        }

        .icon {
            font-size: 1.5rem;
            opacity: 0.8;
        }
    }

    .card-value {
        font-size: 2.5rem;
        font-weight: 800;
        margin-top: 0.5rem;
    }

    .card-value--compact {
        font-size: 2rem;
    }

    &.total .icon { color: var(--primary-color); }
    &.completed .icon { color: var(--green-500); }
    &.failed .icon { color: var(--red-500); }
    &.processing .icon { color: var(--blue-500); }
    &.quota .icon { color: var(--orange-500); }
    &.cost .icon { color: var(--teal-500); }
    &.success-rate .icon { color: var(--cyan-500); }
}

.ai-charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
}

.ai-chart-card {
    border-radius: 12px;
    box-shadow: 0 4px 15px rgb(0 0 0 / 0.05);

    .card-title {
        font-size: 1.1rem;
        font-weight: 600;
    }
}

.stats-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .stats-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: var(--surface-hover);
        border-radius: 8px;

        .label {
            font-weight: 500;
        }
    }
}

.ai-loading-state, .ai-empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    font-size: 1.2rem;
    color: var(--text-color-secondary);
}
</style>
