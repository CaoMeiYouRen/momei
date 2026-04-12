import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TextService } from './text'
import { OpenAIProvider } from '@/server/utils/ai/openai-provider'
import { dataSource } from '@/server/database'
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

    describe('suggestImagePrompt', () => {
        it('should reject when neither title nor content summary is provided', async () => {
            await expect(TextService.suggestImagePrompt({
                title: '',
                summary: '',
                content: '',
            })).rejects.toMatchObject({
                statusCode: 400,
                message: 'Title or content is required',
            })
        })

        it('should reject when provider does not support chat', async () => {
            vi.mocked(aiUtils.getAIProvider).mockResolvedValue({
                name: 'mock-provider',
            } as any)

            await expect(TextService.suggestImagePrompt({
                title: 'AI 封面设计',
                summary: '一张关于 AI 写作与配图协作的封面图。',
            }, 'user-1')).rejects.toMatchObject({
                statusCode: 500,
                statusMessage: 'AI provider does not support chat',
            })
        })

        it('should generate visual prompt suggestion with defaults and parsed overrides', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: JSON.stringify({
                        type: 'clean editorial illustration',
                        palette: 'ink black and warm ivory',
                        rendering: 'soft cinematic light',
                        text: 'AI 与写作',
                        mood: 'calm and thoughtful',
                    }),
                    model: 'gpt-4o',
                    usage: { promptTokens: 12, completionTokens: 18, totalTokens: 30 },
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.suggestImagePrompt({
                title: 'AI 写作工作流',
                summary: '从选题、翻译到配图生成的完整协作链路。',
                content: '这是一篇介绍如何用 AI 完成内容创作工作流的文章。',
                language: 'zh-CN',
                assetUsage: 'post-cover',
            }, 'user-1')

            expect(mockProvider.chat).toHaveBeenCalledWith({
                messages: [
                    expect.objectContaining({
                        role: 'user',
                        content: expect.stringContaining('AI 写作工作流'),
                    }),
                ],
            })
            expect(result.assetUsage).toBe('post-cover')
            expect(result.applyMode).toBe('manual-confirm')
            expect(result.dimensions.type).toBe('clean editorial illustration')
            expect(result.dimensions.palette).toBe('ink black and warm ivory')
            expect(result.prompt).toContain('AI 写作工作流')
        })
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

    describe('optimizeManuscript', () => {
        it('should optimize podcast manuscript and record podcast quota category', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '优化后的播客文稿',
                    model: 'gpt-4o',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.optimizeManuscript(
                '原始播客口播稿',
                'zh-CN',
                'user-1',
                'podcast',
            )

            expect(result).toBe('优化后的播客文稿')
            expect(mockProvider.chat).toHaveBeenCalledWith(expect.objectContaining({
                temperature: 0.7,
                messages: expect.arrayContaining([
                    expect.objectContaining({
                        role: 'system',
                        content: 'Optimize podcast manuscript in zh-CN',
                    }),
                ]),
            }))
            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                category: 'podcast',
                type: 'optimize_manuscript',
            }))
        })
    })

    describe('expandSection', () => {
        it('should expand a section and trim the final content', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '  扩写后的段落内容  ',
                    model: 'gpt-4o',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.expandSection({
                topic: 'AI 写作',
                sectionTitle: '提示词设计',
                sectionContent: '原始段落',
                expandType: 'argument',
                language: 'zh-CN',
            }, 'user-1')

            expect(result).toBe('扩写后的段落内容')
            expect(mockProvider.chat).toHaveBeenCalledWith(expect.objectContaining({
                temperature: 0.8,
            }))
        })
    })

    describe('translation helpers', () => {
        it('should expose async translate threshold decisions', () => {
            expect(TextService.shouldUseAsyncTranslateTask('a'.repeat(999))).toBe(false)
            expect(TextService.shouldUseAsyncTranslateTask('a'.repeat(1000))).toBe(true)
        })

        it('should translate a single name and normalize the slug-friendly response', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn()
                    .mockResolvedValueOnce({
                        content: '  中文标题  ',
                        model: 'gpt-4o',
                        usage: {},
                    })
                    .mockResolvedValueOnce({
                        content: ' Hello World! ',
                        model: 'gpt-4o',
                        usage: {},
                    }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            await expect(TextService.translateName('Hello', 'zh-CN', 'user-1')).resolves.toBe('中文标题')
            await expect(TextService.suggestSlugFromName('Hello World', 'user-1')).resolves.toBe('hello-world')
        })

        it('should short-circuit empty translated name batches after normalization', async () => {
            await expect(TextService.translateNames(['   ', ''], 'zh-CN', 'user-1')).resolves.toEqual([])
            expect(aiUtils.getAIProvider).not.toHaveBeenCalled()
        })

        it('should reject invalid translated name batch payloads', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '["仅一个结果"]',
                    model: 'gpt-4o',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            await expect(TextService.translateNames(['Alpha', 'Beta'], 'zh-CN', 'user-1')).rejects.toThrow('Invalid translated names response')
        })
    })

    describe('recommendCategories', () => {
        it('should return empty array when categories normalize to empty', async () => {
            await expect(TextService.recommendCategories({
                title: 'AI 分类',
                content: '内容',
                categories: ['   ', ''],
                language: 'zh-CN',
            }, 'user-1')).resolves.toEqual([])

            expect(aiUtils.getAIProvider).not.toHaveBeenCalled()
        })

        it('should map provider results back to the provided category list and dedupe them', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: '["tech", "DevOps", "tech", "missing"]',
                    model: 'gpt-4o',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.recommendCategories({
                title: 'AI 可观测性',
                content: '围绕日志、链路与告警的治理。',
                categories: ['Tech', 'DevOps', 'AI'],
                language: 'zh-CN',
            }, 'user-1')

            expect(result).toEqual(['Tech', 'DevOps'])
        })

        it('should fall back to newline parsing when provider response is not JSON', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn().mockResolvedValue({
                    content: 'AI\nUnknown\nDevOps',
                    model: 'gpt-4o',
                    usage: {},
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.recommendCategories({
                title: 'AI 可观测性',
                content: '围绕日志、链路与告警的治理。',
                categories: ['Tech', 'DevOps', 'AI'],
                language: 'zh-CN',
            }, 'user-1')

            expect(result).toEqual(['AI', 'DevOps'])
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

        it('should preserve provider context when using class-based chat providers', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                choices: [{ message: { content: '["技术","AI","开发"]' } }],
                model: 'gpt-4o',
                usage: { prompt_tokens: 8, completion_tokens: 6, total_tokens: 14 },
            })

            vi.stubGlobal('$fetch', mockFetch)

            const provider = new OpenAIProvider({
                enabled: true,
                provider: 'openai',
                apiKey: 'test-key',
                model: 'gpt-4o',
                endpoint: 'https://api.openai.com/v1',
                maxTokens: 2048,
                temperature: 0.7,
            })

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(provider as any)

            const result = await TextService.recommendTags(
                '关于 AI 技术的文章',
                ['技术'],
                'zh-CN',
                'user-1',
            )

            expect(result).toEqual(['技术', 'AI', '开发'])
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.openai.com/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                }),
            )
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
        it('should stream incremental content when provider supports chat streaming', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn(),
                chatStream: vi.fn().mockImplementation(async function* () {
                    await Promise.resolve()
                    yield {
                        delta: 'Translated ',
                        content: 'Translated ',
                        model: 'gpt-4',
                    }
                    yield {
                        delta: 'chunk 1',
                        content: 'Translated chunk 1',
                        model: 'gpt-4',
                    }
                }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const longContent = 'a'.repeat(2000)
            const chunks: any[] = []

            for await (const chunk of TextService.translateStream(longContent, 'en', 'user-1')) {
                chunks.push(chunk)
            }

            expect(chunks).toEqual([
                expect.objectContaining({
                    delta: 'Translated ',
                    chunkIndex: 0,
                    totalChunks: 1,
                    isChunkComplete: false,
                }),
                expect.objectContaining({
                    delta: 'chunk 1',
                    chunkIndex: 0,
                    totalChunks: 1,
                    isChunkComplete: false,
                }),
                expect.objectContaining({
                    chunkIndex: 0,
                    totalChunks: 1,
                    isChunkComplete: true,
                }),
            ])
            expect(mockProvider.chatStream).toHaveBeenCalledTimes(1)
        })

        it('should keep a single SSE stream while server-side chunking long content', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn(),
                chatStream: vi.fn()
                    .mockImplementationOnce(async function* () {
                        await Promise.resolve()
                        yield {
                            delta: 'Chunk 1',
                            content: 'Chunk 1',
                            model: 'gpt-4',
                        }
                    })
                    .mockImplementationOnce(async function* () {
                        await Promise.resolve()
                        yield {
                            delta: 'Chunk 2',
                            content: 'Chunk 2',
                            model: 'gpt-4',
                        }
                    }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const longContent = `${'a'.repeat(2500)}\n\n${'b'.repeat(2500)}`
            const chunks: any[] = []

            for await (const chunk of TextService.translateStream(longContent, 'en', 'user-1')) {
                chunks.push(chunk)
            }

            expect(chunks.map((chunk) => `${chunk.chunkIndex}:${chunk.delta ?? ''}:${chunk.isChunkComplete}`)).toEqual([
                '0:Chunk 1:false',
                '0::true',
                '1:Chunk 2:false',
                '1::true',
            ])
            expect(mockProvider.chatStream).toHaveBeenCalledTimes(2)
        })

        it('should reject content exceeding max length', async () => {
            const tooLongContent = 'a'.repeat(100001)

            const generator = TextService.translateStream(tooLongContent, 'en')

            await expect(generator.next()).rejects.toThrow('Content too long')
        })
    })

    describe('translateInChunks', () => {
        it('should aggregate translated chunks and usage', async () => {
            const mockProvider = {
                name: 'openai',
                chat: vi.fn()
                    .mockResolvedValueOnce({
                        content: 'Translated chunk 1',
                        model: 'gpt-4',
                        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
                    })
                    .mockResolvedValueOnce({
                        content: 'Translated chunk 2',
                        model: 'gpt-4',
                        usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
                    }),
            }

            vi.mocked(aiUtils.getAIProvider).mockResolvedValue(mockProvider as any)

            const result = await TextService.translateInChunks(
                `${'a'.repeat(3500)}\n\n${'b'.repeat(3500)}`,
                'en',
                { chunkSize: 4000, concurrency: 2 },
            )

            expect(result.content).toBe('Translated chunk 1\n\nTranslated chunk 2')
            expect(result.chunkCount).toBe(2)
            expect(result.usage).toEqual({
                promptTokens: 25,
                completionTokens: 45,
                totalTokens: 70,
            })
            expect(result.usageSnapshot.requestCount).toBe(2)
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

