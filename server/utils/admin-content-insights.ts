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
    type AdminContentInsightsTrendPoint,
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

export interface AdminContentInsightsSourceViewEvent {
    postId: string
    bucketHourUtc: string | Date
    views: number
}

export interface AdminContentInsightsSourceCommentEvent {
    postId: string
    createdAt: string | Date
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
    anchorDate: Dayjs
}

interface InsightViewEvent {
    clusterId: string
    occurredAt: Dayjs
    views: number
}

interface InsightCommentEvent {
    clusterId: string
    occurredAt: Dayjs
}

interface InsightPostRanking {
    representative: InsightRepresentative
    views: number
    commentCount: number
}

interface BuildTrendPointsParams {
    days: AdminContentInsightsRange
    timezone: string
    baseDate?: string | Date
    viewEvents: InsightViewEvent[]
    commentEvents: InsightCommentEvent[]
    posts: InsightRepresentative[]
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
    left: InsightPostRanking,
    right: InsightPostRanking,
) => {
    if (left.views !== right.views) {
        return right.views - left.views
    }

    if (left.commentCount !== right.commentCount) {
        return right.commentCount - left.commentCount
    }

    if (!left.representative.anchorDate.isSame(right.representative.anchorDate)) {
        return right.representative.anchorDate.valueOf() - left.representative.anchorDate.valueOf()
    }

    const titleCompare = left.representative.post.title.localeCompare(right.representative.post.title, 'en')
    if (titleCompare !== 0) {
        return titleCompare
    }

    return left.representative.post.id.localeCompare(right.representative.post.id)
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

const mapPostRanking = (item: InsightPostRanking): AdminContentInsightsPostRankingItem => ({
    id: item.representative.post.id,
    clusterId: item.representative.clusterId,
    title: item.representative.post.title,
    slug: item.representative.post.slug,
    language: item.representative.post.language,
    status: item.representative.post.status,
    visibility: item.representative.post.visibility,
    views: item.views,
    commentCount: item.commentCount,
    publishedAt: item.representative.post.publishedAt ? toDayjs(item.representative.post.publishedAt).toISOString() : null,
    createdAt: toDayjs(item.representative.post.createdAt).toISOString(),
    category: item.representative.post.category
        ? {
            id: item.representative.post.category.id,
            name: item.representative.post.category.name,
            slug: item.representative.post.category.slug,
            language: item.representative.post.category.language,
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
    posts: InsightPostRanking[],
    type: 'tags' | 'categories',
    fallbackChain: AppLocaleCode[],
) => {
    const rankingMap = new Map<string, TaxonomyAccumulator>()

    for (const item of posts) {
        const representative = item.representative
        const taxonomies = type === 'tags'
            ? ([...(representative.post.tags || [])])
            : []

        if (type === 'categories' && representative.post.category) {
            taxonomies.push(representative.post.category)
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
                    views: item.views,
                    commentCount: item.commentCount,
                })
                continue
            }

            existing.postCount += 1
            existing.views += item.views
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

const sumViewsInWindow = (
    events: InsightViewEvent[],
    start: Dayjs,
    end: Dayjs,
    timezone: string,
) => events.reduce((total, item) => {
    const localizedDate = item.occurredAt.tz(timezone)
    return isWithinWindow(localizedDate, start, end)
        ? total + item.views
        : total
}, 0)

const countCommentsInWindow = (
    events: InsightCommentEvent[],
    start: Dayjs,
    end: Dayjs,
    timezone: string,
) => events.reduce((total, item) => {
    const localizedDate = item.occurredAt.tz(timezone)
    return isWithinWindow(localizedDate, start, end)
        ? total + 1
        : total
}, 0)

const countPostsInWindow = (
    posts: InsightRepresentative[],
    start: Dayjs,
    end: Dayjs,
    timezone: string,
) => posts.reduce((total, item) => {
    const localizedDate = item.anchorDate.tz(timezone)
    return isWithinWindow(localizedDate, start, end)
        ? total + 1
        : total
}, 0)

const buildClusterWindowCountMap = (
    viewEvents: InsightViewEvent[],
    commentEvents: InsightCommentEvent[],
    start: Dayjs,
    end: Dayjs,
    timezone: string,
) => {
    const viewsByCluster = new Map<string, number>()
    const commentsByCluster = new Map<string, number>()

    for (const item of viewEvents) {
        const localizedDate = item.occurredAt.tz(timezone)
        if (!isWithinWindow(localizedDate, start, end)) {
            continue
        }

        viewsByCluster.set(item.clusterId, (viewsByCluster.get(item.clusterId) || 0) + item.views)
    }

    for (const item of commentEvents) {
        const localizedDate = item.occurredAt.tz(timezone)
        if (!isWithinWindow(localizedDate, start, end)) {
            continue
        }

        commentsByCluster.set(item.clusterId, (commentsByCluster.get(item.clusterId) || 0) + 1)
    }

    return {
        viewsByCluster,
        commentsByCluster,
    }
}

const buildTrendPoints = ({
    days,
    timezone,
    baseDate,
    viewEvents,
    commentEvents,
    posts,
}: BuildTrendPointsParams) => {
    const { currentStart, currentEnd } = buildWindowBoundaries(days, timezone, baseDate)
    const trendPoints: AdminContentInsightsTrendPoint[] = []
    const trendPointMap = new Map<string, AdminContentInsightsTrendPoint>()
    let cursor = currentStart.startOf('day')

    while (cursor.isBefore(currentEnd) || cursor.isSame(currentEnd, 'day')) {
        const point: AdminContentInsightsTrendPoint = {
            date: cursor.format('YYYY-MM-DD'),
            start: cursor.startOf('day').toISOString(),
            end: cursor.endOf('day').toISOString(),
            views: 0,
            comments: 0,
            posts: 0,
        }

        trendPoints.push(point)
        trendPointMap.set(point.date, point)
        cursor = cursor.add(1, 'day')
    }

    for (const item of viewEvents) {
        const localizedDate = item.occurredAt.tz(timezone)
        if (!isWithinWindow(localizedDate, currentStart, currentEnd)) {
            continue
        }

        const trendPoint = trendPointMap.get(localizedDate.format('YYYY-MM-DD'))
        if (trendPoint) {
            trendPoint.views += item.views
        }
    }

    for (const item of commentEvents) {
        const localizedDate = item.occurredAt.tz(timezone)
        if (!isWithinWindow(localizedDate, currentStart, currentEnd)) {
            continue
        }

        const trendPoint = trendPointMap.get(localizedDate.format('YYYY-MM-DD'))
        if (trendPoint) {
            trendPoint.comments += 1
        }
    }

    for (const item of posts) {
        const localizedDate = item.anchorDate.tz(timezone)
        if (!isWithinWindow(localizedDate, currentStart, currentEnd)) {
            continue
        }

        const trendPoint = trendPointMap.get(localizedDate.format('YYYY-MM-DD'))
        if (trendPoint) {
            trendPoint.posts += 1
        }
    }

    return trendPoints
}

const buildSummaryForRange = ({
    posts,
    viewEvents,
    commentEvents,
    days,
    timezone,
    baseDate,
}: BuildTrendPointsParams): AdminContentInsightsSummary => {
    const { currentStart, currentEnd, previousStart, previousEnd } = buildWindowBoundaries(days, timezone, baseDate)

    return {
        days,
        metrics: {
            views: buildMetric(
                sumViewsInWindow(viewEvents, currentStart, currentEnd, timezone),
                sumViewsInWindow(viewEvents, previousStart, previousEnd, timezone),
            ),
            comments: buildMetric(
                countCommentsInWindow(commentEvents, currentStart, currentEnd, timezone),
                countCommentsInWindow(commentEvents, previousStart, previousEnd, timezone),
            ),
            posts: buildMetric(
                countPostsInWindow(posts, currentStart, currentEnd, timezone),
                countPostsInWindow(posts, previousStart, previousEnd, timezone),
            ),
        },
        currentWindow: {
            start: currentStart.toISOString(),
            end: currentEnd.toISOString(),
        },
        previousWindow: {
            start: previousStart.toISOString(),
            end: previousEnd.toISOString(),
        },
        trend: buildTrendPoints({
            days,
            timezone,
            baseDate,
            viewEvents,
            commentEvents,
            posts,
        }),
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
    viewEvents: AdminContentInsightsSourceViewEvent[],
    commentEvents: AdminContentInsightsSourceCommentEvent[],
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
    const clusterIdByPostId = new Map<string, string>()

    for (const post of filteredPosts) {
        const clusterId = resolveTranslationClusterId(post.translationId, post.slug, post.id) || post.id
        const representative: InsightRepresentative = {
            clusterId,
            post,
            anchorDate: resolveAnchorDate(post),
        }
        clusterIdByPostId.set(post.id, clusterId)

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

    const normalizedViewEvents = viewEvents
        .map((item) => {
            const clusterId = clusterIdByPostId.get(item.postId)
            if (!clusterId) {
                return null
            }

            return {
                clusterId,
                occurredAt: toDayjs(item.bucketHourUtc),
                views: item.views,
            } satisfies InsightViewEvent
        })
        .filter((item): item is InsightViewEvent => Boolean(item))

    const normalizedCommentEvents = commentEvents
        .map((item) => {
            const clusterId = clusterIdByPostId.get(item.postId)
            if (!clusterId) {
                return null
            }

            return {
                clusterId,
                occurredAt: toDayjs(item.createdAt),
            } satisfies InsightCommentEvent
        })
        .filter((item): item is InsightCommentEvent => Boolean(item))

    const summaries = ADMIN_CONTENT_INSIGHT_RANGES.map((days) => buildSummaryForRange({
        posts: representatives,
        viewEvents: normalizedViewEvents,
        commentEvents: normalizedCommentEvents,
        days,
        timezone: resolvedTimeZone,
        baseDate: options.baseDate,
    }))

    const selectedWindow = buildWindowBoundaries(options.selectedRange, resolvedTimeZone, options.baseDate)
    const selectedWindowCounts = buildClusterWindowCountMap(
        normalizedViewEvents,
        normalizedCommentEvents,
        selectedWindow.currentStart,
        selectedWindow.currentEnd,
        resolvedTimeZone,
    )
    const selectedWindowPosts = representatives
        .map((item) => ({
            representative: item,
            views: selectedWindowCounts.viewsByCluster.get(item.clusterId) || 0,
            commentCount: selectedWindowCounts.commentsByCluster.get(item.clusterId) || 0,
        }))
        .filter((item) => item.views > 0 || item.commentCount > 0)
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
