import { computed, unref, type ComputedRef, type Ref } from 'vue'
import { type UseFetchOptions } from '#app'
import type { ApiResponse } from '@/types/api'

type MaybeReactive<T> = T | Ref<T> | ComputedRef<T>

type AppQueryScalar = string | number | boolean | null | undefined

type AppQueryValue = AppQueryScalar | MaybeReactive<AppQueryScalar>

type AppQueryRecord = Record<string, AppQueryValue>

type AppFetchResponse<T> = T extends void ? unknown : T

type AppFetchOptions<T> = Omit<UseFetchOptions<AppFetchResponse<T>>, 'query'> & {
    query?: MaybeReactive<AppQueryRecord | undefined>
}

type AppApiFetchOptions = Omit<NonNullable<Parameters<typeof $fetch>[1]>, 'query'> & {
    query?: MaybeReactive<AppQueryRecord | undefined>
}

function resolveQueryRecord(query?: MaybeReactive<AppQueryRecord | undefined>) {
    const baseQuery = unref(query) || {}
    const params: Record<string, AppQueryScalar> = {}

    for (const [key, value] of Object.entries(baseQuery)) {
        params[key] = unref(value as MaybeReactive<AppQueryScalar>)
    }

    return params
}

/**
 * A wrapper around useFetch that automatically appends the current language to the query.
 * This ensures that the data fetched matches the current UI locale.
 */
export function useAppFetch<T = ApiResponse<unknown>>(
    url: string | (() => string),
    options: AppFetchOptions<T> = {},
) {
    const { locale } = useI18n()

    const baseOptions = options as Omit<UseFetchOptions<AppFetchResponse<T>>, 'query'>

    const mergedOptions: UseFetchOptions<AppFetchResponse<T>> = {
        ...baseOptions,
        query: computed(() => {
            const params = resolveQueryRecord(options.query)

            return {
                language: locale.value,
                ...params,
            }
        }) as UseFetchOptions<AppFetchResponse<T>>['query'],
    }

    return useFetch<AppFetchResponse<T>>(url, mergedOptions as never)
}

/**
 * A wrapper around $fetch that automatically appends the current language to the query.
 * Useful for imperative calls.
 */
export function useAppApi() {
    const { locale } = useI18n()

    const $appFetch = <T = ApiResponse<unknown>>(url: string, options: AppApiFetchOptions = {}) => {
        const params = resolveQueryRecord(options.query)

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
