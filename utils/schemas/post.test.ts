import { describe, it, expect } from 'vitest'
import {
    createPostSchema,
    updatePostSchema,
    postQuerySchema,
    updatePostStatusSchema,
    archiveQuerySchema,
} from './post'
import { PostStatus, PostVisibility } from '@/types/post'

describe('utils/schemas/post', () => {
    describe('createPostSchema', () => {
        it('应该验证有效的文章创建数据', () => {
            const validData = {
                title: '测试文章标题',
                slug: 'test-post-slug',
                content: '这是文章内容',
                status: PostStatus.DRAFT,
                visibility: PostVisibility.PUBLIC,
            }

            const result = createPostSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('zh-CN') // 默认值
                expect(result.data.status).toBe(PostStatus.DRAFT)
                expect(result.data.visibility).toBe(PostVisibility.PUBLIC)
            }
        })

        it('应该应用默认值', () => {
            const minimalData = {
                title: '最小文章',
                content: '内容',
            }

            const result = createPostSchema.safeParse(minimalData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('zh-CN')
                expect(result.data.status).toBe(PostStatus.DRAFT)
                expect(result.data.visibility).toBe(PostVisibility.PUBLIC)
            }
        })

        it('应该拒绝空标题', () => {
            const invalidData = {
                title: '',
                content: '内容',
            }

            const result = createPostSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超长标题', () => {
            const invalidData = {
                title: 'a'.repeat(256),
                content: '内容',
            }

            const result = createPostSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝空内容', () => {
            const invalidData = {
                title: '标题',
                content: '',
            }

            const result = createPostSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝 Snowflake ID 格式的 slug', () => {
            const invalidData = {
                title: '标题',
                slug: '5fd0e68d1f80001',
                content: '内容',
            }

            const result = createPostSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该验证有效的封面图片 URL', () => {
            const validData = {
                title: '标题',
                content: '内容',
                coverImage: '/uploads/image.jpg',
            }

            const result = createPostSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证音频相关字段', () => {
            const validData = {
                title: '标题',
                content: '内容',
                audioUrl: '/uploads/audio.mp3',
                audioDuration: 180,
                audioSize: 1024000,
                audioMimeType: 'audio/mpeg',
            }

            const result = createPostSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.audioDuration).toBe(180)
                expect(result.data.audioSize).toBe(1024000)
            }
        })

        it('应该拒绝负数的音频时长', () => {
            const invalidData = {
                title: '标题',
                content: '内容',
                audioDuration: -10,
            }

            const result = createPostSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该验证所有文章状态', () => {
            const statuses = [
                PostStatus.DRAFT,
                PostStatus.PENDING,
                PostStatus.PUBLISHED,
                PostStatus.REJECTED,
                PostStatus.HIDDEN,
            ]

            statuses.forEach((status) => {
                const data = {
                    title: '标题',
                    content: '内容',
                    status,
                }
                const result = createPostSchema.safeParse(data)
                expect(result.success).toBe(true)
            })
        })

        it('应该验证所有可见性选项', () => {
            const visibilities = [
                PostVisibility.PUBLIC,
                PostVisibility.PRIVATE,
                PostVisibility.PASSWORD,
                PostVisibility.REGISTERED,
                PostVisibility.SUBSCRIBER,
            ]

            visibilities.forEach((visibility) => {
                const data = {
                    title: '标题',
                    content: '内容',
                    visibility,
                }
                const result = createPostSchema.safeParse(data)
                expect(result.success).toBe(true)
            })
        })

        it('应该验证可选的日期字段', () => {
            const validData = {
                title: '标题',
                content: '内容',
                createdAt: new Date('2024-01-01'),
                publishedAt: new Date('2024-01-02'),
            }

            const result = createPostSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证浏览量字段', () => {
            const validData = {
                title: '标题',
                content: '内容',
                views: 100,
            }

            const result = createPostSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.views).toBe(100)
            }
        })

        it('应该拒绝负数的浏览量', () => {
            const invalidData = {
                title: '标题',
                content: '内容',
                views: -1,
            }

            const result = createPostSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('updatePostSchema', () => {
        it('应该允许部分更新', () => {
            const partialData = {
                title: '更新的标题',
            }

            const result = updatePostSchema.safeParse(partialData)
            expect(result.success).toBe(true)
        })

        it('应该允许更新所有字段', () => {
            const fullData = {
                title: '更新的标题',
                slug: 'updated-slug',
                content: '更新的内容',
                summary: '更新的摘要',
                status: PostStatus.PUBLISHED,
                visibility: PostVisibility.PUBLIC,
            }

            const result = updatePostSchema.safeParse(fullData)
            expect(result.success).toBe(true)
        })

        it('应该允许空对象（不更新任何字段）', () => {
            const emptyData = {}

            const result = updatePostSchema.safeParse(emptyData)
            expect(result.success).toBe(true)
        })

        it('应该验证更新时的字段约束', () => {
            const invalidData = {
                title: '', // 空标题
            }

            const result = updatePostSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('postQuerySchema', () => {
        it('应该应用默认分页参数', () => {
            const result = postQuerySchema.safeParse({})
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(1)
                expect(result.data.limit).toBe(10)
                expect(result.data.scope).toBe('public')
                expect(result.data.orderBy).toBe('publishedAt')
                expect(result.data.order).toBe('DESC')
                expect(result.data.aggregate).toBe(false)
            }
        })

        it('应该验证自定义分页参数', () => {
            const queryData = {
                page: 2,
                limit: 20,
            }

            const result = postQuerySchema.safeParse(queryData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(2)
                expect(result.data.limit).toBe(20)
            }
        })

        it('应该验证状态过滤', () => {
            const queryData = {
                status: PostStatus.PUBLISHED,
            }

            const result = postQuerySchema.safeParse(queryData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.status).toBe(PostStatus.PUBLISHED)
            }
        })

        it('应该处理空字符串状态', () => {
            const queryData = {
                status: '',
            }

            const result = postQuerySchema.safeParse(queryData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.status).toBeUndefined()
            }
        })

        it('应该验证作用域', () => {
            const publicScope = postQuerySchema.safeParse({ scope: 'public' })
            expect(publicScope.success).toBe(true)

            const manageScope = postQuerySchema.safeParse({ scope: 'manage' })
            expect(manageScope.success).toBe(true)
        })

        it('应该验证排序字段', () => {
            const orderByFields = ['createdAt', 'updatedAt', 'views', 'publishedAt', 'title', 'status']

            orderByFields.forEach((orderBy) => {
                const result = postQuerySchema.safeParse({ orderBy })
                expect(result.success).toBe(true)
            })
        })

        it('应该验证排序方向', () => {
            const ascResult = postQuerySchema.safeParse({ order: 'ASC' })
            expect(ascResult.success).toBe(true)

            const descResult = postQuerySchema.safeParse({ order: 'DESC' })
            expect(descResult.success).toBe(true)
        })

        it('应该验证过滤参数', () => {
            const queryData = {
                authorId: 'user-123',
                category: 'tech',
                tag: 'javascript',
                language: 'zh-CN',
                search: '搜索关键词',
            }

            const result = postQuerySchema.safeParse(queryData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.authorId).toBe('user-123')
                expect(result.data.category).toBe('tech')
                expect(result.data.tag).toBe('javascript')
                expect(result.data.language).toBe('zh-CN')
                expect(result.data.search).toBe('搜索关键词')
            }
        })

        it('应该处理聚合参数', () => {
            const trueResult = postQuerySchema.safeParse({ aggregate: 'true' })
            expect(trueResult.success).toBe(true)
            if (trueResult.success) {
                expect(trueResult.data.aggregate).toBe(true)
            }

            const boolResult = postQuerySchema.safeParse({ aggregate: true })
            expect(boolResult.success).toBe(true)
            if (boolResult.success) {
                expect(boolResult.data.aggregate).toBe(true)
            }
        })
    })

    describe('updatePostStatusSchema', () => {
        it('应该验证状态更新', () => {
            const validData = {
                status: PostStatus.PUBLISHED,
            }

            const result = updatePostStatusSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝无效状态', () => {
            const invalidData = {
                status: 'invalid-status',
            }

            const result = updatePostStatusSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝缺少状态字段', () => {
            const invalidData = {}

            const result = updatePostStatusSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('archiveQuerySchema', () => {
        it('应该应用默认值', () => {
            const result = archiveQuerySchema.safeParse({})
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.includePosts).toBe(false)
                expect(result.data.page).toBe(1)
                expect(result.data.limit).toBe(10)
                expect(result.data.scope).toBe('public')
            }
        })

        it('应该验证年份参数', () => {
            const validData = {
                year: 2024,
            }

            const result = archiveQuerySchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.year).toBe(2024)
            }
        })

        it('应该拒绝过早的年份', () => {
            const invalidData = {
                year: 1969,
            }

            const result = archiveQuerySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该验证月份参数', () => {
            const validData = {
                month: 6,
            }

            const result = archiveQuerySchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.month).toBe(6)
            }
        })

        it('应该拒绝无效月份', () => {
            const invalidMonth0 = archiveQuerySchema.safeParse({ month: 0 })
            expect(invalidMonth0.success).toBe(false)

            const invalidMonth13 = archiveQuerySchema.safeParse({ month: 13 })
            expect(invalidMonth13.success).toBe(false)
        })

        it('应该验证语言参数', () => {
            const validData = {
                language: 'en-US',
            }

            const result = archiveQuerySchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('en-US')
            }
        })

        it('应该验证 includePosts 参数', () => {
            const trueResult = archiveQuerySchema.safeParse({ includePosts: true })
            expect(trueResult.success).toBe(true)
            if (trueResult.success) {
                expect(trueResult.data.includePosts).toBe(true)
            }

            const falseResult = archiveQuerySchema.safeParse({ includePosts: false })
            expect(falseResult.success).toBe(true)
            if (falseResult.success) {
                expect(falseResult.data.includePosts).toBe(false)
            }
        })

        it('应该验证分页限制', () => {
            const validData = {
                page: 1,
                limit: 50,
            }

            const result = archiveQuerySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝超出范围的 limit', () => {
            const invalidData = {
                limit: 101,
            }

            const result = archiveQuerySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })
})
