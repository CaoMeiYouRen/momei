import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { SelectQueryBuilder, Repository } from 'typeorm'
import { applyTranslationAggregation, attachTranslations } from './translation'

describe('translation utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('applyTranslationAggregation', () => {
        it('should apply translation aggregation with default language', () => {
            const mockSubQuery = {
                select: vi.fn().mockReturnThis(),
                groupBy: vi.fn().mockReturnThis(),
                getQuery: vi.fn().mockReturnValue('SELECT ...'),
                getParameters: vi.fn().mockReturnValue({}),
            }

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue(mockSubQuery),
            } as unknown as Repository<any>

            const mockQb = {
                andWhere: vi.fn().mockReturnThis(),
                setParameter: vi.fn().mockReturnThis(),
                setParameters: vi.fn().mockReturnThis(),
            } as unknown as SelectQueryBuilder<any>

            const result = applyTranslationAggregation(mockQb, mockRepo, {
                mainAlias: 'post',
            })

            expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('t2')
            expect(mockSubQuery.select).toHaveBeenCalled()
            expect(mockSubQuery.groupBy).toHaveBeenCalled()
            expect(mockQb.andWhere).toHaveBeenCalled()
            expect(mockQb.setParameter).toHaveBeenCalledWith('prefLang', 'zh-CN')
            expect(result).toBe(mockQb)
        })

        it('should apply translation aggregation with custom language', () => {
            const mockSubQuery = {
                select: vi.fn().mockReturnThis(),
                groupBy: vi.fn().mockReturnThis(),
                getQuery: vi.fn().mockReturnValue('SELECT ...'),
                getParameters: vi.fn().mockReturnValue({}),
            }

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue(mockSubQuery),
            } as unknown as Repository<any>

            const mockQb = {
                andWhere: vi.fn().mockReturnThis(),
                setParameter: vi.fn().mockReturnThis(),
                setParameters: vi.fn().mockReturnThis(),
            } as unknown as SelectQueryBuilder<any>

            applyTranslationAggregation(mockQb, mockRepo, {
                language: 'en-US',
                mainAlias: 'post',
            })

            expect(mockQb.setParameter).toHaveBeenCalledWith('prefLang', 'en-US')
        })

        it('should use custom subAlias when provided', () => {
            const mockSubQuery = {
                select: vi.fn().mockReturnThis(),
                groupBy: vi.fn().mockReturnThis(),
                getQuery: vi.fn().mockReturnValue('SELECT ...'),
                getParameters: vi.fn().mockReturnValue({}),
            }

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue(mockSubQuery),
            } as unknown as Repository<any>

            const mockQb = {
                andWhere: vi.fn().mockReturnThis(),
                setParameter: vi.fn().mockReturnThis(),
                setParameters: vi.fn().mockReturnThis(),
            } as unknown as SelectQueryBuilder<any>

            applyTranslationAggregation(mockQb, mockRepo, {
                mainAlias: 'post',
                subAlias: 'customAlias',
            })

            expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('customAlias')
        })

        it('should apply custom filters when provided', () => {
            const mockSubQuery = {
                select: vi.fn().mockReturnThis(),
                groupBy: vi.fn().mockReturnThis(),
                getQuery: vi.fn().mockReturnValue('SELECT ...'),
                getParameters: vi.fn().mockReturnValue({}),
                where: vi.fn().mockReturnThis(),
            }

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue(mockSubQuery),
            } as unknown as Repository<any>

            const mockQb = {
                andWhere: vi.fn().mockReturnThis(),
                setParameter: vi.fn().mockReturnThis(),
                setParameters: vi.fn().mockReturnThis(),
            } as unknown as SelectQueryBuilder<any>

            const applyFilters = vi.fn((subQuery) => {
                subQuery.where('status = :status', { status: 'published' })
            })

            applyTranslationAggregation(mockQb, mockRepo, {
                mainAlias: 'post',
                applyFilters,
            })

            expect(applyFilters).toHaveBeenCalledWith(mockSubQuery)
        })
    })

    describe('attachTranslations', () => {
        it('should return empty array for empty items', async () => {
            const mockRepo = {} as Repository<any>
            const result = await attachTranslations([], mockRepo)
            expect(result).toEqual([])
        })

        it('should attach single translation for items without translationId', async () => {
            const items = [
                { id: '1', language: 'zh-CN', translationId: null },
                { id: '2', language: 'en-US', translationId: null },
            ]

            const mockRepo = {} as Repository<any>
            const result = await attachTranslations(items, mockRepo)

            expect(result[0]).toHaveProperty('translations')
            expect(result[0].translations).toEqual([
                { id: '1', language: 'zh-CN', translationId: null },
            ])
            expect(result[1].translations).toEqual([
                { id: '2', language: 'en-US', translationId: null },
            ])
        })

        it('should attach all translations for items with translationId', async () => {
            const items = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1' },
            ]

            const allTranslations = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1' },
                { id: '2', language: 'en-US', translationId: 'trans-1' },
            ]

            const mockRepo = {
                find: vi.fn().mockResolvedValue(allTranslations),
            } as unknown as Repository<any>

            const result = await attachTranslations(items, mockRepo)

            expect(result[0].translations).toHaveLength(2)
            expect(result[0].translations).toEqual([
                { id: '1', language: 'zh-CN', translationId: 'trans-1' },
                { id: '2', language: 'en-US', translationId: 'trans-1' },
            ])
        })

        it('should filter translations by translationId', async () => {
            const items = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1' },
                { id: '3', language: 'zh-CN', translationId: 'trans-2' },
            ]

            const allTranslations = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1' },
                { id: '2', language: 'en-US', translationId: 'trans-1' },
                { id: '3', language: 'zh-CN', translationId: 'trans-2' },
                { id: '4', language: 'en-US', translationId: 'trans-2' },
            ]

            const mockRepo = {
                find: vi.fn().mockResolvedValue(allTranslations),
            } as unknown as Repository<any>

            const result = await attachTranslations(items, mockRepo)

            expect(result[0].translations).toHaveLength(2)
            expect(result[0].translations[0].translationId).toBe('trans-1')
            expect(result[1].translations).toHaveLength(2)
            expect(result[1].translations[0].translationId).toBe('trans-2')
        })

        it('should include selected fields in translations', async () => {
            const items = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1', title: 'Title 1' },
            ]

            const allTranslations = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1', title: 'Title 1' },
                { id: '2', language: 'en-US', translationId: 'trans-1', title: 'Title 2' },
            ]

            const mockRepo = {
                find: vi.fn().mockResolvedValue(allTranslations),
            } as unknown as Repository<any>

            const result = await attachTranslations(items, mockRepo, {
                select: ['title' as any],
            })

            expect(result[0].translations[0]).toHaveProperty('title')
            expect(result[0].translations[0].title).toBe('Title 1')
            expect(result[0].translations[1].title).toBe('Title 2')
        })

        it('should handle mixed items with and without translationId', async () => {
            const items = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1' },
                { id: '3', language: 'en-US', translationId: null },
            ]

            const allTranslations = [
                { id: '1', language: 'zh-CN', translationId: 'trans-1' },
                { id: '2', language: 'en-US', translationId: 'trans-1' },
            ]

            const mockRepo = {
                find: vi.fn().mockResolvedValue(allTranslations),
            } as unknown as Repository<any>

            const result = await attachTranslations(items, mockRepo)

            expect(result[0].translations).toHaveLength(2)
            expect(result[1].translations).toHaveLength(1)
            expect(result[1].translations[0].id).toBe('3')
        })
    })
})
