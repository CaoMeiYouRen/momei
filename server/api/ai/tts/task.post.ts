import { createError } from 'h3'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { AITask } from '@/server/entities/ai-task'
import { TTSService } from '@/server/services/ai'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import { calculateQuotaUnits, deriveChargeStatus, normalizeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import { isServerlessEnvironment } from '@/server/utils/env'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { TTS_FRONTEND_DIRECT } from '@/utils/shared/env'
import { isSnowflakeId } from '@/utils/shared/validate'
import type { TTSSynthesisMode, TTSTaskCreateResponse, TTSOptions } from '@/types/ai'

// ---- Zod Schema ----

const TTSOptionsSchema = z.object({
    mode: z.enum(['speech', 'podcast']).optional(),
    speed: z.number().min(0.25).max(4).optional(),
    pitch: z.number().min(-12).max(12).optional(),
    volume: z.number().min(0.5).max(2).optional(),
    language: z.string().max(10).optional(),
    model: z.string().max(100).optional(),
    sampleRate: z.number().int().positive().optional(),
    outputFormat: z.string().max(20).optional(),
}).optional().default({})

const TaskBodySchema = z.object({
    /** 文章 ID（不传则以纯文本合成）— 雪花 ID */
    postId: z.string().trim().refine((value) => isSnowflakeId(value), {
        message: 'Invalid snowflake ID',
    }).optional(),
    /** 合成文本（不传则从 postId 对应文章中读取 content） */
    text: z.string().optional(),
    /** TTS 提供商 */
    provider: z.string().max(50).optional(),
    /** 合成模式: speech（标准朗读）| podcast（AI 播客） */
    mode: z.enum(['speech', 'podcast']).optional().default('speech'),
    /** 音色 ID */
    voice: z.string().min(1).max(200),
    /** 模型名称 */
    model: z.string().max(100).optional(),
    /** AI 优化后的文稿（优先级高于 text/post content） */
    script: z.string().optional(),
    /** 文章语言代码 */
    language: z.string().max(10).optional(),
    /** 翻译簇 ID（任意唯一字符串，非雪花 ID） */
    translationId: z.string().nullable().optional(),
    /** TTS 参数选项 */
    options: TTSOptionsSchema,
})

/** 前端直连降级响应 */
interface FrontendDirectResponse {
    strategy: 'frontend-direct'
    provider: 'volcengine'
    mode: TTSSynthesisMode
    estimatedCost: number
    estimatedQuotaUnits: number
    message: string
}

/**
 * 将合成模式映射为 AITask category/type
 */
function resolveTaskCategory(mode: TTSSynthesisMode): 'tts' | 'podcast' {
    return mode === 'podcast' ? 'podcast' : 'tts'
}

// ---- Handler ----

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const user = session.user

    // 1. Zod 校验
    const { postId, text, provider, mode, voice, model, script, language, translationId, options } =
        await readValidatedBody(event, (payload) => TaskBodySchema.parse(payload))

    // 2. 解析内容
    const finalPostId = postId
    let contentToConvert = text || script
    let resolvedLanguage: string | undefined = language || options.language
    let resolvedTranslationId: string | null = translationId ?? null

    if (finalPostId) {
        const postRepo = dataSource.getRepository(Post)
        const post = await postRepo.findOneBy({ id: finalPostId })
        if (!post) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }

        if (post.authorId !== user.id && !isAdmin(user.role)) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }

        if (!contentToConvert) {
            contentToConvert = post.content
        }

        resolvedLanguage = post.language
        resolvedTranslationId = post.translationId ?? resolvedTranslationId
    }

    if (!contentToConvert) {
        throw createError({ statusCode: 400, statusMessage: 'Text or postId is required' })
    }

    // 3. 构建 options
    const taskCategory = resolveTaskCategory(mode)
    const normalizedOptions: TTSOptions = {
        ...options,
        language: resolvedLanguage || options.language,
    }

    // 4. 配额与成本估算
    const estimatedQuotaUnits = calculateQuotaUnits({
        category: taskCategory,
        type: taskCategory,
        payload: { text: contentToConvert, voice, mode, options: normalizedOptions },
        usageSnapshot: normalizeUsageSnapshot({
            category: taskCategory,
            type: taskCategory,
            payload: { text: contentToConvert, voice, mode, options: normalizedOptions },
            textLength: contentToConvert.length,
        }),
    })
    const estimatedCost = await TTSService.estimateCost(contentToConvert, voice, provider, {
        mode,
        quotaUnits: estimatedQuotaUnits,
    })

    await assertAIQuotaAllowance({
        userId: user.id,
        userRole: user.role,
        category: taskCategory,
        type: taskCategory,
        payload: { text: contentToConvert, voice, mode, options: normalizedOptions },
        estimatedQuotaUnits,
        estimatedCost,
    })

    // 5. 前端直出降级判断
    const useFrontendDirect = (isServerlessEnvironment() || TTS_FRONTEND_DIRECT)
        && (provider === 'volcengine' || !provider)
        && mode === 'speech'

    if (useFrontendDirect) {
        const response: FrontendDirectResponse = {
            strategy: 'frontend-direct',
            provider: 'volcengine',
            mode,
            estimatedCost,
            estimatedQuotaUnits,
            message: 'Serverless 环境自动降级：请前端通过 POST /api/ai/tts/credentials 获取临时凭证后直连火山引擎 TTS API。',
        }
        return response
    }

    // 6. 解析 model
    let finalModel = model
    if (!finalModel) {
        const providerObj = await TTSService.getProvider(provider || 'volcengine')
        finalModel = (providerObj as unknown as Record<string, unknown>).model as string
            || (providerObj as unknown as Record<string, unknown>).defaultModel as string
            || 'unknown'
    }

    // 7. 创建后台任务
    const taskRepo = dataSource.getRepository(AITask)
    const task = taskRepo.create({
        category: taskCategory,
        type: taskCategory,
        postId: finalPostId || undefined,
        userId: user.id,
        provider: provider || 'volcengine',
        mode,
        voice,
        model: finalModel || 'unknown',
        script: contentToConvert,
        payload: JSON.stringify({
            postId: finalPostId || undefined,
            text: contentToConvert,
            voice,
            mode,
            language: resolvedLanguage || null,
            translationId: resolvedTranslationId,
            options: normalizedOptions,
        }),
        status: 'pending',
        progress: 0,
        estimatedCost,
        estimatedQuotaUnits,
        chargeStatus: deriveChargeStatus({ status: 'pending', quotaUnits: estimatedQuotaUnits, settlementSource: 'estimated' }),
    })

    await taskRepo.save(task)

    // 8. 启动后台处理
    const backgroundTask = TTSService.processTask(task.id).catch((err) => {
        console.error('TTS Background Task Error:', err)
    })

    if (isServerlessEnvironment()) {
        event.waitUntil?.(backgroundTask)
    }

    const response: TTSTaskCreateResponse = {
        taskId: task.id,
        estimatedCost,
        estimatedQuotaUnits,
    }
    return response
})
