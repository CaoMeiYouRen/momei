import logger from '@/server/utils/logger'
import type { ExternalFeedSourceConfig } from '@/types/external-feed'

export type ExternalFeedFailureCategory = 'network_error' | 'upstream_4xx' | 'upstream_error'

export interface ExternalFeedFetchError extends Error {
    category: ExternalFeedFailureCategory
    httpStatus: number | null
}

function createExternalFeedFetchError(message: string, category: ExternalFeedFailureCategory, httpStatus: number | null = null): ExternalFeedFetchError {
    const error = new Error(message) as ExternalFeedFetchError
    error.category = category
    error.httpStatus = httpStatus
    return error
}

export async function fetchExternalFeedSource(source: ExternalFeedSourceConfig) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), source.timeoutMs ?? 5000)

    try {
        const response = await fetch(source.sourceUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
                'User-Agent': 'MomeiBot/1.0 (+https://momei.app)',
            },
        })

        if (!response.ok) {
            throw createExternalFeedFetchError(
                `External feed request failed with HTTP ${response.status}`,
                response.status >= 400 && response.status < 500 ? 'upstream_4xx' : 'upstream_error',
                response.status,
            )
        }

        return await response.text()
    } catch (error) {
        if (error instanceof Error && 'category' in error) {
            throw error
        }

        const fetchError = createExternalFeedFetchError(
            error instanceof Error ? error.message : 'Unknown external feed fetch error',
            'network_error',
            null,
        )

        logger.warn('[external-feed] fetch failed', {
            sourceId: source.id,
            sourceUrl: source.sourceUrl,
            category: fetchError.category,
            httpStatus: fetchError.httpStatus,
            message: fetchError.message,
        })

        throw fetchError
    } finally {
        clearTimeout(timeoutId)
    }
}
