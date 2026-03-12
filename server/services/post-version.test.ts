import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    getPostVersionDiffService,
    recordPostVersionCommit,
    restorePostVersionService,
} from './post-version'
import { dataSource } from '@/server/database'
import { PostVisibility } from '@/types/post'
import { PostVersionDiffField, PostVersionSource, type PostVersionSnapshot } from '@/types/post-version'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

function createSnapshot(overrides: Partial<PostVersionSnapshot> = {}): PostVersionSnapshot {
    return {
        title: 'Old title',
        content: 'Old content',
        summary: 'Old summary',
        coverImage: null,
        categoryId: 'category-1',
        tagIds: ['tag-1'],
        visibility: PostVisibility.PUBLIC,
        copyright: null,
        metaVersion: 1,
        metadata: null,
        language: 'zh-CN',
        translationId: 'translation-1',
        ...overrides,
    }
}

function createPostFixture() {
    return {
        id: 'post-1',
        title: 'Old title',
        content: 'Old content',
        summary: 'Old summary',
        coverImage: null,
        categoryId: 'category-1',
        tags: [{ id: 'tag-1', name: 'Tag 1' }],
        visibility: PostVisibility.PUBLIC,
        copyright: null,
        metaVersion: 1,
        metadata: null,
        language: 'zh-CN',
        translationId: 'translation-1',
        authorId: 'user-1',
    }
}

