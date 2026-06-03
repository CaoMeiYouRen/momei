import { normalizeRoutePath } from '@/utils/shared/route-path'

interface UseFeedbackEntryOptions {
    includeAdmin?: boolean
}

export function useFeedbackEntry(options: UseFeedbackEntryOptions = {}) {
    const route = useRoute()
    const localePath = useLocalePath()
    const { availableLocales } = useI18n()
    const localeCodes = availableLocales as readonly string[]

    const normalizedRoutePath = computed(() => normalizeRoutePath(route.path, localeCodes))
    const feedbackPath = computed(() => localePath('/feedback'))
    const isFeedbackRoute = computed(() => normalizedRoutePath.value === '/feedback')
    const isAdminRoute = computed(() => normalizedRoutePath.value === '/admin' || normalizedRoutePath.value.startsWith('/admin/'))

    const shouldShowFeedbackEntry = computed(() => {
        if (isFeedbackRoute.value) {
            return false
        }

        if (!options.includeAdmin && isAdminRoute.value) {
            return false
        }

        return true
    })

    const openFeedbackEntry = async () => {
        await navigateTo(feedbackPath.value)
    }

    return {
        feedbackPath,
        isAdminRoute,
        isFeedbackRoute,
        normalizedRoutePath,
        openFeedbackEntry,
        shouldShowFeedbackEntry,
    }
}
