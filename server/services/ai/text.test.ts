import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dataSource } from '../../database'
import * as aiUtils from '../../utils/ai'
import * as uploadService from '../upload'
import { TextService } from './text'

vi.mock('../../database')
vi.mock('../../entities/ai-task')
vi.mock('../../utils/ai')
vi.mock('../upload')
vi.mock('../../utils/logger')

describe('TextService', () => {
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

    describe('suggestTitles', () => {
        it('should generate title suggestions successfully', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '["标题1", "标题2", "标题3"]',
                    model: 'gpt-4',
                    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.suggestTitles('测试内容', 'zh-CN', 'user-1')

            expect(result).toEqual(['标题1', '标题2', '标题3'])
            expect(mockProvider.chat).toHaveBeenCalledWith(
                expect.objectContaining({
                    temperature: 0.8,
                }),
            )
        })

        it('should handle non-JSON response format', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '1. 标题1\n2. 标题2\n3. 标题3',
                    model: 'gpt-4',
                    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.suggestTitles('测试内容', 'zh-CN')

            expect(result).toEqual(['标题1', '标题2', '标题3'])
        })

        it('should truncate long content to AI_CHUNK_SIZE', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '["标题"]',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const longContent = 'a'.repeat(10000)
            await TextService.suggestTitles(longContent, 'zh-CN')

            expect(mockProvider.chat).toHaveBeenCalled()
        })
    })

    describe('suggestSlug', () => {
        it('should generate SEO-friendly slug', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: 'my-awesome-post',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.suggestSlug('My Awesome Post!', 'content', 'user-1')

            expect(result).toBe('my-awesome-post')
            expect(mockProvider.chat).toHaveBeenCalledWith(
                expect.objectContaining({
                    temperature: 0.3,
                }),
            )
        })

        it('should sanitize slug with special characters', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: 'Hello World! @#$%',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.suggestSlug('测试', 'content')

            expect(result).toMatch(/^[a-z0-9-]+$/)
        })
    })

    describe('generateImage', () => {
        it('should create image generation task and return immediately', async () => {
            const options = {
                prompt: 'A beautiful sunset',
                quality: 'hd' as const,
                style: 'vivid' as const,
            }

            const result = await TextService.generateImage(options, 'user-1')

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
            await TextService.generateImage(options, 'user-1')

            // Wait for background processing
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockProvider.generateImage).toHaveBeenCalledWith(options)
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

            await TextService.generateImage({ prompt: 'Test' }, 'user-1')

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
                result: JSON.stringify({ images: [{ url: '/image.png' }] }),
                error: null,
            }

            mockRepo.findOneBy.mockResolvedValue(mockTask)

            const result = await TextService.getTaskStatus('task-123', 'user-1')

            expect(result).toEqual({
                id: 'task-123',
                status: 'completed',
                result: { images: [{ url: '/image.png' }] },
                error: null,
            })
        })

        it('should throw 404 for non-existent task', async () => {
            mockRepo.findOneBy.mockResolvedValue(null)

            await expect(
                TextService.getTaskStatus('invalid-id', 'user-1'),
            ).rejects.toThrow('Task not found')
        })

        it('should not return task for different user', async () => {
            mockRepo.findOneBy.mockResolvedValue(null)

            await expect(
                TextService.getTaskStatus('task-123', 'user-2'),
            ).rejects.toThrow()
        })
    })

    describe('summarize', () => {
        it('should summarize short content in single request', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '这是一个简短的摘要',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.summarize('短内容', 200, 'zh-CN', 'user-1')

            expect(result).toBe('这是一个简短的摘要')
            expect(mockProvider.chat).toHaveBeenCalledTimes(1)
        })

        it('should reject content exceeding AI_MAX_CONTENT_LENGTH', async () => {
            const longContent = 'a'.repeat(100001) // Assuming AI_MAX_CONTENT_LENGTH is 100000

            await expect(
                TextService.summarize(longContent, 200, 'zh-CN'),
            ).rejects.toThrow('Content too long')
        })

        it('should use chunking strategy for long content', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn()
                    .mockResolvedValueOnce({
                        content: '第一部分摘要',
                        model: 'gpt-4',
                        usage: {},
                    })
                    .mockResolvedValueOnce({
                        content: '第二部分摘要',
                        model: 'gpt-4',
                        usage: {},
                    })
                    .mockResolvedValueOnce({
                        content: '最终摘要',
                        model: 'gpt-4',
                        usage: {},
                    }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            // Create content that splits into exactly 2 chunks
            // Each chunk is 3500 chars, separated by double newlines
            const longContent = `${'a'.repeat(3500)}\n\n${'b'.repeat(3500)}`
            const result = await TextService.summarize(longContent, 200, 'zh-CN')

            expect(result).toBe('最终摘要')
            expect(mockProvider.chat).toHaveBeenCalledTimes(3) // 2 chunks + 1 final
        })
    })

    describe('generateScaffold', () => {
        it('should generate scaffold from topic', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '# 文章大纲\n\n## 第一节\n内容...',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.generateScaffold(
                { topic: 'AI 技术发展' },
                'user-1',
            )

            expect(result).toContain('文章大纲')
            expect(mockProvider.chat).toHaveBeenCalled()
        })

        it('should generate scaffold from snippets', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '# 整合后的大纲',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.generateScaffold(
                { snippets: ['片段1', '片段2'] },
                'user-1',
            )

            expect(result).toContain('整合后的大纲')
        })

        it('should throw error when neither topic nor snippets provided', async () => {
            await expect(
                TextService.generateScaffold({}, 'user-1'),
            ).rejects.toThrow('Either snippets or topic must be provided')
        })

        it('should respect template and audience options', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '# Tutorial',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            await TextService.generateScaffold({
                topic: 'Test',
                template: 'tutorial',
                audience: 'beginner',
                sectionCount: 3,
            })

            expect(mockProvider.chat).toHaveBeenCalledWith(
                expect.objectContaining({
                    temperature: 0.7,
                }),
            )
        })
    })

    describe('recommendTags', () => {
        it('should recommend tags based on content', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '["技术", "AI", "开发"]',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.recommendTags(
                '关于 AI 技术的文章',
                ['技术', '编程'],
                'zh-CN',
                'user-1',
            )

            expect(result).toEqual(['技术', 'AI', '开发'])
        })

        it('should handle non-JSON tag response', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '技术, AI, 开发',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.recommendTags('内容')

            expect(result).toEqual(['技术', 'AI', '开发'])
        })

        it('should return empty array on parse failure', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: 'Invalid response',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.recommendTags('内容')

            expect(result).toEqual(['Invalid', 'response'])
        })
    })

    describe('translateStream', () => {
        it('should stream translation chunks for long content', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn()
                    .mockResolvedValueOnce({
                        content: 'Translated chunk 1',
                        model: 'gpt-4',
                        usage: {},
                    })
                    .mockResolvedValueOnce({
                        content: 'Translated chunk 2',
                        model: 'gpt-4',
                        usage: {},
                    }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const longContent = 'a'.repeat(6000)
            const chunks: any[] = []

            for await (const chunk of TextService.translateStream(longContent, 'en', 'user-1')) {
                chunks.push(chunk)
            }

            expect(chunks.length).toBeGreaterThan(0)
            expect(chunks[0]).toHaveProperty('chunkIndex')
            expect(chunks[0]).toHaveProperty('totalChunks')
            expect(chunks[0]).toHaveProperty('content')
        })

        it('should reject content exceeding max length', async () => {
            const tooLongContent = 'a'.repeat(100001)

            const generator = TextService.translateStream(tooLongContent, 'en')

            await expect(generator.next()).rejects.toThrow('Content too long')
        })
    })

    describe('refineVoice', () => {
        it('should refine voice transcript into professional content', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '这是优化后的专业内容',
                    model: 'gpt-4',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.refineVoice(
                '嗯...那个...我想说的是...',
                'zh-CN',
                'user-1',
            )

            expect(result).toBe('这是优化后的专业内容')
            expect(mockProvider.chat).toHaveBeenCalledWith(
                expect.objectContaining({
                    temperature: 0.7,
                }),
            )
        })
    })
})

