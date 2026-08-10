import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './condense.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readValidatedBody } = global as unknown as {
    readValidatedBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/condense', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should condense content with casual style (default)', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: '这是一段需要缩写的冗长文本内容。',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.condenseContent).mockResolvedValue('这是缩写后的精简内容。')

        const result = await handler({ context: {} } as any)

        expect(TextService.condenseContent).toHaveBeenCalledWith(
            '这是一段需要缩写的冗长文本内容。',
            'casual',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: '这是缩写后的精简内容。',
        })
    })

    it('should condense content with technical style', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'A long verbose explanation that could be shortened considerably.',
            style: 'technical',
            language: 'en-US',
        })
        vi.mocked(TextService.condenseContent).mockResolvedValue('Concise technical summary.')

        const result = await handler({ context: {} } as any)

        expect(TextService.condenseContent).toHaveBeenCalledWith(
            'A long verbose explanation that could be shortened considerably.',
            'technical',
            'en-US',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: 'Concise technical summary.',
        })
    })

    it('should reject empty content via Zod validation', async () => {
        vi.mocked(readValidatedBody).mockRejectedValue(new Error('Validation failed'))

        await expect(handler({ body: { content: '' } } as any)).rejects.toThrow('Validation failed')
        expect(TextService.condenseContent).not.toHaveBeenCalled()
    })

    it('should handle TextService error gracefully', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Some content.',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.condenseContent).mockRejectedValue(new Error('AI service error'))

        const result = await handler({ context: {} } as any).catch((e: Error) => e)

        expect(result).toBeInstanceOf(Error)
        expect((result as Error).message).toBe('AI service error')
    })
})
