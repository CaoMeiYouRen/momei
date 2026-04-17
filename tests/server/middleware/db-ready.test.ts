import { beforeEach, describe, expect, it, vi } from 'vitest'

const initializeDB = vi.fn(() => Promise.resolve(undefined))
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
        warn: vi.fn(),
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

        await ensureRequestDatabaseReady(createEvent('/sitemap.xml'))
        await ensureRequestDatabaseReady(createEvent('/.well-known/webfinger?resource=acct:test@example.com'))

        expect(initializeDB).toHaveBeenCalledTimes(2)
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
        expect(shouldWarmupDatabase('/_nuxt/app.js')).toBe(false)

        await ensureRequestDatabaseReady(createEvent('/zh-CN/installation'))
        await ensureRequestDatabaseReady(createEvent('/ja-JP/installation'))
        await ensureRequestDatabaseReady(createEvent('/api/install/status'))
        await ensureRequestDatabaseReady(createEvent('/robots.txt'))
        await ensureRequestDatabaseReady(createEvent('/_nuxt/app.js'))

        expect(initializeDB).not.toHaveBeenCalled()
    })

    it('should not re-run initialization for an already initialized data source', async () => {
        dataSourceState.isInitialized = true

        await ensureRequestDatabaseReady(createEvent('/feed.atom'))

        expect(initializeDB).not.toHaveBeenCalled()
    })
})
