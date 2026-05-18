import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { isServerlessEnvironment } from '@/server/utils/env'
import { requireAdminOrAuthor } from '@/server/utils/permission'
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/env', () => ({
    isServerlessEnvironment: vi.fn(() => false),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdminOrAuthor: vi.fn(),
}))

vi.mock('@/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/utils/shared/env')>()

    return {
        ...actual,
        TTS_FRONTEND_DIRECT: false,
    }
})

const mockTask = {
    id: 'task-1',
    category: 'podcast',
    type: 'podcast',
    status: 'pending',
    estimatedCost: 1.23,
    estimatedQuotaUnits: 8,
}

const mockCreateTTSTask = vi.fn().mockResolvedValue({
    task: mockTask,
    estimatedCost: 1.23,
    estimatedQuotaUnits: 8,
})

vi.mock('@/server/utils/ai/tts-task-shared', () => ({
    createTTSTask: mockCreateTTSTask,
}))

vi.mock('@/server/utils/ai/tts-direct-dispatch', () => ({
    createFrontendDirectTTSResponse: vi.fn((params) => ({
        taskId: params.taskId,
        strategy: 'frontend-direct',
        provider: 'volcengine',
        mode: params.mode,
        estimatedCost: params.estimatedCost,
        estimatedQuotaUnits: params.estimatedQuotaUnits,
        message: 'Direct TTS task created',
    })),
    shouldUseTTSFrontendDirect: vi.fn(() => false),
}))

const postRepo = {
    findOneBy: vi.fn().mockResolvedValue(null),
}

describe('POST /api/ai/tts/task', () => {
    let handler: (event: any) => Promise<any>
    const postId = 'abcdef123456789'
    const requestBody = {
        provider: 'volcengine',
        voice: 'zh_female_vv_uranus_bigtts',
        text: 'hello world',
        mode: 'podcast',
        options: {},
    }

    beforeEach(async () => {
        handler ||= (await import('./task.post')).default
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(postRepo as any)
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'author-1', role: 'author' },
        } as any)
        vi.mocked(isServerlessEnvironment).mockReturnValue(false)
    })

    it('should create task via shared helper for non-serverless requests', async () => {
        const waitUntil = vi.fn()

        const result = await handler({
            body: requestBody,
            waitUntil,
            context: {},
        } as any)

        expect(result).toEqual({
            taskId: 'task-1',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
        })
        expect(mockCreateTTSTask).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'author-1',
            content: 'hello world',
            voice: 'zh_female_vv_uranus_bigtts',
            provider: 'volcengine',
            mode: 'podcast',
        }))
        expect(waitUntil).not.toHaveBeenCalled()
    })

    it('should use post content and translation metadata when text is omitted', async () => {
        postRepo.findOneBy.mockResolvedValueOnce({
            id: postId,
            authorId: 'author-1',
            content: 'post backed content',
            language: 'zh-CN',
            translationId: 'cluster-1',
        })

        const result = await handler({
            body: {
                postId,
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                mode: 'speech',
                options: {},
            },
            context: {},
        } as any)

        expect(result).toEqual({
            taskId: 'task-1',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
        })
        expect(postRepo.findOneBy).toHaveBeenCalledWith({ id: postId })
        expect(mockCreateTTSTask).toHaveBeenCalledWith(expect.objectContaining({
            postId,
            content: 'post backed content',
            language: 'zh-CN',
            extraPayload: expect.objectContaining({
                language: 'zh-CN',
                translationId: 'cluster-1',
                options: expect.objectContaining({
                    language: 'zh-CN',
                }),
            }),
        }))
    })

    it('should reject when referenced post is missing', async () => {
        postRepo.findOneBy.mockResolvedValueOnce(null)

        await expect(handler({
            body: {
                postId,
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                options: {},
            },
            context: {},
        } as any)).rejects.toMatchObject({
            statusCode: 404,
            statusMessage: 'Post not found',
        })

        expect(mockCreateTTSTask).not.toHaveBeenCalled()
    })

    it('should reject when a non-admin author targets another author\'s post', async () => {
        postRepo.findOneBy.mockResolvedValueOnce({
            id: postId,
            authorId: 'author-2',
            content: 'private content',
            language: 'zh-CN',
            translationId: null,
        })

        await expect(handler({
            body: {
                postId,
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                options: {},
            },
            context: {},
        } as any)).rejects.toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden',
        })

        expect(mockCreateTTSTask).not.toHaveBeenCalled()
    })

    it('should return frontend-direct strategy in serverless runtimes when enabled', async () => {
        const { shouldUseTTSFrontendDirect } = await import('@/server/utils/ai/tts-direct-dispatch')
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)
        vi.mocked(shouldUseTTSFrontendDirect).mockReturnValueOnce(true)

        const waitUntil = vi.fn()

        const result = await handler({
            body: requestBody,
            waitUntil,
            context: {},
        } as any)

        expect(result).toEqual({
            taskId: 'task-1',
            strategy: 'frontend-direct',
            provider: 'volcengine',
            mode: 'podcast',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
            message: 'Direct TTS task created',
        })
        // Frontend-direct tasks should use taskOverrides with type _direct
        expect(mockCreateTTSTask).toHaveBeenCalledWith(expect.objectContaining({
            taskOverrides: expect.objectContaining({
                type: 'podcast_direct',
                actualCost: 0,
                quotaUnits: 0,
            }),
        }))
    })

    it('should skip waitUntil registration outside serverless runtimes', async () => {
        const waitUntil = vi.fn()

        await expect(handler({ body: requestBody, waitUntil, context: {} } as any)).resolves.toEqual({
            taskId: 'task-1',
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
        })

        expect(waitUntil).not.toHaveBeenCalled()
    })
})
