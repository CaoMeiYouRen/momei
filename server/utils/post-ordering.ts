import type { SelectQueryBuilder } from 'typeorm'
import type { Post } from '@/server/entities/post'

export type PostOrderField = 'createdAt' | 'updatedAt' | 'views' | 'publishedAt' | 'title' | 'status' | 'isPinned'

interface ApplyPostOrderingOptions {
    alias?: string
    orderBy?: PostOrderField
    order?: 'ASC' | 'DESC'
    prioritizePinned?: boolean
}

export function applyPostOrdering(
    qb: SelectQueryBuilder<Post>,
    options: ApplyPostOrderingOptions = {},
) {
    const alias = options.alias || 'post'
    const orderBy = options.orderBy || 'publishedAt'
    const order = options.order || 'DESC'
    const prioritizePinned = options.prioritizePinned ?? true

    if (prioritizePinned) {
        qb.orderBy(`${alias}.isPinned`, 'DESC')

        if (orderBy !== 'isPinned') {
            qb.addOrderBy(`${alias}.${orderBy}`, order)
        }
    } else {
        qb.orderBy(`${alias}.${orderBy}`, order)
    }

    if (orderBy !== 'publishedAt') {
        qb.addOrderBy(`${alias}.publishedAt`, 'DESC')
    }

    if (orderBy !== 'createdAt') {
        qb.addOrderBy(`${alias}.createdAt`, 'DESC')
    }
}
