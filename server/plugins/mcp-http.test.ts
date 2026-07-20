import { beforeEach, describe, expect, it, vi } from 'vitest'

async function flushAsyncStartup() {
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))
}

const mocks = vi.hoisted(() => {
    const close = vi.fn().mockResolvedValue(undefined)

    const fakeTransport = {
        handleRequest: vi.fn().mockResolvedValue(new Response('ok')),
    }

    const fakeServer = {
        close,
    }

    const createMcpHttpServer = vi.fn().mockResolvedValue({
        transport: fakeTransport,
        server: fakeServer,
        close,
    })

    return {
        createMcpHttpServer,
        fakeTransport,
        fakeServer,
        close,
        isServerlessEnvironment: vi.fn(),
        logger: {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        },
    }
})

vi.mock('../utils/env', () => ({
    isServerlessEnvironment: mocks.isServerlessEnvironment,
}))

vi.mock('@/server/utils/logger', () => ({
    default: mocks.logger,
}))

vi.mock('momei-mcp-server', () => ({
    createMcpHttpServer: mocks.createMcpHttpServer,
    SERVER_NAME: 'momei-blog',
    SERVER_VERSION: '1.0.0',
}))

describe('MCP HTTP plugin', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        delete (globalThis as Record<string, unknown>).__momei_mcp_transport

        delete process.env.MOMEI_ENABLE_MCP_HTTP
        delete process.env.MOMEI_API_KEY
        delete process.env.MOMEI_API_URL
        delete process.env.MOMEI_ENABLE_DANGEROUS_TOOLS
        mocks.isServerlessEnvironment.mockReturnValue(false)
    })

    it('should return early when MOMEI_ENABLE_MCP_HTTP is not true', async () => {
        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./mcp-http')).default

        plugin({ hooks: { hook: vi.fn() } } as any)

        await flushAsyncStartup()

        expect(mocks.createMcpHttpServer).not.toHaveBeenCalled()
        expect(mocks.logger.info).not.toHaveBeenCalled()
        expect((globalThis as Record<string, unknown>).__momei_mcp_transport).toBeUndefined()
    })

    it('should return early in serverless environments', async () => {
        mocks.isServerlessEnvironment.mockReturnValue(true)
        process.env.MOMEI_ENABLE_MCP_HTTP = 'true'

        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./mcp-http')).default

        plugin({ hooks: { hook: vi.fn() } } as any)

        await flushAsyncStartup()

        expect(mocks.createMcpHttpServer).not.toHaveBeenCalled()
        expect(mocks.logger.info).toHaveBeenCalledWith(
            '[MCP-HTTP] Skipped: SSE not supported in serverless environment.',
        )
        expect((globalThis as Record<string, unknown>).__momei_mcp_transport).toBeUndefined()
    })

    it('should initialize MCP HTTP when conditions are met', async () => {
        process.env.MOMEI_ENABLE_MCP_HTTP = 'true'
        process.env.MOMEI_API_KEY = 'test-key'

        const hookMock = vi.fn()
        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./mcp-http')).default

        plugin({ hooks: { hook: hookMock } } as any)

        await flushAsyncStartup()

        expect(mocks.createMcpHttpServer).toHaveBeenCalledTimes(1)
        expect(mocks.createMcpHttpServer).toHaveBeenCalledWith({
            apiUrl: undefined,
            apiKey: 'test-key',
            enableDangerousTools: false,
        })

        // Transport should be stored in globalThis
        expect((globalThis as Record<string, unknown>).__momei_mcp_transport).toBe(mocks.fakeTransport)

        // Close hook should be registered
        expect(hookMock).toHaveBeenCalledWith('close', expect.any(Function))

        // Success log with server name and version
        expect(mocks.logger.info).toHaveBeenCalledWith(
            expect.stringContaining('momei-blog v1.0.0 mounted at /api/mcp'),
        )
    })

    it('should pass enableDangerousTools to createMcpHttpServer', async () => {
        process.env.MOMEI_ENABLE_MCP_HTTP = 'true'
        process.env.MOMEI_ENABLE_DANGEROUS_TOOLS = 'true'
        process.env.MOMEI_API_URL = 'http://test.local:3000'

        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./mcp-http')).default

        plugin({ hooks: { hook: vi.fn() } } as any)

        await flushAsyncStartup()

        expect(mocks.createMcpHttpServer).toHaveBeenCalledWith({
            apiUrl: 'http://test.local:3000',
            apiKey: undefined,
            enableDangerousTools: true,
        })
    })

    it('should not crash on initialization error (non-blocking)', async () => {
        process.env.MOMEI_ENABLE_MCP_HTTP = 'true'
        mocks.createMcpHttpServer.mockRejectedValueOnce(new Error('Init failed'))

        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./mcp-http')).default

        plugin({ hooks: { hook: vi.fn() } } as any)

        await flushAsyncStartup()

        expect(mocks.logger.error).toHaveBeenCalledWith(
            expect.stringContaining('[MCP-HTTP] Failed to initialize MCP HTTP server'),
            expect.any(Error),
        )
        expect((globalThis as Record<string, unknown>).__momei_mcp_transport).toBeUndefined()
    })
})
