import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { TTSService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const h3Mocks = vi.hoisted(() => ({
    getRouterParam: vi.fn(() => 'post-1'),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()

    return {
        ...actual,
        getRouterParam: h3Mocks.getRouterParam,
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/ai', () => ({
    TTSService: {
        estimateCost: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdminOrAuthor: vi.fn(),
}))

describe('PUT /api/posts/[id]/tts-metadata', () => {
    let handler: (event: any) => Promise<any>

    const post = {
        id: 'post-1',
        authorId: 'author-1',
        language: 'zh-CN',
        translationId: 'translation-1',
        metadata: {
            audio: {
                url: 'https://old.example.com/audio.mp3',
            },
            tts: {
                provider: 'volcengine',
                voice: 'old-voice',
            },
        },
        metaVersion: 1,
    }

    const postRepo = {
        findOneBy: vi.fn(() => Promise.resolve(post)),
        save: vi.fn((value) => Promise.resolve(value)),
    }

    const taskRepo = {
        create: vi.fn((payload) => ({
            id: 'task-direct-1',
            ...payload,
        })),
        save: vi.fn((value) => Promise.resolve(value)),
    }

    beforeEach(async () => {
        handler ||= (await import('./tts-metadata.put')).default
        vi.clearAllMocks()
        h3Mocks.getRouterParam.mockReturnValue('post-1')
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'author-1', role: 'author' },
        } as any)
        vi.mocked(TTSService.estimateCost).mockResolvedValue(0.42)
        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            let entityName: string | undefined

            if (typeof entity === 'function') {
                entityName = entity.name
            } else if (typeof entity === 'object' && entity !== null && 'name' in entity) {
                entityName = (entity as { name?: string }).name
            }

            if (entityName === 'Post') {
                return postRepo as any
            }

            return taskRepo as any
        })
    })

    it('should persist direct tts metadata with post scoped audio fields and completed task metrics', async () => {
        const result = await handler({
            body: {
                audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                mode: 'speech',
                duration: 66,
                audioSize: 2048,
                mimeType: 'audio/mpeg',
                textLength: 123,
                text: 'hello world',
                language: 'zh-CN',
                model: 'seed-tts-2.0-expressive',
            },
        } as any)

        expect(postRepo.save).toHaveBeenCalledTimes(1)
        expect(post.metadata).toMatchObject({
            audio: {
                url: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
                size: 2048,
                duration: 66,
                mimeType: 'audio/mpeg',
                language: 'zh-CN',
                translationId: 'translation-1',
                postId: 'post-1',
                mode: 'speech',
            },
            tts: {
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                duration: 66,
                language: 'zh-CN',
                translationId: 'translation-1',
                postId: 'post-1',
                mode: 'speech',
            },
        })

        expect(taskRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'tts_direct',
            audioDuration: 66,
            audioSize: 2048,
            language: 'zh-CN',
            actualCost: 0.42,
        }))
        expect(result).toEqual({
            success: true,
            audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
        })
    })
})
