/**
 * TTS 元数据回写 API
 *
 * 用途: 前端直连 TTS 完成后调用此端点：
 *   1. 将音频 URL、Provider、音色、时长写入 Post.metadata
 *   2. 创建 AITask 记录并计入 AI 用量统计
 *
 * REST: PATCH /api/posts/:id/tts-metadata
 */
import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { AITask } from '@/server/entities/ai-task'
import { TTSService } from '@/server/services/ai'
import { calculateQuotaUnits, deriveChargeStatus } from '@/server/utils/ai/cost-governance'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import logger from '@/server/utils/logger'
import { applyPostMetadataPatch } from '@/server/utils/post-metadata'
import { buildTTSPostMetadata } from '@/server/utils/ai/tts-post-metadata'

const TTSMetadataSchema = z.object({
    audioUrl: z.string().min(1),
    provider: z.string().min(1).max(50).optional(),
    voice: z.string().min(1).max(200).optional(),
    mode: z.enum(['speech', 'podcast']).optional().default('speech'),
    duration: z.number().int().positive().optional(),
    audioSize: z.number().int().positive().optional(),
    mimeType: z.string().min(1).max(100).optional(),
    /** 合成文本长度（用于计费统计） */
    textLength: z.number().int().nonnegative().optional(),
    /** 原文文本（用于审计记录） */
    text: z.string().optional(),
    /** 语言代码 */
    language: z.string().max(10).optional(),
    /** 语速 */
    speed: z.number().optional(),
    /** 模型名称 */
    model: z.string().max(100).optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const postId = getRouterParam(event, 'id')

    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const body = await readValidatedBody(event, (payload) => TTSMetadataSchema.parse(payload))

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOneBy({ id: postId })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    if (post.authorId !== session.user.id && !isAdmin(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // 1. 回写 Post 元数据
    const effectiveLanguage = body.language || post.language
    const effectiveTranslationId = post.translationId ?? null

    applyPostMetadataPatch(post, {
        metadata: buildTTSPostMetadata({
            post,
            audioUrl: body.audioUrl,
            audioSize: body.audioSize ?? null,
            duration: body.duration ?? null,
            mimeType: body.mimeType || 'audio/mpeg',
            provider: body.provider || 'volcengine',
            voice: body.voice || 'default',
            generatedAt: new Date(),
            language: effectiveLanguage,
            translationId: effectiveTranslationId,
            mode: body.mode,
        }),
    })
    await postRepo.save(post)

    logger.info(`[TTS Metadata] Updated post ${postId} audio metadata: ${body.audioUrl}`)

    // 2. 创建 AITask 记录（前端直连计费）
    const mode = body.mode
    const taskCategory = mode === 'podcast' ? 'podcast' as const : 'tts' as const
    const textLength = body.textLength || 0

    if (textLength > 0) {
        const taskPayload = {
            text: body.text || '',
            voice: body.voice || '',
            mode: body.mode,
            textLength,
            language: effectiveLanguage || null,
            translationId: effectiveTranslationId,
            speed: body.speed ?? null,
            model: body.model || 'seed-tts-2.0',
            audioUrl: body.audioUrl,
            audioSize: body.audioSize ?? null,
            mimeType: body.mimeType || 'audio/mpeg',
            duration: body.duration ?? null,
            /** 标记为前端直连模式 */
            strategy: 'frontend-direct',
        }

        const quotaUnits = calculateQuotaUnits({
            category: taskCategory,
            type: taskCategory,
            payload: taskPayload,
        })
        const actualCost = body.text
            ? await TTSService.estimateCost(body.text, body.voice || 'default', body.provider || 'volcengine', { mode: body.mode, quotaUnits })
            : 0

        const taskRepo = dataSource.getRepository(AITask)
        const task = taskRepo.create({
            category: taskCategory,
            /** type 加 _direct 后缀标记直连模式，与轮询模式区分 */
            type: `${taskCategory}_direct`,
            postId,
            userId: session.user.id,
            provider: body.provider || 'volcengine',
            model: body.model || 'seed-tts-2.0',
            mode: body.mode,
            voice: body.voice || '',
            /** 存储合成原文（截取前 500 字符用于审计展示） */
            script: (body.text || '').slice(0, 500),
            status: 'completed',
            progress: 100,
            actualCost,
            audioDuration: body.duration || 0,
            audioSize: body.audioSize || 0,
            textLength,
            language: effectiveLanguage || null,
            quotaUnits,
            chargeStatus: deriveChargeStatus({ status: 'completed', quotaUnits, settlementSource: 'actual' }),
            completedAt: new Date(),
            durationMs: (body.duration || 0) * 1000,
            payload: JSON.stringify(taskPayload),
            result: JSON.stringify({ audioUrl: body.audioUrl, strategy: 'frontend-direct' }),
        })

        await taskRepo.save(task)

        logger.info(`[TTS Metadata] AITask ${task.id} (${taskCategory}_direct) created, textLength: ${textLength}, quota: ${quotaUnits}`)
    }

    return {
        success: true,
        audioUrl: body.audioUrl,
    }
})
