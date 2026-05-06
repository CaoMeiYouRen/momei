/**
 * TTS 元数据回写 API
 *
 * 用途: 前端直连 TTS 完成后调用此端点：
 *   1. 将音频 URL、Provider、音色、时长写入 Post.metadata
 *   2. 创建 AITask 记录并计入 AI 用量统计
 *
 * REST: PUT /api/posts/:id/tts-metadata
 */
import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { AITask } from '@/server/entities/ai-task'
import { TTSService } from '@/server/services/ai'
import { calculateQuotaUnits, deriveChargeStatus, normalizeUsageSnapshot, serializeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { toNumber } from '@/utils/shared/coerce'
import logger from '@/server/utils/logger'
import { applyPostMetadataPatch } from '@/server/utils/post-metadata'
import { buildTTSPostMetadata } from '@/server/utils/ai/tts-post-metadata'

const TTSMetadataSchema = z.object({
    taskId: z.string().min(1).optional(),
    status: z.enum(['completed', 'failed']).optional().default('completed'),
    audioUrl: z.string().min(1).optional(),
    provider: z.string().min(1).max(50).optional(),
    voice: z.string().min(1).max(200).optional(),
    mode: z.enum(['speech', 'podcast']).optional(),
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
    /** Provider 返回的最终 usage，已在前端归一化 */
    providerUsage: z.record(z.string(), z.unknown()).optional(),
    /** 失败信息 */
    error: z.string().min(1).optional(),
})

function parseExistingTaskPayload(task: Pick<AITask, 'payload'>) {
    if (!task.payload) {
        return {}
    }

    try {
        const parsed = JSON.parse(task.payload) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {}
        }

        return parsed as Record<string, unknown>
    } catch {
        return {}
    }
}

function parseExistingTaskResultAudioUrl(task: Pick<AITask, 'result'>) {
    if (!task.result) {
        return null
    }

    try {
        const parsed = JSON.parse(task.result) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null
        }

        return typeof (parsed as Record<string, unknown>).audioUrl === 'string'
            ? (parsed as Record<string, unknown>).audioUrl as string
            : null
    } catch {
        return null
    }
}

