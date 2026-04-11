import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { dataSource } from '@/server/database'

export function buildCategoryPostCountSubquery(publishedStatus: string) {
    return dataSource.getRepository(Post)
        .createQueryBuilder('p')
        .select('COALESCE(postCategory.translationId, postCategory.id)', 'taxonomyId')
        .addSelect('COUNT(DISTINCT COALESCE(p.translationId, p.id))', 'postCount')
        .innerJoin(Category, 'postCategory', 'postCategory.id = p.categoryId')
        .where('p.status = :publishedStatus', { publishedStatus })
        .groupBy('COALESCE(postCategory.translationId, postCategory.id)')
}

export function buildTagPostCountSubquery(publishedStatus: string) {
    return dataSource.getRepository(Post)
        .createQueryBuilder('p')
        .select('COALESCE(pt.translationId, pt.id)', 'taxonomyId')
        .addSelect('COUNT(DISTINCT COALESCE(p.translationId, p.id))', 'postCount')
        .innerJoin('p.tags', 'pt')
        .where('p.status = :publishedStatus', { publishedStatus })
        .groupBy('COALESCE(pt.translationId, pt.id)')
}