describe('post-version service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should append linear versions with increasing sequence', async () => {
        const post = createPostFixture()
        const versionStore: Record<string, unknown>[] = []

        const versionRepo = {
            findOne: vi.fn((options?: { where?: Record<string, unknown>, order?: Record<string, 'ASC' | 'DESC'> }) => {
                const where = options?.where || {}
                if (where.id) {
                    return Promise.resolve(versionStore.find((item) => item.id === where.id && item.postId === where.postId) || null)
                }

                const versions = versionStore.filter((item) => item.postId === where.postId)
                if (versions.length === 0) {
                    return Promise.resolve(null)
                }

                return Promise.resolve([...versions].sort((left, right) => Number(right.sequence) - Number(left.sequence))[0])
            }),
            save: vi.fn((entity: Record<string, unknown>) => {
                const saved = {
                    ...entity,
                    id: entity.id || `version-${versionStore.length + 1}`,
                    author: null,
                }
                versionStore.push(saved)
                return Promise.resolve(saved)
            }),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity: { name?: string }) => {
            if (entity.name === 'PostVersion') {
                return versionRepo as never
            }

            return {
                findOne: vi.fn(),
                save: vi.fn(),
            } as never
        })

        const firstResult = await recordPostVersionCommit(post as never, 'user-1', {
            source: PostVersionSource.CREATE,
        })

        post.content = 'New content'
        const secondResult = await recordPostVersionCommit(post as never, 'user-1', {
            source: PostVersionSource.EDIT,
        })

        expect(firstResult.created).toBe(true)
        expect(secondResult.created).toBe(true)
        expect(versionStore).toHaveLength(2)
        expect(versionStore[0].sequence).toBe(1)
        expect(versionStore[1].sequence).toBe(2)
        expect(versionStore[1].parentVersionId).toBe(versionStore[0].id)
        expect(versionStore[1].source).toBe(PostVersionSource.EDIT)
        expect(secondResult.version.changedFields).toContain(PostVersionDiffField.CONTENT)
    })

    it('should diff a historical version against current post state', async () => {
        const post = createPostFixture()
        post.content = 'Current content'

        const versionStore = [
            {
                id: 'version-1',
                postId: 'post-1',
                sequence: 1,
                parentVersionId: null,
                restoredFromVersionId: null,
                source: PostVersionSource.CREATE,
                commitSummary: 'create:title,content',
                changedFields: [PostVersionDiffField.TITLE, PostVersionDiffField.CONTENT],
                snapshotHash: 'hash-1',
                snapshot: createSnapshot(),
                title: 'Old title',
                content: 'Old content',
                summary: 'Old summary',
                authorId: 'user-1',
                createdAt: new Date('2026-03-12T00:00:00.000Z'),
                author: null,
            },
        ]

        const postRepo = {
            findOne: vi.fn().mockResolvedValue(post),
        }

        const versionRepo = {
            findOne: vi.fn((options?: { where?: Record<string, string> }) => {
                const where = options?.where || {}
                return Promise.resolve(versionStore.find((item) => item.id === where.id && item.postId === where.postId) || null)
            }),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity: { name?: string }) => {
            if (entity.name === 'Post') {
                return postRepo as never
            }

            if (entity.name === 'PostVersion') {
                return versionRepo as never
            }

            return {
                findOne: vi.fn(),
            } as never
        })

        const diff = await getPostVersionDiffService('post-1', 'version-1', {
            currentUserId: 'user-1',
            isAdmin: false,
        }, {
            compareToCurrent: true,
        })

        expect(diff.compareTarget).toBe('current')
        expect(diff.items.find((item) => item.field === PostVersionDiffField.CONTENT)?.changed).toBe(true)
    })

    it('should restore a historical snapshot and create a restore version', async () => {
        const post = createPostFixture()
        post.title = 'Current title'
        post.content = 'Current content'
        post.summary = 'Current summary'
        post.tags = []

        const versionStore: Record<string, unknown>[] = [
            {
                id: 'version-1',
                postId: 'post-1',
                sequence: 1,
                parentVersionId: null,
                restoredFromVersionId: null,
                source: PostVersionSource.CREATE,
                commitSummary: 'create:title,content',
                changedFields: [PostVersionDiffField.TITLE, PostVersionDiffField.CONTENT],
                snapshotHash: 'hash-1',
                snapshot: createSnapshot(),
                title: 'Old title',
                content: 'Old content',
                summary: 'Old summary',
                authorId: 'user-1',
                createdAt: new Date('2026-03-12T00:00:00.000Z'),
                author: null,
            },
            {
                id: 'version-2',
                postId: 'post-1',
                sequence: 2,
                parentVersionId: 'version-1',
                restoredFromVersionId: null,
                source: PostVersionSource.EDIT,
                commitSummary: 'edit:title,content',
                changedFields: [PostVersionDiffField.TITLE, PostVersionDiffField.CONTENT],
                snapshotHash: 'hash-2',
                snapshot: createSnapshot({
                    title: 'Current title',
                    content: 'Current content',
                    summary: 'Current summary',
                    tagIds: [],
                }),
                title: 'Current title',
                content: 'Current content',
                summary: 'Current summary',
                authorId: 'user-1',
                createdAt: new Date('2026-03-12T00:05:00.000Z'),
                author: null,
            },
        ]

        const postRepo = {
            findOne: vi.fn().mockResolvedValue(post),
            save: vi.fn((entity: Record<string, unknown>) => {
                Object.assign(post, entity)
                return Promise.resolve(post)
            }),
        }

        const versionRepo = {
            findOne: vi.fn((options?: { where?: Record<string, unknown> }) => {
                const where = options?.where || {}
                if (where.id) {
                    return Promise.resolve(versionStore.find((item) => item.id === where.id && item.postId === where.postId) || null)
                }

                const versions = versionStore.filter((item) => item.postId === where.postId)
                return Promise.resolve([...versions].sort((left, right) => Number(right.sequence) - Number(left.sequence))[0] || null)
            }),
            save: vi.fn((entity: Record<string, unknown>) => {
                const saved = {
                    ...entity,
                    id: `version-${versionStore.length + 1}`,
                    author: null,
                    createdAt: new Date('2026-03-12T00:10:00.000Z'),
                }
                versionStore.push(saved)
                return Promise.resolve(saved)
            }),
        }

        const tagRepo = {
            findBy: vi.fn().mockResolvedValue([{ id: 'tag-1', name: 'Tag 1' }]),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity: { name?: string }) => {
            if (entity.name === 'Post') {
                return postRepo as never
            }

            if (entity.name === 'PostVersion') {
                return versionRepo as never
            }

            if (entity.name === 'Tag') {
                return tagRepo as never
            }

            return {
                findOne: vi.fn(),
                save: vi.fn(),
            } as never
        })

        const result = await restorePostVersionService('post-1', 'version-1', {
            currentUserId: 'user-1',
            isAdmin: false,
        })

        expect(result.restored).toBe(true)
        expect(result.post.title).toBe('Old title')
        expect(result.post.content).toBe('Old content')
        expect(result.post.tags).toEqual(['Tag 1'])
        expect(versionStore).toHaveLength(3)
        expect(versionStore[2].source).toBe(PostVersionSource.RESTORE)
        expect(versionStore[2].restoredFromVersionId).toBe('version-1')
    })

    it('should no-op when restoring the latest snapshot again', async () => {
        const post = createPostFixture()
        const latestSnapshot = createSnapshot()
        const versionStore = [
            {
                id: 'version-1',
                postId: 'post-1',
                sequence: 1,
                parentVersionId: null,
                restoredFromVersionId: null,
                source: PostVersionSource.CREATE,
                commitSummary: 'create:title,content',
                changedFields: [PostVersionDiffField.TITLE, PostVersionDiffField.CONTENT],
                snapshotHash: 'same-hash',
                snapshot: latestSnapshot,
                title: latestSnapshot.title,
                content: latestSnapshot.content,
                summary: latestSnapshot.summary,
                authorId: 'user-1',
                createdAt: new Date('2026-03-12T00:00:00.000Z'),
                author: null,
            },
        ]

        const postRepo = {
            findOne: vi.fn().mockResolvedValue(post),
            save: vi.fn().mockResolvedValue(post),
        }

        const versionRepo = {
            findOne: vi.fn((options?: { where?: Record<string, unknown> }) => {
                const where = options?.where || {}
                if (where.id) {
                    return Promise.resolve(versionStore.find((item) => item.id === where.id && item.postId === where.postId) || null)
                }

                return Promise.resolve(versionStore[0])
            }),
            save: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity: { name?: string }) => {
            if (entity.name === 'Post') {
                return postRepo as never
            }

            if (entity.name === 'PostVersion') {
                return versionRepo as never
            }

            if (entity.name === 'Tag') {
                return {
                    findBy: vi.fn().mockResolvedValue([]),
                } as never
            }

            return {
                findOne: vi.fn(),
            } as never
        })

        const result = await restorePostVersionService('post-1', 'version-1', {
            currentUserId: 'user-1',
            isAdmin: false,
        })

        expect(result.restored).toBe(false)
        expect(versionRepo.save).not.toHaveBeenCalled()
        expect(postRepo.save).not.toHaveBeenCalled()
    })
})
