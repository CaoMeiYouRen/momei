import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/utils/validate-api-key', () => ({
    validateApiKeyRequest: vi.fn(),
}))

describe('MCP HTTP endpoint (/api/mcp)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete (globalThis as Record<string, unknown>).__momei_mcp_transport
    })

    it('should throw 503 when transport is not available', async () => {
        const handler = (await import('./index')).default

        await expect(handler({ method: 'GET' } as any)).rejects.toThrow('MCP HTTP endpoint is not available')
    })

    it('should throw 503 when transport is explicitly removed', async () => {
        ;(globalThis as Record<string, unknown>).__momei_mcp_transport = null
        const handler = (await import('./index')).default

        await expect(handler({ method: 'GET' } as any)).rejects.toThrow('MCP HTTP endpoint is not available')
    })

    it('should throw 401 when API key validation fails', async () => {
        const { validateApiKeyRequest } = await import('@/server/utils/validate-api-key')
        const authError = Object.assign(
            new Error('Unauthorized'),
            { statusCode: 401, statusMessage: 'Missing API Key' },
        )
        vi.mocked(validateApiKeyRequest).mockRejectedValue(authError)

        // Transport must exist for validation to be reached
        ;(globalThis as Record<string, unknown>).__momei_mcp_transport = { handleRequest: vi.fn() }

        const handler = (await import('./index')).default
        await expect(handler({ method: 'POST' } as any)).rejects.toThrow('Unauthorized')
    })
})

/**
 * Tests requiring h3 utility mocks (defineEventHandler pass-through +
 * global stubs for setResponseStatus, setHeader, getRequestURL, etc.)
 */
describe('MCP HTTP endpoint with h3 mocks', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete (globalThis as Record<string, unknown>).__momei_mcp_transport

        // Stub defineEventHandler as pass-through (like feed-taxonomy-route test)
        vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
        vi.stubGlobal('createError', vi.fn((opts: Record<string, unknown>) =>
            Object.assign(new Error(String(opts.statusMessage as string ?? 'Error')), opts),
        ))
    })

    it('should construct correct web request and delegate to transport', async () => {
        const { validateApiKeyRequest } = await import('@/server/utils/validate-api-key')
        vi.mocked(validateApiKeyRequest).mockResolvedValue(undefined)

        const mockHandleRequest = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ result: 'ok' }), { status: 200 }),
        )
        ;(globalThis as Record<string, unknown>).__momei_mcp_transport = { handleRequest: mockHandleRequest }

        // setHeader is not auto-imported in test; stub it
        vi.stubGlobal('setHeader', vi.fn())
        vi.stubGlobal('readRawBody', vi.fn().mockResolvedValue('{"jsonrpc":"2.0","method":"tools/list"}'))
        vi.stubGlobal('getRequestURL', vi.fn().mockReturnValue(new URL('http://localhost/api/mcp')))
        vi.stubGlobal('getHeaders', vi.fn().mockReturnValue({ 'content-type': 'application/json' }))

        const handler = (await import('./index')).default
        const result = await handler({ method: 'POST' } as any)

        // Handler should resolve without error and delegate to transport
        expect(result).toBeTruthy()
        expect(mockHandleRequest).toHaveBeenCalledTimes(1)

        // Verify the web request was constructed with correct method, body and url
        const webRequest = mockHandleRequest.mock.calls[0][0] as Request
        expect(webRequest.method).toBe('POST')
        expect(webRequest.url).toBe('http://localhost/api/mcp')
        const reqBody = await webRequest.text()
        expect(reqBody).toBe('{"jsonrpc":"2.0","method":"tools/list"}')
    })

    it('should skip body reading for GET requests', async () => {
        const { validateApiKeyRequest } = await import('@/server/utils/validate-api-key')
        vi.mocked(validateApiKeyRequest).mockResolvedValue(undefined)

        const mockHandleRequest = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
        ;(globalThis as Record<string, unknown>).__momei_mcp_transport = { handleRequest: mockHandleRequest }

        const mockReadRawBody = vi.fn()
        vi.stubGlobal('readRawBody', mockReadRawBody)
        vi.stubGlobal('setHeader', vi.fn())
        vi.stubGlobal('getRequestURL', vi.fn().mockReturnValue(new URL('http://localhost/api/mcp')))
        vi.stubGlobal('getHeaders', vi.fn().mockReturnValue({}))

        const handler = (await import('./index')).default
        const result = await handler({ method: 'GET' } as any)

        expect(mockReadRawBody).not.toHaveBeenCalled()
        expect(result).toBeNull()
    })

    it('should return null for responses without body', async () => {
        const { validateApiKeyRequest } = await import('@/server/utils/validate-api-key')
        vi.mocked(validateApiKeyRequest).mockResolvedValue(undefined)

        const mockHandleRequest = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
        ;(globalThis as Record<string, unknown>).__momei_mcp_transport = { handleRequest: mockHandleRequest }

        vi.stubGlobal('setHeader', vi.fn())
        vi.stubGlobal('readRawBody', vi.fn().mockResolvedValue('{}'))
        vi.stubGlobal('getRequestURL', vi.fn().mockReturnValue(new URL('http://localhost/api/mcp')))
        vi.stubGlobal('getHeaders', vi.fn().mockReturnValue({}))

        const handler = (await import('./index')).default
        const result = await handler({ method: 'POST' } as any)

        expect(result).toBeNull()
    })
})
