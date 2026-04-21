<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.ai.title')" />

        <div class="admin-content">
            <Tabs v-model:value="activeTab">
                <TabList>
                    <Tab value="stats">
                        <i class="mr-2 pi pi-chart-bar" />
                        {{ $t('pages.admin.ai.stats') }}
                    </Tab>
                    <Tab value="tasks">
                        <i class="mr-2 pi pi-list" />
                        {{ $t('pages.admin.ai.tasks') }}
                    </Tab>
                </TabList>

                <TabPanels>
                    <!-- Statistics Panel -->
                    <TabPanel value="stats">
                        <AdminAiStatsOverview
                            :stats="stats"
                            :loading="loadingStats"
                            :cost-display="costDisplay"
                        />
                    </TabPanel>

                    <!-- Task List Panel -->
                    <TabPanel value="tasks">
                        <AdminAiTaskList
                            v-model:selection="selectedTasks"
                            v-model:filters="filters"
                            :tasks="tasks"
                            :total="totalTasks"
                            :loading="loadingTasks"
                            :page-size="pageSize"
                            :cost-display="costDisplay"
                            @refresh="loadTasks"
                            @page-change="onPage"
                            @filter-change="onFilterChange"
                            @show-details="showDetails"
                            @delete="confirmDelete"
                            @bulk-delete="confirmBulkDelete"
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>
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
} = useAdminAiPage()
</script>

<style lang="scss" scoped>
.admin-content {
    margin-top: 1.5rem;
}
</style>
