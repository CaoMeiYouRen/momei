import dayjs, { type Dayjs } from 'dayjs'
import { getLocaleRegistryItem, resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'
import {
    ADMIN_CONTENT_INSIGHT_RANGES,
    type AdminContentInsightsMetric,
    type AdminContentInsightsPostRankingItem,
    type AdminContentInsightsRange,
    type AdminContentInsightsResponse,
    type AdminContentInsightsScope,
    type AdminContentInsightsSummary,
    type AdminContentInsightsTaxonomyRankingItem,
} from '@/types/admin-content-insights'
import { PostStatus, PostVisibility } from '@/types/post'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'

export const DEFAULT_ADMIN_CONTENT_INSIGHTS_TIMEZONE = 'UTC'

export interface AdminContentInsightsSourceTaxonomy {
    id: string
    name: string
    slug: string
    language: string
    translationId?: string | null
}

export interface AdminContentInsightsSourcePost {
    id: string
    title: string
    slug: string
    language: string
    translationId?: string | null
    status: PostStatus
    visibility: PostVisibility
    views: number
    publishedAt?: string | Date | null
    createdAt: string | Date
    category?: AdminContentInsightsSourceTaxonomy | null
    tags?: AdminContentInsightsSourceTaxonomy[] | null
}

export interface BuildAdminContentInsightsOptions {
    selectedRange: AdminContentInsightsRange
    scope: AdminContentInsightsScope
    timezone: string
    preferredLocale?: string | null
    contentLanguage?: string | null
    baseDate?: string | Date
}

interface InsightRepresentative {
    clusterId: string
    post: AdminContentInsightsSourcePost
    commentCount: number
    anchorDate: Dayjs
}

interface WindowBoundaries {
    currentStart: Dayjs
    currentEnd: Dayjs
    previousStart: Dayjs
    previousEnd: Dayjs
}

interface TaxonomyAccumulator {
    id: string
    clusterId: string
    name: string
    slug: string
    language: string
    localeRank: number
    postCount: number
    views: number
    commentCount: number
}

const MAX_LOCALE_RANK = Number.MAX_SAFE_INTEGER
const TAXONOMY_LIMIT = 6
const POST_LIMIT = 6

const isWithinWindow = (value: Dayjs, start: Dayjs, end: Dayjs) => (
    (value.isAfter(start) || value.isSame(start))
    && (value.isBefore(end) || value.isSame(end))
)

const toDayjs = (value: string | Date | null | undefined) => dayjs(value || new Date())

const resolveAnchorDate = (post: AdminContentInsightsSourcePost) => toDayjs(post.publishedAt || post.createdAt)

const buildMetric = (total: number, previousTotal: number): AdminContentInsightsMetric => ({
    total,
    previousTotal,
    delta: total - previousTotal,
    deltaRate: previousTotal > 0
        ? Number((((total - previousTotal) / previousTotal) * 100).toFixed(2))
        : null,
})

const buildWindowBoundaries = (
    days: AdminContentInsightsRange,
    timezone: string,
    baseDate?: string | Date,
): WindowBoundaries => {
    const now = dayjs(baseDate || new Date()).tz(timezone)
    const currentEnd = now.endOf('day')
    const currentStart = currentEnd.startOf('day').subtract(days - 1, 'day')
    const previousEnd = currentStart.subtract(1, 'millisecond')
    const previousStart = previousEnd.startOf('day').subtract(days - 1, 'day')

    return {
        currentStart,
        currentEnd,
        previousStart,
        previousEnd,
    }
}

const buildLocalePreferenceChain = (preferredLocale?: string | null) => {
    const resolvedLocale = resolveAppLocaleCode(preferredLocale)
    const registryItem = getLocaleRegistryItem(resolvedLocale)

    return {
        resolvedLocale,
        fallbackChain: registryItem.fallbackChain,
    }
}

const getLocaleRank = (language: string, fallbackChain: AppLocaleCode[]) => {
    const index = fallbackChain.indexOf(resolveAppLocaleCode(language))
    return index === -1 ? MAX_LOCALE_RANK : index
}

const compareRepresentatives = (
    left: InsightRepresentative,
    right: InsightRepresentative,
    fallbackChain: AppLocaleCode[],
) => {
    const leftLocaleRank = getLocaleRank(left.post.language, fallbackChain)
    const rightLocaleRank = getLocaleRank(right.post.language, fallbackChain)

    if (leftLocaleRank !== rightLocaleRank) {
        return leftLocaleRank - rightLocaleRank
    }

    const leftIsPublic = left.post.status === PostStatus.PUBLISHED && left.post.visibility === PostVisibility.PUBLIC
    const rightIsPublic = right.post.status === PostStatus.PUBLISHED && right.post.visibility === PostVisibility.PUBLIC

    if (leftIsPublic !== rightIsPublic) {
        return leftIsPublic ? -1 : 1
    }

    if (!left.anchorDate.isSame(right.anchorDate)) {
        return right.anchorDate.valueOf() - left.anchorDate.valueOf()
    }

    return left.post.id.localeCompare(right.post.id)
}

const sortPostRankings = (
    left: InsightRepresentative,
    right: InsightRepresentative,
) => {
    if (left.post.views !== right.post.views) {
        return right.post.views - left.post.views
    }

    if (left.commentCount !== right.commentCount) {
        return right.commentCount - left.commentCount
    }

    if (!left.anchorDate.isSame(right.anchorDate)) {
        return right.anchorDate.valueOf() - left.anchorDate.valueOf()
    }

    const titleCompare = left.post.title.localeCompare(right.post.title, 'en')
    if (titleCompare !== 0) {
        return titleCompare
    }

    return left.post.id.localeCompare(right.post.id)
}

const sortTaxonomyRankings = (
    left: TaxonomyAccumulator,
    right: TaxonomyAccumulator,
) => {
    if (left.views !== right.views) {
        return right.views - left.views
    }

    if (left.commentCount !== right.commentCount) {
        return right.commentCount - left.commentCount
    }

    if (left.postCount !== right.postCount) {
        return right.postCount - left.postCount
    }

    return left.name.localeCompare(right.name, 'en')
}

const mapPostRanking = (item: InsightRepresentative): AdminContentInsightsPostRankingItem => ({
    id: item.post.id,
    clusterId: item.clusterId,
    title: item.post.title,
    slug: item.post.slug,
    language: item.post.language,
    status: item.post.status,
    visibility: item.post.visibility,
    views: item.post.views,
    commentCount: item.commentCount,
    publishedAt: item.post.publishedAt ? toDayjs(item.post.publishedAt).toISOString() : null,
    createdAt: toDayjs(item.post.createdAt).toISOString(),
    category: item.post.category
        ? {
            id: item.post.category.id,
            name: item.post.category.name,
            slug: item.post.category.slug,
            language: item.post.category.language,
        }
        : null,
})

const mapTaxonomyRanking = (item: TaxonomyAccumulator): AdminContentInsightsTaxonomyRankingItem => ({
    id: item.id,
    clusterId: item.clusterId,
    name: item.name,
    slug: item.slug,
    language: item.language,
    postCount: item.postCount,
    views: item.views,
    commentCount: item.commentCount,
})

const buildTaxonomyRankings = (
    posts: InsightRepresentative[],
    type: 'tags' | 'categories',
    fallbackChain: AppLocaleCode[],
) => {
    const rankingMap = new Map<string, TaxonomyAccumulator>()

    for (const item of posts) {
        const taxonomies = type === 'tags'
            ? (item.post.tags || [])
            : []

        if (type === 'categories' && item.post.category) {
            taxonomies.push(item.post.category)
        }

        for (const taxonomy of taxonomies) {
            const clusterId = resolveTranslationClusterId(taxonomy.translationId, taxonomy.slug, taxonomy.id) || taxonomy.id
            const localeRank = getLocaleRank(taxonomy.language, fallbackChain)
            const existing = rankingMap.get(clusterId)

            if (!existing) {
                rankingMap.set(clusterId, {
                    id: taxonomy.id,
                    clusterId,
                    name: taxonomy.name,
                    slug: taxonomy.slug,
                    language: taxonomy.language,
                    localeRank,
                    postCount: 1,
                    views: item.post.views,
                    commentCount: item.commentCount,
                })
                continue
            }

            existing.postCount += 1
            existing.views += item.post.views
            existing.commentCount += item.commentCount

            if (localeRank < existing.localeRank) {
                existing.id = taxonomy.id
                existing.name = taxonomy.name
                existing.slug = taxonomy.slug
                existing.language = taxonomy.language
                existing.localeRank = localeRank
            }
        }
    }

    return Array.from(rankingMap.values())
        .sort(sortTaxonomyRankings)
        .slice(0, TAXONOMY_LIMIT)
        .map(mapTaxonomyRanking)
}

const buildSummaryForRange = (
    posts: InsightRepresentative[],
    days: AdminContentInsightsRange,
    timezone: string,
    baseDate?: string | Date,
): AdminContentInsightsSummary => {
    const { currentStart, currentEnd, previousStart, previousEnd } = buildWindowBoundaries(days, timezone, baseDate)

    const currentPosts = posts.filter((item) => isWithinWindow(item.anchorDate, currentStart, currentEnd))
    const previousPosts = posts.filter((item) => isWithinWindow(item.anchorDate, previousStart, previousEnd))

    return {
        days,
        metrics: {
            views: buildMetric(
                currentPosts.reduce((total, item) => total + item.post.views, 0),
                previousPosts.reduce((total, item) => total + item.post.views, 0),
            ),
            comments: buildMetric(
                currentPosts.reduce((total, item) => total + item.commentCount, 0),
                previousPosts.reduce((total, item) => total + item.commentCount, 0),
            ),
            posts: buildMetric(currentPosts.length, previousPosts.length),
        },
        currentWindow: {
            start: currentStart.toISOString(),
            end: currentEnd.toISOString(),
        },
        previousWindow: {
            start: previousStart.toISOString(),
            end: previousEnd.toISOString(),
        },
    }
}

export function isValidAdminContentInsightsTimeZone(timezone?: string | null) {
    if (!timezone) {
        return false
    }

    try {
        Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
        return true
    } catch {
        return false
    }
}

export function resolveAdminContentInsightsTimeZone(timezone?: string | null) {
    return isValidAdminContentInsightsTimeZone(timezone)
        ? timezone as string
        : DEFAULT_ADMIN_CONTENT_INSIGHTS_TIMEZONE
}

export function buildAdminContentInsights(
    posts: AdminContentInsightsSourcePost[],
    commentCountByPostId: Record<string, number>,
    options: BuildAdminContentInsightsOptions,
): AdminContentInsightsResponse {
    const resolvedTimeZone = resolveAdminContentInsightsTimeZone(options.timezone)
    const normalizedContentLanguage = options.contentLanguage
        ? resolveAppLocaleCode(options.contentLanguage)
        : null
    const { fallbackChain } = buildLocalePreferenceChain(
        normalizedContentLanguage || options.preferredLocale,
    )

    const filteredPosts = normalizedContentLanguage
        ? posts.filter((post) => resolveAppLocaleCode(post.language) === normalizedContentLanguage)
        : posts

    const groupedPosts = new Map<string, InsightRepresentative[]>()

    for (const post of filteredPosts) {
        const clusterId = resolveTranslationClusterId(post.translationId, post.slug, post.id) || post.id
        const representative: InsightRepresentative = {
            clusterId,
            post,
            commentCount: commentCountByPostId[post.id] || 0,
            anchorDate: resolveAnchorDate(post),
        }

        const cluster = groupedPosts.get(clusterId)
        if (!cluster) {
            groupedPosts.set(clusterId, [representative])
            continue
        }

        cluster.push(representative)
    }

    const representatives = Array.from(groupedPosts.values())
        .map((items) => items.sort((left, right) => compareRepresentatives(left, right, fallbackChain))[0])
        .filter((item): item is InsightRepresentative => Boolean(item))
        .sort((left, right) => compareRepresentatives(left, right, fallbackChain))

    const summaries = ADMIN_CONTENT_INSIGHT_RANGES.map((days) => buildSummaryForRange(
        representatives,
        days,
        resolvedTimeZone,
        options.baseDate,
    ))

    const selectedWindow = buildWindowBoundaries(options.selectedRange, resolvedTimeZone, options.baseDate)
    const selectedWindowPosts = representatives
        .filter((item) => isWithinWindow(item.anchorDate, selectedWindow.currentStart, selectedWindow.currentEnd))
        .sort(sortPostRankings)

    return {
        selectedRange: options.selectedRange,
        summaries,
        rankings: {
            posts: selectedWindowPosts.slice(0, POST_LIMIT).map(mapPostRanking),
            tags: buildTaxonomyRankings(selectedWindowPosts, 'tags', fallbackChain),
            categories: buildTaxonomyRankings(selectedWindowPosts, 'categories', fallbackChain),
        },
        timezone: resolvedTimeZone,
        scope: options.scope,
        contentLanguage: normalizedContentLanguage,
        generatedAt: dayjs(options.baseDate || new Date()).tz(resolvedTimeZone).toISOString(),
    }
}

export function resolveAdminContentInsightsPreferredLocale(
    preferredLocale?: string | null,
    contentLanguage?: string | null,
) {
    return resolveAppLocaleCode(contentLanguage || preferredLocale || undefined)
}

export function resolveAdminContentInsightsLocaleRank(
    language: string,
    preferredLocale?: string | null,
) {
    const { fallbackChain } = buildLocalePreferenceChain(preferredLocale)
    return getLocaleRank(language, fallbackChain)
}