function normalizeDirectProviderUsage(rawUsage: Record<string, unknown> | undefined) {
    if (!rawUsage) {
        return null
    }

    const totalTokens = toNumber(rawUsage.totalTokens ?? rawUsage.tokens_total ?? rawUsage.tokens, Number.NaN)
    if (Number.isFinite(totalTokens) && totalTokens > 0) {
        return { totalTokens }
    }

    return null
}

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

    const taskRepo = dataSource.getRepository(AITask)
    const existingTask = body.taskId
        ? await taskRepo.findOneBy({ id: body.taskId })
        : null

    if (body.taskId && !existingTask) {
        throw createError({ statusCode: 404, statusMessage: 'Task not found' })
    }

    const existingPayload = existingTask ? parseExistingTaskPayload(existingTask) : {}

    if (existingTask && existingTask.userId !== session.user.id && !isAdmin(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (existingTask) {
        const taskPostId = existingTask.postId || (typeof existingPayload.postId === 'string' ? existingPayload.postId : null)
        if (taskPostId !== postId) {
            throw createError({ statusCode: 400, statusMessage: 'Task does not belong to this post' })
        }

        if (!existingTask.type.endsWith('_direct') || existingPayload.strategy !== 'frontend-direct') {
            throw createError({ statusCode: 400, statusMessage: 'Only frontend-direct TTS tasks can be settled via this endpoint' })
        }
    }

    if (body.status === 'failed' && !existingTask) {
        throw createError({ statusCode: 400, statusMessage: 'Direct taskId is required for failed settlements' })
    }

    if (body.status === 'completed' && !body.audioUrl) {
        throw createError({ statusCode: 400, statusMessage: 'audioUrl is required when settling a completed direct task' })
    }

    if (existingTask?.status === 'completed' && body.status === 'failed') {
        logger.warn(`[TTS Metadata] Ignored stale failed settlement for completed direct task ${existingTask.id}`)

        return {
            success: true,
            audioUrl: parseExistingTaskResultAudioUrl(existingTask),
        }
    }

    const mode = body.mode || (existingPayload.mode as 'speech' | 'podcast' | undefined) || (existingTask?.mode as 'speech' | 'podcast' | undefined) || 'speech'
    const taskCategory = mode === 'podcast' ? 'podcast' as const : 'tts' as const
    const resolvedProvider = body.provider || existingTask?.provider || 'volcengine'
    const resolvedVoice = body.voice || (existingPayload.voice as string | undefined) || existingTask?.voice || 'default'
    const resolvedText = body.text || (existingPayload.text as string | undefined) || existingTask?.script || ''
    const resolvedTextLength = body.textLength ?? (resolvedText ? resolvedText.length : 0)
    const effectiveLanguage = body.language || (existingPayload.language as string | undefined) || existingTask?.language || post.language
    const effectiveTranslationId = post.translationId ?? (existingPayload.translationId as string | null | undefined) ?? null
    const resolvedModel = body.model || existingTask?.model || (existingPayload.model as string | undefined) || 'seed-tts-2.0'
    const taskType = existingTask?.type || `${taskCategory}_direct`
    const taskPayload = {
        postId,
        text: resolvedText,
        voice: resolvedVoice,
        mode,
        textLength: resolvedTextLength,
        language: effectiveLanguage || null,
        translationId: effectiveTranslationId,
        speed: body.speed ?? (existingPayload.speed as number | null | undefined) ?? null,
        model: resolvedModel,
        audioUrl: body.audioUrl ?? null,
        audioSize: body.audioSize ?? null,
        mimeType: body.mimeType || 'audio/mpeg',
        duration: body.duration ?? null,
        options: (typeof existingPayload.options === 'object' && existingPayload.options)
            ? existingPayload.options
            : undefined,
        strategy: 'frontend-direct' as const,
    }
    const normalizedProviderUsage = normalizeDirectProviderUsage(body.providerUsage)
    const usageSnapshot = normalizeUsageSnapshot({
        category: taskCategory,
        type: taskType,
        payload: taskPayload,
        response: normalizedProviderUsage ? { usage: normalizedProviderUsage } : undefined,
        audioDuration: body.duration,
        audioSize: body.audioSize,
        textLength: resolvedTextLength,
    })
    const fallbackQuotaUnits = existingTask
        ? Math.max(0, toNumber(existingTask.estimatedQuotaUnits, 0))
        : calculateQuotaUnits({
            category: taskCategory,
            type: taskType,
            payload: taskPayload,
        })
    const quotaUnits = normalizedProviderUsage
        ? calculateQuotaUnits({
            category: taskCategory,
            type: taskType,
            payload: taskPayload,
            usageSnapshot,
        })
        : fallbackQuotaUnits
    const settlementSource = normalizedProviderUsage ? 'actual' as const : 'estimated' as const
    let settledCost = 0
    if (resolvedText) {
        const existingEstimated = existingTask ? Math.max(0, toNumber(existingTask.estimatedCost, 0)) : null
        if (normalizedProviderUsage) {
            settledCost = await TTSService.estimateCost(resolvedText, resolvedVoice, resolvedProvider, { mode, quotaUnits })
        } else if (existingEstimated !== null) {
            settledCost = existingEstimated
        } else {
            settledCost = await TTSService.estimateCost(resolvedText, resolvedVoice, resolvedProvider, { mode, quotaUnits: fallbackQuotaUnits })
        }
    }
    const failureStage = body.status === 'failed' ? 'provider_processing' : null
    const chargeStatus = deriveChargeStatus({
        status: body.status,
        failureStage,
        quotaUnits,
        settlementSource,
    })

    if (body.status === 'completed') {
        applyPostMetadataPatch(post, {
            metadata: buildTTSPostMetadata({
                post,
                audioUrl: body.audioUrl!,
                audioSize: body.audioSize ?? null,
                duration: body.duration ?? null,
                mimeType: body.mimeType || 'audio/mpeg',
                provider: resolvedProvider,
                voice: resolvedVoice,
                generatedAt: new Date(),
                language: effectiveLanguage,
                translationId: effectiveTranslationId,
                mode,
            }),
        })
        await postRepo.save(post)

        logger.info(`[TTS Metadata] Updated post ${postId} audio metadata: ${body.audioUrl}`)
    }

    if (existingTask) {
        const completedAt = new Date()
        const startedAt = existingTask.startedAt ?? existingTask.createdAt ?? null

        existingTask.category = taskCategory
        existingTask.type = taskType
        existingTask.provider = resolvedProvider
        existingTask.model = resolvedModel
        existingTask.mode = mode
        existingTask.voice = resolvedVoice
        existingTask.script = resolvedText
        existingTask.status = body.status
        existingTask.progress = body.status === 'completed' ? 100 : existingTask.progress
        existingTask.payload = JSON.stringify(taskPayload)
        existingTask.result = body.status === 'completed'
            ? JSON.stringify({ audioUrl: body.audioUrl, strategy: 'frontend-direct' })
            : existingTask.result
        existingTask.error = body.status === 'failed' ? (body.error || 'Frontend direct TTS failed') : null
        existingTask.actualCost = chargeStatus === 'waived' ? 0 : settledCost
        existingTask.audioDuration = body.duration ?? existingTask.audioDuration
        existingTask.audioSize = body.audioSize ?? existingTask.audioSize
        existingTask.textLength = resolvedTextLength
        existingTask.language = effectiveLanguage || null
        existingTask.quotaUnits = chargeStatus === 'waived' ? 0 : quotaUnits
        existingTask.chargeStatus = chargeStatus
        existingTask.failureStage = failureStage
        existingTask.usageSnapshot = serializeUsageSnapshot(usageSnapshot)
        existingTask.completedAt = completedAt
        existingTask.durationMs = startedAt
            ? Math.max(0, completedAt.getTime() - startedAt.getTime())
            : existingTask.durationMs

        await taskRepo.save(existingTask)

        logger.info(`[TTS Metadata] AITask ${existingTask.id} (${taskType}) settled as ${body.status}, settlement=${settlementSource}`)
    } else if (resolvedTextLength > 0) {
        const task = taskRepo.create({
            category: taskCategory,
            type: taskType,
            postId,
            userId: session.user.id,
            provider: resolvedProvider,
            model: resolvedModel,
            mode,
            voice: resolvedVoice,
            script: resolvedText.slice(0, 500),
            status: body.status,
            progress: body.status === 'completed' ? 100 : 0,
            estimatedCost: settledCost,
            estimatedQuotaUnits: quotaUnits,
            actualCost: chargeStatus === 'waived' ? 0 : settledCost,
            audioDuration: body.duration || 0,
            audioSize: body.audioSize || 0,
            textLength: resolvedTextLength,
            language: effectiveLanguage || undefined,
            quotaUnits: chargeStatus === 'waived' ? 0 : quotaUnits,
            chargeStatus,
            failureStage,
            usageSnapshot: serializeUsageSnapshot(usageSnapshot),
            completedAt: new Date(),
            durationMs: (body.duration || 0) * 1000,
            payload: JSON.stringify(taskPayload),
            result: body.status === 'completed'
                ? JSON.stringify({ audioUrl: body.audioUrl, strategy: 'frontend-direct' })
                : undefined,
            error: body.status === 'failed' ? (body.error || 'Frontend direct TTS failed') : undefined,
        })

        await taskRepo.save(task)

        logger.info(`[TTS Metadata] AITask ${task.id} (${taskType}) created, textLength: ${resolvedTextLength}, quota: ${quotaUnits}, settlement=${settlementSource}`)
    }

    return {
        success: true,
        audioUrl: body.audioUrl ?? null,
    }
})
