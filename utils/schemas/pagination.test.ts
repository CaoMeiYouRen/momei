import { describe, it, expect } from 'vitest'
import { paginationSchema, sortingSchema } from './pagination'

describe('utils/schemas/pagination', () => {
    describe('paginationSchema', () => {
        it('应该接受有效的分页参数', () => {
            const validData = {
                page: 1,
                limit: 10,
            }
            const result = paginationSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(1)
                expect(result.data.limit).toBe(10)
            }
        })

        it('应该使用默认值', () => {
            const emptyData = {}
            const result = paginationSchema.safeParse(emptyData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(1)
                expect(result.data.limit).toBe(10)
            }
        })

        it('应该将字符串 page 强制转换为数字', () => {
            const data = { page: '2' }
            const result = paginationSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(2)
            }
        })

        it('应该将字符串 limit 强制转换为数字', () => {
            const data = { limit: '20' }
            const result = paginationSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.limit).toBe(20)
            }
        })

        it('应该拒绝小于 1 的 page', () => {
            const invalidData = { page: 0 }
            const result = paginationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝负数的 page', () => {
            const invalidData = { page: -1 }
            const result = paginationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝小数的 page', () => {
            const invalidData = { page: 1.5 }
            const result = paginationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝小于 1 的 limit', () => {
            const invalidData = { limit: 0 }
            const result = paginationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝大于 500 的 limit', () => {
            const invalidData = { limit: 501 }
            const result = paginationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝负数的 limit', () => {
            const invalidData = { limit: -1 }
            const result = paginationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝小数的 limit', () => {
            const invalidData = { limit: 10.5 }
            const result = paginationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受 page 的边界值 1', () => {
            const data = { page: 1 }
            const result = paginationSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(1)
            }
        })

        it('应该接受 limit 的边界值 500', () => {
            const data = { limit: 500 }
            const result = paginationSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.limit).toBe(500)
            }
        })

        it('应该接受 limit 的边界值 1', () => {
            const data = { limit: 1 }
            const result = paginationSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.limit).toBe(1)
            }
        })

        it('应该处理大数值的 page', () => {
            const data = { page: 1000000 }
            const result = paginationSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(1000000)
            }
        })

        it('应该同时接受 page 和 limit', () => {
            const data = { page: 5, limit: 50 }
            const result = paginationSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(5)
                expect(result.data.limit).toBe(50)
            }
        })
    })

    describe('sortingSchema', () => {
        it('应该接受有效的排序参数', () => {
            const validData = {
                orderBy: 'createdAt',
                order: 'DESC' as const,
            }
            const result = sortingSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.orderBy).toBe('createdAt')
                expect(result.data.order).toBe('DESC')
            }
        })

        it('应该使用默认值', () => {
            const emptyData = {}
            const result = sortingSchema.safeParse(emptyData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.orderBy).toBe('createdAt')
                expect(result.data.order).toBe('DESC')
            }
        })

        it('应该接受 ASC 排序', () => {
            const data = { order: 'ASC' as const }
            const result = sortingSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.order).toBe('ASC')
            }
        })

        it('应该接受 DESC 排序', () => {
            const data = { order: 'DESC' as const }
            const result = sortingSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.order).toBe('DESC')
            }
        })

        it('应该拒绝无效的 order 值', () => {
            const invalidData = { order: 'INVALID' }
            const result = sortingSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受自定义的 orderBy', () => {
            const data = { orderBy: 'name' }
            const result = sortingSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.orderBy).toBe('name')
            }
        })

        it('应该接受空字符串的 orderBy', () => {
            const data = { orderBy: '' }
            const result = sortingSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.orderBy).toBe('')
            }
        })

        it('应该同时接受 orderBy 和 order', () => {
            const data = {
                orderBy: 'updatedAt',
                order: 'ASC' as const,
            }
            const result = sortingSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.orderBy).toBe('updatedAt')
                expect(result.data.order).toBe('ASC')
            }
        })
    })
})
