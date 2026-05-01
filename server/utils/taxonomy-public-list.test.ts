import { describe, expect, it, vi } from 'vitest'
import {
    applyTaxonomyPublicListFilters,
    applyTaxonomyPublicListOrdering,
    buildTaxonomyPublicListCacheKey,
} from './taxonomy-public-list'

describe('buildTaxonomyPublicListCacheKey', () => {
    it('includes aggregate, language, extra segments and pagination fields in order', () => {
        const key = buildTaxonomyPublicListCacheKey({
            namespace: 'categories:public-list',
            query: {
                aggregate: true,
                language: 'zh-CN',
                translationId: 'group-1',
                search: 'tech',
                orderBy: 'createdAt',
                order: 'ASC',
                page: 2,
                limit: 10,
            },
            extraSegments: ['parent-1'],
        })

        expect(key).toBe('categories:public-list:1:zh-CN:parent-1:group-1:tech:createdAt:ASC:2:10')
    })
})

describe('applyTaxonomyPublicListFilters', () => {
    it('applies shared name, translation cluster and language filters', () => {
        const qb = {
            andWhere: vi.fn().mockReturnThis(),
        }

        const result = applyTaxonomyPublicListFilters(qb as never, {
            alias: 'tag',
            aggregate: false,
            search: 'script',
            translationId: 'cluster-1',
            language: 'en-US',
        })

        expect(result).toBe(qb)
        expect(qb.andWhere).toHaveBeenNthCalledWith(1, 'tag.name LIKE :search', { search: '%script%' })
        expect(qb.andWhere).toHaveBeenNthCalledWith(2, 'COALESCE(tag.translationId, tag.slug) = :translationId', {
            translationId: 'cluster-1',
        })
        expect(qb.andWhere).toHaveBeenNthCalledWith(3, 'tag.language = :language', { language: 'en-US' })
    })

    it('skips language filter in aggregate mode', () => {
        const qb = {
            andWhere: vi.fn().mockReturnThis(),
        }

        applyTaxonomyPublicListFilters(qb as never, {
            alias: 'category',
            aggregate: true,
            language: 'zh-CN',
        })

        expect(qb.andWhere).not.toHaveBeenCalled()
    })
})

describe('applyTaxonomyPublicListOrdering', () => {
    it('uses shared post count alias when sorting by postCount', () => {
        const qb = {
            orderBy: vi.fn().mockReturnThis(),
        }

        const result = applyTaxonomyPublicListOrdering(qb as never, {
            alias: 'category',
            orderBy: 'postCount',
            order: 'ASC',
            postCountAlias: 'category_post_count',
        })

        expect(result).toBe(qb)
        expect(qb.orderBy).toHaveBeenCalledWith('category_post_count', 'ASC')
    })

    it('falls back to createdAt ordering on the entity alias', () => {
        const qb = {
            orderBy: vi.fn().mockReturnThis(),
        }

        applyTaxonomyPublicListOrdering(qb as never, {
            alias: 'tag',
            orderBy: undefined,
            order: undefined,
            postCountAlias: 'tag_post_count',
        })

        expect(qb.orderBy).toHaveBeenCalledWith('tag.createdAt', 'DESC')
    })
})
