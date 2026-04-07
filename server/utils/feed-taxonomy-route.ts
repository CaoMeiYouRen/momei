import type { H3Event } from 'h3'
import type { EntityTarget, FindOptionsWhere, ObjectLiteral } from 'typeorm'
import { dataSource } from '@/server/database'
import { generateFeed, getFeedLanguage } from '@/server/utils/feed'

export type ScopedFeedFormat = 'rss2' | 'atom1' | 'json1'

interface ScopedFeedRequest {
    contentType: string
    format: ScopedFeedFormat
    slug: string
}

interface FeedTaxonomyEntity extends ObjectLiteral {
    id: string
    language: string
    name: string
    slug: string
}

interface TaxonomyFeedRouteOptions<T extends FeedTaxonomyEntity> {
    entity: EntityTarget<T>
    feedFilterKey: 'categoryId' | 'tagId'
    labels: {
        default: string
        zhCN: string
    }
    missingSlugMessage: string
    notFoundMessage: string
}

export function parseScopedFeedRequest(rawSlug: string): ScopedFeedRequest {
    let slug = rawSlug
    let format: ScopedFeedFormat = 'rss2'
    let contentType = 'application/xml'

    if (slug.endsWith('.xml')) {
        slug = slug.slice(0, -4)
    } else if (slug.endsWith('.atom')) {
        slug = slug.slice(0, -5)
        format = 'atom1'
        contentType = 'application/atom+xml'
    } else if (slug.endsWith('.json')) {
        slug = slug.slice(0, -5)
        format = 'json1'
        contentType = 'application/feed+json'
    }

    return {
        contentType,
        format,
        slug: decodeURIComponent(slug),
    }
}

export function buildTaxonomyFeedTitle(language: string, name: string, labels: TaxonomyFeedRouteOptions<FeedTaxonomyEntity>['labels']) {
    return language === 'zh-CN'
        ? `${labels.zhCN}: ${name}`
        : `${labels.default}: ${name}`
}

export function createTaxonomyFeedRoute<T extends FeedTaxonomyEntity>(options: TaxonomyFeedRouteOptions<T>) {
    return defineEventHandler(async (event: H3Event) => {
        const { contentType, format, slug } = parseScopedFeedRequest(getRouterParam(event, 'slug') || '')

        if (!slug) {
            throw createError({
                statusCode: 400,
                statusMessage: options.missingSlugMessage,
            })
        }

        const language = getFeedLanguage(event)
        const repository = dataSource.getRepository(options.entity)
        const item = await repository.findOne({
            where: { slug, language } as FindOptionsWhere<T>,
        })

        if (!item) {
            throw createError({
                statusCode: 404,
                statusMessage: options.notFoundMessage,
            })
        }

        const titleSuffix = buildTaxonomyFeedTitle(item.language, item.name, options.labels)
        const feedOptions = options.feedFilterKey === 'categoryId'
            ? { categoryId: item.id, language: item.language, titleSuffix }
            : { tagId: item.id, language: item.language, titleSuffix }
        const feed = await generateFeed(event, feedOptions)

        appendHeader(event, 'Content-Type', contentType)
        return feed[format]()
    })
}
