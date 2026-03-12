import { describe, it, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAutomationTools } from './automation'

interface ToolResponse {
    content: { type: string, text: string }[]
    isError?: boolean
}

type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResponse>

const {
    mockGetPost,
    mockSuggestTitles,
    mockRecommendTags,
    mockRecommendCategories,
    mockTranslatePost,
    mockGenerateCoverImage,
    mockCreateTTSTask,
    mockGetAITask,
} = vi.hoisted(() => ({
    mockGetPost: vi.fn(),
    mockSuggestTitles: vi.fn(),
    mockRecommendTags: vi.fn(),
    mockRecommendCategories: vi.fn(),
    mockTranslatePost: vi.fn(),
    mockGenerateCoverImage: vi.fn(),
    mockCreateTTSTask: vi.fn(),
    mockGetAITask: vi.fn(),
}))

vi.mock('../lib/api', () => {
    return {
        MomeiApi: class {
            getPost = mockGetPost
            suggestTitles = mockSuggestTitles
            recommendTags = mockRecommendTags
            recommendCategories = mockRecommendCategories
            translatePost = mockTranslatePost
            generateCoverImage = mockGenerateCoverImage
            createTTSTask = mockCreateTTSTask
            getAITask = mockGetAITask
        },
    }
})

function getRegisteredHandler(registerSpy: ReturnType<typeof vi.spyOn>, toolName: string): ToolHandler {
    let toolRegistration: (typeof registerSpy.mock.calls)[number] | undefined

    for (const registeredCall of registerSpy.mock.calls) {
        if (registeredCall[0] === toolName) {
            toolRegistration = registeredCall
            break
        }
    }

    expect(toolRegistration?.[2]).toBeTypeOf('function')
    return toolRegistration?.[2] as ToolHandler
}

