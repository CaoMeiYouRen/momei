import { describe, it, expect, vi } from 'vitest'
import { applyPostOrdering } from './post-ordering'
import type { SelectQueryBuilder } from 'typeorm'

function makeQb() {
    const qb = {
        orderBy: vi.fn(),
        addOrderBy: vi.fn(),
    }
    qb.orderBy.mockReturnValue(qb)
    qb.addOrderBy.mockReturnValue(qb)
    return qb as unknown as SelectQueryBuilder<any>
}

describe('applyPostOrdering', () => {
    it('defaults to publishedAt DESC with pinned priority', () => {
        const qb = makeQb()
        applyPostOrdering(qb)
        // Should orderBy isPinned DESC first
        expect((qb as any).orderBy).toHaveBeenCalledWith('post.isPinned', 'DESC')
        // Then publishedAt DESC
        expect((qb as any).addOrderBy).toHaveBeenCalledWith('post.publishedAt', 'DESC')
        // Also adds createdAt DESC since orderBy is publishedAt
        expect((qb as any).addOrderBy).toHaveBeenCalledWith('post.createdAt', 'DESC')
    })

    it('uses custom alias', () => {
        const qb = makeQb()
        applyPostOrdering(qb, { alias: 'p' })
        expect((qb as any).orderBy).toHaveBeenCalledWith('p.isPinned', 'DESC')
    })

    it('disables pinned priority', () => {
        const qb = makeQb()
        applyPostOrdering(qb, { prioritizePinned: false, orderBy: 'publishedAt' })
        expect((qb as any).orderBy).toHaveBeenCalledWith('post.publishedAt', 'DESC')
        expect((qb as any).orderBy).not.toHaveBeenCalledWith(expect.stringContaining('isPinned'), expect.anything())
    })

    it('adds publishedAt fallback when ordering by other field', () => {
        const qb = makeQb()
        applyPostOrdering(qb, { orderBy: 'views', prioritizePinned: false })
        expect((qb as any).addOrderBy).toHaveBeenCalledWith('post.publishedAt', 'DESC')
    })

    it('does not double-add publishedAt when orderBy is publishedAt', () => {
        const qb = makeQb()
        applyPostOrdering(qb, { prioritizePinned: false, orderBy: 'publishedAt' })
        const addOrderByCalls = (qb as any).addOrderBy.mock.calls
        const publishedAtCalls = addOrderByCalls.filter((call: any[]) => call[0]?.includes('publishedAt'))
        expect(publishedAtCalls).toHaveLength(0)
    })

    it('uses custom order direction', () => {
        const qb = makeQb()
        applyPostOrdering(qb, { orderBy: 'views', order: 'ASC', prioritizePinned: false })
        expect((qb as any).orderBy).toHaveBeenCalledWith('post.views', 'ASC')
    })
})
