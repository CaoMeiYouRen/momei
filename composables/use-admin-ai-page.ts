import { useConfirm } from 'primevue/useconfirm'
import type { ApiResponse } from '@/types/api'
import type {
    AIAdminStatsResponse,
    AIAdminTaskDetailItem,
    AIAdminTaskListFilters,
    AIAdminTaskListItem,
    AIAdminTaskListResponse,
    AITaskDetailResponse,
    AICostDisplay,
} from '@/types/ai'

export interface AdminAiPageEvent {
    page: number
    rows: number
}

interface UseAdminAiPageOptions {
    /**
     * `page-change` 事件里 `page` 的页码基准。
     *
     * - `0`（默认）：PrimeVue `DataTable` 的 `@page` 为 **0 基**（`pageIndex`），内部 `+1` 归一为 1 基；
     * - `1`：caomei-ui `DataTable` 的 `@page` 为 **1 基**，无需再抬升。
     *
     * 与 `composables/use-admin-list.ts` 的 `pageIndexBase` 同口径：迁移期同一 composable 服务两套组件库，
     * 页面侧不得各写一份「减一」包装。
     */
    pageIndexBase?: 0 | 1
}

export function useAdminAiPage(options: UseAdminAiPageOptions = {}) {
    const { pageIndexBase = 0 } = options

    const { t } = useI18n()
    const confirm = useConfirm()
    const { $appFetch } = useAppApi()
    const { resolveErrorMessage, showErrorToast, showSuccessToast } = useRequestFeedback()

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
    const loadingTaskDetails = ref(false)
    const taskDetailsError = ref<string | null>(null)
    const selectedTask = ref<AIAdminTaskDetailItem | null>(null)
    const taskDetailsRequestToken = ref(0)

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

    const deleteTasks = async (ids: string, successKey: string) => {
        await $appFetch('/api/admin/ai/tasks', {
            method: 'DELETE',
            query: { ids },
        })
        showSuccessToast(successKey)
        await refreshAll()
    }

    const onPage = (event: AdminAiPageEvent) => {
        page.value = event.page + (pageIndexBase === 1 ? 0 : 1)
        pageSize.value = event.rows
        void loadTasks()
    }

    const onFilterChange = () => {
        page.value = 1
        void loadTasks()
    }

    const showDetails = async (task: AIAdminTaskListItem) => {
        taskDetailsRequestToken.value += 1
        const requestToken = taskDetailsRequestToken.value

        detailsVisible.value = true
        loadingTaskDetails.value = true
        taskDetailsError.value = null
        selectedTask.value = null

        try {
            const response = await $appFetch<ApiResponse<AITaskDetailResponse>>(`/api/ai/tasks/${task.id}`)

            if (taskDetailsRequestToken.value !== requestToken) {
                return
            }

            const detail = response.data?.item

            if (!detail) {
                const error = new Error('AI task detail response is empty')
                const resolvedErrorMessage = resolveErrorMessage(error, {
                    fallbackKey: 'pages.admin.ai.feedback.load_tasks_failed',
                })

                taskDetailsError.value = resolvedErrorMessage
                showErrorToast(error, {
                    fallbackKey: 'pages.admin.ai.feedback.load_tasks_failed',
                })
                return
            }

            selectedTask.value = detail
            costDisplay.value = response.data?.costDisplay || costDisplay.value
        } catch (error: unknown) {
            if (taskDetailsRequestToken.value !== requestToken) {
                return
            }

            taskDetailsError.value = resolveErrorMessage(error, {
                fallbackKey: 'pages.admin.ai.feedback.load_tasks_failed',
            })
            showErrorToast(error, {
                fallbackKey: 'pages.admin.ai.feedback.load_tasks_failed',
            })
        } finally {
            if (taskDetailsRequestToken.value === requestToken) {
                loadingTaskDetails.value = false
            }
        }
    }

    const confirmDeleteTask = (task: AIAdminTaskListItem) => {
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
            accept: () => {
                void (async () => {
                    try {
                        await deleteTasks(task.id, 'pages.admin.ai.feedback.delete_task_success')
                    } catch (error: unknown) {
                        showErrorToast(error, {
                            fallbackKey: 'pages.admin.ai.feedback.delete_task_failed',
                        })
                    }
                })()
            },
        })
    }

    const confirmBulkDelete = () => {
        confirm.require({
            message: t('pages.admin.ai.delete_confirm'),
            header: t('common.confirm_delete'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                void (async () => {
                    try {
                        const ids = selectedTasks.value.map((task) => task.id).join(',')
                        await deleteTasks(ids, 'pages.admin.ai.feedback.delete_tasks_success')
                        selectedTasks.value = []
                    } catch (error: unknown) {
                        showErrorToast(error, {
                            fallbackKey: 'pages.admin.ai.feedback.delete_tasks_failed',
                        })
                    }
                })()
            },
        })
    }

    onMounted(() => {
        void refreshAll()
    })

    watch(detailsVisible, (visible) => {
        if (visible) {
            return
        }

        taskDetailsRequestToken.value += 1
        loadingTaskDetails.value = false
        taskDetailsError.value = null
        selectedTask.value = null
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
        confirmDelete: confirmDeleteTask,
        confirmBulkDelete,
    }
}
