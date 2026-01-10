import { ref, reactive, onMounted, computed } from 'vue'

interface UseAdminListOptions<F> {
    url?: string
    fetchFn?: (params: any) => Promise<{ data: any[], total: number }>
    initialFilters?: F
    initialSort?: { field: string, order: 'asc' | 'desc' }
    initialPage?: number
    initialLimit?: number
}

export function useAdminList<T = any, F extends object = any>(options: UseAdminListOptions<F>) {
    const { url, fetchFn, initialFilters, initialSort, initialPage = 1, initialLimit = 10 } = options

    const items = ref<T[]>([])
    const total = ref(0)
    const page = ref(initialPage)
    const limit = ref(initialLimit)
    const loading = ref(false)
    const error = ref<any>(null)

    const filters = reactive({ ...(initialFilters || {}) }) as F
    const sort = reactive({
        field: initialSort?.field || 'createdAt',
        order: initialSort?.order || 'desc',
    })

    const load = async () => {
        loading.value = true
        error.value = null
        try {
            // 过滤掉 filters 中的 null, undefined 和空字符串
            const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    acc[key] = value
                }
                return acc
            }, {} as any)

            const params = {
                page: page.value,
                offset: (page.value - 1) * limit.value,
                limit: limit.value,
                orderBy: sort.field,
                order: sort.order.toUpperCase(),
                sortBy: sort.field,
                sortDirection: sort.order,
                ...cleanedFilters,
                scope: 'manage',
            }

            let dataItems: T[] = []
            let dataTotal = 0

            if (fetchFn) {
                const result = await fetchFn(params)
                dataItems = result.data
                dataTotal = result.total
            } else if (url) {
                const response = await $fetch<any>(url, { params })
                if (response.code === 200) {
                    dataItems = response.data.items || response.data.list
                    dataTotal = response.data.total
                } else {
                    error.value = response.message
                }
            }

            items.value = dataItems
            total.value = dataTotal
        } catch (e: any) {
            error.value = e.data?.statusMessage || e.message
        } finally {
            loading.value = false
        }
    }

    const onPage = (event: any) => {
        page.value = event.page + 1
        limit.value = event.rows
        load()
    }

    const onSort = (event: any) => {
        sort.field = event.sortField
        sort.order = event.sortOrder === 1 ? 'asc' : 'desc'
        load()
    }

    const onFilterChange = () => {
        page.value = 1
        load()
    }

    const resetFilters = () => {
        Object.assign(filters, initialFilters || {})
        page.value = 1
        load()
    }

    const pagination = computed(() => ({
        page: page.value,
        limit: limit.value,
        total: total.value,
    }))

    // Initialize
    onMounted(() => {
        load()
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
