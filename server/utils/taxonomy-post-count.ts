import type { SelectQueryBuilder } from 'typeorm'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { dataSource } from '@/server/database'

/**
 * 构建通用的分类/标签关联文章数子查询。
 * 通过 `joinFn` 参数注入不同的 join 逻辑，避免 buildCategoryPostCountSubquery
 * 与 buildTagPostCountSubquery 的结构重复。
 *
 * @param publishedStatus - 文章发布状态过滤值
 * @param alias - 分类/标签表别名（用于 select/groupBy 中的 COALESCE 表达式）。
 *                 应为硬编码字面量，不得传入用户输入或动态计算值。
 * @param joinFn - 回调函数，负责设置具体的 join 条件
 */
function buildTaxonomyPostCountSubquery(
    publishedStatus: string,
    alias: string,
    joinFn: (qb: SelectQueryBuilder<Post>) => SelectQueryBuilder<Post>,
) {
    let qb = dataSource.getRepository(Post)
        .createQueryBuilder('p')
        .select(`COALESCE(${alias}.translationId, ${alias}.id)`, 'taxonomy_id')
        .addSelect('COUNT(DISTINCT COALESCE(p.translationId, p.id))', 'post_count')
        .where('p.status = :publishedStatus', { publishedStatus })
        .groupBy(`COALESCE(${alias}.translationId, ${alias}.id)`)

    qb = joinFn(qb)
    return qb
}

export function buildCategoryPostCountSubquery(publishedStatus: string) {
    return buildTaxonomyPostCountSubquery(publishedStatus, 'postCategory', (qb) =>
        qb.innerJoin(Category, 'postCategory', 'postCategory.id = p.categoryId'),
    )
}

export function buildTagPostCountSubquery(publishedStatus: string) {
    return buildTaxonomyPostCountSubquery(publishedStatus, 'pt', (qb) =>
        qb.innerJoin('p.tags', 'pt'),
    )
}
