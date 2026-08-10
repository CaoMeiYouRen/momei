import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './expand.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readValidatedBody } = global as unknown as {
    readValidatedBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/expand', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should expand content with casual style (default)', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: '这是一段需要扩写的文本内容。',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.expandContent).mockResolvedValue('这是扩写后更加详细的内容。')

        const result = await handler({ context: {} } as any)

        expect(TextService.expandContent).toHaveBeenCalledWith(
            '这是一段需要扩写的文本内容。',
            'casual',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: '这是扩写后更加详细的内容。',
        })
    })

    it('should expand content with academic style', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'A brief point to expand.',
            style: 'academic',
            language: 'en-US',
        })
        vi.mocked(TextService.expandContent).mockResolvedValue('An expanded academic discussion of the point.')

        const result = await handler({ context: {} } as any)

        expect(TextService.expandContent).toHaveBeenCalledWith(
            'A brief point to expand.',
            'academic',
            'en-US',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: 'An expanded academic discussion of the point.',
        })
    })

    it('should reject empty content via Zod validation', async () => {
        vi.mocked(readValidatedBody).mockRejectedValue(new Error('Validation failed'))

        await expect(handler({ body: { content: '' } } as any)).rejects.toThrow('Validation failed')
        expect(TextService.expandContent).not.toHaveBeenCalled()
    })

    it('should handle TextService error gracefully', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Some content.',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.expandContent).mockRejectedValue(new Error('AI service error'))

        const result = await handler({ context: {} } as any).catch((e: Error) => e)

        expect(result).toBeInstanceOf(Error)
        expect((result as Error).message).toBe('AI service error')
    })
})
