import { describe, it, expect } from 'vitest'
import { tagBodySchema, tagUpdateSchema, tagQuerySchema } from './tag'

describe('utils/schemas/tag', () => {
    describe('tagBodySchema', () => {
        it('应该接受有效的标签数据', () => {
            const validData = {
                name: 'JavaScript',
                slug: 'javascript',
                language: 'zh-CN',
                translationId: null,
            }
            const result = tagBodySchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该接受最小有效数据', () => {
            const minimalData = {
                name: 'JS',
                slug: 'js',
            }
            const result = tagBodySchema.safeParse(minimalData)
            expect(result.success).toBe(true)
        })

        it('应该使用默认语言 zh-CN', () => {
            const data = {
                name: 'JavaScript',
                slug: 'javascript',
            }
            const result = tagBodySchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('zh-CN')
            }
        })

        it('应该拒绝空名称', () => {
            const invalidData = {
                name: '',
                slug: 'javascript',
            }
            const result = tagBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝名称超过100个字符', () => {
            const invalidData = {
                name: 'a'.repeat(101),
                slug: 'javascript',
            }
            const result = tagBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝空slug', () => {
            const invalidData = {
                name: 'JavaScript',
                slug: '',
            }
            const result = tagBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝 Snowflake ID 格式的 slug', () => {
            const invalidData = {
                name: 'JavaScript',
                slug: '123456789012345',
            }
            const result = tagBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0]?.message).toBe('Slug cannot be a Snowflake ID format')
            }
        })

        it('应该拒绝超过255字符的 translationId', () => {
            const invalidData = {
                name: 'JavaScript',
                slug: 'javascript',
                translationId: 'a'.repeat(256),
            }
            const result = tagBodySchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受 null translationId', () => {
            const data = {
                name: 'JavaScript',
                slug: 'javascript',
                translationId: null,
            }
            const result = tagBodySchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('应该接受自定义语言', () => {
            const data = {
                name: 'JavaScript',
                slug: 'javascript',
                language: 'en-US',
            }
            const result = tagBodySchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('en-US')
            }
        })
    })

    describe('tagUpdateSchema', () => {
        it('应该接受部分更新数据', () => {
            const partialData = {
                name: 'Updated JS',
            }
            const result = tagUpdateSchema.safeParse(partialData)
            expect(result.success).toBe(true)
        })

        it('应该接受空对象作为更新', () => {
            const emptyData = {}
            const result = tagUpdateSchema.safeParse(emptyData)
            expect(result.success).toBe(true)
        })

        it('应该接受所有字段更新', () => {
            const fullData = {
                name: 'Updated JS',
                slug: 'updated-js',
                language: 'en-US',
                translationId: 'trans-123',
            }
            const result = tagUpdateSchema.safeParse(fullData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝更新时 Snowflake ID 格式的 slug', () => {
            const invalidData = {
                slug: 'abcdef123456789',
            }
            const result = tagUpdateSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受可选的 slug 更新', () => {
            const data = {
                name: 'Updated JS',
            }
            const result = tagUpdateSchema.safeParse(data)
            expect(result.success).toBe(true)
        })
    })

    describe('tagQuerySchema', () => {
        it('应该接受空查询参数', () => {
            const emptyQuery = {}
            const result = tagQuerySchema.safeParse(emptyQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受分页参数', () => {
            const paginationQuery = {
                page: 1,
                pageSize: 10,
            }
            const result = tagQuerySchema.safeParse(paginationQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受排序参数', () => {
            const sortQuery = {
                sortBy: 'name',
                sortOrder: 'asc' as const,
            }
            const result = tagQuerySchema.safeParse(sortQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受搜索参数', () => {
            const searchQuery = {
                search: 'java',
            }
            const result = tagQuerySchema.safeParse(searchQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受语言过滤', () => {
            const langQuery = {
                language: 'zh-CN',
            }
            const result = tagQuerySchema.safeParse(langQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受 translationId 过滤', () => {
            const transQuery = {
                translationId: 'trans-123',
            }
            const result = tagQuerySchema.safeParse(transQuery)
            expect(result.success).toBe(true)
        })

        it('应该接受 aggregate=true', () => {
            const aggregateQuery = {
                aggregate: 'true',
            }
            const result = tagQuerySchema.safeParse(aggregateQuery)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.aggregate).toBe(true)
            }
        })

        it('应该接受 aggregate=false', () => {
            const aggregateQuery = {
                aggregate: 'false',
            }
            const result = tagQuerySchema.safeParse(aggregateQuery)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.aggregate).toBe(false)
            }
        })

        it('应该接受布尔值 aggregate', () => {
            const aggregateQuery = {
                aggregate: true,
            }
            const result = tagQuerySchema.safeParse(aggregateQuery)
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
                search: 'java',
                language: 'zh-CN',
                aggregate: 'true',
            }
            const result = tagQuerySchema.safeParse(combinedQuery)
            expect(result.success).toBe(true)
        })

        it('aggregate 默认值应为 false', () => {
            const query = {}
            const result = tagQuerySchema.safeParse(query)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.aggregate).toBe(false)
            }
        })
    })
})
