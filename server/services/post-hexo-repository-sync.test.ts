import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    buildHexoRepositoryFilePath,
    dispatchPostHexoRepositorySyncService,
    syncPostToHexoRepository,
    type HexoRepositorySyncConfig,
} from './post-hexo-repository-sync'
import { dataSource, initializeDB } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus, PostVisibility } from '@/types/post'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
}))

import { getSetting } from '@/server/services/setting'

function readRequestBody(requestInit?: RequestInit) {
    return typeof requestInit?.body === 'string' ? requestInit.body : ''
}

const actor = {
    currentUserId: 'admin-user',
    isAdmin: true,
} as const

async function createAuthor() {
    const user = new User()
    user.name = 'Hexo Sync Author'
    user.email = `hexo-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
    user.role = 'author'
    return dataSource.getRepository(User).save(user)
}

async function createPublishedPost() {
    const author = await createAuthor()
    const post = new Post()
    post.title = 'Hexo Sync Post'
    post.slug = `hexo-sync-${Math.random().toString(36).slice(2, 10)}`
    post.content = '![Cover](/uploads/cover.png)\n\n正文内容'
    post.summary = 'Hexo repository sync summary'
    post.author = author
    post.authorId = author.id
    post.language = 'en-US'
    post.status = PostStatus.PUBLISHED
    post.visibility = PostVisibility.PUBLIC
    post.coverImage = '/uploads/frontmatter-cover.png'
    post.metadata = {
        audio: {
            url: '/uploads/audio.mp3',
        },
    }
    return dataSource.getRepository(Post).save(post)
}

describe('post-hexo-repository-sync service', () => {
    beforeAll(async () => {
        await initializeDB()
    })

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
            switch (key as SettingKey) {
                case SettingKey.HEXO_SYNC_ENABLED:
                    return Promise.resolve('true')
                case SettingKey.HEXO_SYNC_PROVIDER:
                    return Promise.resolve('github')
                case SettingKey.HEXO_SYNC_OWNER:
                    return Promise.resolve('example-owner')
                case SettingKey.HEXO_SYNC_REPO:
                    return Promise.resolve('example-hexo')
                case SettingKey.HEXO_SYNC_BRANCH:
                    return Promise.resolve('main')
                case SettingKey.HEXO_SYNC_POSTS_DIR:
                    return Promise.resolve('source/_posts')
                case SettingKey.HEXO_SYNC_ACCESS_TOKEN:
                    return Promise.resolve('ghp_test_token')
                case SettingKey.SITE_URL:
                    return Promise.resolve('https://momei.app')
                default:
                    return Promise.resolve((typeof defaultValue === 'string' ? defaultValue : null) ?? null)
            }
        })

        await dataSource.getRepository(Post).clear()
        await dataSource.getRepository(User).clear()
    })

    it('builds locale-scoped repository file paths', () => {
        expect(buildHexoRepositoryFilePath({
            id: 'post-1',
            slug: 'hello-world',
            language: 'ja-JP',
        }, 'source/_posts')).toBe('source/_posts/ja-JP/hello-world.md')
    })

    it('upserts repository content via provider contents API', async () => {
        const post = await createPublishedPost()
        const fetcher = vi.fn<typeof fetch>()
        fetcher
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Not Found' }), { status: 404, statusText: 'Not Found' }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                content: {
                    sha: 'content-sha-1',
                    html_url: 'https://github.com/example-owner/example-hexo/blob/main/source/_posts/en-US/hello.md',
                },
                commit: {
                    sha: 'commit-sha-1',
                },
            }), { status: 201 }))

        const config: HexoRepositorySyncConfig = {
            provider: 'github',
            owner: 'example-owner',
            repo: 'example-hexo',
            branch: 'main',
            postsDir: 'source/_posts',
            accessToken: 'ghp_test_token',
            siteUrl: 'https://momei.app',
        }

        const result = await syncPostToHexoRepository(post, config, { operation: 'sync' }, fetcher)

        expect(result.mode).toBe('created')
        expect(result.filePath).toBe(`source/_posts/en-US/${post.slug}.md`)
        expect(fetcher).toHaveBeenCalledTimes(2)
        expect(fetcher.mock.calls[1]?.[0]).toBe(`https://api.github.com/repos/example-owner/example-hexo/contents/source/_posts/en-US/${post.slug}.md`)

        const requestInit = fetcher.mock.calls[1]?.[1]
        const payload = JSON.parse(readRequestBody(requestInit)) as { content: string }
        const markdown = Buffer.from(payload.content, 'base64').toString('utf-8')
        expect(markdown).toContain('image: https://momei.app/uploads/frontmatter-cover.png')
        expect(markdown).toContain('audio_url: https://momei.app/uploads/audio.mp3')
        expect(markdown).toContain('![Cover](https://momei.app/uploads/cover.png)')
    })

    it('uses gitee contents API contract for repository sync', async () => {
        const post = await createPublishedPost()
        const fetcher = vi.fn<typeof fetch>()
        fetcher
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Not Found' }), { status: 404, statusText: 'Not Found' }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                content: {
                    sha: 'gitee-content-sha',
                    html_url: 'https://gitee.com/example-owner/example-hexo/blob/main/source/_posts/en-US/managed.md',
                },
                commit: {
                    sha: 'gitee-commit-sha',
                },
            }), { status: 201 }))

        const config: HexoRepositorySyncConfig = {
            provider: 'gitee',
            owner: 'example-owner',
            repo: 'example-hexo',
            branch: 'main',
            postsDir: 'source/_posts',
            accessToken: 'gitee_test_token',
            siteUrl: 'https://momei.app',
        }

        const result = await syncPostToHexoRepository(post, config, { operation: 'sync' }, fetcher)

        expect(result.mode).toBe('created')
        expect(fetcher.mock.calls[0]?.[0]).toBe(`https://gitee.com/api/v5/repos/example-owner/example-hexo/contents/source/_posts/en-US/${post.slug}.md?ref=main&access_token=gitee_test_token`)

        const requestInit = fetcher.mock.calls[1]?.[1]
        expect(requestInit?.method).toBe('POST')
        const payload = JSON.parse(readRequestBody(requestInit)) as { access_token: string }
        expect(payload.access_token).toBe('gitee_test_token')
    })

    it('persists sync state for managed posts', async () => {
        const post = await createPublishedPost()
        const fetcher = vi.fn<typeof fetch>()
        fetcher
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Not Found' }), { status: 404, statusText: 'Not Found' }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                content: {
                    sha: 'content-sha-2',
                    html_url: 'https://github.com/example-owner/example-hexo/blob/main/source/_posts/en-US/managed.md',
                },
                commit: {
                    sha: 'commit-sha-2',
                },
            }), { status: 201 }))

        const result = await dispatchPostHexoRepositorySyncService(post.id, {
            operation: 'sync',
        }, actor, fetcher)

        expect(result.state.remoteSha).toBe('commit-sha-2')
        expect(result.state.lastFailureReason).toBeNull()

        const persisted = await dataSource.getRepository(Post).findOneByOrFail({ id: post.id })
        expect(persisted.metadata?.integration?.hexoRepositorySync).toMatchObject({
            provider: 'github',
            owner: 'example-owner',
            repo: 'example-hexo',
            branch: 'main',
            filePath: `source/_posts/en-US/${post.slug}.md`,
            remoteSha: 'commit-sha-2',
        })
    })

    it('classifies auth failures and stores failure state', async () => {
        const post = await createPublishedPost()
        const fetcher = vi.fn<typeof fetch>()
        fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Bad credentials' }), {
            status: 401,
            statusText: 'Unauthorized',
        }))

        await expect(dispatchPostHexoRepositorySyncService(post.id, {
            operation: 'sync',
        }, actor, fetcher)).rejects.toMatchObject({
            statusCode: 401,
            statusMessage: 'Bad credentials',
        })

        const persisted = await dataSource.getRepository(Post).findOneByOrFail({ id: post.id })
        expect(persisted.metadata?.integration?.hexoRepositorySync).toMatchObject({
            lastFailureReason: 'auth_failed',
            filePath: `source/_posts/en-US/${post.slug}.md`,
        })
    })

    it('preserves previous remote state when retry fails after a successful sync', async () => {
        const post = await createPublishedPost()

        const successFetcher = vi.fn<typeof fetch>()
        successFetcher
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Not Found' }), { status: 404, statusText: 'Not Found' }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                content: {
                    sha: 'content-sha-3',
                    html_url: 'https://github.com/example-owner/example-hexo/blob/main/source/_posts/en-US/success.md',
                },
                commit: {
                    sha: 'commit-sha-3',
                },
            }), { status: 201 }))

        const successResult = await dispatchPostHexoRepositorySyncService(post.id, {
            operation: 'sync',
        }, actor, successFetcher)

        const failureFetcher = vi.fn<typeof fetch>()
        failureFetcher.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Bad credentials' }), {
            status: 401,
            statusText: 'Unauthorized',
        }))

        await expect(dispatchPostHexoRepositorySyncService(post.id, {
            operation: 'retry',
        }, actor, failureFetcher)).rejects.toMatchObject({
            statusCode: 401,
            statusMessage: 'Bad credentials',
        })

        const persisted = await dataSource.getRepository(Post).findOneByOrFail({ id: post.id })
        expect(persisted.metadata?.integration?.hexoRepositorySync).toMatchObject({
            remoteSha: 'commit-sha-3',
            remoteUrl: 'https://github.com/example-owner/example-hexo/blob/main/source/_posts/en-US/success.md',
            lastSyncedAt: successResult.state.lastSyncedAt,
            lastFailureReason: 'auth_failed',
            lastOperation: 'retry',
        })
    })
})
