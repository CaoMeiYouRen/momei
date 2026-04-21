import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './[id].get'
import { dataSource } from '@/server/database'
import { scanAndCompensateTimedOutMediaTasks } from '@/server/services/ai/media-task-monitor'
import { isServerlessEnvironment } from '@/server/utils/env'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/database')
vi.mock('@/server/services/ai/media-task-monitor', () => ({
    scanAndCompensateTimedOutMediaTasks: vi.fn(),
}))
vi.mock('@/server/utils/env', () => ({
    isServerlessEnvironment: vi.fn(() => false),
}))
vi.mock('@/server/utils/permission')

describe('GET /api/tasks/tts/[id]', () => {
    let mockRepo: { findOneBy: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        vi.clearAllMocks()
        mockRepo = {
            findOneBy: vi.fn(),
        }
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
        vi.mocked(isServerlessEnvironment).mockReturnValue(false)
        vi.mocked(scanAndCompensateTimedOutMediaTasks).mockResolvedValue({
            scanned: 0,
            completed: 0,
            failed: 0,
            resumed: 0,
            skipped: 0,
            staleBefore: '2026-03-09T00:00:00.000Z',
        })
    })

    it('should allow owner to read task', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)

        mockRepo.findOneBy.mockResolvedValue({
            id: 'task-1',
            userId: 'user-1',
            status: 'completed',
            progress: 100,
            result: JSON.stringify({ audioUrl: '/audio.mp3', raw: { requestId: 'req-1' } }),
            error: null,
            updatedAt: '2026-03-09T00:00:00.000Z',
        })

        const result = await handler({
            context: {
                params: { id: 'task-1' },
            },
        } as any)

        expect(result).toEqual({
            id: 'task-1',
            status: 'completed',
            progress: 100,
            result: { audioUrl: '/audio.mp3' },
            audioUrl: '/audio.mp3',
            error: null,
            updatedAt: '2026-03-09T00:00:00.000Z',
        })
    })

    it('should reject non-owner non-admin', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-2', role: 'author' },
        } as any)

        mockRepo.findOneBy.mockResolvedValue({
            id: 'task-1',
            userId: 'user-1',
        })

        await expect(handler({
            context: {
                params: { id: 'task-1' },
            },
        } as any)).rejects.toThrow('Forbidden')
    })

    it('should allow admin to read other user task', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' },
        } as any)

        mockRepo.findOneBy.mockResolvedValue({
            id: 'task-1',
            userId: 'user-1',
            status: 'completed',
            progress: 100,
            result: JSON.stringify({ audioUrl: '/audio.mp3', raw: { requestId: 'req-1' } }),
            error: null,
            updatedAt: '2026-03-09T00:00:00.000Z',
        })

        const result = await handler({
            context: {
                params: { id: 'task-1' },
            },
        } as any)

        expect(result).toEqual({
            id: 'task-1',
            status: 'completed',
            progress: 100,
            result: {
                audioUrl: '/audio.mp3',
                raw: { requestId: 'req-1' },
            },
            audioUrl: '/audio.mp3',
            error: null,
            updatedAt: '2026-03-09T00:00:00.000Z',
        })
    })

    it('should trigger stale podcast recovery in serverless environments and re-read task status', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)
        vi.mocked(scanAndCompensateTimedOutMediaTasks).mockResolvedValue({
            scanned: 1,
            completed: 1,
            failed: 0,
            resumed: 0,
            skipped: 0,
            staleBefore: '2026-03-08T23:55:00.000Z',
        })

        mockRepo.findOneBy
            .mockResolvedValueOnce({
                id: 'task-1',
                type: 'podcast',
                userId: 'user-1',
                status: 'processing',
                progress: 30,
                result: null,
                error: null,
                updatedAt: '2026-03-09T00:00:00.000Z',
            })
            .mockResolvedValueOnce({
                id: 'task-1',
                type: 'podcast',
                userId: 'user-1',
                status: 'completed',
                progress: 100,
                result: JSON.stringify({ audioUrl: '/audio.mp3' }),
                error: null,
                updatedAt: '2026-03-09T00:10:00.000Z',
            })

        const result = await handler({
            context: {
                params: { id: 'task-1' },
            },
        } as any)

        expect(scanAndCompensateTimedOutMediaTasks).toHaveBeenCalledWith(expect.any(Date), {
            taskId: 'task-1',
        })
        expect(mockRepo.findOneBy).toHaveBeenCalledTimes(2)
        expect(result).toEqual({
            id: 'task-1',
            status: 'completed',
            progress: 100,
            result: { audioUrl: '/audio.mp3' },
            audioUrl: '/audio.mp3',
            error: null,
            updatedAt: '2026-03-09T00:10:00.000Z',
        })
    })

    it('should trigger stale tts recovery in serverless environments and re-read task status', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)
        vi.mocked(scanAndCompensateTimedOutMediaTasks).mockResolvedValue({
            scanned: 1,
            completed: 1,
            failed: 0,
            resumed: 0,
            skipped: 0,
            staleBefore: '2026-03-08T23:55:00.000Z',
        })

        mockRepo.findOneBy
            .mockResolvedValueOnce({
                id: 'task-2',
                type: 'tts',
                userId: 'user-1',
                status: 'processing',
                progress: 35,
                result: null,
                error: null,
                updatedAt: '2026-03-09T00:00:00.000Z',
            })
            .mockResolvedValueOnce({
                id: 'task-2',
                type: 'tts',
                userId: 'user-1',
                status: 'completed',
                progress: 100,
                result: JSON.stringify({ audioUrl: '/audio-2.mp3' }),
                error: null,
                updatedAt: '2026-03-09T00:10:00.000Z',
            })

        const result = await handler({
            context: {
                params: { id: 'task-2' },
            },
        } as any)

        expect(scanAndCompensateTimedOutMediaTasks).toHaveBeenCalledWith(expect.any(Date), {
            taskId: 'task-2',
        })
        expect(mockRepo.findOneBy).toHaveBeenCalledTimes(2)
        expect(result).toEqual({
            id: 'task-2',
            status: 'completed',
            progress: 100,
            result: { audioUrl: '/audio-2.mp3' },
            audioUrl: '/audio-2.mp3',
            error: null,
            updatedAt: '2026-03-09T00:10:00.000Z',
        })
    })
})
