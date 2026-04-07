import { createTaxonomyFeedRoute } from '@/server/utils/feed-taxonomy-route'
import { Category } from '@/server/entities/category'

export default createTaxonomyFeedRoute({
    entity: Category,
    feedFilterKey: 'categoryId',
    labels: {
        default: 'Category',
        zhCN: '分类',
    },
    missingSlugMessage: 'Category slug is required',
    notFoundMessage: 'Category not found',
})
