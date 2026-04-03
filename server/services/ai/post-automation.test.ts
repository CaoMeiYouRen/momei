import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestTranslation, translateInChunks } from './text-translation'
import { TextService } from './text'
import { PostAutomationService } from './post-automation'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { createPostService, updatePostService } from '@/server/services/post'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/post', () => ({
    createPostService: vi.fn(),
    updatePostService: vi.fn(),
}))

vi.mock('./text-translation', () => ({
    requestTranslation: vi.fn(),
    translateInChunks: vi.fn(),
}))

vi.mock('./text', () => ({
    TextService: {
        translateName: vi.fn(),
        suggestSlugFromName: vi.fn(),
        suggestSlug: vi.fn(),
        recommendCategories: vi.fn(),
    },
}))

describe('PostAutomationService', () => {
    const actor = { userId: 'user-1', isAdmin: true }

    const sourcePost = {
        id: 'post-1',
        title: '源文标题',
        content: '源文内容',
        summary: '源文摘要',
        language: 'zh-CN',
        slug: 'yuan-wen-biao-ti',
        authorId: 'user-1',
        category: {
            id: 'cat-zh',
            name: '工程实践',
            slug: 'gong-cheng-shi-jian',
            language: 'zh-CN',
            translationId: 'engineering-practice',
        },
        tags: [],
        visibility: 'public',
        coverImage: null,
        metadata: null,
        copyright: null,
        translationId: 'yuan-wen-biao-ti',
        status: 'draft',
    }

    let taskRepo: { findOneBy: ReturnType<typeof vi.fn>, save: ReturnType<typeof vi.fn>, create: ReturnType<typeof vi.fn> }
    let postRepo: { findOne: ReturnType<typeof vi.fn> }
    let categoryRepo: { find: ReturnType<typeof vi.fn> }
    let tagRepo: { findOne: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        vi.clearAllMocks()

        taskRepo = {
            findOneBy: vi.fn(),
            save: vi.fn((value) => Promise.resolve(value)),
            create: vi.fn((value) => ({ ...value, id: value.id || 'task-generated' })),
        }
        postRepo = {
            findOne: vi.fn(),
        }
        categoryRepo = {
            find: vi.fn(),
        }
        tagRepo = {
            findOne: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if (entity === AITask) {
                return taskRepo as never
            }
            if (entity === Post) {
                return postRepo as never
            }
            if (entity === Category) {
                return categoryRepo as never
            }
            if (entity === Tag) {
                return tagRepo as never
            }
            throw new Error(`Unexpected entity: ${entity instanceof Function ? entity.name : 'unknown-entity'}`)
        })

        postRepo.findOne.mockImplementation((options: { where?: Record<string, string> }) => {
            if (options.where?.id === 'post-1') {
                return sourcePost as never
            }

            return null as never
        })

        vi.mocked(requestTranslation).mockImplementation((content: string) => ({
            provider: {} as never,
            response: {
                content: `${content}-translated`,
                model: 'mock-translate-model',
                usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
            },
            translatedContent: `${content}-translated`,
        }) as never)
        vi.mocked(translateInChunks).mockResolvedValue({
            content: 'translated-content',
            usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
            usageSnapshot: { requestCount: 1 },
        } as never)
        vi.mocked(TextService.translateName).mockResolvedValue('Engineering Practice')
        vi.mocked(TextService.suggestSlugFromName).mockResolvedValue('engineering-practice')
        vi.mocked(TextService.suggestSlug).mockResolvedValue('translated-title-ai')
        vi.mocked(TextService.recommendCategories).mockResolvedValue(['Engineering'])
        vi.mocked(createPostService).mockResolvedValue({ id: 'post-en-1', slug: 'translated-title-ai' } as never)
        vi.mocked(updatePostService).mockResolvedValue({ id: 'post-en-1', slug: 'translated-title-ai' } as never)
    })

    it('should recommend target language categories from translation cluster and AI candidates', async () => {
        categoryRepo.find.mockResolvedValue([
            { id: 'cat-en-1', name: 'Engineering Practice', slug: 'engineering-practice', language: 'en-US', translationId: 'engineering-practice' },
            { id: 'cat-en-2', name: 'Engineering', slug: 'engineering', language: 'en-US', translationId: 'engineering' },
        ])

        const result = await PostAutomationService.recommendCategoriesForPost({
            postId: 'post-1',
            targetLanguage: 'en-US',
        }, actor)

        expect(result.matchedCategoryId).toBe('cat-en-1')
        expect(result.candidates.map((item) => item.reason)).toContain('translation-cluster')
        expect(result.proposedCategory?.slug).toBe('engineering-practice')
    })

    it('should persist a preview task without writing a translated post', async () => {
        const task = {
            id: 'task-preview',
            userId: 'user-1',
            payload: JSON.stringify({
                sourcePostId: 'post-1',
                targetLanguage: 'en-US',
                scopes: ['title', 'content', 'summary', 'category'],
                confirmationMode: 'require',
                slugStrategy: 'ai',
                categoryStrategy: 'suggest',
            }),
            progress: 0,
            status: 'pending',
            error: null,
            result: null,
        }

        taskRepo.findOneBy.mockImplementation((where: { id: string }) => {
            if (where.id === 'task-preview') {
                return task as never
            }

            return task as never
        })
        categoryRepo.find.mockResolvedValue([
            { id: 'cat-en-1', name: 'Engineering Practice', slug: 'engineering-practice', language: 'en-US', translationId: 'engineering-practice' },
            { id: 'cat-en-2', name: 'Engineering', slug: 'engineering', language: 'en-US', translationId: 'engineering' },
        ])

        await (PostAutomationService as never as { processTranslatePostTask: (taskId: string, actorValue: typeof actor) => Promise<void> }).processTranslatePostTask('task-preview', actor)

        expect(createPostService).not.toHaveBeenCalled()
        expect(updatePostService).not.toHaveBeenCalled()

        const completedTask = taskRepo.save.mock.calls
            .map((call) => call[0])
            .find((savedTask) => savedTask.status === 'completed' && typeof savedTask.result === 'string')

        expect(completedTask).toBeDefined()
        const result = JSON.parse(String(completedTask?.result)) as { needsConfirmation: boolean, preview: { slug: string } }
        expect(result.needsConfirmation).toBe(true)
        expect(result.preview.slug).toBe('translated-title-ai')
    })

    it('should resolve tags before chunked content translation in preview tasks', async () => {
        const savedProgresses: number[] = []
        const task = {
            id: 'task-tags-before-content',
            userId: 'user-1',
            payload: JSON.stringify({
                sourcePostId: 'post-1',
                targetLanguage: 'en-US',
                scopes: ['title', 'summary', 'tags', 'content'],
                confirmationMode: 'require',
                slugStrategy: 'ai',
                categoryStrategy: 'cluster',
            }),
            progress: 0,
            status: 'pending',
            error: null,
            result: null,
        }

        taskRepo.findOneBy.mockResolvedValue(task as never)
        taskRepo.save.mockImplementation((value) => {
            if (typeof value?.progress === 'number') {
                savedProgresses.push(value.progress)
            }

            return { ...value } as never
        })
        postRepo.findOne.mockImplementation((options: { where?: Record<string, string> }) => {
            if (options.where?.id === 'post-1') {
                return {
                    ...sourcePost,
                    tags: [{
                        id: 'tag-zh-1',
                        name: '源标签',
                        slug: 'source-tag',
                        language: 'zh-CN',
                        translationId: 'shared-tag-cluster',
                    }],
                } as never
            }

            return null as never
        })

        vi.mocked(translateInChunks).mockImplementationOnce(() => {
            expect(savedProgresses).toContain(40)

            return Promise.resolve({
                content: 'translated-content',
                usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
                usageSnapshot: { requestCount: 1 },
            } as never)
        })

        await (PostAutomationService as never as { processTranslatePostTask: (taskId: string, actorValue: typeof actor) => Promise<void> }).processTranslatePostTask('task-tags-before-content', actor)

        expect(savedProgresses).toContain(40)

        const completedTask = taskRepo.save.mock.calls
            .map((call) => call[0])
            .find((savedTask) => savedTask.status === 'completed' && typeof savedTask.result === 'string')

        expect(completedTask).toBeDefined()
        const result = JSON.parse(String(completedTask?.result)) as {
            needsConfirmation: boolean
            preview: {
                tags: string[]
                tagBindings: { name: string, translationId?: string | null }[]
            }
        }

        expect(result.needsConfirmation).toBe(true)
        expect(result.preview.tags).toEqual(['源标签-translated'])
        expect(result.preview.tagBindings[0]?.translationId).toBe('shared-tag-cluster')
    })

    it('should keep preview generation running when tag translation fails', async () => {
        const task = {
            id: 'task-tags-failed-preview',
            userId: 'user-1',
            payload: JSON.stringify({
                sourcePostId: 'post-1',
                targetLanguage: 'en-US',
                scopes: ['title', 'tags', 'content'],
                confirmationMode: 'require',
                slugStrategy: 'ai',
                categoryStrategy: 'cluster',
            }),
            progress: 0,
            status: 'pending',
            error: null,
            result: null,
        }

        taskRepo.findOneBy.mockResolvedValue(task as never)
        postRepo.findOne.mockImplementation((options: { where?: Record<string, string> }) => {
            if (options.where?.id === 'post-1') {
                return {
                    ...sourcePost,
                    tags: [{
                        id: 'tag-zh-1',
                        name: '源标签',
                        slug: 'source-tag',
                        language: 'zh-CN',
                        translationId: 'shared-tag-cluster',
                    }],
                } as never
            }

            return null as never
        })

        vi.mocked(requestTranslation).mockImplementation((content: string) => {
            if (content === '源标签') {
                throw new Error('tag provider offline')
            }

            return {
                provider: {} as never,
                response: {
                    content: `${content}-translated`,
                    model: 'mock-translate-model',
                    usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
                },
                translatedContent: `${content}-translated`,
            } as never
        })

        await (PostAutomationService as never as { processTranslatePostTask: (taskId: string, actorValue: typeof actor) => Promise<void> }).processTranslatePostTask('task-tags-failed-preview', actor)

        const completedTask = taskRepo.save.mock.calls
            .map((call) => call[0])
            .find((savedTask) => savedTask.status === 'completed' && typeof savedTask.result === 'string')

        expect(completedTask).toBeDefined()
        const result = JSON.parse(String(completedTask?.result)) as {
            needsConfirmation: boolean
            preview: {
                content: string
                tags: string[]
                tagBindings: unknown[]
                warnings: string[]
            }
        }

        expect(result.needsConfirmation).toBe(true)
        expect(result.preview.content).toBe('translated-content')
        expect(result.preview.tags).toEqual([])
        expect(result.preview.tagBindings).toEqual([])
        expect(result.preview.warnings).toContain('Tag translation failed: tag provider offline')
    })

    it('should apply an approved preview snapshot when confirmation is provided', async () => {
        const confirmTask = {
            id: 'task-confirm',
            userId: 'user-1',
            payload: JSON.stringify({
                sourcePostId: 'post-1',
                targetLanguage: 'en-US',
                confirmationMode: 'confirmed',
                previewTaskId: 'preview-1',
                approvedSlug: 'custom-preview-slug',
                approvedCategoryId: 'cat-approved',
            }),
            progress: 0,
            status: 'pending',
            error: null,
            result: null,
        }

        const previewTask = {
            id: 'preview-1',
            userId: 'user-1',
            type: 'translate_post',
            status: 'completed',
            result: JSON.stringify({
                needsConfirmation: true,
                preview: {
                    sourcePostId: 'post-1',
                    targetPostId: null,
                    targetLanguage: 'en-US',
                    translationId: 'yuan-wen-biao-ti',
                    appliedScopes: ['title', 'content', 'summary', 'category'],
                    title: 'Translated Title',
                    summary: 'Translated Summary',
                    content: 'Translated Content',
                    slug: 'preview-slug',
                    slugStrategy: 'ai',
                    categoryId: 'cat-original',
                    categoryRecommendation: null,
                    tags: [],
                    tagBindings: [],
                    coverImage: null,
                    metadata: null,
                    copyright: null,
                    visibility: 'public',
                    status: 'draft',
                    warnings: [],
                    coverImageCopied: false,
                    audioCopied: false,
                },
            }),
        }

        taskRepo.findOneBy.mockImplementation((where: { id: string }) => {
            if (where.id === 'preview-1') {
                return previewTask as never
            }

            if (where.id === 'task-confirm') {
                return confirmTask as never
            }

            return confirmTask as never
        })

        await (PostAutomationService as never as { processTranslatePostTask: (taskId: string, actorValue: typeof actor) => Promise<void> }).processTranslatePostTask('task-confirm', actor)

        expect(createPostService).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Translated Title',
            slug: 'custom-preview-slug',
            categoryId: 'cat-approved',
            content: 'Translated Content',
        }), 'user-1', {
            isAdmin: true,
        })

        const completedTask = taskRepo.save.mock.calls
            .map((call) => call[0])
            .find((savedTask) => savedTask.status === 'completed' && typeof savedTask.result === 'string')

        expect(completedTask).toBeDefined()
        const result = JSON.parse(String(completedTask?.result)) as { previewTaskId: string | null, slug: string }
        expect(result.previewTaskId).toBe('preview-1')
        expect(result.slug).toBe('custom-preview-slug')
    })

    it('should not copy source cover and audio assets into a new translated post', async () => {
        const task = {
            id: 'task-assets',
            userId: 'user-1',
            payload: JSON.stringify({
                sourcePostId: 'post-1',
                targetLanguage: 'en-US',
                scopes: ['title', 'content', 'summary', 'coverImage', 'audio'],
                confirmationMode: 'auto',
                slugStrategy: 'ai',
                categoryStrategy: 'cluster',
            }),
            progress: 0,
            status: 'pending',
            error: null,
            result: null,
        }

        postRepo.findOne.mockImplementation((options: { where?: Record<string, string> }) => {
            if (options.where?.id === 'post-1') {
                return {
                    ...sourcePost,
                    coverImage: '/covers/source-cover.png',
                    metadata: {
                        audio: {
                            url: '/audio/source.mp3',
                            duration: 42,
                        },
                        tts: {
                            provider: 'openai',
                            voice: 'alloy',
                        },
                    },
                } as never
            }

            return null as never
        })

        taskRepo.findOneBy.mockResolvedValue(task)

        await (PostAutomationService as never as { processTranslatePostTask: (taskId: string, actorValue: typeof actor) => Promise<void> }).processTranslatePostTask('task-assets', actor)

        expect(createPostService).toHaveBeenCalledWith(expect.objectContaining({
            coverImage: null,
            metadata: null,
        }), 'user-1', {
            isAdmin: true,
        })

        const completedTask = taskRepo.save.mock.calls
            .map((call) => call[0])
            .find((savedTask) => savedTask.status === 'completed' && typeof savedTask.result === 'string')

        expect(completedTask).toBeDefined()
        const result = JSON.parse(String(completedTask?.result)) as { coverImageCopied: boolean, audioCopied: boolean }
        expect(result.coverImageCopied).toBe(false)
        expect(result.audioCopied).toBe(false)
    })

    it('should warn that target locale cover and audio must be regenerated when assets are missing', async () => {
        const task = {
            id: 'task-asset-preview',
            userId: 'user-1',
            payload: JSON.stringify({
                sourcePostId: 'post-1',
                targetLanguage: 'en-US',
                scopes: ['title', 'coverImage', 'audio'],
                confirmationMode: 'require',
                slugStrategy: 'ai',
                categoryStrategy: 'cluster',
            }),
            progress: 0,
            status: 'pending',
            error: null,
            result: null,
        }

        postRepo.findOne.mockImplementation((options: { where?: Record<string, string> }) => {
            if (options.where?.id === 'post-1') {
                return {
                    ...sourcePost,
                    coverImage: '/covers/source-cover.png',
                    metadata: {
                        audio: {
                            url: '/audio/source.mp3',
                            duration: 42,
                        },
                    },
                } as never
            }

            return null as never
        })

        taskRepo.findOneBy.mockResolvedValue(task)

        await (PostAutomationService as never as { processTranslatePostTask: (taskId: string, actorValue: typeof actor) => Promise<void> }).processTranslatePostTask('task-asset-preview', actor)

        const completedTask = taskRepo.save.mock.calls
            .map((call) => call[0])
            .find((savedTask) => savedTask.status === 'completed' && typeof savedTask.result === 'string')

        expect(completedTask).toBeDefined()
        const result = JSON.parse(String(completedTask?.result)) as {
            needsConfirmation: boolean
            preview: {
                coverImage: string | null
                metadata: Record<string, unknown> | null
                warnings: string[]
            }
        }

        expect(result.needsConfirmation).toBe(true)
        expect(result.preview.coverImage).toBeNull()
        expect(result.preview.metadata).toBeNull()
        expect(result.preview.warnings).toContain('Cover image must be regenerated for en-US')
        expect(result.preview.warnings).toContain('Audio asset must be regenerated for en-US')
    })
})
