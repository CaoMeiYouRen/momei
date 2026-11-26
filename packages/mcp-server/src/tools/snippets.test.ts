import { describe, it, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerSnippetTools } from './snippets'

interface ToolResponse {
    content: { type: string, text: string }[]
    isError?: boolean
}

type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResponse>

const {
    mockListSnippets,
    mockCreateSnippet,
    mockGetSnippet,
    mockUpdateSnippet,
    mockConvertSnippetToPost,
    mockDeleteSnippet,
} = vi.hoisted(() => ({
    mockListSnippets: vi.fn(),
    mockCreateSnippet: vi.fn(),
    mockGetSnippet: vi.fn(),
    mockUpdateSnippet: vi.fn(),
    mockConvertSnippetToPost: vi.fn(),
    mockDeleteSnippet: vi.fn(),
}))

vi.mock('../lib/api', () => ({
    MomeiApi: class {
        listSnippets = mockListSnippets
        createSnippet = mockCreateSnippet
        getSnippet = mockGetSnippet
        updateSnippet = mockUpdateSnippet
        convertSnippetToPost = mockConvertSnippetToPost
        deleteSnippet = mockDeleteSnippet
    },
}))

function getRegisteredHandler(registerSpy: ReturnType<typeof vi.spyOn>, toolName: string): ToolHandler {
    let toolRegistration: [string, unknown, ToolHandler] | undefined

    for (const registeredCall of registerSpy.mock.calls) {
        if (registeredCall[0] === toolName) {
            toolRegistration = registeredCall as [string, unknown, ToolHandler]
            break
        }
    }

    const handler = toolRegistration?.[2]

    expect(handler).toBeTypeOf('function')
    return handler!
}

interface ZodField {
    parse: (value: unknown) => unknown
    safeParse: (value: unknown) => { success: boolean }
}

function getRegisteredOptions(registerSpy: ReturnType<typeof vi.spyOn>, toolName: string): { inputSchema: Record<string, ZodField> } {
    let toolRegistration: [string, { inputSchema: Record<string, ZodField> }, unknown] | undefined

    for (const registeredCall of registerSpy.mock.calls) {
        if (registeredCall[0] === toolName) {
            toolRegistration = registeredCall as [string, { inputSchema: Record<string, ZodField> }, unknown]
            break
        }
    }

    expect(toolRegistration).toBeDefined()
    return toolRegistration![1]
}

const baseConfig = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: false }

