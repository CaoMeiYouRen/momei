import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LessThanOrEqual } from 'typeorm'
import { processScheduledPosts } from './task'
import { dataSource } from '@/server/database'
import { PostStatus } from '@/types/post'

const mocks = vi.hoisted(() => ({
    postRepo: {
        find: vi.fn(),
        update: vi.fn(),
    },
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
    executePublishEffects: vi.fn(),
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(() => mocks.postRepo),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: mocks.logger,
}))

vi.mock('./post-publish', () => ({
    executePublishEffects: mocks.executePublishEffects,
}))

describe('task service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.postRepo.find.mockResolvedValue([])
        mocks.postRepo.update.mockResolvedValue(undefined)
        mocks.executePublishEffects.mockResolvedValue(undefined)
    })

    it('should scan scheduled posts with a minimal field set', async () => {
        const now = new Date('2026-03-30T12:00:00.000Z')
        mocks.postRepo.find.mockResolvedValue([
            {
                id: 'post-1',
                title: 'Scheduled Post',
                authorId: 'author-1',
                metadata: {
                    publish: {
                        intent: {
                            pushOption: 'none',
                        },
                    },
                },
            },
        ])

        await processScheduledPosts(now)

        expect(dataSource.getRepository).toHaveBeenCalledTimes(1)
        expect(mocks.postRepo.find).toHaveBeenCalledWith({
            where: {
                status: PostStatus.SCHEDULED,
                publishedAt: LessThanOrEqual(now),
            },
            select: {
                id: true,
                title: true,
                authorId: true,
                metadata: true,
            },
        })
        expect(mocks.postRepo.update).toHaveBeenCalledWith('post-1', {
            status: PostStatus.PUBLISHED,
        })
        expect(mocks.executePublishEffects).toHaveBeenCalledWith({
            id: 'post-1',
            title: 'Scheduled Post',
            authorId: 'author-1',
            metadata: {
                publish: {
                    intent: {
                        pushOption: 'none',
                    },
                },
            },
        }, {
            pushOption: 'none',
        })
    })

    it('should skip publish side effects when no scheduled posts are due', async () => {
        await processScheduledPosts(new Date('2026-03-30T12:00:00.000Z'))

        expect(mocks.postRepo.update).not.toHaveBeenCalled()
        expect(mocks.executePublishEffects).not.toHaveBeenCalled()
    })
})
