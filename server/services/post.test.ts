import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPostService, updatePostService } from './post'
import { dataSource } from '@/server/database'
import { PostStatus, PostVisibility } from '@/types/post'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('./tag', () => ({
    ensureTags: vi.fn((tags) => Promise.resolve(tags.map((name: string, i: number) => ({ id: `tag${i}`, name })))),
}))

vi.mock('./notification', () => ({
    createCampaignFromPost: vi.fn().mockResolvedValue({ id: 'campaign1' }),
    sendMarketingCampaign: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/utils/password', () => ({
    hashPassword: vi.fn((pwd) => `hashed_${pwd}`),
}))

// 辅助函数：创建基础测试数据
function createTestPostData(overrides: any = {}) {
    return {
        title: 'Test Title',
        content: 'Test content',
        language: 'zh-CN',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        pushOption: 'none' as const,
        syncToMemos: false,
        ...overrides,
    }
}

describe('post service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createPostService', () => {
        it('应该创建新文章并自动生成 slug', async () => {
            const mockPost = {
                id: 'post1',
                slug: 'test-title',
                authorId: 'author1',
                status: PostStatus.DRAFT,
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve({ ...mockPost, ...post })),
            }

            const mockCategoryRepo = {
                findOne: vi.fn().mockResolvedValue({ id: 'cat1', name: 'Tech' }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return mockCategoryRepo as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ categoryId: 'cat1' }),
                'author1',
                { isAdmin: false },
            )

            expect(result.slug).toBe('test-title')
            expect(result.authorId).toBe('author1')
            expect(mockPostRepo.save).toHaveBeenCalled()
        })

        it('应该在 slug 冲突时添加随机后缀', async () => {
            const mockPostRepo = {
                findOne: vi.fn()
                    .mockResolvedValueOnce({ id: 'existing', slug: 'test-title' })
                    .mockResolvedValueOnce(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData(),
                'author1',
                { isAdmin: false },
            )

            expect(result.slug).toMatch(/^test-title-[a-zA-Z0-9]{4}$/)
        })

        it('应该在提供的 slug 已存在时抛出错误', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue({ id: 'existing', slug: 'custom-slug' }),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockPostRepo as any)

            await expect(
                createPostService(
                    createTestPostData({ slug: 'custom-slug' }),
                    'author1',
                    { isAdmin: false },
                ),
            ).rejects.toThrow('Slug already exists')
        })

        it('应该处理分类 ID', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            const mockCategoryRepo = {
                findOne: vi.fn().mockResolvedValue({ id: 'cat1', name: 'Tech' }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return mockCategoryRepo as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ categoryId: 'cat1' }),
                'author1',
                { isAdmin: false },
            )

            expect(result.categoryId).toBe('cat1')
        })

        it('应该在分类不存在时抛出错误', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }

            const mockCategoryRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return mockCategoryRepo as any
                }
                return {} as any
            })

            await expect(
                createPostService(
                    createTestPostData({ categoryId: 'nonexistent' }),
                    'author1',
                    { isAdmin: false },
                ),
            ).rejects.toThrow('Category with ID "nonexistent" not found')
        })

        it('应该处理标签', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ tags: ['tag1', 'tag2'] }),
                'author1',
                { isAdmin: false },
            )

            expect(result.tags).toBeDefined()
        })

        it('应该处理密码保护', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ password: 'secret123' }),
                'author1',
                { isAdmin: false },
            )

            expect(result.password).toBe('hashed_secret123')
        })

        it('应该将非管理员的发布状态改为待审核', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ status: PostStatus.PUBLISHED }),
                'author1',
                { isAdmin: false },
            )

            expect(result.status).toBe(PostStatus.PENDING)
        })

        it('应该允许管理员直接发布', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ status: PostStatus.PUBLISHED }),
                'author1',
                { isAdmin: true },
            )

            expect(result.status).toBe(PostStatus.PUBLISHED)
        })

        it('应该在发布时设置 publishedAt', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ status: PostStatus.PUBLISHED }),
                'author1',
                { isAdmin: true },
            )

            expect(result.publishedAt).toBeInstanceOf(Date)
        })

        it('应该允许管理员设置自定义创建时间', async () => {
            const customDate = new Date('2024-01-01')
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await createPostService(
                createTestPostData({ createdAt: customDate }),
                'author1',
                { isAdmin: true },
            )

            expect(result.createdAt).toBe(customDate)
        })

        it('应该在发布时创建营销推送（pushOption=now）', async () => {
            const { createCampaignFromPost, sendMarketingCampaign } = await import('./notification')

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => {
                    post.id = 'post1'
                    return Promise.resolve(post)
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            await createPostService(
                createTestPostData({ status: PostStatus.PUBLISHED, pushOption: 'now' }),
                'author1',
                { isAdmin: true },
            )

            expect(createCampaignFromPost).toHaveBeenCalledWith('post1', 'author1', MarketingCampaignStatus.SENDING)
            expect(sendMarketingCampaign).toHaveBeenCalledWith('campaign1')
        })

        it('应该在发布时创建草稿推送（pushOption=later）', async () => {
            const { createCampaignFromPost } = await import('./notification')

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
                save: vi.fn().mockImplementation((post) => {
                    post.id = 'post1'
                    return Promise.resolve(post)
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            await createPostService(
                createTestPostData({
                    title: 'Test',
                    content: 'Content',
                    status: PostStatus.PUBLISHED,
                    pushOption: 'draft',
                }),
                'author1',
                { isAdmin: true },
            )

            expect(createCampaignFromPost).toHaveBeenCalledWith('post1', 'author1', MarketingCampaignStatus.DRAFT)
        })
    })

    describe('updatePostService', () => {
        it('应该更新现有文章', async () => {
            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                status: PostStatus.DRAFT,
                language: 'zh-CN',
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(existingPost),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await updatePostService(
                'post1',
                { title: 'Updated Title' },
                { isAdmin: false, currentUserId: 'author1' },
            )

            expect(result.title).toBe('Updated Title')
            expect(mockPostRepo.save).toHaveBeenCalled()
        })

        it('应该在文章不存在时抛出错误', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockPostRepo as any)

            await expect(
                updatePostService(
                    'nonexistent',
                    { title: 'Updated' },
                    { isAdmin: false, currentUserId: 'author1' },
                ),
            ).rejects.toThrow('Post not found')
        })

        it('应该在非作者且非管理员时拒绝更新', async () => {
            const existingPost = {
                id: 'post1',
                authorId: 'author1',
                status: PostStatus.DRAFT,
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(existingPost),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockPostRepo as any)

            await expect(
                updatePostService(
                    'post1',
                    { title: 'Updated' },
                    { isAdmin: false, currentUserId: 'other-user' },
                ),
            ).rejects.toThrow('Forbidden')
        })

        it('应该允许管理员更新任何文章', async () => {
            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                status: PostStatus.DRAFT,
                language: 'zh-CN',
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(existingPost),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await updatePostService(
                'post1',
                { title: 'Updated by Admin' },
                { isAdmin: true, currentUserId: 'admin1' },
            )

            expect(result.title).toBe('Updated by Admin')
        })

        it('应该在 slug 冲突时抛出错误', async () => {
            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                language: 'zh-CN',
                tags: [],
            }

            const conflictPost = {
                id: 'post2',
                slug: 'new-slug',
                language: 'zh-CN',
            }

            const mockPostRepo = {
                findOne: vi.fn()
                    .mockResolvedValueOnce(existingPost)
                    .mockResolvedValueOnce(conflictPost),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockPostRepo as any)

            await expect(
                updatePostService(
                    'post1',
                    { slug: 'new-slug' },
                    { isAdmin: false, currentUserId: 'author1' },
                ),
            ).rejects.toThrow('Post slug already exists in this language')
        })

        it('应该允许更新为相同的 slug', async () => {
            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                status: PostStatus.DRAFT,
                language: 'zh-CN',
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn()
                    .mockResolvedValueOnce(existingPost)
                    .mockResolvedValueOnce(existingPost),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await updatePostService(
                'post1',
                { slug: 'test-post' },
                { isAdmin: false, currentUserId: 'author1' },
            )

            expect(result.slug).toBe('test-post')
        })

        it('应该在首次发布时创建营销推送', async () => {
            const { createCampaignFromPost, sendMarketingCampaign } = await import('./notification')

            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                status: PostStatus.DRAFT,
                language: 'zh-CN',
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(existingPost),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            await updatePostService(
                'post1',
                { status: PostStatus.PUBLISHED, pushOption: 'now' },
                { isAdmin: true, currentUserId: 'author1' },
            )

            expect(createCampaignFromPost).toHaveBeenCalled()
            expect(sendMarketingCampaign).toHaveBeenCalled()
        })

        it('应该在已发布文章更新时不创建推送', async () => {
            const { createCampaignFromPost } = await import('./notification')
            vi.mocked(createCampaignFromPost).mockClear()

            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                status: PostStatus.PUBLISHED,
                language: 'zh-CN',
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(existingPost),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            await updatePostService(
                'post1',
                { title: 'Updated Title', pushOption: 'now' },
                { isAdmin: true, currentUserId: 'author1' },
            )

            expect(createCampaignFromPost).not.toHaveBeenCalled()
        })

        it('应该允许管理员修改浏览量', async () => {
            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                status: PostStatus.DRAFT,
                language: 'zh-CN',
                views: 100,
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(existingPost),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await updatePostService(
                'post1',
                { views: 500 },
                { isAdmin: true, currentUserId: 'admin1' },
            )

            expect(result.views).toBe(500)
        })

        it('应该更新发布时间当从非发布状态转为发布状态', async () => {
            const existingPost = {
                id: 'post1',
                slug: 'test-post',
                authorId: 'author1',
                status: PostStatus.DRAFT,
                language: 'zh-CN',
                publishedAt: null,
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(existingPost),
                save: vi.fn().mockImplementation((post) => Promise.resolve(post)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'Category') {
                    return {} as any
                }
                return {} as any
            })

            const result = await updatePostService(
                'post1',
                { status: PostStatus.PUBLISHED },
                { isAdmin: true, currentUserId: 'author1' },
            )

            expect(result.publishedAt).toBeInstanceOf(Date)
        })
    })
})
