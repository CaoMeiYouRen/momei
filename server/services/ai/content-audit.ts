import { AIBaseService } from './base'
import { getAIProvider } from '@/server/utils/ai'
import { formatPrompt } from '@/server/utils/ai/prompt'
import { CONTENT_AUDIT_PROMPT } from '@/server/utils/ai/prompts/content-audit'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import logger from '@/server/utils/logger'
import { AI_CHUNK_SIZE } from '@/utils/shared/env'
import {
    AUDIT_CACHE_TTL_MS,
    AUDIT_GOOD_THRESHOLD,
    AUDIT_SCHEMA_VERSION,
    type PostAuditDetail,
    type PostAuditMetaCompleteness,
    type PostAuditReadability,
    type PostAuditResult,
} from '@/types/post'

/** 值在目标范围附近的得分 */
function rateRange(value: number, idealMin: number, idealMax: number, fullAtPercent: number): number {
    if (value >= idealMin && value <= idealMax) {
        return 1
    }
    if (value <= 0) {
        return 0
    }
    const distance = value < idealMin
        ? idealMin - value
        : value - idealMax
    const decay = Math.min(distance / idealMin, 1)
    return Math.max(0, 1 - decay * (1 - fullAtPercent / 100))
}

function metaMessage(
    factor: string,
    score: number,
    detail: string | null | undefined,
): string {
    const labels: Record<string, string> = {
        title: 'Title',
        summary: 'Summary',
        coverImage: 'Cover image',
        tags: 'Tags',
        category: 'Category',
    }
    const label = labels[factor] || factor

    let scoreTier = 0
    if (score >= 20) {
        scoreTier = 20
    }
    else if (score >= 15) {
        scoreTier = 15
    }
    else if (score >= 10) {
        scoreTier = 10
    }
    else if (score > 0) {
        scoreTier = 1
    }

    const messages: Record<string, Record<number, (d: string | null | undefined) => string>> = {
        title: {
            '20': () => 'Title is well within the ideal length range',
            '15': () => 'Title is slightly outside the ideal length range',
            '10': () => 'Title is too short or too long',
            '1': () => 'Title is far from ideal length',
            '0': () => 'Title is missing',
        },
        summary: {
            '20': () => 'Summary is detailed',
            '15': () => 'Summary is present but could be longer',
            '10': () => 'Summary is very brief',
            '1': () => 'Summary is too short',
            '0': () => 'Summary is missing; add one to improve SEO',
        },
        coverImage: {
            '20': () => `${label} is set`,
            '0': () => 'No cover image; articles with images perform better',
        },
        tags: {
            '20': () => {
                const parsed = detail ? parseInt(detail) : 0
                return `${parsed >= 3 ? '3+' : detail} tags assigned`
            },
            '10': () => `Only ${detail || 'a few'} tags; aim for 3 or more`,
            '0': () => 'No tags assigned; add 3+ tags for better discoverability',
        },
        category: {
            '20': () => `${label} is assigned`,
            '0': () => 'No category assigned',
        },
    }

    const factorMsgs = messages[factor]
    if (!factorMsgs) {
        return `${label} is missing`
    }

    // Find the best matching tier (exact or next lowest)
    const tiers = Object.keys(factorMsgs).map(Number).sort((a, b) => b - a)
    const matchedTier = tiers.find((t) => scoreTier >= t)
    if (matchedTier !== undefined) {
        const fn = factorMsgs[matchedTier]
        if (fn) {
            return fn(detail)
        }
    }

    return `${label} is missing`
}

export class ContentAuditService extends AIBaseService {
    /** 服务端计算元数据完整度，零 AI 成本 */
    static computeMetaCompleteness(post: {
        title: string
        summary?: string | null
        coverImage?: string | null
        tags?: { id: string }[] | null
        categoryId?: string | null
    }): PostAuditMetaCompleteness {
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
        if (tagCount >= 3) { tagsScore = 20 } else if (tagCount >= 1) { tagsScore = 10 }

        const categoryScore = post.categoryId ? 20 : 0

        const total = titleScore + summaryScore + coverScore + tagsScore + categoryScore

        const detail = (
            factor: string,
            score: number,
            current: string | null,
        ): PostAuditDetail => ({
            score,
            message: metaMessage(factor, score, current),
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

    /** AI 评估可读性 */
    static async analyzeReadability(
        title: string,
        content: string,
        language: string,
        userId?: string,
    ): Promise<PostAuditReadability> {
        await this.assertQuotaAllowance({
            userId,
            category: 'text',
            type: 'content_audit_readability',
            payload: { title, contentLength: content.length, language },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('AI provider does not support chat')
        }

        const prompt = formatPrompt(CONTENT_AUDIT_PROMPT, {
            title,
            content: content.slice(0, AI_CHUNK_SIZE),
            language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: 'You are a content quality auditor. Return JSON only.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logUsage({ task: 'content-audit-readability', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'content_audit_readability',
            provider: provider.name,
            model: response.model,
            payload: { title, contentLength: content.length, language },
            response: { content: response.content },
            textLength: content.length,
            language,
        })

        let parsed: { readabilityScore: number, hasHeadings: boolean, averageParagraphLength: string, suggestions: string[] }
        try {
            const cleaned = response.content
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim()
            parsed = JSON.parse(cleaned)
        } catch (e) {
            logger.warn('[ContentAudit] Failed to parse AI response, using fallback', e instanceof Error ? e.message : String(e))
            parsed = {
                readabilityScore: 50,
                hasHeadings: false,
                averageParagraphLength: 'medium',
                suggestions: ['Unable to parse AI analysis. Please try again.'],
            }
        }

        return {
            score: Math.max(0, Math.min(100, parsed.readabilityScore || 50)),
            suggestions: (parsed.suggestions || []).slice(0, 5),
        }
    }

    /** 编排完整审计流程，含缓存 */
    static async audit(
        postId: string,
        userId: string,
        options?: { force?: boolean; isAdmin?: boolean },
    ): Promise<PostAuditResult> {
        const repo = dataSource.getRepository(Post)
        const post = await repo.findOne({
            where: { id: postId },
            relations: { tags: true, category: true, author: true },
        })
        if (!post) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }

        // 行级权限：非管理员只能审计自己的文章
        if (!options?.isAdmin && post.authorId !== userId) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }

        // 检查缓存
        if (!options?.force && post.metadata?.audit) {
            const cached = post.metadata.audit
            const age = Date.now() - new Date(cached.cachedAt).getTime()
            if (age < AUDIT_CACHE_TTL_MS && cached.version === AUDIT_SCHEMA_VERSION) {
                return cached
            }
        }

        // 计算元数据完整度（无需 AI）
        const metaCompleteness = this.computeMetaCompleteness(post)

        // AI 可读性分析
        const readability = await this.analyzeReadability(
            post.title,
            post.content,
            post.language,
            userId,
        )

        // 综合评分
        const score = Math.round(metaCompleteness.score * 0.5 + readability.score * 0.5)
        const tier = score >= AUDIT_GOOD_THRESHOLD ? 'good' : 'needs_improvement'

        const result: PostAuditResult = {
            score,
            tier,
            metaCompleteness,
            readability,
            cachedAt: new Date().toISOString(),
            version: AUDIT_SCHEMA_VERSION,
        }

        // 持久化到 post.metadata
        const metadata = post.metadata ? { ...post.metadata } : {}
        metadata.audit = result
        post.metadata = metadata
        await repo.save(post)

        return result
    }
}
