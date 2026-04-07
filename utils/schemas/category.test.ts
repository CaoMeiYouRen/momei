import { describe, it, expect, beforeEach } from 'vitest'
import { categoryBodySchema, categoryUpdateSchema, categoryQuerySchema } from './category'

describe('utils/schemas/category', () => {
    describe('categoryBodySchema', () => {
        it('应该接受有效的分类数据', () => {
            const validData = {
                name: 'Technology',
                slug: 'technology',
                description: 'Tech related posts',
                parentId: null,
                language: 'zh-CN',
                translationId: null,
            }
            const result = categoryBodySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受最小有效数据', () => {
            const minimalData = {
                name: 'Tech',
                slug: 'tech',
            }
            const result = categoryBodySchema.safeParse(minimalData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝空名称', () => {
            const invalidData = {
                name: '',
                slug: 'tech',
            }
            const result = categoryBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝名称超过100个字符', () => {
            const invalidData = {
                name: 'a'.repeat(101),
                slug: 'tech',
            }
            const result = categoryBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝空slug', () => {
            const invalidData = {
                name: 'Tech',
                slug: '',
            }
            const result = categoryBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝slug超过100个字符', () => {
            const invalidData = {
                name: 'Tech',
                slug: 'a'.repeat(101),
            }
            const result = categoryBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝 Snowflake ID 格式的 slug', () => {
            const invalidData = {
                name: 'Tech',
                slug: '123456789012345',
            }
            const result = categoryBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('Slug cannot be a Snowflake ID format')
            }
        })

        it('应该接受有效的 parentId', () => {
            const data = {
                name: 'Tech',
                slug: 'tech',
                parentId: 'parent-id',
            }
            const result = categoryBodySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受 null parentId', () => {
            const data = {
                name: 'Tech',
                slug: 'tech',
                parentId: null,
            }
            const result = categoryBodySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该使用默认语言 zh-CN', () => {
            const data = {
                name: 'Tech',
                slug: 'tech',
            }
            const result = categoryBodySchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('zh-CN')
            }
        })

        it('应该接受自定义语言', () => {
            const data = {
                name: 'Tech',
                slug: 'tech',
                language: 'en-US',
            }
            const result = categoryBodySchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('en-US')
            }
        })

        it('应该接受可选的 description', () => {
            const data = {
                name: 'Tech',
                slug: 'tech',
                description: 'A category',
            }
            const result = categoryBodySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受 null description', () => {
            const data = {
                name: 'Tech',
                slug: 'tech',
                description: null,
            }
            const result = categoryBodySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该拒绝超过255字符的 translationId', () => {
            const invalidData = {
                name: 'Tech',
                slug: 'tech',
                translationId: 'a'.repeat(256),
            }
            const result = categoryBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('categoryUpdateSchema', () => {
        it('应该接受部分更新数据', () => {
            const partialData = {
                name: 'Updated Tech',
            }
            const result = categoryUpdateSchema.safeParse(partialData)
            expect(result.success).toBe(true)
        })

        it('应该接受空对象作为更新', () => {
            const emptyData = {}
            const result = categoryUpdateSchema.safeParse(emptyData)
            expect(result.success).toBe(true)
        })

        it('应该接受所有字段更新', () => {
            const fullData = {
                name: 'Updated Tech',
                slug: 'updated-tech',
                description: 'Updated description',
                parentId: 'new-parent',
                language: 'en-US',
                translationId: 'trans-123',
            }
            const result = categoryUpdateSchema.safeParse(fullData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝更新时 Snowflake ID 格式的 slug', () => {
            const invalidData = {
                slug: 'abcdef123456789',
            }
            const result = categoryUpdateSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('categoryQuerySchema', () => {
        it('应该接受空查询参数', () => {
            const emptyQuery = {}
            const result = categoryQuerySchema.safeParse(emptyQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受分页参数', () => {
            const paginationQuery = {
                page: 1,
                pageSize: 10,
            }
            const result = categoryQuerySchema.safeParse(paginationQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受排序参数', () => {
            const sortQuery = {
                sortBy: 'name',
                sortOrder: 'asc' as const,
            }
            const result = categoryQuerySchema.safeParse(sortQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受搜索参数', () => {
            const searchQuery = {
                search: 'tech',
            }
            const result = categoryQuerySchema.safeParse(searchQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受 parentId 过滤', () => {
            const parentQuery = {
                parentId: 'parent-123',
            }
            const result = categoryQuerySchema.safeParse(parentQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受语言过滤', () => {
            const langQuery = {
                language: 'zh-CN',
            }
            const result = categoryQuerySchema.safeParse(langQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受 translationId 过滤', () => {
            const transQuery = {
                translationId: 'trans-123',
            }
            const result = categoryQuerySchema.safeParse(transQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受 aggregate=true', () => {
            const aggregateQuery = {
                aggregate: 'true',
            }
            const result = categoryQuerySchema.safeParse(aggregateQuery)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.aggregate).toBe(true)
            }
        })

        it('应该接受 aggregate=false', () => {
            const aggregateQuery = {
                aggregate: 'false',
            }
            const result = categoryQuerySchema.safeParse(aggregateQuery)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.aggregate).toBe(false)
            }
        })

        it('应该接受布尔值 aggregate', () => {
            const aggregateQuery = {
                aggregate: true,
            }
            const result = categoryQuerySchema.safeParse(aggregateQuery)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.aggregate).toBe(true)
            }
        })

        it('应该接受组合查询参数', () => {
            const combinedQuery = {
                page: 1,
                pageSize: 20,
                sortBy: 'name' as const,
                sortOrder: 'desc' as const,
                search: 'tech',
                language: 'zh-CN',
                aggregate: 'true',
            }
            const result = categoryQuerySchema.safeParse(combinedQuery)
            expect(result.success).toBe(true)
        })

        it('aggregate 默认值应为 false', () => {
            const query = {}
            const result = categoryQuerySchema.safeParse(query)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.aggregate).toBe(false)
            }
        })
    })
})
