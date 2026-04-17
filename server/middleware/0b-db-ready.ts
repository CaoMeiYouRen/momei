import { defineEventHandler, getRequestURL, type H3Event } from 'h3'
import logger from '@/server/utils/logger'

const STATIC_ASSET_PATTERN = /\.(?:css|js|mjs|map|png|jpe?g|gif|svg|ico|woff2?|ttf|eot|webp|avif|txt|webmanifest)$/i
const INSTALLATION_PAGE_PATTERN = /^(?:\/[a-z]{2}-[A-Z]{2})?\/installation(?:\/|$)/

function normalizePathname(pathname: string) {
    return pathname.split('?')[0] || '/'
}

export function shouldWarmupDatabase(pathname: string) {
    const normalizedPath = normalizePathname(pathname)

    if (INSTALLATION_PAGE_PATTERN.test(normalizedPath) || normalizedPath.startsWith('/api/install')) {
        return false
    }

    if (normalizedPath.startsWith('/_nuxt') || normalizedPath.startsWith('/uploads') || normalizedPath.startsWith('/favicon')) {
        return false
    }

    if (normalizedPath.startsWith('/feed') || normalizedPath.startsWith('/api') || normalizedPath.startsWith('/.well-known') || normalizedPath.startsWith('/sitemap')) {
        return true
    }

    return !STATIC_ASSET_PATTERN.test(normalizedPath)
}

export async function ensureRequestDatabaseReady(event: H3Event) {
    const { pathname } = getRequestURL(event)

    if (!shouldWarmupDatabase(pathname)) {
        return
    }

    const { dataSource, initializeDB } = await import('@/server/database')

    if (dataSource.isInitialized) {
        return
    }

    await initializeDB()

    if (!dataSource.isInitialized) {
        logger.warn(`[DBReady] Database warmup did not finish before handling ${pathname}`)
    }
}

export default defineEventHandler(ensureRequestDatabaseReady)
