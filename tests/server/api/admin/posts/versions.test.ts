import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import diffHandler from '@/server/api/admin/posts/[id]/versions/[versionId]/diff.get'
import restoreHandler from '@/server/api/admin/posts/[id]/versions/[versionId]/restore.post'
import { dataSource, initializeDB } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostVersion } from '@/server/entities/post-version'
import { Tag } from '@/server/entities/tag'
import { User } from '@/server/entities/user'
import { recordPostVersionCommit } from '@/server/services/post-version'
import { PostStatus, PostVisibility } from '@/types/post'
import { PostVersionDiffField, PostVersionSource } from '@/types/post-version'
import { generateRandomString } from '@/utils/shared/random'

function createEvent(options: {
    postId: string
    versionId: string
    userId: string
    role?: string
    query?: Record<string, unknown>
    userAgent?: string
    ipAddress?: string
}) {
    return {
        context: {
            params: {
                id: options.postId,
                versionId: options.versionId,
            },
            auth: {
                user: {
                    id: options.userId,
                    role: options.role || 'author',
                },
            },
        },
        query: options.query || {},
        ipAddress: options.ipAddress || '127.0.0.1',
        node: {
            req: {
                headers: {
                    'user-agent': options.userAgent || 'vitest-agent',
                },
            },
            res: {},
        },
    } as never
}

async function createUser(role: string) {
    const user = new User()
    user.name = `${role}-${generateRandomString(6)}`
    user.email = `${role}-${generateRandomString(6)}@example.com`
    user.role = role
    return dataSource.getRepository(User).save(user)
}

async function createTag(name: string) {
    const tag = new Tag()
    tag.name = name
    tag.slug = `${name.toLowerCase()}-${generateRandomString(4)}`
    tag.language = 'zh-CN'
    return dataSource.getRepository(Tag).save(tag)
}

async function seedVersionedPost() {
    const author = await createUser('author')
    const intruder = await createUser('author')
    const initialTag = await createTag('Initial')
    const editedTag = await createTag('Edited')

    const postRepo = dataSource.getRepository(Post)
    const versionRepo = dataSource.getRepository(PostVersion)

    const post = new Post()
    post.title = 'Initial title'
    post.slug = `post-${generateRandomString(8)}`
    post.content = 'Initial content'
    post.summary = 'Initial summary'
    post.author = author
    post.authorId = author.id
    post.language = 'zh-CN'
    post.status = PostStatus.DRAFT
    post.visibility = PostVisibility.PUBLIC
    post.metadata = {
        audio: {
            url: '/audio/initial.mp3',
            duration: 12,
        },
    }
    post.tags = [initialTag]
    await postRepo.save(post)

    const createdPost = await postRepo.findOneOrFail({
        where: { id: post.id },
        relations: ['tags'],
    })

    await recordPostVersionCommit(createdPost, author.id, {
        source: PostVersionSource.CREATE,
        auditContext: {
            ipAddress: '10.0.0.1',
            userAgent: 'seed-create',
        },
    })

    createdPost.title = 'Edited title'
    createdPost.content = 'Edited content'
    createdPost.summary = 'Edited summary'
    createdPost.coverImage = '/covers/edited.webp'
    createdPost.metadata = {
        audio: {
            url: '/audio/edited.mp3',
            duration: 24,
        },
    }
    createdPost.tags = [editedTag]
    await postRepo.save(createdPost)

    const editedPost = await postRepo.findOneOrFail({
        where: { id: post.id },
        relations: ['tags'],
    })

    await recordPostVersionCommit(editedPost, author.id, {
        source: PostVersionSource.EDIT,
        auditContext: {
            ipAddress: '10.0.0.2',
            userAgent: 'seed-edit',
        },
    })

    const versions = await versionRepo.find({
        where: { postId: post.id },
        order: { sequence: 'ASC' },
    })

    const [initialVersion, latestVersion] = versions
    if (!initialVersion || !latestVersion) {
        throw new Error('Expected seeded post to have at least two versions')
    }

    return {
        author,
        intruder,
        postId: post.id,
        initialTagId: initialTag.id,
        initialVersionId: initialVersion.id,
        latestVersionId: latestVersion.id,
    }
}