describe('Snippet Tools Registration', () => {
    let server: McpServer

    beforeEach(() => {
        server = new McpServer({ name: 'test', version: '1.0.0' })
        vi.resetAllMocks()
    })

    it('should register snippet tools without the dangerous delete tool', () => {
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerSnippetTools(server, baseConfig)

        const registeredTools = registerSpy.mock.calls.map((call) => call[0])
        expect(registeredTools).toEqual(expect.arrayContaining([
            'list_snippets',
            'create_snippet',
            'get_snippet',
            'update_snippet',
            'convert_snippet_to_post',
        ]))
        expect(registeredTools).not.toContain('delete_snippet')
    })

    it('should register delete_snippet when dangerous tools are enabled', () => {
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerSnippetTools(server, { ...baseConfig, enableDangerousTools: true })

        const registeredTools = registerSpy.mock.calls.map((call) => call[0])
        expect(registeredTools).toContain('delete_snippet')
    })

    it('should list snippets and serialise the response payload', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockListSnippets.mockResolvedValue({ data: [{ id: 'snippet_1' }] })

        registerSnippetTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'list_snippets')({ page: 1, limit: 10 })

        expect(mockListSnippets).toHaveBeenCalledWith({ page: 1, limit: 10 })
        expect(result.isError).toBeUndefined()
        expect(result.content[0]?.text).toContain('snippet_1')
    })

    it('should create a snippet with the default inbox status when omitted', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockCreateSnippet.mockResolvedValue({ data: { id: 'snippet_2' } })

        registerSnippetTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'create_snippet')({
            content: 'idea',
            source: 'web',
        })

        expect(mockCreateSnippet).toHaveBeenCalledWith({ content: 'idea', source: 'web', status: 'inbox' })
        expect(result.content[0]?.text).toContain('snippet_2')
    })

    it('should create a snippet with an explicit status', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockCreateSnippet.mockResolvedValue({ data: { id: 'snippet_3' } })

        registerSnippetTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'create_snippet')({
            content: 'archived idea',
            status: 'archived',
        })

        expect(mockCreateSnippet).toHaveBeenCalledWith({ content: 'archived idea', status: 'archived' })
        expect(result.content[0]?.text).toContain('snippet_3')
    })

    it('should get a single snippet', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockGetSnippet.mockResolvedValue({ data: { id: 'snippet_1', content: 'idea' } })

        registerSnippetTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'get_snippet')({ id: 'snippet_1' })

        expect(mockGetSnippet).toHaveBeenCalledWith('snippet_1')
        expect(result.content[0]?.text).toContain('idea')
    })

    it('should update a snippet without the id in the payload', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockUpdateSnippet.mockResolvedValue({ data: { id: 'snippet_1' } })

        registerSnippetTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'update_snippet')({
            id: 'snippet_1',
            content: 'updated',
        })

        expect(mockUpdateSnippet).toHaveBeenCalledWith('snippet_1', { content: 'updated' })
        expect(result.content[0]?.text).toContain('updated successfully')
    })

    it('should convert a snippet to a post', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockConvertSnippetToPost.mockResolvedValue({ data: { postId: 'post_9' } })

        registerSnippetTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'convert_snippet_to_post')({ id: 'snippet_1' })

        expect(mockConvertSnippetToPost).toHaveBeenCalledWith('snippet_1')
        expect(result.content[0]?.text).toContain('post_9')
    })

    it('should delete a snippet when dangerous tools are enabled', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockDeleteSnippet.mockResolvedValue({ data: { id: 'snippet_1' } })

        registerSnippetTools(server, { ...baseConfig, enableDangerousTools: true })

        const result = await getRegisteredHandler(registerSpy, 'delete_snippet')({ id: 'snippet_1' })

        expect(mockDeleteSnippet).toHaveBeenCalledWith('snippet_1')
        expect(result.content[0]?.text).toContain('deleted successfully')
    })

    it('should expose zod defaults and bounds on the registered input schemas', () => {
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerSnippetTools(server, baseConfig)

        const listOptions = getRegisteredOptions(registerSpy, 'list_snippets')
        expect(listOptions.inputSchema.page?.parse(undefined)).toBe(1)
        expect(listOptions.inputSchema.limit?.parse(undefined)).toBe(10)
        expect(listOptions.inputSchema.limit?.safeParse(101).success).toBe(false)
        expect(listOptions.inputSchema.limit?.safeParse(0).success).toBe(false)

        const createOptions = getRegisteredOptions(registerSpy, 'create_snippet')
        expect(createOptions.inputSchema.source?.parse(undefined)).toBe('web')
        expect(createOptions.inputSchema.status?.parse(undefined)).toBe('inbox')
        expect(createOptions.inputSchema.content?.safeParse('').success).toBe(false)
    })

    it('should surface API errors as isError responses for every handler', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        const failure = new Error('api unavailable')
        mockListSnippets.mockRejectedValue(failure)
        mockCreateSnippet.mockRejectedValue(failure)
        mockGetSnippet.mockRejectedValue(failure)
        mockUpdateSnippet.mockRejectedValue(failure)
        mockConvertSnippetToPost.mockRejectedValue(failure)
        mockDeleteSnippet.mockRejectedValue(failure)

        registerSnippetTools(server, { ...baseConfig, enableDangerousTools: true })

        const cases: Array<[string, Record<string, unknown>]> = [
            ['list_snippets', { page: 1, limit: 10 }],
            ['create_snippet', { content: 'idea' }],
            ['get_snippet', { id: 'snippet_1' }],
            ['update_snippet', { id: 'snippet_1' }],
            ['convert_snippet_to_post', { id: 'snippet_1' }],
            ['delete_snippet', { id: 'snippet_1' }],
        ]

        for (const [toolName, input] of cases) {
            const result = await getRegisteredHandler(registerSpy, toolName)(input)
            expect(result.isError).toBe(true)
            expect(result.content[0]?.text).toContain('api unavailable')
        }
    })
})
