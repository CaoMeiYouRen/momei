import { createTaxonomyFeedRoute } from '@/server/utils/feed-taxonomy-route'
import { Tag } from '@/server/entities/tag'

export default createTaxonomyFeedRoute({
    entity: Tag,
    feedFilterKey: 'tagId',
    labels: {
        default: 'Tag',
        zhCN: '标签',
    },
    missingSlugMessage: 'Tag slug is required',
    notFoundMessage: 'Tag not found',
})
