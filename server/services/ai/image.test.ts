import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dataSource } from '../../database'
import * as aiUtils from '../../utils/ai'
import * as uploadService from '../upload'
import { ImageService } from './image'

vi.mock('../../database')
vi.mock('../../entities/ai-task')
vi.mock('../../utils/ai')
vi.mock('../upload')
vi.mock('../../utils/logger')

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
                type: 'image_generation',
                status: 'processing',
                payload: JSON.stringify(options),
                userId: 'user-1',
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
                result: { url: '/image.png' },
                error: null,
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
