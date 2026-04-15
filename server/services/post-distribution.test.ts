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

const actor = {
    currentUserId: 'admin-user',
    isAdmin: true,
} as const

async function createAuthor() {
    const user = new User()
    user.name = 'Distribution Author'
    user.email = `distribution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
    user.role = 'author'
    return dataSource.getRepository(User).save(user)
}

async function createPublishedPost() {
    const author = await createAuthor()
    const post = new Post()
    post.title = 'Distributed Post'
    post.slug = `distributed-${Math.random().toString(36).slice(2, 10)}`
    post.content = '## Heading\n\nThis is the full content for distribution testing.'
    post.summary = 'Distribution summary'
    post.author = author
    post.authorId = author.id
    post.language = 'zh-CN'
    post.status = PostStatus.PUBLISHED
    post.visibility = PostVisibility.PUBLIC
    post.metadata = null
    return dataSource.getRepository(Post).save(post)
}

describe('post-distribution service', () => {
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
                case SettingKey.SITE_URL:
                    return Promise.resolve('https://momei.app')
                case SettingKey.POST_COPYRIGHT:
                    return Promise.resolve('all-rights-reserved')
                default:
                    return Promise.resolve(null)
            }
        })

        await dataSource.getRepository(Post).clear()
        await dataSource.getRepository(Tag).clear()
        await dataSource.getRepository(User).clear()
    })

    it('should expose idle distribution summary by default', async () => {
        const post = await createPublishedPost()

        const summary = await getPostDistributionService(post.id, actor)

        expect(summary.channels.memos.status).toBe('idle')
        expect(summary.channels.wechatsync.status).toBe('idle')
        expect(summary.timeline).toEqual([])
    })

    it('should create a memos delivery record and persist remote state', async () => {
        const post = await createPublishedPost()
        const tag = new Tag()
        tag.name = 'Nuxt'
        tag.slug = `nuxt-${Math.random().toString(36).slice(2, 8)}`
        tag.language = 'zh-CN'
        tag.translationId = 'cluster-nuxt'
        await dataSource.getRepository(Tag).save(tag)

        post.coverImage = 'https://static.example.com/cover.png'
        post.tags = [tag]
        await dataSource.getRepository(Post).save(post)

        vi.mocked(createMemo).mockResolvedValue({ name: 'memos/42' })

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, actor)

        expect(createMemo).toHaveBeenCalledTimes(1)
        expect(createMemo).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('![](https://static.example.com/cover.png)'),
        }))
        expect(createMemo).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('#Nuxt'),
        }))
        expect(createMemo).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('版权声明'),
        }))
        expect(updateMemo).not.toHaveBeenCalled()
        expect(result.summary.channels.memos.status).toBe('succeeded')
        expect(result.summary.channels.memos.remoteId).toBe('42')
        expect(result.summary.channels.memos.remoteUrl).toBe('https://memos.example.com/memos/42')
        expect(result.summary.timeline[0]?.action).toBe('create')
        expect(result.summary.timeline[0]?.status).toBe('succeeded')

        const persistedPost = await dataSource.getRepository(Post).findOneByOrFail({ id: post.id })
        expect(persistedPost.metadata?.integration?.memosId).toBe('42')
        expect(persistedPost.metadata?.integration?.distribution?.channels?.memos?.remoteId).toBe('42')
    })

    it('should allow memos distribution when enabled is stored as quoted true', async () => {
        const post = await createPublishedPost()
        vi.mocked(getSetting).mockImplementation((...args: Parameters<typeof getSetting>) => {
            const [key] = args

            switch (key as SettingKey) {
                case SettingKey.MEMOS_ENABLED:
                    return Promise.resolve('"true"')
                case SettingKey.MEMOS_INSTANCE_URL:
                    return Promise.resolve('https://memos.example.com')
                case SettingKey.SITE_URL:
                    return Promise.resolve('https://momei.app')
                case SettingKey.POST_COPYRIGHT:
                    return Promise.resolve('all-rights-reserved')
                default:
                    return Promise.resolve(null)
            }
        })
        vi.mocked(createMemo).mockResolvedValue({ name: 'memos/quoted-true' })

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, actor)

        expect(createMemo).toHaveBeenCalledTimes(1)
        expect(result.summary.channels.memos.status).toBe('succeeded')
        expect(result.summary.channels.memos.remoteId).toBe('quoted-true')
    })

    it('should reject memos distribution when explicitly disabled', async () => {
        const post = await createPublishedPost()
        vi.mocked(getSetting).mockImplementation((...args: Parameters<typeof getSetting>) => {
            const [key] = args

            switch (key as SettingKey) {
                case SettingKey.MEMOS_ENABLED:
                    return Promise.resolve('false')
                case SettingKey.MEMOS_INSTANCE_URL:
                    return Promise.resolve('https://memos.example.com')
                case SettingKey.SITE_URL:
                    return Promise.resolve('https://momei.app')
                case SettingKey.POST_COPYRIGHT:
                    return Promise.resolve('all-rights-reserved')
                default:
                    return Promise.resolve(null)
            }
        })

        await expect(dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, actor)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Memos integration is disabled',
        })
        expect(createMemo).not.toHaveBeenCalled()
    })

    it('should normalize memos public permalink when the configured instance URL includes api path', async () => {
        const post = await createPublishedPost()
        vi.mocked(getSetting).mockImplementation((...args: Parameters<typeof getSetting>) => {
            const [key] = args

            switch (key as SettingKey) {
                case SettingKey.MEMOS_ENABLED:
                    return Promise.resolve('true')
                case SettingKey.MEMOS_INSTANCE_URL:
                    return Promise.resolve('https://memos.example.com/api/v1')
                case SettingKey.SITE_URL:
                    return Promise.resolve('https://momei.app')
                case SettingKey.POST_COPYRIGHT:
                    return Promise.resolve('all-rights-reserved')
                default:
                    return Promise.resolve(null)
            }
        })
        vi.mocked(createMemo).mockResolvedValue({ name: 'api/v1/memos/normalized-42' })

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'sync',
        }, actor)

        expect(result.summary.channels.memos.remoteId).toBe('normalized-42')
        expect(result.summary.channels.memos.remoteUrl).toBe('https://memos.example.com/memos/normalized-42')
        expect(result.summary.timeline[0]?.remoteUrl).toBe('https://memos.example.com/memos/normalized-42')
    })

    it('should update existing memos content on retry when a remote id exists', async () => {
        const post = await createPublishedPost()
        post.metadata = {
            integration: {
                memosId: 'memo-100',
                distribution: {
                    channels: {
                        memos: {
                            status: 'failed',
                            remoteId: 'memo-100',
                            lastMode: 'update-existing',
                            lastFailureReason: 'network_error',
                        },
                    },
                    timeline: [],
                },
            },
        }
        await dataSource.getRepository(Post).save(post)
        vi.mocked(updateMemo).mockResolvedValue({ name: 'memos/memo-100', uid: 'memo-100' })

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'memos',
            operation: 'retry',
        }, actor)

        expect(updateMemo).toHaveBeenCalledTimes(1)
        expect(updateMemo).toHaveBeenCalledWith('memo-100', expect.objectContaining({ content: expect.stringContaining('# Distributed Post') }))
        expect(result.summary.channels.memos.status).toBe('succeeded')
        expect(result.summary.channels.memos.lastAction).toBe('retry')
        expect(result.summary.channels.memos.lastMode).toBe('update-existing')
        expect(result.summary.channels.memos.retryCount).toBe(1)
    })

    it('should finalize wechatsync attempts and classify failures', async () => {
        const post = await createPublishedPost()
        const started = await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'sync',
        }, actor)

        expect(started.summary.channels.wechatsync.status).toBe('delivering')
        expect(started.attemptId).toBeTruthy()

        const summary = await completeWechatSyncDistributionService(post.id, {
            attemptId: started.attemptId!,
            accounts: [
                {
                    id: '1',
                    title: '公众号 A',
                    status: 'done',
                    draftLink: 'https://drafts.example.com/a',
                },
                {
                    id: '2',
                    title: '公众号 B',
                    status: 'failed',
                    error: 'network timeout',
                },
            ],
            observation: {
                strategy: 'single_add_task_default_raw',
                resolution: 'terminal_status',
                payload: {
                    renderMode: 'none',
                    contentProfile: 'default',
                    usesRawPost: true,
                    markdownLength: 128,
                    contentLength: 256,
                    descLength: 32,
                    accountKeys: ['1', '2'],
                },
                readyEventCount: 1,
                statusEventCount: 2,
                events: [
                    {
                        phase: 'dispatch_started',
                        at: '2026-04-16T10:00:00.000Z',
                        accountCount: 2,
                    },
                ],
            },
        }, actor)

        expect(summary.channels.wechatsync.status).toBe('failed')
        expect(summary.channels.wechatsync.lastFailureReason).toBe('network_error')
        expect(summary.channels.wechatsync.remoteUrl).toBeNull()
        expect(summary.timeline[0]?.remoteUrl).toBe('https://drafts.example.com/a')
        expect(summary.timeline[0]?.details).toMatchObject({
            successCount: 1,
            failureCount: 1,
            observation: {
                strategy: 'single_add_task_default_raw',
                readyEventCount: 1,
                statusEventCount: 2,
            },
        })
    })

    it('should reject wechatsync completion payloads with non-terminal statuses', async () => {
        const post = await createPublishedPost()
        const started = await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'sync',
        }, actor)

        await expect(completeWechatSyncDistributionService(post.id, {
            attemptId: started.attemptId!,
            accounts: [
                {
                    id: '1',
                    title: '公众号 A',
                    status: 'uploading' as never,
                },
            ],
        }, actor)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'WechatSync completion requires terminal account statuses',
        })
    })

    it('should terminate an active wechatsync attempt manually', async () => {
        const post = await createPublishedPost()
        await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'sync',
        }, actor)

        const result = await dispatchPostDistributionService(post.id, {
            channel: 'wechatsync',
            operation: 'terminate',
        }, actor)

        expect(result.summary.channels.wechatsync.status).toBe('cancelled')
        expect(result.summary.channels.wechatsync.lastFailureReason).toBe('manual_terminated')
        expect(result.summary.timeline[0]?.action).toBe('create')
        expect(result.summary.timeline[0]?.status).toBe('cancelled')
    })
})
