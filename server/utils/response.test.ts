import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockTranslate } = vi.hoisted(() => ({
    mockTranslate: vi.fn(async (key: string) => `translated:${key}`),
}))

vi.mock('./i18n', () => ({
    t: mockTranslate,
    getLocale: () => 'en-US',
}))

import { ensureFound, fail, localizedFail, localizedSuccess, paginate, success } from './response'

describe('response utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('createError', vi.fn((options: Record<string, unknown>) => Object.assign(new Error(String(options.statusMessage)), options)))
    })

    describe('success', () => {
        it('should return success response with default code 200', () => {
            const data = { id: 1, name: 'Test' }
            const response = success(data)

            expect(response).toEqual({
                code: 200,
                data,
                locale: 'en-US',
            })
        })

        it('should return success response with custom code', () => {
            const data = { id: 1, name: 'Test' }
            const response = success(data, 201)

            expect(response).toEqual({
                code: 201,
                data,
                locale: 'en-US',
            })
        })

        it('should handle null data', () => {
            const response = success(null)

            expect(response).toEqual({
                code: 200,
                data: null,
                locale: 'en-US',
            })
        })

        it('should handle array data', () => {
            const data = [1, 2, 3]
            const response = success(data)

            expect(response).toEqual({
                code: 200,
                data,
                locale: 'en-US',
            })
        })
    })

    describe('fail', () => {
        it('should throw error with default status code 400', () => {
            expect(() => fail('Error message')).toThrowError('Error message')
        })

        it('should throw error with custom status code', () => {
            expect(() => fail('Not found', 404)).toThrowError('Not found')
        })

        it('should expose locale-aware payload in thrown errors', () => {
            expect(() => fail('Conflict', 409)).toThrow(expect.objectContaining({
                statusCode: 409,
                data: {
                    code: 409,
                    message: 'Conflict',
                    locale: 'en-US',
                },
            }))
        })
    })

    describe('localizedSuccess', () => {
        it('should resolve translated success messages', async () => {
            await expect(localizedSuccess({ id: 1 }, 'common.saved', { scope: 'post' }, 201)).resolves.toEqual({
                code: 201,
                data: { id: 1 },
                message: 'translated:common.saved',
                locale: 'en-US',
            })
        })
    })

    describe('localizedFail', () => {
        it('should throw translated localized errors', async () => {
            await expect(localizedFail('error.validation', 422, { field: 'title' })).rejects.toMatchObject({
                statusCode: 422,
                statusMessage: 'translated:error.validation',
                data: {
                    code: 422,
                    message: 'translated:error.validation',
                    locale: 'en-US',
                    key: 'error.validation',
                },
            })
        })
    })

    describe('ensureFound', () => {
        it('should return entity when it exists', () => {
            const entity = { id: 1, name: 'Test' }
            const result = ensureFound(entity, 'Entity')

            expect(result).toBe(entity)
        })

        it('should throw 404 error when entity is null', () => {
            expect(() => ensureFound(null, 'User')).toThrow(expect.objectContaining({
                statusCode: 404,
                data: expect.objectContaining({
                    flag: 'NOT_FOUND',
                    params: { resource: 'User' },
                }),
            }))
        })

        it('should throw 404 error when entity is undefined', () => {
            expect(() => ensureFound(undefined, 'Post')).toThrow()
        })

        it('should handle entity with falsy values', () => {
            const entity = { id: 0, name: '' }
            const result = ensureFound(entity, 'Entity')

            expect(result).toBe(entity)
        })
    })

    describe('paginate', () => {
        it('should return paginated data', () => {
            const items = [1, 2, 3, 4, 5]
            const result = paginate(items, 50, 1, 10)

            expect(result).toEqual({
                items,
                total: 50,
                page: 1,
                limit: 10,
                totalPages: 5,
            })
        })

        it('should calculate total pages correctly', () => {
            const items = [1, 2, 3]
            const result = paginate(items, 25, 1, 10)

            expect(result.totalPages).toBe(3)
        })

        it('should handle last page with fewer items', () => {
            const items = [1, 2, 3]
            const result = paginate(items, 23, 3, 10)

            expect(result).toEqual({
                items,
                total: 23,
                page: 3,
                limit: 10,
                totalPages: 3,
            })
        })

        it('should handle empty items', () => {
            const result = paginate([], 0, 1, 10)

            expect(result).toEqual({
                items: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            })
        })
    })
})
