/**
 * TTS 元数据回写 API (原型)
 *
 * 用途: 前端完成"流式接收音频 + 直传 OSS"后，调用此端点将音频 URL、Provider、音色、时长
 *       等信息写入 Post.metadata.audio / Post.metadata.tts 字段。
 *
 * REST: PATCH /api/posts/:id/tts-metadata
 * Body: { audioUrl, provider, voice, mode, duration }
 */
import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import logger from '@/server/utils/logger'
import { z } from 'zod'

const TTSMetadataSchema = z.object({
    audioUrl: z.string().url(),
    provider: z.string().min(1).max(50).optional(),
    voice: z.string().min(1).max(100).optional(),
    mode: z.enum(['speech', 'podcast']).optional(),
    duration: z.number().int().positive().optional(),
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

    // 权限检查：仅作者或管理员
    if (post.authorId !== session.user.id && !isAdmin(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // 确保 metadata 对象存在
    const metadata = (post.metadata || {}) as Record<string, unknown>

    // 写入 audio 元数据（音频播放 URL）
    metadata.audio = {
        ...((metadata.audio as Record<string, unknown>) || {}),
        url: body.audioUrl,
        updatedAt: new Date().toISOString(),
    }

    // 写入 tts 元数据（TTS 生成记录）
    metadata.tts = {
        provider: body.provider || 'unknown',
        voice: body.voice || 'default',
        mode: body.mode || 'speech',
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

    return {
        success: true,
        audioUrl: body.audioUrl,
    }
})
