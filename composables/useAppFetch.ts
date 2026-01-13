import { computed, unref } from 'vue'
import { type UseFetchOptions } from '#app'

/**
 * A wrapper around useFetch that automatically appends the current language to the query.
 * This ensures that the data fetched matches the current UI locale.
 */
export function useAppFetch<T = any>(
    url: string | (() => string),
    options: UseFetchOptions<T> = {},
) {
    const { locale } = useI18n()

    const mergedOptions = {
        ...options,
        query: computed(() => {
            const baseQuery = unref(options.query) || {}
            return {
                language: locale.value,
                ...baseQuery,
            }
        }),
    }

    return useFetch<T>(url, mergedOptions as any)
}

/**
 * A wrapper around $fetch that automatically appends the current language to the query.
 * Useful for imperative calls.
 */
export function useAppApi() {
    const { locale } = useI18n()

    const $appFetch = <T = any>(url: string, options: any = {}) => {
        const query = {
            language: locale.value,
            ...options.query,
        }
        return $fetch<T>(url, {
            ...options,
            query,
        })
    }

    return {
        $appFetch,
    }
}
