import { describe, expect, it } from 'vitest'
import { ensureFound, fail, paginate, success } from './response'

describe('response utils', () => {
    describe('success', () => {
        it('should return success response with default code 200', () => {
            const data = { id: 1, name: 'Test' }
            const response = success(data)

            expect(response).toEqual({
                code: 200,
                data,
                locale: 'zh-CN',
            })
        })

        it('should return success response with custom code', () => {
            const data = { id: 1, name: 'Test' }
            const response = success(data, 201)

            expect(response).toEqual({
                code: 201,
                data,
                locale: 'zh-CN',
            })
        })

        it('should handle null data', () => {
            const response = success(null)

            expect(response).toEqual({
                code: 200,
                data: null,
                locale: 'zh-CN',
            })
        })

        it('should handle array data', () => {
            const data = [1, 2, 3]
            const response = success(data)

            expect(response).toEqual({
                code: 200,
                data,
                locale: 'zh-CN',
            })
        })
    })

    describe('fail', () => {
        it('should throw error with default status code 400', () => {
            expect(() => fail('Error message')).toThrow()
        })

        it('should throw error with custom status code', () => {
            expect(() => fail('Not found', 404)).toThrow()
        })
    })

    describe('ensureFound', () => {
        it('should return entity when it exists', () => {
            const entity = { id: 1, name: 'Test' }
            const result = ensureFound(entity, 'Entity')

            expect(result).toBe(entity)
        })

        it('should throw 404 error when entity is null', () => {
            expect(() => ensureFound(null, 'User')).toThrow()
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
