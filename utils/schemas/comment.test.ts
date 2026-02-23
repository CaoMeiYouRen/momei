import { describe, expect, it } from 'vitest'
import { commentBodySchema, commentListQuerySchema } from './comment'
import { CommentStatus } from '@/types/comment'

describe('utils/schemas/comment', () => {
    describe('commentListQuerySchema', () => {
        it('应该验证有效的查询参数并应用默认值', () => {
            const result = commentListQuerySchema.safeParse({
                status: CommentStatus.PUBLISHED,
                keyword: '  hello  ',
                postId: '5fd0e68d1f80001',
            })

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(1)
                expect(result.data.limit).toBe(10)
                expect(result.data.keyword).toBe('hello')
            }
        })

        it('应该拒绝非法状态', () => {
            const result = commentListQuerySchema.safeParse({ status: 'invalid-status' })
            expect(result.success).toBe(false)
        })

        it('应该拒绝非法 postId', () => {
            const result = commentListQuerySchema.safeParse({ postId: 'not-an-id' })
            expect(result.success).toBe(false)
        })

        it('应该拒绝越界分页参数', () => {
            const result = commentListQuerySchema.safeParse({ page: 0, limit: 0 })
            expect(result.success).toBe(false)
        })

        it('应该拒绝超长关键词', () => {
            const result = commentListQuerySchema.safeParse({ keyword: 'a'.repeat(101) })
            expect(result.success).toBe(false)
        })
    })

    describe('commentBodySchema', () => {
        it('应该验证有效评论内容', () => {
            const result = commentBodySchema.safeParse({
                content: '  这是一条评论  ',
                authorName: '  Tester  ',
                authorEmail: 'tester@example.com',
                authorUrl: 'https://example.com/about',
            })

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.content).toBe('这是一条评论')
                expect(result.data.authorName).toBe('Tester')
            }
        })

        it('应该拒绝空白评论内容', () => {
            const result = commentBodySchema.safeParse({ content: '   ' })
            expect(result.success).toBe(false)
        })

        it('应该拒绝超长评论内容', () => {
            const result = commentBodySchema.safeParse({ content: 'a'.repeat(5001) })
            expect(result.success).toBe(false)
        })

        it('应该拒绝非法邮箱和 URL', () => {
            const result = commentBodySchema.safeParse({
                content: 'valid content',
                authorEmail: 'invalid-email',
                authorUrl: 'invalid-url',
            })
            expect(result.success).toBe(false)
        })

        it('应该拒绝非法 parentId', () => {
            const result = commentBodySchema.safeParse({
                content: 'valid content',
                parentId: 'invalid-parent',
            })
            expect(result.success).toBe(false)
        })
    })
})
