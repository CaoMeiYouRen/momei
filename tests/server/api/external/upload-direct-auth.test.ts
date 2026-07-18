import { beforeEach, describe, expect, it, vi } from 'vitest'

const validateApiKeyRequest = vi.fn()
const authorizeDirectUpload = vi.fn()

vi.mock('@/server/utils/validate-api-key', () => ({
    validateApiKeyRequest,
}))

vi.mock('@/server/services/direct-upload', () => ({
    authorizeDirectUpload,
}))

describe('external upload direct-auth api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        validateApiKeyRequest.mockResolvedValue({
            user: {
                id: 'user-1',
            },
        })
    })

    it('authorizes direct upload with API-key user context', async () => {
        authorizeDirectUpload.mockResolvedValue({
            strategy: 'proxy',
        })

        const handler = (await import('@/server/api/external/upload/direct-auth.post')).default
        const result = await handler({
            body: {
                filename: 'cover.png',
                contentType: 'image/png',
                size: 1024,
                type: 'image',
                prefix: 'migrations/image/',
            },
        } as never)

        expect(validateApiKeyRequest).toHaveBeenCalledOnce()
        expect(authorizeDirectUpload).toHaveBeenCalledWith({
            userId: 'user-1',
            filename: 'cover.png',
            contentType: 'image/png',
            size: 1024,
            type: 'image',
            prefix: 'migrations/image/',
        })
        expect(result.code).toBe(200)
        expect(result.data.strategy).toBe('proxy')
    })
})
