import type {
    AdminContentInsightsRange,
    AdminContentInsightsResponse,
    AdminContentInsightsScope,
} from '@/types/admin-content-insights'
import { normalizeOptionalString } from '@/utils/shared/coerce'

const DEFAULT_RANGE: AdminContentInsightsRange = 30
const DEFAULT_SCOPE: AdminContentInsightsScope = 'all'

const resolveBrowserTimeZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
        return 'UTC'
    }
}

export function useAdminContentInsightsPage() {
    const { t, locale } = useI18n()
    const { $appFetch } = useAppApi()
    const { contentLanguage } = useAdminI18n()
    const { showErrorToast } = useRequestFeedback()

    const dashboard = ref<AdminContentInsightsResponse | null>(null)
    const loading = ref(false)
    const selectedRange = ref<AdminContentInsightsRange>(DEFAULT_RANGE)
    const scope = ref<AdminContentInsightsScope>(DEFAULT_SCOPE)
    const timezone = ref('UTC')

    const scopeOptions = computed(() => [
        {
            label: t('pages.admin.dashboard.scopes.all'),
            value: 'all' as const,
        },
        {
            label: t('pages.admin.dashboard.scopes.public'),
            value: 'public' as const,
        },
    ])

    const selectedSummary = computed(() => dashboard.value?.summaries.find((item) => item.days === selectedRange.value) || null)

    const load = async () => {
        loading.value = true

        try {
            const normalizedContentLanguage = normalizeOptionalString(contentLanguage.value)

            dashboard.value = await $appFetch<AdminContentInsightsResponse>('/api/admin/content-insights', {
                query: {
                    range: selectedRange.value,
                    scope: scope.value,
                    contentLanguage: normalizedContentLanguage || undefined,
                    language: locale.value,
                    timezone: timezone.value,
                },
            })
        } catch (error: unknown) {
            showErrorToast(error, {
                fallbackKey: 'pages.admin.dashboard.feedback.load_failed',
            })
        } finally {
            loading.value = false
        }
    }

    watch([selectedRange, scope, contentLanguage, locale], () => {
        void load()
    })

    onMounted(() => {
        timezone.value = resolveBrowserTimeZone()
        void load()
    })

    return {
        dashboard,
        loading,
        selectedRange,
        selectedSummary,
        scope,
        scopeOptions,
        timezone,
        refresh: load,
    }
}
