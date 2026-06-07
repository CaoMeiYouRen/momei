import { AIBaseService } from './base'
import { getAIProvider } from '@/server/utils/ai'
import { formatPrompt } from '@/server/utils/ai/prompt'
import { CONTENT_AUDIT_PROMPT } from '@/server/utils/ai/prompts/content-audit'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import logger from '@/server/utils/logger'
import { AI_CHUNK_SIZE } from '@/utils/shared/env'
import { computeAuditMetaCompleteness } from '@/utils/shared/post-audit-quick'
import type { AppLocaleCode } from '@/i18n/config/locale-registry'
import {
    AUDIT_CACHE_TTL_MS,
    AUDIT_GOOD_THRESHOLD,
    AUDIT_SCHEMA_VERSION,
    type PostAuditReadability,
    type PostAuditResult,
} from '@/types/post'

const AUDIT_FALLBACK_SUGGESTIONS: Record<AppLocaleCode, string> = {
    'zh-CN': 'AI 可读性分析暂不可用，请稍后重试。',
    'zh-TW': 'AI 可讀性分析暫時不可用，請稍後重試。',
    'en-US': 'AI readability analysis is temporarily unavailable. Please try again later.',
    'ko-KR': 'AI 가독성 분석을 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    'ja-JP': 'AIの可読性分析は一時的に利用できません。しばらくしてから再試行してください。',
}

export class ContentAuditService extends AIBaseService {
    /** AI 评估可读性 */
    static async analyzeReadability(
        title: string,
        content: string,
        responseLocale: AppLocaleCode,
        articleLanguage: string,
        userId?: string,
    ): Promise<PostAuditReadability> {
        await this.assertQuotaAllowance({
            userId,
            category: 'text',
            type: 'content_audit_readability',
            payload: { title, contentLength: content.length, language: responseLocale },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('AI provider does not support chat')
        }

        const prompt = formatPrompt(CONTENT_AUDIT_PROMPT, {
            title,
            content: content.slice(0, AI_CHUNK_SIZE),
            responseLanguage: responseLocale,
            articleLanguage,
        })

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a content quality auditor. Return JSON only. Every suggestion must be written in ${responseLocale}.`,
                },
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
            payload: { title, contentLength: content.length, language: responseLocale },
            response: { content: response.content },
            textLength: content.length,
            language: responseLocale,
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
                suggestions: [AUDIT_FALLBACK_SUGGESTIONS[responseLocale]],
            }
        }

        const suggestions = Array.isArray(parsed.suggestions)
            ? parsed.suggestions
                .map((item) => String(item).trim())
                .filter(Boolean)
                .slice(0, 5)
            : []

        return {
            score: Math.max(0, Math.min(100, parsed.readabilityScore || 50)),
            suggestions: suggestions.length > 0
                ? suggestions
                : [AUDIT_FALLBACK_SUGGESTIONS[responseLocale]],
        }
    }

    /** 编排完整审计流程，含缓存 */
    static async audit(
        postId: string,
        userId: string,
        options?: { force?: boolean, isAdmin?: boolean, uiLocale?: AppLocaleCode },
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
        const metaCompleteness = computeAuditMetaCompleteness(post)

        // AI 可读性分析
        const readability = await this.analyzeReadability(
            post.title,
            post.content,
            options?.uiLocale || 'zh-CN',
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
