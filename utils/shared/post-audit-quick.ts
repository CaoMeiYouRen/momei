import {
    AUDIT_GOOD_THRESHOLD,
    AUDIT_SCHEMA_VERSION,
    type PostAuditDetail,
    type PostAuditMetaCompleteness,
    type PostAuditResult,
} from '@/types/post'

export interface PostAuditQuickInput {
    title: string
    content?: string | null
    summary?: string | null
    coverImage?: string | null
    tags?: { id: string }[] | null
    categoryId?: string | null
}

/** 值在目标范围附近的得分 */
function rateRange(value: number, idealMin: number, idealMax: number, fullAtPercent: number): number {
    if (value >= idealMin && value <= idealMax) {
        return 1
    }
    if (value <= 0) {
        return 0
    }
    const distance = value < idealMin ? idealMin - value : value - idealMax
    const decay = Math.min(distance / idealMin, 1)
    return Math.max(0, 1 - decay * (1 - fullAtPercent / 100))
}

const I18N_PREFIX = 'pages.admin.posts.audit.msg'

/** 拼装审计消息的 i18n key 与参数 */
function metaMessage(
    factor: string,
    score: number,
    detail: string | null | undefined,
): Pick<PostAuditDetail, 'key' | 'params'> {
    let scoreTier: number
    if (score >= 20) {
        scoreTier = 20
    } else if (score >= 15) {
        scoreTier = 15
    } else if (score >= 10) {
        scoreTier = 10
    } else if (score > 0) {
        scoreTier = 1
    } else {
        scoreTier = 0
    }

    const msgs: Record<string, Record<number, { key: string, params?: Record<string, string | number> }>> = {
        title: {
            '20': { key: `${I18N_PREFIX}.title_ideal` },
            '15': { key: `${I18N_PREFIX}.title_slightly_off` },
            '10': { key: `${I18N_PREFIX}.title_too_short_or_long` },
            '1': { key: `${I18N_PREFIX}.title_far_from_ideal` },
            '0': { key: `${I18N_PREFIX}.title_missing` },
        },
        summary: {
            '20': { key: `${I18N_PREFIX}.summary_detailed` },
            '15': { key: `${I18N_PREFIX}.summary_present_but_short` },
            '10': { key: `${I18N_PREFIX}.summary_very_brief` },
            '1': { key: `${I18N_PREFIX}.summary_too_short` },
            '0': { key: `${I18N_PREFIX}.summary_missing` },
        },
        coverImage: {
            '20': { key: `${I18N_PREFIX}.cover_image_set` },
            '0': { key: `${I18N_PREFIX}.cover_image_missing` },
        },
        tags: {
            '20': { key: `${I18N_PREFIX}.tags_assigned`, params: { count: Number(detail) || 0 } },
            '10': { key: `${I18N_PREFIX}.tags_few`, params: { count: Number(detail) || 0 } },
            '0': { key: `${I18N_PREFIX}.tags_missing` },
        },
        category: {
            '20': { key: `${I18N_PREFIX}.category_assigned` },
            '0': { key: `${I18N_PREFIX}.category_missing` },
        },
    }

    const factorMsgs = msgs[factor]
    if (!factorMsgs) {
        return { key: `${I18N_PREFIX}.unknown`, params: { factor } }
    }

    const tiers = Object.keys(factorMsgs).map(Number).sort((a, b) => b - a)
    const matchedTier = tiers.find((t) => scoreTier >= t)
    if (matchedTier !== undefined && factorMsgs[matchedTier]) {
        return factorMsgs[matchedTier]
    }

    return { key: `${I18N_PREFIX}.unknown`, params: { factor } }
}

export function computeAuditMetaCompleteness(post: PostAuditQuickInput): PostAuditMetaCompleteness {
    const titleLen = post.title.length || 0
    const titleScore = Math.round(rateRange(titleLen, 5, 60, 80) * 20)

    const summaryLen = post.summary?.length || 0
    let summaryScore = 0
    if (summaryLen > 80) {
        summaryScore = 20
    } else if (summaryLen > 20) {
        summaryScore = 15
    } else if (summaryLen > 0) {
        summaryScore = 10
    }

    const coverScore = post.coverImage ? 20 : 0

    const tagCount = post.tags?.length || 0
    let tagsScore = 0
    if (tagCount >= 3) {
        tagsScore = 20
    } else if (tagCount >= 1) {
        tagsScore = 10
    }

    const categoryScore = post.categoryId ? 20 : 0

    const total = titleScore + summaryScore + coverScore + tagsScore + categoryScore

    const detail = (
        factor: string,
        score: number,
        current: string | null,
    ): PostAuditDetail => ({
        score,
        ...metaMessage(factor, score, current),
    })

    return {
        score: total,
        details: {
            title: detail('title', titleScore, post.title),
            summary: detail('summary', summaryScore, post.summary || null),
            coverImage: detail('coverImage', coverScore, post.coverImage || null),
            tags: detail('tags', tagsScore, String(tagCount)),
            category: detail('category', categoryScore, post.categoryId || null),
        },
    }
}

function computeQuickReadabilityScore(content?: string | null): number {
    const normalized = (content || '').trim()
    if (!normalized) {
        return 50
    }

    const plain = normalized
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')

    const charCount = plain.replace(/\s+/g, '').length
    const headingCount = (plain.match(/^#{2,3}\s+/gm) || []).length
    const paragraphParts = plain.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    const avgParagraphLength = paragraphParts.length > 0
        ? paragraphParts.reduce((sum, p) => sum + p.replace(/\s+/g, '').length, 0) / paragraphParts.length
        : charCount

    let score = 55
    if (headingCount > 0) { score += 15 }
    if (avgParagraphLength <= 260) { score += 15 } else if (avgParagraphLength <= 420) { score += 8 }
    if (charCount >= 300) { score += 10 }

    return Math.max(0, Math.min(100, Math.round(score)))
}

export function computeQuickAuditResult(post: PostAuditQuickInput): PostAuditResult {
    const metaCompleteness = computeAuditMetaCompleteness(post)
    const readabilityScore = computeQuickReadabilityScore(post.content)
    const score = Math.round(metaCompleteness.score * 0.5 + readabilityScore * 0.5)
    const tier = score >= AUDIT_GOOD_THRESHOLD ? 'good' : 'needs_improvement'

    return {
        score,
        tier,
        metaCompleteness,
        readability: {
            score: readabilityScore,
            suggestions: [],
        },
        cachedAt: new Date().toISOString(),
        version: AUDIT_SCHEMA_VERSION,
    }
}
