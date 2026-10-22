import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    completeWechatSyncDistributionService,
    dispatchPostDistributionService,
    getPostDistributionService,
} from './post-distribution'
import { dataSource, initializeDB } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { User } from '@/server/entities/user'
import { PostStatus, PostVisibility } from '@/types/post'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
}))

vi.mock('@/server/utils/memos', () => ({
    createMemo: vi.fn(),
    updateMemo: vi.fn(),
}))

import { getSetting } from '@/server/services/setting'
import { createMemo, updateMemo } from '@/server/utils/memos'

const adminActor = {
    currentUserId: 'admin-user',
    isAdmin: true,
} as const

let authorSequence = 0

async function createAuthor(name = 'Distribution Author') {
    authorSequence += 1
    const user = new User()
    user.name = name
    user.email = `distribution-${Date.now()}-${authorSequence}-${Math.random().toString(36).slice(2, 8)}@example.com`
    user.role = 'author'
    return dataSource.getRepository(User).save(user)
}

async function createPost(options: {
    status?: PostStatus
    metadata?: Record<string, unknown> | null
    author?: User
} = {}) {
    const author = options.author ?? await createAuthor()
    const post = new Post()
    post.title = 'Distribution Failure Post'
    post.slug = `distribution-failure-${Math.random().toString(36).slice(2, 10)}`
    post.content = '## Heading\n\nContent for distribution failure testing.'
    post.summary = 'Failure summary'
    post.author = author
    post.authorId = author.id
    post.language = 'zh-CN'
    post.status = options.status ?? PostStatus.PUBLISHED
    post.visibility = PostVisibility.PUBLIC
    post.metadata = options.metadata ?? null
    return dataSource.getRepository(Post).save(post)
}

async function reloadPost(postId: string) {
    const post = await dataSource.getRepository(Post).findOne({ where: { id: postId } })

    if (!post) {
        throw new Error('Expected post to exist')
    }

    return post
}

