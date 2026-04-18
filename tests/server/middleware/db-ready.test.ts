import { beforeEach, describe, expect, it, vi } from 'vitest'

const initializeDB = vi.fn(() => Promise.resolve(undefined))
const loggerWarn = vi.fn()
const dataSourceState = {
    isInitialized: false,
}

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')

    return {
        ...actual,
        defineEventHandler: (handler: unknown) => handler,
        getRequestURL: (event: { url?: string }) => new URL(event.url || 'http://localhost/'),
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        get isInitialized() {
            return dataSourceState.isInitialized
        },
    },
    initializeDB,
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        warn: loggerWarn,
        error: vi.fn(),
    },
}))

import { ensureRequestDatabaseReady, shouldWarmupDatabase } from '@/server/middleware/0b-db-ready'

function createEvent(path: string) {
    return {
        url: `http://localhost${path}`,
    } as any
}

describe('db ready middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        dataSourceState.isInitialized = false
    })

    it('should warm up feed routes even when they use json or xml suffixes', async () => {
        expect(shouldWarmupDatabase('/feed.xml')).toBe(true)
        expect(shouldWarmupDatabase('/feed.json')).toBe(true)

        await ensureRequestDatabaseReady(createEvent('/feed.xml'))

        expect(initializeDB).toHaveBeenCalledTimes(1)
    })

    it('should warm up public friend-links api routes before handlers access repositories', async () => {
        await ensureRequestDatabaseReady(createEvent('/api/friend-links?featured=true'))

        expect(initializeDB).toHaveBeenCalledTimes(1)
    })

    it('should warm up anonymous metadata routes such as sitemap and webfinger', async () => {
        expect(shouldWarmupDatabase('/sitemap.xml')).toBe(true)
        expect(shouldWarmupDatabase('/.well-known/webfinger')).toBe(true)
        expect(shouldWarmupDatabase('/fed/actor/test-user')).toBe(true)

        await ensureRequestDatabaseReady(createEvent('/sitemap.xml'))
        await ensureRequestDatabaseReady(createEvent('/.well-known/webfinger?resource=acct:test@example.com'))
        await ensureRequestDatabaseReady(createEvent('/fed/actor/test-user'))

        expect(initializeDB).toHaveBeenCalledTimes(3)
    })

    it('should skip installation and static asset requests', async () => {
        expect(shouldWarmupDatabase('/installation')).toBe(false)
        expect(shouldWarmupDatabase('/zh-CN/installation')).toBe(false)
        expect(shouldWarmupDatabase('/en-US/installation/step-1')).toBe(false)
        expect(shouldWarmupDatabase('/zh-TW/installation')).toBe(false)
        expect(shouldWarmupDatabase('/ko-KR/installation')).toBe(false)
        expect(shouldWarmupDatabase('/ja-JP/installation')).toBe(false)
        expect(shouldWarmupDatabase('/api/install/status')).toBe(false)
        expect(shouldWarmupDatabase('/robots.txt')).toBe(false)
        expect(shouldWarmupDatabase('/')).toBe(false)
        expect(shouldWarmupDatabase('/posts')).toBe(false)
        expect(shouldWarmupDatabase('/_nuxt/app.js')).toBe(false)
        expect(shouldWarmupDatabase('/uploads/avatar.webp')).toBe(false)
        expect(shouldWarmupDatabase('/favicon.ico')).toBe(false)

        await ensureRequestDatabaseReady(createEvent('/zh-CN/installation'))
        await ensureRequestDatabaseReady(createEvent('/ja-JP/installation'))
        await ensureRequestDatabaseReady(createEvent('/api/install/status'))
        await ensureRequestDatabaseReady(createEvent('/robots.txt'))
        await ensureRequestDatabaseReady(createEvent('/'))
        await ensureRequestDatabaseReady(createEvent('/posts'))
        await ensureRequestDatabaseReady(createEvent('/_nuxt/app.js'))
        await ensureRequestDatabaseReady(createEvent('/uploads/avatar.webp'))
        await ensureRequestDatabaseReady(createEvent('/favicon.ico'))

        expect(initializeDB).not.toHaveBeenCalled()
    })

    it('should not re-run initialization for an already initialized data source', async () => {
        dataSourceState.isInitialized = true

        await ensureRequestDatabaseReady(createEvent('/feed.atom'))

        expect(initializeDB).not.toHaveBeenCalled()
    })

    it('should warn when initialization still leaves the data source unavailable', async () => {
        initializeDB.mockImplementationOnce(async () => {
            dataSourceState.isInitialized = false
        })

        await ensureRequestDatabaseReady(createEvent('/api/posts'))

        expect(initializeDB).toHaveBeenCalledTimes(1)
        expect(loggerWarn).toHaveBeenCalledWith('[DBReady] Database warmup did not finish before handling /api/posts')
    })
})
