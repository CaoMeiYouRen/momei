import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scanAndCompensateTimedOutMediaTasks } from './media-task-monitor'
import { dataSource } from '@/server/database'
import { ImageService } from '@/server/services/ai/image'
import { TTSService } from '@/server/services/ai/tts'
import { acquireLock, releaseLock } from '@/server/utils/redis'
import { AI_HEAVY_TASK_TIMEOUT_MS } from '@/utils/shared/env'

const mocks = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/ai/image', () => ({
    ImageService: {
        compensateStaleTask: vi.fn(),
    },
}))

vi.mock('@/server/services/ai/tts', () => ({
    TTSService: {
        compensateStaleTask: vi.fn(),
    },
}))

vi.mock('@/server/utils/redis', () => ({
    acquireLock: vi.fn(),
    releaseLock: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: mocks.logger,
}))

describe('media task monitor', () => {
    const taskRepo = {
        find: vi.fn(),
        update: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as never)
        vi.mocked(acquireLock).mockResolvedValue(true)
        vi.mocked(releaseLock).mockResolvedValue(undefined)
        taskRepo.update.mockResolvedValue({ affected: 1 })
    })

    it('should scan stale image and podcast tasks and aggregate outcomes', async () => {
        taskRepo.find.mockResolvedValue([
            { id: 'image-1', type: 'image_generation' },
            { id: 'podcast-1', type: 'podcast' },
            { id: 'tts-1', type: 'tts' },
        ])
        vi.mocked(ImageService.compensateStaleTask).mockResolvedValue('completed')
        vi.mocked(TTSService.compensateStaleTask)
            .mockResolvedValueOnce('resumed')
            .mockResolvedValueOnce('completed')

        const summary = await scanAndCompensateTimedOutMediaTasks(new Date('2026-04-07T12:00:00.000Z'))

        expect(summary).toEqual(expect.objectContaining({
            scanned: 3,
            completed: 2,
            resumed: 1,
            skipped: 0,
            failed: 0,
        }))
        expect(ImageService.compensateStaleTask).toHaveBeenCalledWith('image-1')
        expect(TTSService.compensateStaleTask).toHaveBeenCalledWith('podcast-1')
        expect(TTSService.compensateStaleTask).toHaveBeenCalledWith('tts-1')
        expect(taskRepo.find).toHaveBeenCalledTimes(1)
        expect(taskRepo.update).toHaveBeenCalledTimes(3)
        expect(releaseLock).toHaveBeenCalledTimes(1)
    })

    it('should return empty summary when no stale task exists', async () => {
        taskRepo.find.mockResolvedValue([])

        const summary = await scanAndCompensateTimedOutMediaTasks(new Date('2026-04-07T12:00:00.000Z'))

        expect(summary).toEqual(expect.objectContaining({
            scanned: 0,
            completed: 0,
            resumed: 0,
            skipped: 0,
            failed: 0,
        }))
        expect(ImageService.compensateStaleTask).not.toHaveBeenCalled()
        expect(TTSService.compensateStaleTask).not.toHaveBeenCalled()
        expect(releaseLock).toHaveBeenCalledTimes(1)
    })

    it('should skip scan when compensation lock is already held', async () => {
        vi.mocked(acquireLock).mockResolvedValue(false)

        const summary = await scanAndCompensateTimedOutMediaTasks(new Date('2026-04-07T12:00:00.000Z'))

        expect(summary).toEqual(expect.objectContaining({
            scanned: 0,
            completed: 0,
            resumed: 0,
            skipped: 0,
            failed: 0,
        }))
        expect(taskRepo.find).not.toHaveBeenCalled()
        expect(releaseLock).not.toHaveBeenCalled()
    })

    it('should skip a task when another worker already claimed compensation in database', async () => {
        taskRepo.find.mockResolvedValue([
            { id: 'image-1', type: 'image_generation', status: 'processing', result: null, progress: 20 },
        ])
        taskRepo.update.mockResolvedValue({ affected: 0 })

        const summary = await scanAndCompensateTimedOutMediaTasks(new Date('2026-04-07T12:00:00.000Z'))

        expect(summary).toEqual(expect.objectContaining({
            scanned: 1,
            completed: 0,
            resumed: 0,
            skipped: 1,
            failed: 0,
        }))
        expect(ImageService.compensateStaleTask).not.toHaveBeenCalled()
    })

    it('should narrow stale scan to a single task when taskId filter is provided', async () => {
        taskRepo.find.mockResolvedValue([
            { id: 'podcast-1', type: 'podcast' },
        ])
        vi.mocked(TTSService.compensateStaleTask).mockResolvedValue('completed')

        const summary = await scanAndCompensateTimedOutMediaTasks(new Date('2026-04-07T12:00:00.000Z'), {
            taskId: 'podcast-1',
        })

        expect(summary).toEqual(expect.objectContaining({
            scanned: 1,
            completed: 1,
            failed: 0,
            resumed: 0,
            skipped: 0,
        }))
        expect(taskRepo.find).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.arrayContaining([
                expect.objectContaining({ id: 'podcast-1', status: 'pending' }),
                expect.objectContaining({ id: 'podcast-1', status: 'processing' }),
            ]),
        }))
        expect(TTSService.compensateStaleTask).toHaveBeenCalledWith('podcast-1')
    })

    it('should compensate stale tts task through TTSService', async () => {
        taskRepo.find.mockResolvedValue([
            { id: 'tts-1', type: 'tts' },
        ])
        vi.mocked(TTSService.compensateStaleTask).mockResolvedValue('completed')

        const summary = await scanAndCompensateTimedOutMediaTasks(new Date('2026-04-07T12:00:00.000Z'))

        expect(summary).toEqual(expect.objectContaining({
            scanned: 1,
            completed: 1,
            failed: 0,
            resumed: 0,
            skipped: 0,
        }))
        expect(TTSService.compensateStaleTask).toHaveBeenCalledWith('tts-1')
    })

    it('should claim compensation with a lease that covers the heavy task timeout window', async () => {
        taskRepo.find.mockResolvedValue([
            { id: 'tts-1', type: 'tts', status: 'processing', result: null, progress: 20 },
        ])
        vi.mocked(TTSService.compensateStaleTask).mockResolvedValue('resumed')

        const now = new Date('2026-04-07T12:00:00.000Z')
        await scanAndCompensateTimedOutMediaTasks(now)

        const claimedUpdate = taskRepo.update.mock.calls[0]?.[1] as { result?: string }
        const claimedResult = JSON.parse(String(claimedUpdate.result)) as { compensationLeaseExpiresAt: string }

        expect(Date.parse(claimedResult.compensationLeaseExpiresAt) - now.getTime()).toBeGreaterThanOrEqual(AI_HEAVY_TASK_TIMEOUT_MS)
    })
})
