import { describe, expect, it } from 'vitest'
import {
    subscriberIdSchema,
    subscriberListQuerySchema,
    subscribeSchema,
    updateSubscriberSchema,
} from './subscriber'

describe('utils/schemas/subscriber', () => {
    describe('subscribeSchema', () => {
        it('应该验证有效订阅数据并应用默认语言', () => {
            const result = subscribeSchema.safeParse({ email: 'test@example.com' })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('zh-CN')
            }
        })

        it('应该拒绝非法邮箱', () => {
            const result = subscribeSchema.safeParse({ email: 'not-email' })
            expect(result.success).toBe(false)
        })
    })

    describe('subscriberListQuerySchema', () => {
        it('应该验证并规范化有效查询参数', () => {
            const result = subscriberListQuerySchema.safeParse({
                page: '2',
                pageSize: '50',
                email: '  test@example.com  ',
            })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(2)
                expect(result.data.pageSize).toBe(50)
                expect(result.data.email).toBe('test@example.com')
            }
        })

        it('应该拒绝越界分页参数', () => {
            const result = subscriberListQuerySchema.safeParse({ page: 0, pageSize: 101 })
            expect(result.success).toBe(false)
        })

        it('应该拒绝超长邮箱查询字符串', () => {
            const result = subscriberListQuerySchema.safeParse({ email: `${'a'.repeat(260)}@example.com` })
            expect(result.success).toBe(false)
        })
    })

    describe('subscriberIdSchema', () => {
        it('应该验证合法订阅者 ID', () => {
            const result = subscriberIdSchema.safeParse({ id: '5fd0e68d1f80001' })
            expect(result.success).toBe(true)
        })

        it('应该拒绝非法订阅者 ID', () => {
            const result = subscriberIdSchema.safeParse({ id: 'invalid-id' })
            expect(result.success).toBe(false)
        })
    })

    describe('updateSubscriberSchema', () => {
        it('应该验证管理员更新输入', () => {
            const result = updateSubscriberSchema.safeParse({
                isActive: false,
                language: 'en-US',
                userId: '5fd0e68d1f80001',
            })
            expect(result.success).toBe(true)
        })

        it('应该允许将 userId 置空', () => {
            const result = updateSubscriberSchema.safeParse({ userId: null })
            expect(result.success).toBe(true)
        })

        it('应该拒绝非法 userId 和非法类型字段', () => {
            const result = updateSubscriberSchema.safeParse({
                userId: 'bad-user-id',
                isActive: 'true',
            })
            expect(result.success).toBe(false)
        })
    })
})
