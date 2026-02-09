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
                        <AdminAiStatsOverview :stats="stats" :loading="loadingStats" />
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
            :task="selectedTask"
        />

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const activeTab = ref('stats')
const stats = ref<any>(null)
const loadingStats = ref(false)

const tasks = ref<any[]>([])
const totalTasks = ref(0)
const loadingTasks = ref(false)
const selectedTasks = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)

const filters = ref({
    search: '',
    type: null,
    status: null,
})

const detailsVisible = ref(false)
const selectedTask = ref<any>(null)

const loadStats = async () => {
    loadingStats.value = true
    try {
        stats.value = await $fetch('/api/admin/ai/stats')
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message })
    } finally {
        loadingStats.value = false
    }
}

const loadTasks = async () => {
    loadingTasks.value = true
    try {
        const response: any = await $fetch('/api/admin/ai/tasks', {
            query: {
                page: page.value,
                pageSize: pageSize.value,
                type: filters.value.type,
                status: filters.value.status,
                search: filters.value.search,
            },
        })
        tasks.value = response.items
        totalTasks.value = response.total
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message })
    } finally {
        loadingTasks.value = false
    }
}

const onPage = (event: any) => {
    page.value = event.page + 1
    pageSize.value = event.rows
    loadTasks()
}

const onFilterChange = () => {
    page.value = 1
    loadTasks()
}

const showDetails = (task: any) => {
    selectedTask.value = task
    detailsVisible.value = true
}

const confirmDelete = (task: any) => {
    confirm.require({
        message: t('pages.admin.ai.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: t('common.cancel'),
            severity: 'secondary',
            outlined: true,
        },
        acceptProps: {
            label: t('common.delete'),
            severity: 'danger',
        },
        accept: async () => {
            try {
                await $fetch('/api/admin/ai/tasks', {
                    method: 'DELETE',
                    query: { ids: task.id },
                })
                toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
                loadTasks()
                loadStats()
            } catch (e: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: e.message })
            }
        },
    })
}

const confirmBulkDelete = () => {
    confirm.require({
        message: t('pages.admin.ai.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                const ids = selectedTasks.value.map((t) => t.id).join(',')
                await $fetch('/api/admin/ai/tasks', {
                    method: 'DELETE',
                    query: { ids },
                })
                toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
                selectedTasks.value = []
                loadTasks()
                loadStats()
            } catch (e: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: e.message })
            }
        },
    })
}

onMounted(() => {
    loadStats()
    loadTasks()
})
</script>

<style lang="scss" scoped>
.admin-content {
    margin-top: 1.5rem;
}
</style>
