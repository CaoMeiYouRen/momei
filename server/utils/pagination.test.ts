import { describe, expect, it, vi } from 'vitest'
import { applyPagination, parsePagination } from './pagination'

describe('pagination utils', () => {
    describe('applyPagination', () => {
        it('should apply pagination to query builder', () => {
            const mockQb = {
                skip: vi.fn().mockReturnThis(),
                take: vi.fn().mockReturnThis(),
            }

            applyPagination(mockQb as any, { page: 1, limit: 10 })

            expect(mockQb.skip).toHaveBeenCalledWith(0)
            expect(mockQb.take).toHaveBeenCalledWith(10)
        })

        it('should calculate correct offset for page 2', () => {
            const mockQb = {
                skip: vi.fn().mockReturnThis(),
                take: vi.fn().mockReturnThis(),
            }

            applyPagination(mockQb as any, { page: 2, limit: 10 })

            expect(mockQb.skip).toHaveBeenCalledWith(10)
            expect(mockQb.take).toHaveBeenCalledWith(10)
        })

        it('should calculate correct offset for page 3 with limit 20', () => {
            const mockQb = {
                skip: vi.fn().mockReturnThis(),
                take: vi.fn().mockReturnThis(),
            }

            applyPagination(mockQb as any, { page: 3, limit: 20 })

            expect(mockQb.skip).toHaveBeenCalledWith(40)
            expect(mockQb.take).toHaveBeenCalledWith(20)
        })
    })

    describe('parsePagination', () => {
        it('should parse valid pagination parameters', () => {
            const result = parsePagination({ page: '2', limit: '20' })

            expect(result).toEqual({
                page: 2,
                limit: 20,
            })
        })

        it('should return default values for invalid parameters', () => {
            const result = parsePagination({ page: 'invalid', limit: 'invalid' })

            expect(result).toEqual({
                page: 1,
                limit: 10,
            })
        })

        it('should return default values for missing parameters', () => {
            const result = parsePagination({})

            expect(result).toEqual({
                page: 1,
                limit: 10,
            })
        })

        it('should return default values for null/undefined', () => {
            const result1 = parsePagination(null)
            const result2 = parsePagination(undefined)

            expect(result1).toEqual({ page: 1, limit: 10 })
            expect(result2).toEqual({ page: 1, limit: 10 })
        })
    })
})
