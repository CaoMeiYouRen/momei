import { beforeEach, describe, expect, it, vi } from 'vitest'
import { commentTranslationService } from './comment-translation'
import { commentService } from './comment'
import { TextService } from './ai'
import { dataSource } from '@/server/database'

vi.mock('./comment', () => ({
    commentService: {
        getCommentById: vi.fn(),
    },
}))

vi.mock('./ai', () => ({
    TextService: {
        shouldUseAsyncTranslateTask: vi.fn(),
        translate: vi.fn(),
        createTranslateTask: vi.fn(),
        getTaskStatus: vi.fn(),
    },
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

describe('commentTranslationService', () => {
    const mockCommentRepo = {
        save: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        ;(dataSource.getRepository as any).mockReturnValue(mockCommentRepo)
        vi.mocked(TextService.shouldUseAsyncTranslateTask).mockReturnValue(false)
        vi.mocked(TextService.translate).mockResolvedValue('Translated comment')
    })

    it('should reuse cached translation when target locale already exists', async () => {
        vi.mocked(commentService.getCommentById).mockResolvedValue({
            id: '123456789012345678',
            content: 'Original comment',
            translationCache: {
                'en-US': {
                    content: 'Cached translation',
                    updatedAt: '2026-04-20T00:00:00.000Z',
                },
            },
        } as any)

        const result = await commentTranslationService.getOrCreateTranslation({
            actorId: 'visitor-actor-id',
            commentId: '123456789012345678',
            targetLanguage: 'en-US',
        })

        expect(result).toEqual({
            commentId: '123456789012345678',
            targetLanguage: 'en-US',
            content: 'Cached translation',
            updatedAt: '2026-04-20T00:00:00.000Z',
            fromCache: true,
        })
        expect(TextService.translate).not.toHaveBeenCalled()
        expect(mockCommentRepo.save).not.toHaveBeenCalled()
    })

    it('should translate and persist cache for uncached locale', async () => {
        vi.mocked(commentService.getCommentById).mockResolvedValue({
            id: '123456789012345678',
            content: 'Original comment',
            translationCache: null,
        } as any)

        const result = await commentTranslationService.getOrCreateTranslation({
            actorId: 'visitor-actor-id',
            commentId: '123456789012345678',
            targetLanguage: 'zh-CN',
        })

        expect(TextService.translate).toHaveBeenCalledWith(
            'Original comment',
            'zh-CN',
            'visitor-actor-id',
            { field: 'content' },
        )
        expect(result.commentId).toBe('123456789012345678')
        expect(result.targetLanguage).toBe('zh-CN')
        expect(result.content).toBe('Translated comment')
        expect(result.fromCache).toBe(false)
        expect(mockCommentRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            id: '123456789012345678',
            translationCache: expect.objectContaining({
                'zh-CN': expect.objectContaining({
                    content: 'Translated comment',
                }),
            }),
        }))
    })

    it('should wait for task completion when long comment requires async translation', async () => {
        vi.mocked(commentService.getCommentById).mockResolvedValue({
            id: '123456789012345678',
            content: 'a'.repeat(1500),
            translationCache: null,
        } as any)
        vi.mocked(TextService.shouldUseAsyncTranslateTask).mockReturnValue(true)
        vi.mocked(TextService.createTranslateTask).mockResolvedValue({ id: 'task-1' } as any)
        vi.mocked(TextService.getTaskStatus)
            .mockResolvedValueOnce({ status: 'processing', progress: 50 } as any)
            .mockResolvedValueOnce({
                status: 'completed',
                progress: 100,
                result: {
                    mode: 'task',
                    content: 'Translated long comment',
                    completedChunks: 2,
                    totalChunks: 2,
                },
            } as any)

        const result = await commentTranslationService.getOrCreateTranslation({
            actorId: 'visitor-actor-id',
            commentId: '123456789012345678',
            targetLanguage: 'ja-JP',
        })

        expect(TextService.createTranslateTask).toHaveBeenCalledWith(
            'a'.repeat(1500),
            'ja-JP',
            'visitor-actor-id',
            { field: 'content' },
        )
        expect(TextService.getTaskStatus).toHaveBeenCalledTimes(2)
        expect(result.content).toBe('Translated long comment')
    })

    it('should reject when comment is not visible to current viewer', async () => {
        vi.mocked(commentService.getCommentById).mockResolvedValue(null)

        await expect(commentTranslationService.getOrCreateTranslation({
            actorId: 'visitor-actor-id',
            commentId: '123456789012345678',
            targetLanguage: 'ko-KR',
        })).rejects.toMatchObject({
            statusCode: 404,
        })
    })
})
