import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockT, mockGetLocale } = vi.hoisted(() => ({
    mockT: vi.fn((key: string) => {
        if (key === 'success.created') {
            return '创建成功'
        }
        if (key === 'error.invalid') {
            return '无效请求'
        }
        return key
    }),
    mockGetLocale: vi.fn(() => 'zh-CN'),
}))

vi.mock('@/server/utils/i18n', () => ({
    t: mockT,
    getLocale: mockGetLocale,
}))

import { success, localizedSuccess, fail, localizedFail, ensureFound, paginate } from '@/server/utils/response'

describe('server/utils/response', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('success', () => {
        it('returns a success response with data and default code 200', () => {
            const result = success({ id: 1 })
            expect(result).toEqual({
                code: 200,
                data: { id: 1 },
                locale: 'zh-CN',
            })
            expect(mockGetLocale).toHaveBeenCalled()
        })

        it('accepts custom code', () => {
            const result = success(null, 201)
            expect(result.code).toBe(201)
            expect(result.data).toBeNull()
        })
    })

    describe('localizedSuccess', () => {
        it('returns a localized success response with message', async () => {
            const result = await localizedSuccess({ id: 1 }, 'success.created')
            expect(result.code).toBe(200)
            expect(result.data).toEqual({ id: 1 })
            expect(result.message).toBe('创建成功')
            expect(result.locale).toBe('zh-CN')
            expect(mockT).toHaveBeenCalledWith('success.created', undefined)
        })
    })

    describe('fail', () => {
        it('throws an error with createError', () => {
            try {
                fail('Bad request')
                expect(true).toBe(false)
            } catch (err: any) {
                expect(err.statusCode).toBe(400)
                expect(err.statusMessage).toBe('Bad request')
                expect(err.data.code).toBe(400)
                expect(err.data.message).toBe('Bad request')
                expect(err.data.locale).toBe('zh-CN')
            }
        })

        it('accepts custom statusCode', () => {
            try {
                fail('Not found', 404)
            } catch (err: any) {
                expect(err.statusCode).toBe(404)
            }
        })
    })

    describe('localizedFail', () => {
        it('throws a localized error', async () => {
            try {
                await localizedFail('error.invalid', 422)
                expect(true).toBe(false)
            } catch (err: any) {
                expect(err.statusCode).toBe(422)
                expect(err.statusMessage).toBe('无效请求')
                expect(err.data.key).toBe('error.invalid')
                expect(err.data.locale).toBe('zh-CN')
                expect(mockT).toHaveBeenCalledWith('error.invalid', undefined)
            }
        })
    })

    describe('ensureFound', () => {
        it('returns the entity when it exists', () => {
            const entity = { id: 1, name: 'test' }
            expect(ensureFound(entity, 'Post')).toBe(entity)
        })

        it('throws 404 when entity is null', () => {
            try {
                ensureFound(null, 'Post')
                expect(true).toBe(false)
            } catch (err: any) {
                expect(err.statusCode).toBe(404)
                expect(err.statusMessage).toBe('Post not found')
                expect(err.data.flag).toBe('NOT_FOUND')
            }
        })

        it('throws 404 when entity is undefined', () => {
            try {
                ensureFound(undefined, 'User')
            } catch (err: any) {
                expect(err.statusCode).toBe(404)
                expect(err.statusMessage).toBe('User not found')
            }
        })
    })

    describe('paginate', () => {
        it('returns paginated result with calculated totalPages', () => {
            const result = paginate([1, 2, 3], 30, 1, 10)
            expect(result).toEqual({
                items: [1, 2, 3],
                total: 30,
                page: 1,
                limit: 10,
                totalPages: 3,
            })
        })

        it('handles zero total', () => {
            const result = paginate([], 0, 1, 20)
            expect(result.totalPages).toBe(0)
        })

        it('handles last page with partial items', () => {
            const items = [1, 2, 3, 4, 5]
            const result = paginate(items, 25, 3, 10)
            expect(result.page).toBe(3)
            expect(result.totalPages).toBe(3)
            expect(result.items).toHaveLength(5)
        })
    })
})