describe('post-distribution service 失败与权限分支', () => {
    beforeAll(async () => {
        await initializeDB()
    })

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.mocked(getSetting).mockImplementation((...args: Parameters<typeof getSetting>) => {
            const [key] = args

            switch (key as SettingKey) {
                case SettingKey.MEMOS_ENABLED:
                    return Promise.resolve('true')
                case SettingKey.MEMOS_INSTANCE_URL:
                    return Promise.resolve('https://memos.example.com')
                default:
                    return Promise.resolve(null)
            }
        })

        await dataSource.getRepository(Post).clear()
        await dataSource.getRepository(Tag).clear()
        await dataSource.getRepository(User).clear()
    })

    it('文章不存在时读取分布摘要返回 404', async () => {
        await expect(getPostDistributionService('missing-post', adminActor)).rejects.toMatchObject({
            statusCode: 404,
            statusMessage: 'Post not found',
        })
    })

    it('非作者且非管理员读取分布摘要返回 403', async () => {
        const owner = await createAuthor('Owner')
        const intruder = await createAuthor('Intruder')
        const post = await createPost({ author: owner })

        await expect(getPostDistributionService(post.id, {
            currentUserId: intruder.id,
            isAdmin: false,
        })).rejects.toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden',
        })
    })

    it('非管理员作者可以读取自己文章的分布摘要', async () => {
        const owner = await createAuthor('Owner')
        const post = await createPost({ author: owner })

        const summary = await getPostDistributionService(post.id, {
            currentUserId: owner.id,
            isAdmin: false,
        })

        expect(summary.channels.memos.status).toBe('idle')
    })

    it('非草稿状态不允许手动分发', async () => {
        const post = await createPost({ status: PostStatus.DRAFT })

        await expect(dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, adminActor)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Only published posts can be distributed manually',
        })
        expect(createMemo).not.toHaveBeenCalled()
    })

    it('非作者且非管理员分发时返回 403', async () => {
        const owner = await createAuthor('Owner')
        const intruder = await createAuthor('Intruder')
        const post = await createPost({ author: owner })

        await expect(dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, {
            currentUserId: intruder.id,
            isAdmin: false,
        })).rejects.toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden',
        })
    })

    it('Memos 集成关闭时拒绝分发且不发起远端请求', async () => {
        const post = await createPost()
        vi.mocked(getSetting).mockImplementation((...args: Parameters<typeof getSetting>) => {
            const [key] = args
            if (key as SettingKey === SettingKey.MEMOS_ENABLED) {
                return Promise.resolve('false')
            }
            return Promise.resolve(null)
        })

        await expect(dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, adminActor)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Memos integration is disabled',
        })
        expect(createMemo).not.toHaveBeenCalled()
    })

    it('Memos 无进行中尝试时 terminate 直接返回空 attemptId', async () => {
        const post = await createPost()

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'terminate',
        }, adminActor)

        expect(result.attemptId).toBeNull()
        expect(result.summary.channels.memos.status).toBe('idle')
        expect(createMemo).not.toHaveBeenCalled()
    })

    it('WechatSync 无进行中尝试时 terminate 直接返回空 attemptId', async () => {
        const post = await createPost()

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'terminate',
        }, adminActor)

        expect(result.attemptId).toBeNull()
        expect(result.summary.channels.wechatsync.status).toBe('idle')
    })

    it('Memos 返回空结果时按内容校验失败落库', async () => {
        const post = await createPost()
        vi.mocked(createMemo).mockResolvedValue(null as never)

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, adminActor)

        expect(result.summary.channels.memos.status).toBe('failed')
        expect(result.summary.channels.memos.lastFailureReason).toBe('content_validation_failed')
        expect(result.summary.channels.memos.lastMessage).toBe('Memos integration is disabled')
        expect(result.summary.timeline[0]?.status).toBe('failed')
    })

    it('已存在远端 ID 且指定 republish-new 时新建 Memo 而不是更新', async () => {
        const post = await createPost({
            metadata: {
                integration: {
                    distribution: {
                        channels: {
                            memos: {
                                status: 'succeeded',
                                remoteId: 'memo-existing',
                                lastMode: 'update-existing',
                            },
                        },
                        timeline: [],
                    },
                },
            },
        })
        vi.mocked(createMemo).mockResolvedValue({ name: 'memos/memo-new', uid: 'memo-new' })

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
            mode: 'republish-new',
        }, adminActor)

        expect(updateMemo).not.toHaveBeenCalled()
        expect(createMemo).toHaveBeenCalledOnce()
        expect(result.summary.channels.memos.status).toBe('succeeded')
        expect(result.summary.channels.memos.lastAction).toBe('republish')
        expect(result.summary.channels.memos.remoteId).toBe('memo-new')
    })

    it('进行中的分发尝试复用同一 attemptId 且不重复创建 Memo', async () => {
        const post = await createPost({
            metadata: {
                integration: {
                    memosId: 'memo-inflight',
                    distribution: {
                        channels: {
                            memos: {
                                status: 'delivering',
                                remoteId: 'memo-inflight',
                                activeAttemptId: 'attempt-inflight',
                            },
                        },
                        timeline: [
                            {
                                id: 'attempt-inflight',
                                channel: 'memos',
                                action: 'create',
                                mode: null,
                                status: 'delivering',
                                triggeredBy: 'manual',
                                operatorId: 'admin-user',
                                startedAt: '2026-04-16T10:00:00.000Z',
                                finishedAt: null,
                                message: null,
                                details: null,
                            },
                        ],
                    },
                },
            },
        })

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, adminActor)

        expect(result.attemptId).toBe('attempt-inflight')
        expect(result.summary.channels.memos.status).toBe('delivering')
        expect(createMemo).not.toHaveBeenCalled()
        expect(updateMemo).not.toHaveBeenCalled()
    })

    it.each([
        [{ statusCode: 401, statusMessage: 'Unauthorized provider' }, 'auth_failed'],
        [{ statusCode: 403, statusMessage: 'Forbidden provider' }, 'auth_failed'],
        [{ statusCode: 429, statusMessage: 'Too many requests' }, 'rate_limited'],
        [{ statusCode: 404, statusMessage: 'Memo not found' }, 'remote_missing'],
        [{ statusCode: 422, statusMessage: 'Invalid content' }, 'content_validation_failed'],
        [{ statusCode: 400, statusMessage: 'Bad request' }, 'content_validation_failed'],
        [{ message: 'socket hang up' }, 'network_error'],
        [{ message: 'unexpected upstream failure' }, 'unknown'],
        ['plain string failure', 'unknown'],
    ])('Memos 失败 %j 归类为 %s', async (thrown, expectedReason) => {
        const post = await createPost()
        vi.mocked(createMemo).mockRejectedValue(thrown)

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, adminActor)

        expect(result.summary.channels.memos.status).toBe('failed')
        expect(result.summary.channels.memos.lastFailureReason).toBe(expectedReason)
    })

    it('WechatSync 完成时另一尝试仍活跃则返回 409', async () => {
        const post = await createPost()
        const started = await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'sync',
        }, adminActor)

        await expect(completeWechatSyncDistributionService(post.id, {
            attemptId: 'another-attempt',
            accounts: [
                { id: '1', title: '公众号 A', status: 'done' },
            ],
        }, adminActor)).rejects.toMatchObject({
            statusCode: 409,
            statusMessage: 'Another WechatSync attempt is currently active',
        })

        expect(started.attemptId).toBeTruthy()
    })

    it('WechatSync 全部成功时记录成功状态与首个草稿链接', async () => {
        const post = await createPost()
        const started = await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'sync',
        }, adminActor)

        const summary = await completeWechatSyncDistributionService(post.id, {
            attemptId: started.attemptId!,
            accounts: [
                { id: '1', title: '公众号 A', status: 'done', draftLink: 'https://drafts.example.com/a' },
                { id: '2', title: '公众号 B', status: 'done', draftLink: 'https://drafts.example.com/b' },
            ],
        }, adminActor)

        expect(summary.channels.wechatsync.status).toBe('succeeded')
        expect(summary.channels.wechatsync.lastFailureReason).toBeNull()
        expect(summary.channels.wechatsync.remoteUrl).toBe('https://drafts.example.com/a')
        expect(summary.channels.wechatsync.lastMessage).toBe('WechatSync delivered to 2 account(s)')

        const persisted = await reloadPost(post.id)
        expect(persisted.metadata?.integration?.distribution?.channels?.wechatsync?.status).toBe('succeeded')
    })

    it('WechatSync 完成未知 attemptId 时返回 404', async () => {
        const post = await createPost()

        await expect(completeWechatSyncDistributionService(post.id, {
            attemptId: 'missing-attempt',
            accounts: [
                { id: '1', title: '公众号 A', status: 'done' },
            ],
        }, adminActor)).rejects.toMatchObject({
            statusCode: 404,
            statusMessage: 'Distribution attempt not found',
        })
    })

    it('WechatSync 失败消息命中鉴权词表时归类为 auth_failed', async () => {
        const post = await createPost()
        const started = await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'sync',
        }, adminActor)

        const summary = await completeWechatSyncDistributionService(post.id, {
            attemptId: started.attemptId!,
            accounts: [
                { id: '1', title: '公众号 A', status: 'failed', error: '登录已失效，请重新扫码' },
            ],
        }, adminActor)

        expect(summary.channels.wechatsync.status).toBe('failed')
        expect(summary.channels.wechatsync.lastFailureReason).toBe('auth_failed')
    })
})
