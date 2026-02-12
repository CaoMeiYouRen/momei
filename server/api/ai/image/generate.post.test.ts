import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './generate.post'
import { AIService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

describe('POST /api/ai/image/generate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should generate image task successfully with valid input', async () => {
        const mockTask = {
            id: 'task-123',
            status: 'processing',
            type: 'image_generation',
            userId: 'user-1',
        }

        vi.mocked(AIService.generateImage).mockResolvedValue(mockTask as any)

        const mockEvent = {
            context: {
                session: {
                    user: { id: 'user-1', role: 'author' },
                },
            },
        } as any

        const mockBody = {
            prompt: 'A beautiful sunset over mountains',
            model: 'doubao',
            quality: 'standard',
            style: 'vivid',
        }

        vi.mocked(global.readBody).mockResolvedValue(mockBody)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' } as any,
            session: {} as any,
        } as any)

        const result = await handler(mockEvent)

        expect(result).toEqual({
            code: 200,
            data: {
                taskId: 'task-123',
                status: 'processing',
            },
        })
        expect(AIService.generateImage).toHaveBeenCalledWith(mockBody, 'user-1')
    })

    it('should reject invalid prompt (empty string)', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'user-1', role: 'author' },
                },
            },
        } as any

        const mockBody = {
            prompt: '',
            quality: 'standard',
        }

        vi.mocked(global.readBody).mockResolvedValue(mockBody)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' } as any,
            session: {} as any,
        } as any)

        await expect(handler(mockEvent)).rejects.toThrow()
    })

    it('should reject prompt exceeding max length', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'user-1', role: 'author' },
                },
            },
        } as any

        const mockBody = {
            prompt: 'a'.repeat(1001),
            quality: 'standard',
        }

        vi.mocked(global.readBody).mockResolvedValue(mockBody)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' } as any,
            session: {} as any,
        } as any)

        await expect(handler(mockEvent)).rejects.toThrow()
    })

    it('should handle AI service errors gracefully', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'user-1', role: 'author' },
                },
            },
        } as any

        const mockBody = {
            prompt: 'Test prompt',
            quality: 'standard',
        }

        vi.mocked(global.readBody).mockResolvedValue(mockBody)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' } as any,
            session: {} as any,
        } as any)
        vi.mocked(AIService.generateImage).mockRejectedValue(new Error('AI provider unavailable'))

        await expect(handler(mockEvent)).rejects.toThrow('AI provider unavailable')
    })

    it('should validate quality enum values', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'user-1', role: 'author' },
                },
            },
        } as any

        const mockBody = {
            prompt: 'Test prompt',
            quality: 'ultra', // Invalid value
        }

        vi.mocked(global.readBody).mockResolvedValue(mockBody)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' } as any,
            session: {} as any,
        } as any)

        await expect(handler(mockEvent)).rejects.toThrow()
    })

    it('should validate style enum values', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'user-1', role: 'author' },
                },
            },
        } as any

        const mockBody = {
            prompt: 'Test prompt',
            style: 'cartoon', // Invalid value
        }

        vi.mocked(global.readBody).mockResolvedValue(mockBody)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' } as any,
            session: {} as any,
        } as any)

        await expect(handler(mockEvent)).rejects.toThrow()
    })
})
