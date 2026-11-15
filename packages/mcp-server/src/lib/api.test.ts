import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createMomeiApiMock, apiMock } = vi.hoisted(() => {
    const mockApi = {
        ai: {
            createTTSTask: vi.fn(),
            generateCoverImage: vi.fn(),
            getTask: vi.fn(),
            recommendCategories: vi.fn(),
            recommendTags: vi.fn(),
            suggestTitles: vi.fn(),
            translatePost: vi.fn(),
        },
        categories: { create: vi.fn(), delete: vi.fn(), list: vi.fn(), update: vi.fn() },
        client: { post: vi.fn() },
        migrations: {
            applyLinkGovernance: vi.fn(),
            dryRunLinkGovernance: vi.fn(),
            getLinkGovernanceReport: vi.fn(),
        },
        posts: {
            create: vi.fn(),
            delete: vi.fn(),
            get: vi.fn(),
            list: vi.fn(),
            publish: vi.fn(),
            update: vi.fn(),
            validate: vi.fn(),
        },
        snippets: { convertToPost: vi.fn(), create: vi.fn(), delete: vi.fn(), get: vi.fn(), list: vi.fn(), update: vi.fn() },
        tags: { create: vi.fn(), delete: vi.fn(), list: vi.fn(), update: vi.fn() },
        versions: { create: vi.fn(), list: vi.fn() },
    }

    return { apiMock: mockApi, createMomeiApiMock: vi.fn(() => mockApi) }
})

vi.mock('@momei-blog/api-client', () => ({
    createMomeiApi: createMomeiApiMock,
}))

const { MomeiApi } = await import('./api')

const config = { apiKey: 'test-key', apiUrl: 'http://localhost:3000', enableDangerousTools: false }

