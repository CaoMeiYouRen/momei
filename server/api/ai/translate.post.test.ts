import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './translate.post'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

const { readBody } = global as unknown as {
    readBody: ReturnType<typeof vi.fn>
}

describe('POST /api/ai/translate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
    })

    it('should return direct translation for short content', async () => {
        vi.mocked(readBody).mockResolvedValue({
            content: 'short content',
            targetLanguage: 'en-US',
        })
        vi.mocked(TextService.shouldUseAsyncTranslateTask).mockReturnValue(false)
        vi.mocked(TextService.translate).mockResolvedValue('translated short content')

        const result = await handler({ context: {} } as any)

        expect(TextService.translate).toHaveBeenCalledWith(
            'short content',
            'en-US',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: {
                mode: 'direct',
                content: 'translated short content',
                directReturnMaxChars: 1000,
            },
        })
    })

    it('should create translation task for long content', async () => {
        vi.mocked(readBody).mockResolvedValue({
            content: 'a'.repeat(1200),
            targetLanguage: 'en-US',
        })
        vi.mocked(TextService.shouldUseAsyncTranslateTask).mockReturnValue(true)
        vi.mocked(TextService.createTranslateTask).mockResolvedValue({
            id: 'task-123',
            status: 'pending',
        } as any)

        const result = await handler({ context: {} } as any)

        expect(TextService.createTranslateTask).toHaveBeenCalledWith(
            'a'.repeat(1200),
            'en-US',
            'user-1',
        )
        expect(result).toEqual({
            code: 200,
            data: {
                mode: 'task',
                taskId: 'task-123',
                status: 'pending',
                directReturnMaxChars: 1000,
            },
        })
    })
})

