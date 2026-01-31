import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { validateApiKeyRequest } from './validate-api-key'

// Mock H3 functions
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        getRequestHeader: vi.fn(),
        createError: vi.fn((options) => {
            const error = new Error(options.statusMessage)
            ;(error as any).statusCode = options.statusCode
            return error
        }),
    }
})

// Mock dependencies
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/api-key', () => ({
    verifyApiKey: vi.fn(),
}))

describe('server/utils/validate-api-key', () => {
    let mockEvent: Partial<H3Event>
    let mockRepo: any
    let mockVerifyApiKey: any
    let mockGetRequestHeader: any

    beforeEach(async () => {
        vi.clearAllMocks()

        // Import mocked modules
        const { dataSource } = await import('@/server/database')
        const { verifyApiKey } = await import('@/server/utils/api-key')
        const { getRequestHeader } = await import('h3')

        mockVerifyApiKey = verifyApiKey
        mockGetRequestHeader = getRequestHeader

        mockRepo = {
            find: vi.fn(),
            save: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo)

        mockEvent = {} as Partial<H3Event>
    })

    describe('validateApiKeyRequest', () => {
        it('应该在缺少 API Key 时抛出 401 错误', async () => {
            vi.mocked(mockGetRequestHeader).mockReturnValue(undefined)

            await expect(validateApiKeyRequest(mockEvent as H3Event)).rejects.toThrow('Missing API Key')
        })

        it('应该从 X-API-KEY header 中提取 token', async () => {
            const token = 'test-api-key-1234567890'
            vi.mocked(mockGetRequestHeader).mockReturnValue(token)

            const mockApiKey = {
                id: '1',
                key: 'hashed-key',
                prefix: token.slice(0, 16),
                expiresAt: null,
                lastUsedAt: new Date(),
                userId: 'user-1',
                user: { id: 'user-1', email: 'test@example.com' },
            }

            mockRepo.find.mockResolvedValue([mockApiKey])
            vi.mocked(mockVerifyApiKey).mockReturnValue(true)

            const result = await validateApiKeyRequest(mockEvent as H3Event)

            expect(result.user).toEqual(mockApiKey.user)
            expect(result.apiKey).toEqual(mockApiKey)
            expect(mockRepo.save).toHaveBeenCalledWith(mockApiKey)
        })

        it('应该从 Authorization Bearer header 中提取 token', async () => {
            const token = 'test-api-key-1234567890'
            vi.mocked(mockGetRequestHeader).mockReturnValueOnce(undefined).mockReturnValueOnce(`Bearer ${token}`)

            const mockApiKey = {
                id: '1',
                key: 'hashed-key',
                prefix: token.slice(0, 16),
                expiresAt: null,
                lastUsedAt: new Date(),
                userId: 'user-1',
                user: { id: 'user-1', email: 'test@example.com' },
            }

            mockRepo.find.mockResolvedValue([mockApiKey])
            vi.mocked(mockVerifyApiKey).mockReturnValue(true)

            const result = await validateApiKeyRequest(mockEvent as H3Event)

            expect(result.user).toEqual(mockApiKey.user)
        })

        it('应该在 API Key 无效时抛出 401 错误', async () => {
            const token = 'invalid-api-key-1234567890'
            vi.mocked(mockGetRequestHeader).mockReturnValue(token)

            mockRepo.find.mockResolvedValue([])

            await expect(validateApiKeyRequest(mockEvent as H3Event)).rejects.toThrow('Invalid API Key')
        })

        it('应该在 API Key 过期时抛出 401 错误', async () => {
            const token = 'expired-api-key-1234567890'
            vi.mocked(mockGetRequestHeader).mockReturnValue(token)

            const expiredDate = new Date()
            expiredDate.setDate(expiredDate.getDate() - 1) // 昨天过期

            const mockApiKey = {
                id: '1',
                key: 'hashed-key',
                prefix: token.slice(0, 16),
                expiresAt: expiredDate,
                lastUsedAt: new Date(),
                userId: 'user-1',
                user: { id: 'user-1', email: 'test@example.com' },
            }

            mockRepo.find.mockResolvedValue([mockApiKey])
            vi.mocked(mockVerifyApiKey).mockReturnValue(true)

            await expect(validateApiKeyRequest(mockEvent as H3Event)).rejects.toThrow('API Key Expired')
        })

        it('应该在用户不存在时抛出 401 错误', async () => {
            const token = 'test-api-key-1234567890'
            vi.mocked(mockGetRequestHeader).mockReturnValue(token)

            const mockApiKey = {
                id: '1',
                key: 'hashed-key',
                prefix: token.slice(0, 16),
                expiresAt: null,
                lastUsedAt: new Date(),
                userId: 'user-1',
                user: null, // 用户不存在
            }

            mockRepo.find.mockResolvedValue([mockApiKey])
            vi.mocked(mockVerifyApiKey).mockReturnValue(true)

            await expect(validateApiKeyRequest(mockEvent as H3Event)).rejects.toThrow('User not found')
        })

        it('应该更新 API Key 的最后使用时间', async () => {
            const token = 'test-api-key-1234567890'
            vi.mocked(mockGetRequestHeader).mockReturnValue(token)

            const mockApiKey = {
                id: '1',
                key: 'hashed-key',
                prefix: token.slice(0, 16),
                expiresAt: null,
                lastUsedAt: new Date('2024-01-01'),
                userId: 'user-1',
                user: { id: 'user-1', email: 'test@example.com' },
            }

            mockRepo.find.mockResolvedValue([mockApiKey])
            vi.mocked(mockVerifyApiKey).mockReturnValue(true)

            await validateApiKeyRequest(mockEvent as H3Event)

            expect(mockRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: '1',
                    lastUsedAt: expect.any(Date),
                }),
            )
            expect(mockApiKey.lastUsedAt.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime())
        })
    })
})
