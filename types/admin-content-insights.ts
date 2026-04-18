import type { PostStatus, PostVisibility } from './post'

export const ADMIN_CONTENT_INSIGHT_RANGES = [7, 30, 90] as const

export type AdminContentInsightsRange = typeof ADMIN_CONTENT_INSIGHT_RANGES[number]

export type AdminContentInsightsScope = 'all' | 'public'

export interface AdminContentInsightsMetric {
    total: number
    previousTotal: number
    delta: number
    deltaRate: number | null
}

export interface AdminContentInsightsWindow {
    start: string
    end: string
}

export interface AdminContentInsightsTrendPoint {
    date: string
    start: string
    end: string
    views: number
    comments: number
    posts: number
}

export interface AdminContentInsightsSummary {
    days: AdminContentInsightsRange
    metrics: {
        views: AdminContentInsightsMetric
        comments: AdminContentInsightsMetric
        posts: AdminContentInsightsMetric
    }
    currentWindow: AdminContentInsightsWindow
    previousWindow: AdminContentInsightsWindow
    trend: AdminContentInsightsTrendPoint[]
}

export interface AdminContentInsightsCategoryRef {
    id: string
    name: string
    slug: string
    language: string
}

export interface AdminContentInsightsPostRankingItem {
    id: string
    clusterId: string
    title: string
    slug: string
    language: string
    status: PostStatus
    visibility: PostVisibility
    views: number
    commentCount: number
    publishedAt: string | null
    createdAt: string
    category: AdminContentInsightsCategoryRef | null
}

export interface AdminContentInsightsTaxonomyRankingItem {
    id: string
    clusterId: string
    name: string
    slug: string
    language: string
    postCount: number
    views: number
    commentCount: number
}

export interface AdminContentInsightsResponse {
    selectedRange: AdminContentInsightsRange
    summaries: AdminContentInsightsSummary[]
    rankings: {
        posts: AdminContentInsightsPostRankingItem[]
        tags: AdminContentInsightsTaxonomyRankingItem[]
        categories: AdminContentInsightsTaxonomyRankingItem[]
    }
    timezone: string
    scope: AdminContentInsightsScope
    contentLanguage: string | null
    generatedAt: string
}
