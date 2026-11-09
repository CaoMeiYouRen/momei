import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createPostService,
    deletePostVersionService,
    getPostVersionDetailService,
    getPostVersionsService,
    updatePostService,
} from './post'
import { ensureCategory } from './category'
import {
    deletePostVersionService as deletePostVersionImpl,
    getPostVersionDetailService as getPostVersionDetailImpl,
    getPostVersionsService as getPostVersionsImpl,
} from './post-version'
import { dataSource } from '@/server/database'
import { PostStatus } from '@/types/post'

/**
 * `server/services/post` 的**生命周期分支**契约。
 *
 * 主体 CRUD 由 `post.test.ts` 覆盖；本文件只补齐容易被回归漏掉的边角：
 * 分类清空 / 按名称建分类、定时发布三条校验、非法状态流转、slug 变更与版本服务委托。
 */

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('./tag', () => ({
    ensureTags: vi.fn(async (tags: string[]) => tags.map((name, index) => ({ id: `tag${index}`, name }))),
}))

vi.mock('./category', () => ({
    ensureCategory: vi.fn(async (name: string) => ({ id: 'cat-created', name })),
}))

vi.mock('./post-publish', () => ({
    executePublishEffects: vi.fn(),
}))

vi.mock('./post-version', () => ({
    recordPostVersionCommit: vi.fn(async () => undefined),
    getPostVersionsService: vi.fn(async () => [{ id: 'v1' }]),
    getPostVersionDetailService: vi.fn(async () => ({ id: 'v1' })),
    deletePostVersionService: vi.fn(async () => true),
    PostVersionSource: { EDIT: 'edit', CREATE: 'create' },
}))

vi.mock('@/server/utils/password', () => ({
    hashPassword: vi.fn((password: string) => `hashed_${password}`),
}))

const basePost = {
    id: 'post1',
    slug: 'test-title',
    authorId: 'author1',
    language: 'zh-CN',
    status: PostStatus.DRAFT,
    tags: [],
}

function createRepositories(options: {
    post?: Record<string, unknown> | null
    postFindOne?: ReturnType<typeof vi.fn>
    category?: Record<string, unknown> | null
} = {}) {
    const postRepo = {
        findOne: options.postFindOne ?? vi.fn().mockResolvedValue(options.post === undefined ? null : options.post),
        save: vi.fn(async (post: Record<string, unknown>) => post),
        count: vi.fn().mockResolvedValue(0),
        find: vi.fn().mockResolvedValue([]),
        remove: vi.fn(async (value: unknown) => value),
    }
    const categoryRepo = {
        findOne: vi.fn().mockResolvedValue(options.category ?? null),
        save: vi.fn(async (value: unknown) => value),
        count: vi.fn().mockResolvedValue(0),
        find: vi.fn().mockResolvedValue([]),
        remove: vi.fn(async (value: unknown) => value),
    }

    vi.mocked(dataSource.getRepository).mockImplementation((entity: { name: string }) => {
        if (entity.name === 'Post') {
            return postRepo as never
        }
        if (entity.name === 'Category') {
            return categoryRepo as never
        }
        return postRepo as never
    })

    return { postRepo, categoryRepo }
}

const createPayload = (overrides: Record<string, unknown> = {}) => ({
    title: 'Test Title',
    content: 'Test content',
    language: 'zh-CN',
    status: PostStatus.DRAFT,
    visibility: 'public',
    pushOption: 'none' as const,
    syncToMemos: false,
    ...overrides,
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('createPostService 分类与定时发布分支', () => {
    it('categoryId 显式传 null 时清空分类', async () => {
        const { postRepo } = createRepositories()

        const result = await createPostService(createPayload({ categoryId: null }), 'author1', { isAdmin: false })

        expect(result.categoryId).toBeNull()
        expect(postRepo.save).toHaveBeenCalled()
    })

    it('category 传 null 时同样清空分类', async () => {
        createRepositories()

        const result = await createPostService(createPayload({ category: null }), 'author1', { isAdmin: false })

        expect(result.categoryId).toBeNull()
    })

    it('按名称找不到分类时调用 ensureCategory 创建', async () => {
        createRepositories({ category: null })

        const result = await createPostService(createPayload({ category: 'Tech' }), 'author1', { isAdmin: false })

        expect(ensureCategory).toHaveBeenCalledWith('Tech', 'zh-CN')
        expect(result.categoryId).toBe('cat-created')
    })

    it('定时发布允许非管理员设置未来发布时间', async () => {
        createRepositories()
        const publishedAt = new Date(Date.now() + 60 * 60 * 1000)

        const result = await createPostService(
            createPayload({ status: PostStatus.SCHEDULED, publishedAt }),
            'author1',
            { isAdmin: false },
        )

        expect(result.status).toBe(PostStatus.SCHEDULED)
        expect(result.publishedAt).toEqual(publishedAt)
    })

    it('定时发布缺少发布时间时拒绝', async () => {
        createRepositories()

        await expect(
            createPostService(createPayload({ status: PostStatus.SCHEDULED }), 'author1', { isAdmin: false }),
        ).rejects.toThrow('publishedAt is required for scheduled post')
    })

    it('定时发布时间早于当前时间时拒绝', async () => {
        createRepositories()

        await expect(
            createPostService(
                createPayload({ status: PostStatus.SCHEDULED, publishedAt: new Date(Date.now() - 60_000) }),
                'author1',
                { isAdmin: false },
            ),
        ).rejects.toThrow('publishedAt must be in the future for scheduled post')
    })
})

describe('updatePostService 状态与 slug 分支', () => {
    it('非管理员执行非法状态流转时拒绝', async () => {
        createRepositories({
            postFindOne: vi.fn().mockResolvedValue({ ...basePost, status: PostStatus.PUBLISHED }),
        })

        await expect(
            updatePostService('post1', { status: PostStatus.REJECTED }, { isAdmin: false, currentUserId: 'author1' }),
        ).rejects.toThrow(/Invalid status transition/)
    })

    it('slug 变更且无冲突时写回新 slug', async () => {
        const { postRepo } = createRepositories({
            postFindOne: vi.fn()
                .mockResolvedValueOnce({ ...basePost })
                .mockResolvedValueOnce(null),
        })

        const result = await updatePostService(
            'post1',
            { slug: 'brand-new-slug' },
            { isAdmin: false, currentUserId: 'author1' },
        )

        expect(result.slug).toBe('brand-new-slug')
        expect(postRepo.save).toHaveBeenCalled()
    })
})

describe('版本服务委托', () => {
    it('三个版本入口按参数透传给实现并返回结果', async () => {
        const actor = { userId: 'author1', isAdmin: false }

        await expect(getPostVersionsService('post1', actor)).resolves.toEqual([{ id: 'v1' }])
        await expect(getPostVersionDetailService('post1', 'v1', actor)).resolves.toEqual({ id: 'v1' })
        await expect(deletePostVersionService('post1', actor)).resolves.toBe(true)

        expect(getPostVersionsImpl).toHaveBeenCalledWith('post1', actor)
        expect(getPostVersionDetailImpl).toHaveBeenCalledWith('post1', 'v1', actor)
        expect(deletePostVersionImpl).toHaveBeenCalledWith('post1', actor)
    })
})
