import { describe, it, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTaxonomyTools } from './taxonomy'

interface ToolResponse {
    content: { type: string, text: string }[]
    isError?: boolean
}

type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResponse>

const {
    mockListCategories,
    mockCreateCategory,
    mockUpdateCategory,
    mockDeleteCategory,
    mockListTags,
    mockCreateTag,
    mockUpdateTag,
    mockDeleteTag,
} = vi.hoisted(() => ({
    mockListCategories: vi.fn(),
    mockCreateCategory: vi.fn(),
    mockUpdateCategory: vi.fn(),
    mockDeleteCategory: vi.fn(),
    mockListTags: vi.fn(),
    mockCreateTag: vi.fn(),
    mockUpdateTag: vi.fn(),
    mockDeleteTag: vi.fn(),
}))

vi.mock('../lib/api', () => ({
    MomeiApi: class {
        listCategories = mockListCategories
        createCategory = mockCreateCategory
        updateCategory = mockUpdateCategory
        deleteCategory = mockDeleteCategory
        listTags = mockListTags
        createTag = mockCreateTag
        updateTag = mockUpdateTag
        deleteTag = mockDeleteTag
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

describe('Taxonomy Tools Registration', () => {
    let server: McpServer

    beforeEach(() => {
        server = new McpServer({ name: 'test', version: '1.0.0' })
        vi.resetAllMocks()
    })

    it('should register taxonomy tools without the dangerous delete tools', () => {
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerTaxonomyTools(server, baseConfig)

        const registeredTools = registerSpy.mock.calls.map((call) => call[0])
        expect(registeredTools).toEqual(expect.arrayContaining([
            'list_categories',
            'create_category',
            'update_category',
            'list_tags',
            'create_tag',
            'update_tag',
        ]))
        expect(registeredTools).not.toContain('delete_category')
        expect(registeredTools).not.toContain('delete_tag')
    })

    it('should register delete tools when dangerous tools are enabled', () => {
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerTaxonomyTools(server, { ...baseConfig, enableDangerousTools: true })

        const registeredTools = registerSpy.mock.calls.map((call) => call[0])
        expect(registeredTools).toContain('delete_category')
        expect(registeredTools).toContain('delete_tag')
    })

    it('should list categories', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockListCategories.mockResolvedValue({ data: { items: [{ id: 'cat_1', name: 'Engineering' }] } })

        registerTaxonomyTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'list_categories')({ page: 1, limit: 10 })

        expect(mockListCategories).toHaveBeenCalledWith({ page: 1, limit: 10 })
        expect(result.isError).toBeUndefined()
        expect(result.content[0]?.text).toContain('Engineering')
    })

    it('should create a category', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockCreateCategory.mockResolvedValue({ data: { id: 'cat_2' } })

        registerTaxonomyTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'create_category')({
            name: 'Engineering',
            slug: 'engineering',
        })

        expect(mockCreateCategory).toHaveBeenCalledWith({ name: 'Engineering', slug: 'engineering' })
        expect(result.content[0]?.text).toContain('cat_2')
    })

    it('should update a category without the id in the payload', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockUpdateCategory.mockResolvedValue({ data: { id: 'cat_2' } })

        registerTaxonomyTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'update_category')({
            id: 'cat_2',
            name: 'Platform',
        })

        expect(mockUpdateCategory).toHaveBeenCalledWith('cat_2', { name: 'Platform' })
        expect(result.content[0]?.text).toContain('updated successfully')
    })

    it('should delete a category when dangerous tools are enabled', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockDeleteCategory.mockResolvedValue({ data: { id: 'cat_2' } })

        registerTaxonomyTools(server, { ...baseConfig, enableDangerousTools: true })

        const result = await getRegisteredHandler(registerSpy, 'delete_category')({ id: 'cat_2' })

        expect(mockDeleteCategory).toHaveBeenCalledWith('cat_2')
        expect(result.content[0]?.text).toContain('deleted successfully')
    })

    it('should list tags', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockListTags.mockResolvedValue({ data: { items: [{ id: 'tag_1', name: 'nuxt' }] } })

        registerTaxonomyTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'list_tags')({ page: 1, limit: 10 })

        expect(mockListTags).toHaveBeenCalledWith({ page: 1, limit: 10 })
        expect(result.content[0]?.text).toContain('nuxt')
    })

    it('should create a tag', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockCreateTag.mockResolvedValue({ data: { id: 'tag_2' } })

        registerTaxonomyTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'create_tag')({
            name: 'nuxt',
            slug: 'nuxt',
        })

        expect(mockCreateTag).toHaveBeenCalledWith({ name: 'nuxt', slug: 'nuxt' })
        expect(result.content[0]?.text).toContain('tag_2')
    })

    it('should update a tag without the id in the payload', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockUpdateTag.mockResolvedValue({ data: { id: 'tag_2' } })

        registerTaxonomyTools(server, baseConfig)

        const result = await getRegisteredHandler(registerSpy, 'update_tag')({
            id: 'tag_2',
            name: 'framework',
        })

        expect(mockUpdateTag).toHaveBeenCalledWith('tag_2', { name: 'framework' })
        expect(result.content[0]?.text).toContain('updated successfully')
    })

    it('should delete a tag when dangerous tools are enabled', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        mockDeleteTag.mockResolvedValue({ data: { id: 'tag_2' } })

        registerTaxonomyTools(server, { ...baseConfig, enableDangerousTools: true })

        const result = await getRegisteredHandler(registerSpy, 'delete_tag')({ id: 'tag_2' })

        expect(mockDeleteTag).toHaveBeenCalledWith('tag_2')
        expect(result.content[0]?.text).toContain('deleted successfully')
    })

    it('should expose zod defaults and bounds on the registered input schemas', () => {
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerTaxonomyTools(server, baseConfig)

        const listOptions = getRegisteredOptions(registerSpy, 'list_categories')
        expect(listOptions.inputSchema.page?.parse(undefined)).toBe(1)
        expect(listOptions.inputSchema.limit?.parse(undefined)).toBe(10)
        expect(listOptions.inputSchema.limit?.safeParse(101).success).toBe(false)
        expect(listOptions.inputSchema.limit?.safeParse(0).success).toBe(false)

        const createOptions = getRegisteredOptions(registerSpy, 'create_category')
        expect(createOptions.inputSchema.language?.parse(undefined)).toBe('zh-CN')
        expect(createOptions.inputSchema.name?.safeParse('').success).toBe(false)
        expect(createOptions.inputSchema.name?.safeParse('x'.repeat(101)).success).toBe(false)
        expect(createOptions.inputSchema.slug?.safeParse('x'.repeat(101)).success).toBe(false)
    })

    it('should surface API errors as isError responses for every handler', async () => {
        const registerSpy = vi.spyOn(server, 'registerTool')
        const failure = new Error('api unavailable')
        mockListCategories.mockRejectedValue(failure)
        mockCreateCategory.mockRejectedValue(failure)
        mockUpdateCategory.mockRejectedValue(failure)
        mockDeleteCategory.mockRejectedValue(failure)
        mockListTags.mockRejectedValue(failure)
        mockCreateTag.mockRejectedValue(failure)
        mockUpdateTag.mockRejectedValue(failure)
        mockDeleteTag.mockRejectedValue(failure)

        registerTaxonomyTools(server, { ...baseConfig, enableDangerousTools: true })

        const cases: Array<[string, Record<string, unknown>]> = [
            ['list_categories', { page: 1, limit: 10 }],
            ['create_category', { name: 'Engineering', slug: 'engineering' }],
            ['update_category', { id: 'cat_2' }],
            ['delete_category', { id: 'cat_2' }],
            ['list_tags', { page: 1, limit: 10 }],
            ['create_tag', { name: 'nuxt', slug: 'nuxt' }],
            ['update_tag', { id: 'tag_2' }],
            ['delete_tag', { id: 'tag_2' }],
        ]

        for (const [toolName, input] of cases) {
            const result = await getRegisteredHandler(registerSpy, toolName)(input)
            expect(result.isError).toBe(true)
            expect(result.content[0]?.text).toContain('api unavailable')
        }
    })
})
