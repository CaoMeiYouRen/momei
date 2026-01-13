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
            const params: Record<string, any> = { ...baseQuery }

            // Unref each property to ensure reactive values are correctly resolved
            // before being passed to the API.
            for (const key in params) {
                params[key] = unref(params[key])
            }

            return {
                language: locale.value,
                ...params,
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
        const rawQuery = unref(options.query) || {}
        const params: Record<string, any> = { ...rawQuery }

        for (const key in params) {
            params[key] = unref(params[key])
        }

        const query = {
            language: locale.value,
            ...params,
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