describe('MomeiApi', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('把配置透传给 api-client 工厂', () => {
        void new MomeiApi(config)

        expect(createMomeiApiMock).toHaveBeenCalledWith({ apiKey: 'test-key', apiUrl: 'http://localhost:3000' })
    })

    it('文章方法的默认查询参数为空对象', async () => {
        apiMock.posts.list.mockResolvedValueOnce({ items: [] })
        const client = new MomeiApi(config)

        await expect(client.listPosts()).resolves.toEqual({ code: 200, data: { items: [] } })

        expect(apiMock.posts.list).toHaveBeenCalledWith({})

        await client.listPosts({ page: 2, limit: 10 })
        expect(apiMock.posts.list).toHaveBeenLastCalledWith({ page: 2, limit: 10 })
    })

    const delegatingCases: Array<{
        call: (client: InstanceType<typeof MomeiApi>) => Promise<unknown>
        expected: unknown[]
        method: string
    }> = [
        { call: (client) => client.getPost('post-1'), expected: ['post-1'], method: 'posts.get' },
        { call: (client) => client.createPost({ title: 't' }), expected: [{ title: 't' }], method: 'posts.create' },
        { call: (client) => client.updatePost('post-1', { title: 't' }), expected: ['post-1', { title: 't' }], method: 'posts.update' },
        { call: (client) => client.publishPost('post-1'), expected: ['post-1'], method: 'posts.publish' },
        { call: (client) => client.validateImportPost({ title: 't' }), expected: [{ title: 't' }], method: 'posts.validate' },
        { call: (client) => client.suggestTitles({ content: 'c' }), expected: [{ content: 'c' }], method: 'ai.suggestTitles' },
        { call: (client) => client.recommendTags({ content: 'c' }), expected: [{ content: 'c' }], method: 'ai.recommendTags' },
        { call: (client) => client.recommendCategories({ content: 'c' }), expected: [{ content: 'c' }], method: 'ai.recommendCategories' },
        { call: (client) => client.translatePost({ id: 'p' }), expected: [{ id: 'p' }], method: 'ai.translatePost' },
        { call: (client) => client.generateCoverImage({ id: 'p' }), expected: [{ id: 'p' }], method: 'ai.generateCoverImage' },
        { call: (client) => client.createTTSTask({ id: 'p' }), expected: [{ id: 'p' }], method: 'ai.createTTSTask' },
        { call: (client) => client.getAITask('task-1'), expected: ['task-1'], method: 'ai.getTask' },
        { call: (client) => client.dryRunLinkGovernance({ scope: 'all' }), expected: [{ scope: 'all' }], method: 'migrations.dryRunLinkGovernance' },
        { call: (client) => client.applyLinkGovernance({ scope: 'all' }), expected: [{ scope: 'all' }], method: 'migrations.applyLinkGovernance' },
        { call: (client) => client.getLinkGovernanceReport('report-1'), expected: ['report-1'], method: 'migrations.getLinkGovernanceReport' },
        { call: (client) => client.listCategories(), expected: [{}], method: 'categories.list' },
        { call: (client) => client.createCategory({ name: 'c' }), expected: [{ name: 'c' }], method: 'categories.create' },
        { call: (client) => client.updateCategory('cat-1', { name: 'c' }), expected: ['cat-1', { name: 'c' }], method: 'categories.update' },
        { call: (client) => client.listTags({ page: 1 }), expected: [{ page: 1 }], method: 'tags.list' },
        { call: (client) => client.createTag({ name: 't' }), expected: [{ name: 't' }], method: 'tags.create' },
        { call: (client) => client.updateTag('tag-1', { name: 't' }), expected: ['tag-1', { name: 't' }], method: 'tags.update' },
        { call: (client) => client.listSnippets(), expected: [{}], method: 'snippets.list' },
        { call: (client) => client.createSnippet({ title: 's' }), expected: [{ title: 's' }], method: 'snippets.create' },
        { call: (client) => client.getSnippet('snippet-1'), expected: ['snippet-1'], method: 'snippets.get' },
        { call: (client) => client.updateSnippet('snippet-1', { title: 's' }), expected: ['snippet-1', { title: 's' }], method: 'snippets.update' },
        { call: (client) => client.convertSnippetToPost('snippet-1'), expected: ['snippet-1'], method: 'snippets.convertToPost' },
        { call: (client) => client.listPostVersions('post-1'), expected: ['post-1'], method: 'versions.list' },
        { call: (client) => client.createPostVersion('post-1'), expected: ['post-1'], method: 'versions.create' },
    ]

    it.each(delegatingCases)('$method 透传到 api-client 并包成 200 信封', async ({ call, expected, method }) => {
        const [namespace = '', name = ''] = method.split('.')
        const target = (apiMock as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>)[namespace]![name]!
        target.mockResolvedValueOnce({ ok: true })
        const client = new MomeiApi(config)

        await expect(call(client)).resolves.toEqual({ code: 200, data: { ok: true } })
        expect(target).toHaveBeenCalledWith(...expected)
    })

    it('删除类方法统一返回 { deleted: true }', async () => {
        const client = new MomeiApi(config)

        await expect(client.deletePost('post-1')).resolves.toEqual({ code: 200, data: { deleted: true } })
        await expect(client.deleteCategory('cat-1')).resolves.toEqual({ code: 200, data: { deleted: true } })
        await expect(client.deleteTag('tag-1')).resolves.toEqual({ code: 200, data: { deleted: true } })
        await expect(client.deleteSnippet('snippet-1')).resolves.toEqual({ code: 200, data: { deleted: true } })

        expect(apiMock.posts.delete).toHaveBeenCalledWith('post-1')
        expect(apiMock.categories.delete).toHaveBeenCalledWith('cat-1')
        expect(apiMock.tags.delete).toHaveBeenCalledWith('tag-1')
        expect(apiMock.snippets.delete).toHaveBeenCalledWith('snippet-1')
    })

    it('syncViews 仅在传入语言时附加 language 字段', async () => {
        apiMock.client.post.mockResolvedValue({ code: 200, data: { synced: 1 } })
        const client = new MomeiApi(config)
        const entries = [{ url: '/posts/a', views: 3 }]

        await client.syncViews(entries)
        expect(apiMock.client.post).toHaveBeenLastCalledWith('/api/external/posts/sync-views', { entries })

        await client.syncViews(entries, 'zh-CN')
        expect(apiMock.client.post).toHaveBeenLastCalledWith('/api/external/posts/sync-views', { entries, language: 'zh-CN' })
        // syncViews 是唯一不套 200 信封的方法：直接返回 api-client 结果。
        await expect(client.syncViews(entries)).resolves.toEqual({ code: 200, data: { synced: 1 } })
    })

    it('api-client 抛错时原样向上抛出，不吞异常', async () => {
        apiMock.posts.get.mockRejectedValueOnce(new Error('boom'))
        const client = new MomeiApi(config)

        await expect(client.getPost('post-1')).rejects.toThrow('boom')
    })
})
