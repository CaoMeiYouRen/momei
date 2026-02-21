import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as uploadService from '../upload'
import { ImageService } from './image'
import { dataSource } from '@/server/database'
import * as aiUtils from '@/server/utils/ai'

vi.mock('@/server/database')
vi.mock('@/server/entities/ai-task')
vi.mock('@/server/utils/ai')
vi.mock('../upload')
vi.mock('@/server/utils/logger')

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
                id: undefined,
                type: 'image_generation',
                userId: 'user-1',
                payload: JSON.stringify(options),
            })
            expect(mockRepo.save).toHaveBeenCalled()
        })

        it('should process image generation in background', async () => {
            const mockTask = {
                id: 'task-123',
                status: 'processing',
                type: 'image_generation',
            }

            mockRepo.findOneBy.mockResolvedValue(mockTask)

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
                url: '/uploads/ai/task-123.png',
                path: '/uploads/ai/task-123.png',
                size: 1024,
                mimeType: 'image/png',
            } as any)

            const options = { prompt: 'Test' }
            await ImageService.generateImage(options, 'user-1')

            // Wait for background processing
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockProvider.generateImage).toHaveBeenCalledWith(options)
            expect(mockRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'completed',
                }),
            )
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
        it('should return task status for valid task', async () => {
            const mockTask = {
                id: 'task-123',
                status: 'completed',
                result: JSON.stringify({ url: '/image.png' }),
                error: null,
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
