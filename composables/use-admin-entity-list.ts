interface UseAdminEntityListOptions<TItem> {
    loadItems: () => Promise<TItem[]>
}

export function useAdminEntityList<TItem>(options: UseAdminEntityListOptions<TItem>) {
    const items = ref<TItem[]>([])
    const loading = ref(true)

    const refresh = async () => {
        loading.value = true
        try {
            items.value = await options.loadItems()
        } catch {
            // Preserve the last successful result when a refresh fails.
        } finally {
            loading.value = false
        }
    }

    onMounted(() => {
        void refresh()
    })

    return {
        items,
        loading,
        refresh,
    }
}
