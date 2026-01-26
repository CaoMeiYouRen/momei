// testSetup.ts
import { vi } from 'vitest'

// 设置环境变量
// process.env.NODE_ENV = 'test';
// process.env.BETTER_AUTH_TRUSTED_ORIGINS = 'http://localhost:3000';
// process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test_db';

// 模拟WebSocket服务器以避免端口冲突
vi.mock('ws', () => ({
    Server: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        close: vi.fn(),
    })),
}))

// 强制测试环境使用内存数据库
vi.stubEnv('DATABASE_TYPE', 'sqlite')
vi.stubEnv('DATABASE_PATH', ':memory:')
vi.stubEnv('NODE_ENV', 'test')

// 全局错误处理
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason)
})

// Mock Nuxt/H3 Globals for Unit Testing Server Handlers
const mockEventHandler = (handler: any) => handler

const mockGetValidatedQuery = async (event: any, validate: any) => validate(event.query || {})
const mockReadValidatedBody = async (event: any, validate: any) => validate(event.body || {})

const mockCreateError = (err: any) => {
    const error = new Error(err.statusMessage || 'Error')
    // @ts-expect-error - Adding statusCode to error
    error.statusCode = err.statusCode
    return error
}

vi.stubGlobal('defineEventHandler', mockEventHandler)
vi.stubGlobal('getValidatedQuery', mockGetValidatedQuery)
vi.stubGlobal('readValidatedBody', mockReadValidatedBody)
vi.stubGlobal('createError', mockCreateError)
vi.stubGlobal('getAppManifest', () => Promise.resolve({
    publicPath: '/',
    buildId: 'test',
    routes: {},
    matcher: {},
    prerendered: [],
}))
vi.stubGlobal('useRuntimeConfig', () => ({
    public: {
        siteUrl: 'https://momei.app',
        appName: '墨梅博客',
    },
}))

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useToast: () => ({
            add: vi.fn(),
            remove: vi.fn(),
            removeAllGroups: vi.fn(),
            removeGroup: vi.fn(),
        }),
    }
})

// Mock PrimeVue useConfirm
vi.mock('primevue/useconfirm', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useConfirm: () => ({
            require: vi.fn(),
            close: vi.fn(),
        }),
    }
})
