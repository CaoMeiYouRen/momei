// testSetup.ts
import { vi } from 'vitest'
import { createLegacyToastApi, createLegacyConfirmApi } from '@/tests/helpers/caomei-service-mocks'

// 设置环境变量
// process.env.NODE_ENV = 'test';
// process.env.BETTER_AUTH_TRUSTED_ORIGINS = 'http://localhost:3000';
// process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test_db';

// 强制测试环境使用内存数据库
vi.stubEnv('DATABASE_TYPE', 'sqlite')
vi.stubEnv('DATABASE_PATH', ':memory:')
vi.stubEnv('NODE_ENV', 'test')

const globalTestSetupState = globalThis as typeof globalThis & {
    __momeiVitestUnhandledRejectionHandlerInstalled__?: boolean
}

// setupFiles 会在同一 worker 的每个测试文件前重复执行，监听器只能注册一次。
if (!globalTestSetupState.__momeiVitestUnhandledRejectionHandlerInstalled__) {
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection:', reason)
    })
    globalTestSetupState.__momeiVitestUnhandledRejectionHandlerInstalled__ = true
}

// Mock Nuxt/H3 Globals for Unit Testing Server Handlers
const mockEventHandler = (handler: any) => handler

const mockGetValidatedQuery = vi.fn(async (event: any, validate: any) => await validate(event.query || {}))
const mockReadValidatedBody = vi.fn(async (event: any, validate: any) => await validate(event.body || {}))
const mockReadBody = vi.fn((event: any) => Promise.resolve(event.body || {}))
const mockGetRouterParam = vi.fn((event: any, key: string) => event.params?.[key])
const mockGetRequestIP = vi.fn(() => null)
const mockGetRequestHeader = vi.fn(() => undefined)
const mockGetRequestHost = vi.fn(() => 'example.com')
const mockGetRequestProtocol = vi.fn(() => 'https')

const mockCreateError = (err: any) => {
    const error = new Error(err.statusMessage || 'Error')
    // @ts-expect-error - Adding statusCode to error
    error.statusCode = err.statusCode
    return error
}

vi.stubGlobal('defineEventHandler', mockEventHandler)
vi.stubGlobal('getValidatedQuery', mockGetValidatedQuery)
vi.stubGlobal('readValidatedBody', mockReadValidatedBody)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('getRequestIP', mockGetRequestIP)
vi.stubGlobal('getRequestHeader', mockGetRequestHeader)
vi.stubGlobal('getRequestHost', mockGetRequestHost)
vi.stubGlobal('getRequestProtocol', mockGetRequestProtocol)
vi.stubGlobal('createError', mockCreateError)
vi.stubGlobal('getAppManifest', vi.fn(() => Promise.resolve({
    publicPath: '/',
    buildId: 'test',
    routes: {},
    matcher: {},
    prerendered: [],
})))
vi.stubGlobal('getRouteRules', vi.fn(() => ({})))
vi.stubGlobal('useRuntimeConfig', () => ({
    public: {
        siteUrl: 'https://momei.app',
        appName: '墨梅博客',
        windowsLocalDevMode: false,
    },
}))

// Mock pg 模块，避免 pg 内部 CJS require('pg-pool') 在 Vitest ESM 上下文中返回 Module 对象导致崩溃。
// 测试使用 SQLite，pg mock 仅需满足 TypeORM PostgresDriver 的类型检查。
vi.mock('pg', () => {
    class MockPool { }
    class MockClient { }
    return {
        default: {
            Pool: MockPool,
            Client: MockClient,
            Query: class MockQuery { },
            types: { setTypeParser: () => undefined, getTypeParser: () => undefined },
            defaults: {},
            DatabaseError: class MockDatabaseError extends Error { },
        },
        Pool: MockPool,
        Client: MockClient,
    }
})

/**
 * 浮层族迁移后的全局默认 mock：`useToast` / `useConfirm` 改为显式从 `caomei-ui` 引入。
 *
 * 保持 `importOriginal` 展开，避免把组件导入一并替换掉；单测若需断言调用，
 * 在自己的文件内 `vi.mock('caomei-ui')` 覆盖即可（文件级 mock 优先）。
 */
vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useToast: () => createLegacyToastApi(vi.fn()),
        useConfirm: () => createLegacyConfirmApi(vi.fn((options: { reject?: () => void }) => options.reject?.())),
    }
})
