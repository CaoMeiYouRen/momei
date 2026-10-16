<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.ai.title')" />

        <div class="admin-content">
            <!-- `Tabs` 族 → `CaomeiTabs` 族（本路由的路由级在册族增量）；`TabPanels` 由 `CaomeiTabContent` 承接。 -->
            <CaomeiTabs v-model="activeTab">
                <CaomeiTabList>
                    <CaomeiTabTrigger value="stats">
                        <ChartColumn :size="16" class="ai-tabs__icon" />
                        {{ $t('pages.admin.ai.stats') }}
                    </CaomeiTabTrigger>
                    <CaomeiTabTrigger value="tasks">
                        <List :size="16" class="ai-tabs__icon" />
                        {{ $t('pages.admin.ai.tasks') }}
                    </CaomeiTabTrigger>
                </CaomeiTabList>

                <!-- Statistics Panel -->
                <CaomeiTabContent value="stats">
                    <AdminAiStatsOverview
                        :stats="stats"
                        :loading="loadingStats"
                        :cost-display="costDisplay"
                    />
                </CaomeiTabContent>

                <!-- Task List Panel -->
                <CaomeiTabContent value="tasks">
                    <AdminAiTaskList
                        v-model:selection="selectedTasks"
                        v-model:filters="filters"
                        :tasks="tasks"
                        :total="totalTasks"
                        :loading="loadingTasks"
                        :page="page"
                        :page-size="pageSize"
                        :cost-display="costDisplay"
                        @refresh="loadTasks"
                        @page-change="onPage"
                        @filter-change="onFilterChange"
                        @show-details="showDetails"
                        @delete="confirmDelete"
                        @bulk-delete="confirmBulkDelete"
                    />
                </CaomeiTabContent>
            </CaomeiTabs>
        </div>

        <AdminAiTaskDetailsDialog
            v-model:visible="detailsVisible"
            :loading="loadingTaskDetails"
            :error-message="taskDetailsError"
            :task="selectedTask"
            :cost-display="costDisplay"
        />

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ChartColumn, List } from '@lucide/vue'

definePageMeta({
    middleware: 'admin',
})

const {
    activeTab,
    stats,
    loadingStats,
    costDisplay,
    tasks,
    totalTasks,
    loadingTasks,
    selectedTasks,
    page,
    pageSize,
    filters,
    detailsVisible,
    loadingTaskDetails,
    taskDetailsError,
    selectedTask,
    loadTasks,
    onPage,
    onFilterChange,
    showDetails,
    confirmDelete,
    confirmBulkDelete,
} = useAdminAiPage({
    // caomei `DataTable` 的 `page` / `@page` 为 1 基（PrimeVue 为 0 基），显式声明页码基准。
    pageIndexBase: 1,
})
</script>

<style lang="scss" scoped>
.admin-content {
    margin-top: 1.5rem;
}

// 迁移前为 `pi pi-chart-bar` / `pi pi-list`（primeicons 字体图标，`mr-2`）；换成 lucide SVG 后
// 按实测补横向间距与基线补偿（SVG 默认贴基线，会比字体图标低约 2px）。
.ai-tabs__icon {
    margin-right: 0.5rem;
    vertical-align: -0.15em;
}
</style>
