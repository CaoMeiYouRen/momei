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
import { calculateQuotaUnits, deriveChargeStatus } from '@/server/utils/ai/cost-governance'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import logger from '@/server/utils/logger'

const TTSMetadataSchema = z.object({
    audioUrl: z.string().min(1),
    provider: z.string().min(1).max(50).optional(),
    voice: z.string().min(1).max(100).optional(),
    mode: z.enum(['speech', 'podcast']).optional().default('speech'),
    duration: z.number().int().positive().optional(),
    /** 合成文本长度（用于计费统计） */
    textLength: z.number().int().nonnegative().optional(),
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
    const metadata = (post.metadata || {}) as Record<string, unknown>

    metadata.audio = {
        ...((metadata.audio ?? {}) as Record<string, unknown>),
        url: body.audioUrl,
        updatedAt: new Date().toISOString(),
    }

    metadata.tts = {
        provider: body.provider || 'unknown',
        voice: body.voice || 'default',
        mode: body.mode,
        duration: body.duration ?? (
            typeof (metadata.tts as Record<string, unknown>)?.duration === 'number'
                ? (metadata.tts as Record<string, unknown>).duration
                : undefined
        ),
        generatedAt: new Date().toISOString(),
    }

    post.metadata = metadata
    await postRepo.save(post)

    logger.info(`[TTS Metadata] Updated post ${postId} audio metadata: ${body.audioUrl}`)

    // 2. 创建 AITask 记录（前端直连计费）
    const mode = body.mode
    const taskCategory = mode === 'podcast' ? 'podcast' as const : 'tts' as const
    const textLength = body.textLength || 0

    if (textLength > 0) {
        const payload = { text: '', voice: body.voice || '', mode: body.mode, textLength }
        const quotaUnits = calculateQuotaUnits({
            category: taskCategory,
            type: taskCategory,
            payload,
        })

        const taskRepo = dataSource.getRepository(AITask)
        const task = taskRepo.create({
            category: taskCategory,
            type: taskCategory,
            postId,
            userId: session.user.id,
            provider: body.provider || 'volcengine',
            model: 'seed-tts-2.0',
            mode: body.mode,
            voice: body.voice || '',
            script: '',
            status: 'completed',
            progress: 100,
            textLength,
            quotaUnits,
            chargeStatus: deriveChargeStatus({ status: 'completed', quotaUnits, settlementSource: 'actual' }),
            completedAt: new Date(),
            durationMs: (body.duration || 0) * 1000,
            result: JSON.stringify({ audioUrl: body.audioUrl }),
        })

        await taskRepo.save(task)

        logger.info(`[TTS Metadata] AITask ${task.id} created for direct TTS, textLength: ${textLength}, quotaUnits: ${quotaUnits}`)
    }

    return {
        success: true,
        audioUrl: body.audioUrl,
    }
})
