import { defineEventHandler, getRequestURL, type H3Event } from 'h3'

let dbReadyLoggerPromise: Promise<typeof import('@/server/utils/logger').default> | null = null

async function getDbReadyLogger() {
    dbReadyLoggerPromise ??= import('@/server/utils/logger').then((module) => module.default)
    return dbReadyLoggerPromise
}

const INSTALLATION_PAGE_PATTERN = /^(?:\/[a-z]{2}-[A-Z]{2})?\/installation(?:\/|$)/
const LAZY_PUBLIC_ROUTE_PATTERNS = [
    /^\/api\/settings\/public\/?$/,
    /^\/api\/posts\/home\/?$/,
    /^\/api\/categories\/?$/,
    /^\/api\/tags\/?$/,
]
const PERMISSION_GATED_ROUTE_PREFIXES = [
    '/api/admin',
    '/api/user',
    '/api/upload',
    '/api/notifications',
]

function normalizePathname(pathname: string) {
    return pathname.split('?')[0] || '/'
}

export function shouldWarmupDatabase(pathname: string) {
    const normalizedPath = normalizePathname(pathname)

    if (INSTALLATION_PAGE_PATTERN.test(normalizedPath) || normalizedPath.startsWith('/api/install')) {
        return false
    }

    if (LAZY_PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(normalizedPath))) {
        return false
    }

    if (PERMISSION_GATED_ROUTE_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
        return false
    }

    if (normalizedPath.startsWith('/_nuxt') || normalizedPath.startsWith('/uploads') || normalizedPath.startsWith('/favicon')) {
        return false
    }

    if (
        normalizedPath.startsWith('/feed')
        || normalizedPath.startsWith('/api')
        || normalizedPath.startsWith('/llms')
        || normalizedPath.startsWith('/.well-known')
        || normalizedPath.startsWith('/sitemap')
        || normalizedPath.startsWith('/fed')
    ) {
        return true
    }

    return false
}

export async function ensureRequestDatabaseReady(event: H3Event) {
    const { pathname } = getRequestURL(event)

    if (!shouldWarmupDatabase(pathname)) {
        return
    }

    const { dataSource, initializeDatabaseConnection } = await import('@/server/database')

    if (dataSource.isInitialized) {
        return
    }

    await initializeDatabaseConnection()

    if (!dataSource.isInitialized) {
        const logger = await getDbReadyLogger()
        logger.warn(`[DBReady] Database warmup did not finish before handling ${pathname}`)
    }
}

export default defineEventHandler(ensureRequestDatabaseReady)
