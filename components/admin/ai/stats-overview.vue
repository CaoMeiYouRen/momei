<template>
    <div v-if="stats" class="ai-stats-container">
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
                    <span class="card-title">{{ $t('pages.admin.ai.chart_type') }}</span>
                </template>
                <template #content>
                    <div class="stats-list">
                        <div
                            v-for="typeItem in stats.typeStats"
                            :key="typeItem.type"
                            class="stats-item"
                        >
                            <span class="label">{{ $t(`pages.admin.ai.types.${typeItem.type}`) }}</span>
                            <Tag :value="typeItem.count" severity="info" />
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
const props = defineProps<{
    stats: any
    loading: boolean
}>()

const getTotalTasks = () => {
    return props.stats?.statusStats?.reduce((acc: number, s: any) => acc + Number(s.count), 0) || 0
}

const getStatusCount = (status: string) => {
    return props.stats?.statusStats?.find((s: any) => s.status === status)?.count || 0
}
</script>

<style lang="scss" scoped>
.ai-stats-container {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
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

    &.total .icon { color: var(--primary-color); }
    &.completed .icon { color: var(--green-500); }
    &.failed .icon { color: var(--red-500); }
    &.processing .icon { color: var(--blue-500); }
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
