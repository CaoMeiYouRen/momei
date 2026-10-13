import { ref, onMounted, computed, watch, type Ref } from 'vue'
import { useAdminI18n } from './use-admin-i18n'
import type { ApiResponse } from '@/types/api'

export type AdminListFilterValue = string | number | boolean | null | undefined

type AdminListFilters = Record<string, AdminListFilterValue>

type AdminListError = string | null

interface AdminListFetchResult<T> {
    data: T[]
    total: number
}

interface AdminListResponseData<T> {
    items?: T[]
    list?: T[]
    total: number
}

interface AdminListRequestParams {
    page: number
    offset: number
    limit: number
    orderBy: string
    order: 'ASC' | 'DESC'
    sortBy: string
    sortDirection: 'asc' | 'desc'
    language?: string
    scope: 'manage'
}

interface AdminPageEvent {
    page: number
    rows: number
}

interface AdminSortEvent {
    sortField?: string | ((item: unknown) => string)
    sortOrder: number | null | undefined
}

interface UseAdminListOptions<T, F extends AdminListFilters> {
    url?: string
    fetchFn?: (params: AdminListRequestParams & F) => Promise<AdminListFetchResult<T>>
    initialFilters?: F
    initialSort?: { field: string, order: 'asc' | 'desc' }
    initialPage?: number
    initialLimit?: number
    /**
     * `onPage` 收到的 `event.page` 的页码基准。
     *
     * - `0`（默认）：PrimeVue `DataTable` 的 `@page` 为**0 基**（`pageIndex`），故内部做 `+1` 归一为 1 基。
     * - `1`：caomei-ui `DataTable` 的 `@page` 为**1 基**（`pageIndex + 1`），无需再抬升。
     *
     * 迁移期同一 composable 会同时服务两套组件库，故以显式选项区分，避免页面侧各写一份「减一」包装
     * （见迁移方案 §5.5：路由内组件来源唯一，但共享 composable 需同时兼容两侧事件语义）。
     */
    pageIndexBase?: 0 | 1
}

function getErrorDetail(error: unknown): AdminListError {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || null
}

function hasAggregateFilter(filters: AdminListFilters) {
    return filters.aggregate === true
}

export function useAdminList<T = unknown, F extends AdminListFilters = AdminListFilters>(options: UseAdminListOptions<T, F>) {
    const { url, fetchFn, initialFilters, initialSort, initialPage = 1, initialLimit = 10, pageIndexBase = 0 } = options
    const { contentLanguage } = useAdminI18n()
    const { locale } = useI18n()

    const items = ref<T[]>([])
    const total = ref(0)
    const page = ref(initialPage)
    const limit = ref(initialLimit)
    const loading = ref(false)
    const error = ref<AdminListError>(null)

    const filters = ref(initialFilters ?? {}) as Ref<F>
    const sort = ref({
        field: initialSort?.field || 'createdAt',
        order: initialSort?.order || 'desc',
    })

    const load = async () => {
        loading.value = true
        error.value = null
        try {
            // 过滤掉 filters 中的 null, undefined 和空字符串
            const cleanedFilters = Object.entries(filters.value).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    acc[key] = value
                }
                return acc
            }, {} as Record<string, AdminListFilterValue>)

            const params = {
                page: page.value,
                offset: (page.value - 1) * limit.value,
                limit: limit.value,
                orderBy: sort.value.field,
                order: sort.value.order === 'asc' ? 'ASC' : 'DESC',
                sortBy: sort.value.field,
                sortDirection: sort.value.order,
                ...cleanedFilters,
                language: contentLanguage.value || (hasAggregateFilter(filters.value) ? locale.value : undefined),
                scope: 'manage',
            } as AdminListRequestParams & F

            let dataItems: T[] = []
            let dataTotal = 0

            if (fetchFn) {
                const result = await fetchFn(params)
                dataItems = result.data
                dataTotal = result.total
            } else if (url) {
                const response = await $fetch<ApiResponse<AdminListResponseData<T>>>(url, { params })
                if (response.code === 200) {
                    dataItems = response.data.items || response.data.list || []
                    dataTotal = response.data.total
                } else {
                    error.value = response.message || null
                }
            }

            items.value = dataItems
            total.value = dataTotal
        } catch (caughtError) {
            error.value = getErrorDetail(caughtError)
        } finally {
            loading.value = false
        }
    }

    const onPage = (event: AdminPageEvent) => {
        page.value = event.page + (pageIndexBase === 1 ? 0 : 1)
        limit.value = event.rows
        void load()
    }

    const onSort = (event: AdminSortEvent) => {
        if (typeof event.sortField !== 'string' || !event.sortField) {
            return
        }

        sort.value.field = event.sortField
        sort.value.order = event.sortOrder === 1 ? 'asc' : 'desc'
        void load()
    }

    const onFilterChange = () => {
        page.value = 1
        void load()
    }

    const resetFilters = () => {
        Object.assign(filters.value, initialFilters || {})
        page.value = 1
        void load()
    }

    const pagination = computed(() => ({
        page: page.value,
        limit: limit.value,
        total: total.value,
    }))

    // Watch for content language changes
    watch(contentLanguage, () => {
        page.value = 1
        void load()
    })

    // Watch for global UI language changes (only when "All Languages" is selected and aggregation is on)
    watch(locale, () => {
        if (contentLanguage.value === null && hasAggregateFilter(filters.value)) {
            void load()
        }
    })

    // Initialize
    onMounted(() => {
        void load()
    })

    return {
        items,
        loading,
        error,
        filters,
        sort,
        pagination,
        refresh: load,
        onPage,
        onSort,
        onFilterChange,
        resetFilters,
    }
}
