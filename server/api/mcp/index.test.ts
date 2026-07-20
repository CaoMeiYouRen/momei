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
})