describe('admin post versions API', () => {
    beforeAll(async () => {
        await initializeDB()
    })

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.stubGlobal('getRouterParam', vi.fn((event: { context?: { params?: Record<string, string> } }, key: string) => event.context?.params?.[key]))
        vi.stubGlobal('getQuery', vi.fn((event: { query?: Record<string, unknown> }) => event.query || {}))
        vi.stubGlobal('getRequestIP', vi.fn((event: { ipAddress?: string }) => event.ipAddress || null))
        vi.stubGlobal('getRequestHeader', vi.fn((event: { node?: { req?: { headers?: Record<string, string> } } }, key: string) => event.node?.req?.headers?.[key] || null))

        await dataSource.getRepository(PostVersion).clear()
        await dataSource.getRepository(Post).clear()
        await dataSource.getRepository(Tag).clear()
        await dataSource.getRepository(User).clear()
    })

    it('should return field diff against the parent version', async () => {
        const seed = await seedVersionedPost()

        const result = await diffHandler(createEvent({
            postId: seed.postId,
            versionId: seed.latestVersionId,
            userId: seed.author.id,
        }))

        expect(result.code).toBe(200)
        expect(result.data).toBeDefined()
        if (!result.data) {
            throw new Error('Expected diff response data')
        }

        expect(result.data.compareTarget).toBe('parent')
        expect(result.data.currentVersion.id).toBe(seed.latestVersionId)
        expect(result.data.compareVersion?.id).toBe(seed.initialVersionId)
        expect(result.data.items.find((item: { field: PostVersionDiffField, changed: boolean }) => item.field === PostVersionDiffField.CONTENT)?.changed).toBe(true)
        expect(result.data.items.find((item: { field: PostVersionDiffField, changed: boolean }) => item.field === PostVersionDiffField.METADATA)?.changed).toBe(true)
    })

    it('should restore a historical version and append a restore commit', async () => {
        const seed = await seedVersionedPost()

        const result = await restoreHandler(createEvent({
            postId: seed.postId,
            versionId: seed.initialVersionId,
            userId: seed.author.id,
        }))

        expect(result.code).toBe(200)
        expect(result.data).toBeDefined()
        if (!result.data) {
            throw new Error('Expected restore response data')
        }

        expect(result.data.restored).toBe(true)
        expect(result.data.post.title).toBe('Initial title')
        expect(result.data.version.source).toBe(PostVersionSource.RESTORE)

        const post = await dataSource.getRepository(Post).findOneOrFail({
            where: { id: seed.postId },
            relations: ['tags'],
        })
        const versions = await dataSource.getRepository(PostVersion).find({
            where: { postId: seed.postId },
            order: { sequence: 'ASC' },
        })
        const restoreVersion = versions[2]

        expect(post.title).toBe('Initial title')
        expect(post.content).toBe('Initial content')
        expect(post.tags.map((tag) => tag.id)).toEqual([seed.initialTagId])
        expect(versions).toHaveLength(3)
        expect(restoreVersion).toBeDefined()
        if (!restoreVersion) {
            throw new Error('Expected restore version record')
        }

        expect(restoreVersion.source).toBe(PostVersionSource.RESTORE)
        expect(restoreVersion.restoredFromVersionId).toBe(seed.initialVersionId)
        expect(restoreVersion.parentVersionId).toBe(seed.latestVersionId)
        expect(restoreVersion.ipAddress).toBe('127.0.0.1')
        expect(restoreVersion.userAgent).toBe('vitest-agent')
    })

    it('should reject an author reading another authors version history', async () => {
        const seed = await seedVersionedPost()

        await expect(diffHandler(createEvent({
            postId: seed.postId,
            versionId: seed.latestVersionId,
            userId: seed.intruder.id,
        }))).rejects.toMatchObject({
            statusCode: 403,
            statusMessage: 'Forbidden',
        })
    })

    it('should return 404 when the requested version does not exist', async () => {
        const seed = await seedVersionedPost()

        await expect(diffHandler(createEvent({
            postId: seed.postId,
            versionId: 'missing-version',
            userId: seed.author.id,
        }))).rejects.toMatchObject({
            statusCode: 404,
            statusMessage: 'Version not found',
        })
    })
})
