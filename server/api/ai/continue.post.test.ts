import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './continue.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readValidatedBody } = global as unknown as {
    readValidatedBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/continue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should continue writing with casual style (default)', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: '这是一段需要续写的文本内容。',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.continueWriting).mockResolvedValue('这是续写出来的后续内容。')

        const result = await handler({ context: {} } as any)

        expect(TextService.continueWriting).toHaveBeenCalledWith(
            '这是一段需要续写的文本内容。',
            'casual',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: '这是续写出来的后续内容。',
        })
    })

    it('should continue writing with formal style', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: '需要续写的文本',
            style: 'formal',
            language: 'zh-CN',
        })
        vi.mocked(TextService.continueWriting).mockResolvedValue('正式风格的续写内容。')

        const result = await handler({ context: {} } as any)

        expect(TextService.continueWriting).toHaveBeenCalledWith(
            '需要续写的文本',
            'formal',
            'zh-CN',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: '正式风格的续写内容。',
        })
    })

    it('should reject empty content via Zod validation', async () => {
        vi.mocked(readValidatedBody).mockRejectedValue(new Error('Validation failed'))

        await expect(handler({ body: { content: '' } } as any)).rejects.toThrow('Validation failed')
        expect(TextService.continueWriting).not.toHaveBeenCalled()
    })

    it('should handle TextService error gracefully', async () => {
        vi.mocked(readValidatedBody).mockResolvedValue({
            content: 'Some content.',
            style: 'casual',
            language: 'zh-CN',
        })
        vi.mocked(TextService.continueWriting).mockRejectedValue(new Error('AI service error'))

        const result = await handler({ context: {} } as any).catch((e: Error) => e)

        expect(result).toBeInstanceOf(Error)
        expect((result as Error).message).toBe('AI service error')
    })
})
