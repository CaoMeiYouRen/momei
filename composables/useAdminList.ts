import { ref, reactive, onMounted } from 'vue'

interface UseAdminListOptions<T, F> {
    url: string
    initialFilters?: F
    initialPage?: number
    initialLimit?: number
}

export function useAdminList<T = any, F extends object = any>(options: UseAdminListOptions<T, F>) {
    const { url, initialFilters, initialPage = 1, initialLimit = 10 } = options

    const items = ref<T[]>([])
    const total = ref(0)
    const page = ref(initialPage)
    const limit = ref(initialLimit)
    const pending = ref(false)
    const error = ref<any>(null)

    const filters = reactive({ ...(initialFilters || {}) }) as F

    const load = async () => {
        pending.value = true
        error.value = null
        try {
            const query = {
                page: page.value,
                limit: limit.value,
                ...filters,
                scope: 'manage',
            }

            const response = await $fetch<any>(url, { params: query })
            if (response.code === 200) {
                items.value = response.data.items
                total.value = response.data.total
            } else {
                error.value = response.message
            }
        } catch (e: any) {
            error.value = e.data?.statusMessage || e.message
        } finally {
            pending.value = false
        }
    }

    const onPage = (event: any) => {
        page.value = event.page + 1
        limit.value = event.rows
        load()
    }

    const resetFilters = () => {
        Object.assign(filters, initialFilters || {})
        page.value = 1
        load()
    }

    // Initialize
    onMounted(() => {
        load()
    })

    // Watch filters if needed, or trigger manually
    // watch(() => filters, () => { page.value = 1; load() }, { deep: true })

    return {
        items,
        total,
        page,
        limit,
        pending,
        error,
        filters,
        load,
        onPage,
        resetFilters,
    }
}