describe('Automation Tools Registration', () => {
    let server: McpServer

    beforeEach(() => {
        server = new McpServer({ name: 'test', version: '1.0.0' })
        vi.clearAllMocks()
    })

    it('should register automation tools', () => {
        const config = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: false }
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerAutomationTools(server, config)

        const registeredTools = registerSpy.mock.calls.map((call) => call[0])
        expect(registeredTools).toContain('suggest_titles')
        expect(registeredTools).toContain('recommend_tags')
        expect(registeredTools).toContain('recommend_categories')
        expect(registeredTools).toContain('translate_post')
        expect(registeredTools).toContain('generate_cover_image')
        expect(registeredTools).toContain('generate_post_audio')
        expect(registeredTools).toContain('get_ai_task')
    })

    it('should call suggest_titles handler with post content and language', async () => {
        const config = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: false }
        const registerSpy = vi.spyOn(server, 'registerTool')

        mockGetPost.mockResolvedValue({
            data: {
                content: 'post body',
                language: 'zh-CN',
                tags: [{ name: 'nuxt' }],
            },
        })
        mockSuggestTitles.mockResolvedValue({
            data: ['标题一', '标题二'],
        })

        registerAutomationTools(server, config)

        const handler = getRegisteredHandler(registerSpy, 'suggest_titles')
        const result = await handler({ postId: 'post_1' })

        expect(mockGetPost).toHaveBeenCalledWith('post_1')
        expect(mockSuggestTitles).toHaveBeenCalledWith({
            content: 'post body',
            language: 'zh-CN',
        })
        expect(result?.isError).toBeUndefined()
        expect(result?.content[0]?.text).toContain('标题一')
    })

    it('should call recommend_tags handler with extracted tag names', async () => {
        const config = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: false }
        const registerSpy = vi.spyOn(server, 'registerTool')

        mockGetPost.mockResolvedValue({
            data: {
                content: 'post body',
                language: 'zh-CN',
                tags: ['nuxt', { name: 'i18n' }, { foo: 'ignored' }],
            },
        })
        mockRecommendTags.mockResolvedValue({
            data: ['nuxt', 'i18n', 'automation'],
        })

        registerAutomationTools(server, config)

        const handler = getRegisteredHandler(registerSpy, 'recommend_tags')
        const result = await handler({ postId: 'post_2' })

        expect(mockRecommendTags).toHaveBeenCalledWith({
            content: 'post body',
            existingTags: ['nuxt', 'i18n'],
            language: 'zh-CN',
        })
        expect(result?.content[0]?.text).toContain('automation')
    })

    it('should call recommend_categories handler with target language payload', async () => {
        const config = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: false }
        const registerSpy = vi.spyOn(server, 'registerTool')

        mockRecommendCategories.mockResolvedValue({
            data: {
                matchedCategoryId: 'cat_1',
                candidates: [{ id: 'cat_1', name: 'Engineering', slug: 'engineering', language: 'en-US', reason: 'ai-recommended' }],
            },
        })

        registerAutomationTools(server, config)

        const handler = getRegisteredHandler(registerSpy, 'recommend_categories')
        const result = await handler({ postId: 'post_3', targetLanguage: 'en-US', limit: 3 })

        expect(mockRecommendCategories).toHaveBeenCalledWith({
            postId: 'post_3',
            targetLanguage: 'en-US',
            sourceLanguage: undefined,
            limit: 3,
        })
        expect(result?.content[0]?.text).toContain('Engineering')
    })

    it('should call long-running automation handlers with task payloads', async () => {
        const config = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: false }
        const registerSpy = vi.spyOn(server, 'registerTool')

        mockTranslatePost.mockResolvedValue({ data: { taskId: 'task_translate', status: 'pending' } })
        mockGenerateCoverImage.mockResolvedValue({ data: { taskId: 'task_cover', status: 'pending' } })
        mockCreateTTSTask.mockResolvedValue({ data: { taskId: 'task_audio', status: 'pending' } })
        mockGetAITask.mockResolvedValue({ data: { taskId: 'task_audio', status: 'completed' } })

        registerAutomationTools(server, config)

        const translateHandler = getRegisteredHandler(registerSpy, 'translate_post')
        const coverHandler = getRegisteredHandler(registerSpy, 'generate_cover_image')
        const audioHandler = getRegisteredHandler(registerSpy, 'generate_post_audio')
        const taskHandler = getRegisteredHandler(registerSpy, 'get_ai_task')

        const translateResult = await translateHandler({
            sourcePostId: 'post_1',
            targetLanguage: 'en-US',
            targetStatus: 'draft',
            slugStrategy: 'ai',
            categoryStrategy: 'suggest',
            confirmationMode: 'require',
        })
        const coverResult = await coverHandler({
            postId: 'post_1',
            prompt: 'cover prompt',
            quality: 'hd',
        })
        const audioResult = await audioHandler({
            postId: 'post_1',
            voice: 'voice_1',
            mode: 'speech',
        })
        const taskResult = await taskHandler({ taskId: 'task_audio' })

        expect(mockTranslatePost).toHaveBeenCalledWith({
            sourcePostId: 'post_1',
            targetLanguage: 'en-US',
            targetStatus: 'draft',
            slugStrategy: 'ai',
            categoryStrategy: 'suggest',
            confirmationMode: 'require',
        })
        expect(mockGenerateCoverImage).toHaveBeenCalledWith({
            postId: 'post_1',
            prompt: 'cover prompt',
            model: undefined,
            size: undefined,
            aspectRatio: undefined,
            quality: 'hd',
            style: undefined,
            n: 1,
        })
        expect(mockCreateTTSTask).toHaveBeenCalledWith({
            postId: 'post_1',
            voice: 'voice_1',
            provider: undefined,
            mode: 'speech',
            model: undefined,
            script: undefined,
        })
        expect(mockGetAITask).toHaveBeenCalledWith('task_audio')
        expect(translateResult?.content[0]?.text).toContain('task_translate')
        expect(coverResult?.content[0]?.text).toContain('task_cover')
        expect(audioResult?.content[0]?.text).toContain('task_audio')
        expect(taskResult?.content[0]?.text).toContain('completed')
    })
})
