import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    dataSourceState,
    initializeDatabaseConnection,
    initializeDB,
    getInstallationStatus,
    loggerInfo,
    runtimeCache,
    setRuntimeCache,
    sendRedirect,
} = vi.hoisted(() => ({
    dataSourceState: {
        isInitialized: false,
    },
    initializeDatabaseConnection: vi.fn(() => Promise.resolve(undefined)),
    initializeDB: vi.fn(() => Promise.resolve(undefined)),
    getInstallationStatus: vi.fn(() => Promise.resolve({
        installed: true,
        databaseConnected: true,
    })),
    loggerInfo: vi.fn(),
    runtimeCache: new Map<string, unknown>(),
    setRuntimeCache: vi.fn((key: string, value: unknown) => {
        runtimeCache.set(key, value)
    }),
    sendRedirect: vi.fn((_event: unknown, location: string, statusCode: number) => ({
        location,
        statusCode,
    })),
}))

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')

    return {
        ...actual,
        defineEventHandler: (handler: unknown) => handler,
        createError: (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input),
        sendRedirect,
    }
})

vi.mock('~/server/database', () => ({
    dataSource: {
        get isInitialized() {
            return dataSourceState.isInitialized
        },
    },
    initializeDatabaseConnection,
    initializeDB,
}))

vi.mock('~/server/services/installation', () => ({
    getInstallationStatus,
}))

vi.mock('@/server/utils/runtime-cache', () => ({
    getRuntimeCache: vi.fn((key: string) => runtimeCache.get(key)),
    setRuntimeCache,
}))

vi.mock('~/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
        info: loggerInfo,
    },
}))

vi.mock('@/utils/shared/env', () => ({
    TEST_MODE: false,
}))

import installationMiddleware from '@/server/middleware/0-installation'

function createEvent(path: string) {
    return {
        path,
        context: {},
        headers: {},
    } as any
}

describe('installation middleware state probe', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        runtimeCache.clear()
        dataSourceState.isInitialized = false
    })

    it('should only initialize the database connection for the homepage installation probe', async () => {
        await installationMiddleware(createEvent('/'))

        expect(initializeDatabaseConnection).toHaveBeenCalledTimes(1)
        expect(initializeDB).not.toHaveBeenCalled()
        expect(setRuntimeCache).toHaveBeenCalledWith(
            'installation:status',
            {
                installed: true,
                databaseConnected: true,
            },
            600,
        )
        expect(loggerInfo.mock.calls.map(([message]) => message)).toEqual(expect.arrayContaining([
            expect.stringContaining('[momei-perf] scope=installation-probe stage=database-connection durationMs='),
            expect.stringContaining('[momei-perf] scope=installation-probe stage=installation-status durationMs='),
            expect.stringContaining('[momei-perf] scope=installation-probe stage=total durationMs='),
        ]))
    })

    it('should keep public settings requests on the connection-only probe path', async () => {
        await installationMiddleware(createEvent('/api/settings/public'))

        expect(initializeDatabaseConnection).toHaveBeenCalledTimes(1)
        expect(initializeDB).not.toHaveBeenCalled()
    })
})
