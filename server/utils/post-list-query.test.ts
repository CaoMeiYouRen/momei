import { Brackets } from 'typeorm'
import { describe, expect, it, vi } from 'vitest'
import { applyPostListSelect, applyPublishedPostLanguageFallbackFilter } from './post-list-query'

function createQueryBuilderMock() {
    const state = {
        select: [] as string[][],
        leftJoin: [] as [string, string][],
        addSelect: [] as string[][],
        qb: {
            select(fields: string[]) {
                state.select.push(fields)
                return this
            },
            leftJoin(path: string, alias: string) {
                state.leftJoin.push([path, alias])
                return this
            },
            addSelect(fields: string[]) {
                state.addSelect.push(fields)
                return this
            },
        },
    }

    return state
}

describe('applyPostListSelect', () => {
    it('selects card fields and all joins by default', () => {
        const state = createQueryBuilderMock()
        const qb = applyPostListSelect(state.qb as never)

        expect(qb).toBe(state.qb)
        expect(state.select).toHaveLength(1)
        expect(state.select[0]).toContain('post.title')
        expect(state.leftJoin).toEqual([
            ['post.author', 'author'],
            ['post.category', 'category'],
            ['post.tags', 'tags'],
        ])
        expect(state.addSelect).toContainEqual(['author.id', 'author.name', 'author.image', 'author.email'])
        expect(state.addSelect).toContainEqual(['category.id', 'category.name', 'category.slug'])
        expect(state.addSelect).toContainEqual(['tags.id', 'tags.name', 'tags.slug'])
    })

    it('omits author email when includeAuthorEmail is false', () => {
        const state = createQueryBuilderMock()

        applyPostListSelect(state.qb as never, { includeAuthorEmail: false })

        expect(state.addSelect).toContainEqual(['author.id', 'author.name', 'author.image'])
    })

    it('skips author join when includeAuthor is false', () => {
        const state = createQueryBuilderMock()

        applyPostListSelect(state.qb as never, { includeAuthor: false })

        expect(state.leftJoin).not.toContainEqual(['post.author', 'author'])
        expect(state.addSelect.some((fields) => fields.includes('author.id'))).toBe(false)
    })

    it('skips category and tag joins when disabled', () => {
        const state = createQueryBuilderMock()

        applyPostListSelect(state.qb as never, { includeCategory: false, includeTags: false })

        expect(state.leftJoin).toEqual([
            ['post.author', 'author'],
        ])
        expect(state.addSelect).toHaveLength(1)
    })
})

describe('applyPublishedPostLanguageFallbackFilter', () => {
    it('returns the original query builder when language is missing', () => {
        const queryBuilder = {
            andWhere: vi.fn().mockReturnThis(),
        }

        const result = applyPublishedPostLanguageFallbackFilter(queryBuilder as never, undefined)

        expect(result).toBe(queryBuilder)
        expect(queryBuilder.andWhere).not.toHaveBeenCalled()
    })

    it('adds a shared fallback filter when language is provided', () => {
        const queryBuilder = {
            andWhere: vi.fn().mockReturnThis(),
        }

        const result = applyPublishedPostLanguageFallbackFilter(queryBuilder as never, 'zh-TW')

        expect(result).toBe(queryBuilder)
        expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1)
        expect(queryBuilder.andWhere.mock.calls[0]?.[0]).toBeInstanceOf(Brackets)
    })
})
