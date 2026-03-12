import { useConfirm } from 'primevue/useconfirm'
import type {
    AIAdminStatsResponse,
    AIAdminTaskListFilters,
    AIAdminTaskListItem,
    AIAdminTaskListResponse,
    AICostDisplay,
} from '@/types/ai'

interface AdminAiPageEvent {
    page: number
    rows: number
}

export function useAdminAiPage() {
    const { t } = useI18n()
    const confirm = useConfirm()
    const { $appFetch } = useAppApi()
    const { showErrorToast, showSuccessToast } = useRequestFeedback()

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
            const response = await $appFetch<AIAdminStatsResponse>('/api/admin/ai/stats')
            stats.value = response
            costDisplay.value = response.costDisplay
        } catch (error: unknown) {
            showErrorToast(error, {
                fallbackKey: 'pages.admin.ai.feedback.load_stats_failed',
            })
        } finally {
            loadingStats.value = false
        }
    }

    const loadTasks = async () => {
        loadingTasks.value = true
        try {
            const response = await $appFetch<AIAdminTaskListResponse>('/api/admin/ai/tasks', {
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
            showErrorToast(error, {
                fallbackKey: 'pages.admin.ai.feedback.load_tasks_failed',
            })
        } finally {
            loadingTasks.value = false
        }
    }

    const refreshAll = async () => {
        await Promise.all([loadTasks(), loadStats()])
    }

    const deleteTasks = async (ids: string, successKey: string, fallbackKey: string) => {
        await $appFetch('/api/admin/ai/tasks', {
            method: 'DELETE',
            query: { ids },
        })
        showSuccessToast(successKey)
        await refreshAll()
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
                    await deleteTasks(task.id, 'pages.admin.ai.feedback.delete_task_success', 'pages.admin.ai.feedback.delete_task_failed')
                } catch (error: unknown) {
                    showErrorToast(error, {
                        fallbackKey: 'pages.admin.ai.feedback.delete_task_failed',
                    })
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
                    await deleteTasks(ids, 'pages.admin.ai.feedback.delete_tasks_success', 'pages.admin.ai.feedback.delete_tasks_failed')
                    selectedTasks.value = []
                } catch (error: unknown) {
                    showErrorToast(error, {
                        fallbackKey: 'pages.admin.ai.feedback.delete_tasks_failed',
                    })
                }
            },
        })
    }

    onMounted(() => {
        void refreshAll()
    })

    return {
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
        selectedTask,
        loadTasks,
        onPage,
        onFilterChange,
        showDetails,
        confirmDelete,
        confirmBulkDelete,
    }
}
