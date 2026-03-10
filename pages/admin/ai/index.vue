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
            :task="selectedTask"
            :cost-display="costDisplay"
        />

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import type {
    AIAdminStatsResponse,
    AIAdminTaskListFilters,
    AIAdminTaskListItem,
    AIAdminTaskListResponse,
    AICostDisplay,
} from '@/types/ai'

type AdminAiPageEvent = {
    page: number
    rows: number
}

function getErrorDetail(error: unknown, fallback: string) {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

definePageMeta({
    middleware: 'admin',
})

const activeTab = ref('stats')
const stats = ref<AIAdminStatsResponse | null>(null)
const loadingStats = ref(false)
const costDisplay = ref<AICostDisplay | null>(null)

const tasks = ref<AIAdminTaskListItem[]>([])
const totalTasks = ref(0)
const loadingTasks = ref(false)
const selectedTasks = ref<AIAdminTaskListItem[]>([])
const page = ref(1)
const pageSize = ref(10)

const filters = ref<AIAdminTaskListFilters>({
    search: '',
    type: null,
    status: null,
})

const detailsVisible = ref(false)
const selectedTask = ref<AIAdminTaskListItem | null>(null)

const loadStats = async () => {
    loadingStats.value = true
    try {
        const response = await $fetch<AIAdminStatsResponse>('/api/admin/ai/stats')
        stats.value = response
        costDisplay.value = response.costDisplay
    } catch (error: unknown) {
        toast.add({ severity: 'error', summary: 'Error', detail: getErrorDetail(error, 'Failed to load AI stats') })
    } finally {
        loadingStats.value = false
    }
}

const loadTasks = async () => {
    loadingTasks.value = true
    try {
        const response = await $fetch<AIAdminTaskListResponse>('/api/admin/ai/tasks', {
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
        costDisplay.value = response.costDisplay
    } catch (error: unknown) {
        toast.add({ severity: 'error', summary: 'Error', detail: getErrorDetail(error, 'Failed to load AI tasks') })
    } finally {
        loadingTasks.value = false
    }
}

const onPage = (event: AdminAiPageEvent) => {
    page.value = event.page + 1
    pageSize.value = event.rows
    void loadTasks()
}

const onFilterChange = () => {
    page.value = 1
    void loadTasks()
}

const showDetails = (task: AIAdminTaskListItem) => {
    selectedTask.value = task
    detailsVisible.value = true
}

const confirmDelete = (task: AIAdminTaskListItem) => {
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
                await Promise.all([loadTasks(), loadStats()])
            } catch (error: unknown) {
                toast.add({ severity: 'error', summary: 'Error', detail: getErrorDetail(error, 'Failed to delete AI task') })
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
                const ids = selectedTasks.value.map((task) => task.id).join(',')
                await $fetch('/api/admin/ai/tasks', {
                    method: 'DELETE',
                    query: { ids },
                })
                toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
                selectedTasks.value = []
                await Promise.all([loadTasks(), loadStats()])
            } catch (error: unknown) {
                toast.add({ severity: 'error', summary: 'Error', detail: getErrorDetail(error, 'Failed to delete AI tasks') })
            }
        },
    })
}

onMounted(() => {
    void loadStats()
    void loadTasks()
})
</script>

<style lang="scss" scoped>
.admin-content {
    margin-top: 1.5rem;
}
</style>
