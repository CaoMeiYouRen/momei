import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './rewrite.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readValidatedBody } = global as unknown as {
    readValidatedBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/rewrite', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should rewrite content with casual style (default)', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: '这是一段需要改写的文本内容。',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.rewrite).mockResolvedValue('这是一段改写后的文本内容。')

        const result = await handler({ context: {} } as any)

        expect(TextService.rewrite).toHaveBeenCalledWith(
            '这是一段需要改写的文本内容。',
            'casual',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: '这是一段改写后的文本内容。',
        })
    })

    it('should rewrite content with formal style', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: '这是一段需要改写的文本内容。',
            style: 'formal',
            language: 'zh-CN',
        })
        vi.mocked(TextService.rewrite).mockResolvedValue('这是一段经过正式风格改写后的文本内容。')

        const result = await handler({ context: {} } as any)

        expect(TextService.rewrite).toHaveBeenCalledWith(
            '这是一段需要改写的文本内容。',
            'formal',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: '这是一段经过正式风格改写后的文本内容。',
        })
    })

    it('should rewrite content with academic style in English', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'This is a text that needs to be rewritten.',
            style: 'academic',
            language: 'en-US',
        })
        vi.mocked(TextService.rewrite).mockResolvedValue('This is an academic revision of the original text.')

        const result = await handler({ context: {} } as any)

        expect(TextService.rewrite).toHaveBeenCalledWith(
            'This is a text that needs to be rewritten.',
            'academic',
            'en-US',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: 'This is an academic revision of the original text.',
        })
    })

    it('should reject empty content via Zod validation', async () => {
        vi.mocked(readValidatedBody).mockRejectedValue(new Error('Validation failed'))

        await expect(handler({ body: { content: '' } } as any)).rejects.toThrow('Validation failed')
        expect(TextService.rewrite).not.toHaveBeenCalled()
    })

    it('should handle TextService error gracefully', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Some content.',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.rewrite).mockRejectedValue(new Error('AI service error'))

        const result = await handler({ context: {} } as any).catch((e: Error) => e)

        expect(result).toBeInstanceOf(Error)
        expect((result as Error).message).toBe('AI service error')
    })
})
