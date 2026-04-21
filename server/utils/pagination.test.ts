import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { applyDefaultPaginationLimit, applyPagination, parsePagination, safeParsePaginatedQuery } from './pagination'

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

    describe('applyDefaultPaginationLimit', () => {
        it('should inject configured limit when request limit is missing', () => {
            expect(applyDefaultPaginationLimit({ page: '1' }, '25')).toEqual({
                page: '1',
                limit: 25,
            })
        })

        it('should keep explicit request limit', () => {
            expect(applyDefaultPaginationLimit({ page: '1', limit: '5' }, '25')).toEqual({
                page: '1',
                limit: '5',
            })
        })

        it('should fall back to built-in default when configured limit is invalid', () => {
            expect(applyDefaultPaginationLimit({ page: '1' }, 'invalid')).toEqual({
                page: '1',
                limit: 10,
            })
        })
    })

    describe('safeParsePaginatedQuery', () => {
        const querySchema = z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(10),
            keyword: z.string().trim().min(1).optional(),
        })

        it('should return parsed query when schema validation succeeds', () => {
            expect(safeParsePaginatedQuery(querySchema, {
                page: '2',
                limit: '20',
                keyword: 'hello',
            })).toEqual({
                page: 2,
                limit: 20,
                keyword: 'hello',
            })
        })

        it('should fall back to pagination defaults when schema validation fails', () => {
            expect(safeParsePaginatedQuery(querySchema, {
                page: 'invalid',
                limit: 'invalid',
                keyword: 42,
            })).toEqual({
                page: 1,
                limit: 10,
            })
        })

        it('should allow overriding the pagination fallback', () => {
            expect(safeParsePaginatedQuery(querySchema, {
                page: 'invalid',
            }, {
                page: 1,
                limit: 25,
            })).toEqual({
                page: 1,
                limit: 25,
            })
        })
    })
})
