import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as uploadService from '../upload'
import { ImageService } from './image'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import * as aiUtils from '@/server/utils/ai'

vi.mock('@/server/database')
vi.mock('@/server/entities/ai-task')
vi.mock('@/server/services/ai/quota-governance', () => ({
    assertAIQuotaAllowance: vi.fn(),
    resolveAIQuotaPolicy: vi.fn(),
}))
vi.mock('@/server/utils/ai')
vi.mock('../upload')
vi.mock('@/server/utils/logger')
vi.mock('@/server/utils/post-metadata', () => ({
    applyPostMetadataPatch: vi.fn((post, input: { metadata?: Record<string, unknown> | null }) => {
        if (input.metadata !== undefined) {
            post.metadata = input.metadata
        }
    }),
}))

describe('ImageService', () => {
    let mockRepo: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockRepo = {
            create: vi.fn((data) => ({ ...data, id: 'task-123' })),
            save: vi.fn((task) => Promise.resolve(task)),
            findOneBy: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('generateImage', () => {
        it('should create image generation task and return immediately', async () => {
            const options = {
                prompt: 'A beautiful sunset',
                quality: 'hd' as const,
                style: 'vivid' as const,
            }

            const result = await ImageService.generateImage(options, 'user-1')

            expect(result.id).toBe('task-123')
            expect(mockRepo.create).toHaveBeenCalledWith({
                category: 'image',
                id: undefined,
                type: 'image_generation',
                userId: 'user-1',
                payload: JSON.stringify(options),
            })
            expect(mockRepo.save).toHaveBeenCalled()
        })

        it('should process image generation in background', async () => {
            const post = {
                id: 'post-123',
                language: 'en-US',
                translationId: 'cluster-1',
                coverImage: null,
                metadata: null,
            }
            const postRepo = {
                findOneBy: vi.fn().mockResolvedValue(post),
                save: vi.fn().mockResolvedValue(post),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
                if (entity === Post) {
                    return postRepo as any
                }

                return mockRepo
            })

            const mockProvider = {
                name: 'openai',
                generateImage: vi.fn().mockResolvedValue({
                    images: [{ url: 'https://example.com/image.png' }],
                    usage: {},
                    model: 'dall-e-3',
                }),
            }

            vi.mocked(aiUtils.getAIImageProvider).mockResolvedValue(mockProvider as any)
            vi.mocked(uploadService.uploadFromUrl).mockResolvedValue({
                url: '/uploads/posts/post-123/image/ai/generated.png',
                path: '/uploads/posts/post-123/image/ai/generated.png',
                size: 1024,
                mimeType: 'image/png',
            } as any)

            const options = { prompt: 'Test', postId: 'post-123', targetLanguage: 'en-US', translationId: 'cluster-1' }
            await ImageService.generateImage(options, 'user-1')

            // Wait for background processing
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockProvider.generateImage).toHaveBeenCalledWith(options)
            expect(uploadService.uploadFromUrl).toHaveBeenCalledWith(
                'https://example.com/image.png',
                'posts/post-123/image/ai/',
                'user-1',
            )
            expect(postRepo.findOneBy).toHaveBeenCalledWith({ id: 'post-123' })
            expect(postRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                coverImage: '/uploads/posts/post-123/image/ai/generated.png',
                metadata: expect.objectContaining({
                    cover: expect.objectContaining({
                        url: '/uploads/posts/post-123/image/ai/generated.png',
                        language: 'en-US',
                        translationId: 'cluster-1',
                        postId: 'post-123',
                    }),
                }),
            }))
            expect(mockRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'completed',
                }),
            )
        })

        it('should keep existing cover when overwriteExistingCover is false', async () => {
            const post = {
                id: 'post-123',
                language: 'en-US',
                translationId: 'cluster-1',
                coverImage: '/covers/existing.png',
                metadata: null,
            }
            const postRepo = {
                findOneBy: vi.fn().mockResolvedValue(post),
                save: vi.fn().mockResolvedValue(post),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
                if (entity === Post) {
                    return postRepo as any
                }

                return mockRepo
            })

            const mockProvider = {
                name: 'openai',
                generateImage: vi.fn().mockResolvedValue({
                    images: [{ url: 'https://example.com/image.png' }],
                    usage: {},
                    model: 'dall-e-3',
                }),
            }

            vi.mocked(aiUtils.getAIImageProvider).mockResolvedValue(mockProvider as any)
            vi.mocked(uploadService.uploadFromUrl).mockResolvedValue({
                url: '/uploads/posts/post-123/image/ai/generated.png',
                path: '/uploads/posts/post-123/image/ai/generated.png',
                size: 1024,
                mimeType: 'image/png',
            } as any)

            await ImageService.generateImage({
                prompt: 'Test',
                postId: 'post-123',
                targetLanguage: 'en-US',
                translationId: 'cluster-1',
                overwriteExistingCover: false,
            }, 'user-1')

            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(postRepo.save).not.toHaveBeenCalled()
            expect(post.coverImage).toBe('/covers/existing.png')
        })

        it('should not backfill post cover before editor confirmation when applyToPost is false', async () => {
            const post = {
                id: 'post-123',
                language: 'en-US',
                translationId: 'cluster-1',
                coverImage: '/covers/existing.png',
                metadata: {
                    cover: {
                        url: '/covers/existing.png',
                        source: 'manual',
                    },
                },
            }
            const postRepo = {
                findOneBy: vi.fn().mockResolvedValue(post),
                save: vi.fn().mockResolvedValue(post),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
                if (entity === Post) {
                    return postRepo as any
                }

                return mockRepo
            })

            const mockProvider = {
                name: 'openai',
                generateImage: vi.fn().mockResolvedValue({
                    images: [{ url: 'https://example.com/image.png' }],
                    usage: {},
                    model: 'dall-e-3',
                }),
            }

            vi.mocked(aiUtils.getAIImageProvider).mockResolvedValue(mockProvider as any)
            vi.mocked(uploadService.uploadFromUrl).mockResolvedValue({
                url: '/uploads/posts/post-123/image/ai/generated.png',
                path: '/uploads/posts/post-123/image/ai/generated.png',
                size: 1024,
                mimeType: 'image/png',
            } as any)

            await ImageService.generateImage({
                prompt: 'Test',
                postId: 'post-123',
                targetLanguage: 'en-US',
                translationId: 'cluster-1',
                applyToPost: false,
            }, 'user-1')

            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(uploadService.uploadFromUrl).toHaveBeenCalled()
            expect(postRepo.save).not.toHaveBeenCalled()
            expect(post.coverImage).toBe('/covers/existing.png')
            expect(post.metadata.cover).toEqual({
                url: '/covers/existing.png',
                source: 'manual',
            })
        })

        it('should handle image generation failure', async () => {
            const mockTask = {
                id: 'task-123',
                status: 'processing',
            }

            mockRepo.findOneBy.mockResolvedValue(mockTask)

            const mockProvider = {
                name: 'openai',
                generateImage: vi.fn().mockRejectedValue(new Error('API quota exceeded')),
            }

            vi.mocked(aiUtils.getAIImageProvider).mockResolvedValue(mockProvider as any)

            await ImageService.generateImage({ prompt: 'Test' }, 'user-1')

            // Wait for background processing
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'failed',
                    error: 'API quota exceeded',
                }),
            )
        })
    })

    describe('getTaskStatus', () => {
        it('should only return minimal fields while task is still running', async () => {
            const mockTask = {
                id: 'task-123',
                status: 'processing',
                progress: 45,
                result: JSON.stringify({ url: '/image.png', raw: { providerRequestId: 'req-1' } }),
                error: null,
                updatedAt: undefined,
            }
            mockRepo.findOneBy.mockResolvedValue(mockTask)

            const result = await ImageService.getTaskStatus('task-123', 'user-1')

            expect(result).toEqual({
                id: 'task-123',
                status: 'processing',
                progress: 45,
                error: null,
                updatedAt: undefined,
            })
        })

        it('should hide raw result data for non-admin callers after completion', async () => {
            const mockTask = {
                id: 'task-123',
                status: 'completed',
                result: JSON.stringify({ url: '/image.png', raw: { providerRequestId: 'req-1' } }),
                error: null,
                updatedAt: undefined,
            }
            mockRepo.findOneBy.mockResolvedValue(mockTask)

            const result = await ImageService.getTaskStatus('task-123', 'user-1')

            expect(result).toEqual({
                id: 'task-123',
                status: 'completed',
                progress: 0,
                result: { url: '/image.png' },
                audioUrl: '/image.png',
                error: null,
                updatedAt: undefined,
            })
        })

        it('should allow admins to read raw result data', async () => {
            const mockTask = {
                id: 'task-123',
                userId: 'user-1',
                status: 'completed',
                result: JSON.stringify({ url: '/image.png', raw: { providerRequestId: 'req-1' } }),
                error: null,
                updatedAt: undefined,
            }
            mockRepo.findOneBy.mockResolvedValue(mockTask)

            const result = await ImageService.getTaskStatus('task-123', 'admin-1', {
                isAdmin: true,
                includeRaw: true,
            })

            expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 'task-123' })
            expect(result).toEqual({
                id: 'task-123',
                status: 'completed',
                progress: 0,
                result: {
                    url: '/image.png',
                    raw: { providerRequestId: 'req-1' },
                },
                audioUrl: '/image.png',
                error: null,
                updatedAt: undefined,
            })
        })

        it('should throw 404 for non-existent task', async () => {
            mockRepo.findOneBy.mockResolvedValue(null)

            await expect(
                ImageService.getTaskStatus('invalid-id', 'user-1'),
            ).rejects.toThrow()
        })

        it('should not return task for different user', async () => {
            mockRepo.findOneBy.mockResolvedValue(null)

            await expect(
                ImageService.getTaskStatus('task-123', 'user-2'),
            ).rejects.toThrow()
        })
    })
})
