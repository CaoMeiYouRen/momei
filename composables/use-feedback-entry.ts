interface UseFeedbackEntryOptions {
    includeAdmin?: boolean
}

function normalizeFeedbackRoutePath(path: string, localeCodes: readonly string[]) {
    if (!path) {
        return '/'
    }

    const normalizedSource = path.startsWith('/') ? path : `/${path}`
    const segments = normalizedSource.split('/')
    const firstSegment = segments[1]
    const strippedLocalePath = firstSegment && localeCodes.includes(firstSegment)
        ? `/${segments.slice(2).join('/')}`
        : normalizedSource

    if (!strippedLocalePath || strippedLocalePath === '//') {
        return '/'
    }

    if (strippedLocalePath.length > 1 && strippedLocalePath.endsWith('/')) {
        return strippedLocalePath.slice(0, -1)
    }

    return strippedLocalePath
}

export function useFeedbackEntry(options: UseFeedbackEntryOptions = {}) {
    const route = useRoute()
    const localePath = useLocalePath()
    const { availableLocales } = useI18n()
    const localeCodes = availableLocales as readonly string[]

    const normalizedRoutePath = computed(() => normalizeFeedbackRoutePath(route.path, localeCodes))
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
