import { describe, it, expect } from 'vitest'
import {
    adminFriendLinkListQuerySchema,
    friendLinkCategorySchema,
    friendLinkSchema,
    friendLinkApplicationSchema,
    friendLinkApplicationReviewSchema,
} from './friend-link'
import { FriendLinkStatus, FriendLinkApplicationStatus } from '@/types/friend-link'

describe('utils/schemas/friend-link', () => {
    describe('friendLinkCategorySchema', () => {
        it('应该接受有效的分类数据', () => {
            const validData = {
                name: 'Tech Blogs',
                slug: 'tech-blogs',
                description: 'Technology related blogs',
                sortOrder: 1,
                isEnabled: true,
            }
            const result = friendLinkCategorySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受最小有效数据', () => {
            const minimalData = {
                name: 'Tech',
            }
            const result = friendLinkCategorySchema.safeParse(minimalData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝空名称', () => {
            const invalidData = {
                name: '',
            }
            const result = friendLinkCategorySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('分类名称不能为空')
            }
        })

        it('应该拒绝超过100字符的名称', () => {
            const invalidData = {
                name: 'a'.repeat(101),
            }
            const result = friendLinkCategorySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('分类名称过长')
            }
        })

        it('应该拒绝无效的 slug 格式', () => {
            const invalidData = {
                name: 'Tech',
                slug: 'Invalid_Slug',
            }
            const result = friendLinkCategorySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('Slug 仅支持小写字母、数字和连字符')
            }
        })

        it('应该接受有效的 slug', () => {
            const data = {
                name: 'Tech',
                slug: 'tech-blogs-2024',
            }
            const result = friendLinkCategorySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该拒绝超过100字符的 slug', () => {
            const invalidData = {
                name: 'Tech',
                slug: 'a'.repeat(101),
            }
            const result = friendLinkCategorySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超过500字符的描述', () => {
            const invalidData = {
                name: 'Tech',
                description: 'a'.repeat(501),
            }
            const result = friendLinkCategorySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受负数的 sortOrder', () => {
            const invalidData = {
                name: 'Tech',
                sortOrder: -1,
            }
            const result = friendLinkCategorySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受零的 sortOrder', () => {
            const data = {
                name: 'Tech',
                sortOrder: 0,
            }
            const result = friendLinkCategorySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该拒绝超过9999的 sortOrder', () => {
            const invalidData = {
                name: 'Tech',
                sortOrder: 10000,
            }
            const result = friendLinkCategorySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('friendLinkSchema', () => {
        it('应该接受有效的友链数据', () => {
            const validData = {
                name: 'Example Blog',
                url: 'https://example.com',
                logo: '/logo.png',
                description: 'A great blog',
                rssUrl: 'https://example.com/rss',
                contactEmail: 'admin@example.com',
                categoryId: 'cat-123',
                status: FriendLinkStatus.ACTIVE,
                isPinned: false,
                isFeatured: true,
                sortOrder: 1,
            }
            const result = friendLinkSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受最小有效数据', () => {
            const minimalData = {
                name: 'Example',
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(minimalData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝空名称', () => {
            const invalidData = {
                name: '',
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超过120字符的名称', () => {
            const invalidData = {
                name: 'a'.repeat(121),
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝无效的 URL', () => {
            const invalidData = {
                name: 'Example',
                url: 'not-a-url',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝非 http/https 协议的 URL', () => {
            const invalidData = {
                name: 'Example',
                url: 'ftp://example.com',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受本地路径的 logo', () => {
            const data = {
                name: 'Example',
                url: 'https://example.com',
                logo: '/local/image.png',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受 data URL 的 logo', () => {
            const data = {
                name: 'Example',
                url: 'https://example.com',
                logo: 'data:image/png;base64,iVBORw0KG...',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该拒绝无效的 logo URL', () => {
            const invalidData = {
                name: 'Example',
                url: 'https://example.com',
                logo: 'invalid-logo',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超过2000字符的描述', () => {
            const invalidData = {
                name: 'Example',
                url: 'https://example.com',
                description: 'a'.repeat(2001),
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝无效的邮箱', () => {
            const invalidData = {
                name: 'Example',
                url: 'https://example.com',
                contactEmail: 'not-an-email',
            }
            const result = friendLinkSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受空字符串 RSS URL', () => {
            const data = {
                name: 'Example',
                url: 'https://example.com',
                rssUrl: '',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受有效的 status 枚举值', () => {
            const statuses = [
                FriendLinkStatus.DRAFT,
                FriendLinkStatus.ACTIVE,
                FriendLinkStatus.INACTIVE,
            ]
            statuses.forEach((status) => {
                const data = {
                    name: 'Example',
                    url: 'https://example.com',
                    contactEmail: 'admin@example.com',
                    status,
                }
                const result = friendLinkSchema.safeParse(data)
                expect(result.success).toBe(true)
            })
        })
    })

    describe('friendLinkApplicationSchema', () => {
        it('应该接受有效的申请数据', () => {
            const validData = {
                name: 'Example Blog',
                url: 'https://example.com',
                logo: '/logo.png',
                description: 'A great blog',
                categoryId: 'cat-123',
                categorySuggestion: 'Tech',
                contactName: 'John Doe',
                contactEmail: 'admin@example.com',
                rssUrl: 'https://example.com/rss',
                reciprocalUrl: 'https://example.com/link',
                message: 'Please add my blog',
            }
            const result = friendLinkApplicationSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受最小有效数据', () => {
            const minimalData = {
                name: 'Example',
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
            }
            const result = friendLinkApplicationSchema.safeParse(minimalData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝超过100字符的分类建议', () => {
            const invalidData = {
                name: 'Example',
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
                categorySuggestion: 'a'.repeat(101),
            }
            const result = friendLinkApplicationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超过100字符的联系人名称', () => {
            const invalidData = {
                name: 'Example',
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
                contactName: 'a'.repeat(101),
            }
            const result = friendLinkApplicationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超过500字符的消息', () => {
            const invalidData = {
                name: 'Example',
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
                message: 'a'.repeat(501),
            }
            const result = friendLinkApplicationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受空的交换链接 URL', () => {
            const data = {
                name: 'Example',
                url: 'https://example.com',
                contactEmail: 'admin@example.com',
                reciprocalUrl: '',
            }
            const result = friendLinkApplicationSchema.safeParse(data)
            expect(result.success).toBe(true)
        })
    })

    describe('friendLinkApplicationReviewSchema', () => {
        it('应该接受有效的审核数据', () => {
            const validData = {
                status: FriendLinkApplicationStatus.APPROVED,
                reviewNote: 'Looks good',
                linkData: {
                    name: 'Approved Blog',
                    url: 'https://example.com',
                    contactEmail: 'admin@example.com',
                },
            }
            const result = friendLinkApplicationReviewSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受最小审核数据', () => {
            const minimalData = {
                status: FriendLinkApplicationStatus.APPROVED,
            }
            const result = friendLinkApplicationReviewSchema.safeParse(minimalData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝超过1000字符的审核备注', () => {
            const invalidData = {
                status: FriendLinkApplicationStatus.APPROVED,
                reviewNote: 'a'.repeat(1001),
            }
            const result = friendLinkApplicationReviewSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受所有有效的 status 枚举值', () => {
            const statuses = Object.values(FriendLinkApplicationStatus)
            statuses.forEach((status) => {
                const data = { status }
                const result = friendLinkApplicationReviewSchema.safeParse(data)
                expect(result.success).toBe(true)
            })
        })

        it('应该接受部分 linkData', () => {
            const data = {
                status: FriendLinkApplicationStatus.APPROVED,
                linkData: {
                    description: 'Updated description',
                },
            }
            const result = friendLinkApplicationReviewSchema.safeParse(data)
            expect(result.success).toBe(true)
        })
    })

    describe('adminFriendLinkListQuerySchema', () => {
        it('应该解析后台友链列表查询参数', () => {
            const result = adminFriendLinkListQuerySchema.safeParse({
                page: '2',
                limit: '15',
                status: FriendLinkStatus.ACTIVE,
                categoryId: ' category-1 ',
                featured: 'true',
                keyword: '  example  ',
            })

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data).toEqual({
                    page: 2,
                    limit: 15,
                    status: FriendLinkStatus.ACTIVE,
                    categoryId: 'category-1',
                    featured: true,
                    keyword: 'example',
                })
            }
        })

        it('应该拒绝无效 featured 值', () => {
            expect(adminFriendLinkListQuerySchema.safeParse({ featured: 'maybe' }).success).toBe(false)
        })
    })
})
