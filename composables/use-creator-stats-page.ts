import type { CreatorStatsResponse } from '@/types/creator-stats'

export function useCreatorStatsPage() {
    const { $appFetch } = useAppApi()
    const stats = ref<CreatorStatsResponse | null>(null)
    const loading = ref(false)
    const selectedRange = ref<7 | 30 | 90>(30)

    const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')

    async function fetchStats() {
        loading.value = true
        try {
            const data = await $appFetch<CreatorStatsResponse>('/api/admin/creator-stats', {
                query: {
                    range: String(selectedRange.value),
                    timezone: timezone.value,
                },
            })
            stats.value = data
        } finally {
            loading.value = false
        }
    }

    // Auto-load on mount and on filter change
    watch([selectedRange], () => {
        void fetchStats()
    }, { immediate: false })

    onMounted(() => {
        void fetchStats()
    })

    return {
        stats,
        loading,
        selectedRange,
        timezone,
        refresh: fetchStats,
    }
}
