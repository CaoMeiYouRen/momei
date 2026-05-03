import { defineEventHandler, createError, readBody } from 'h3'
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

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const user = session.user

    const body = await readBody(event)
    const { postId, text, provider, mode = 'speech', voice, model, script, language, translationId, options = {} } = body

    if (!voice) {
        throw createError({ statusCode: 400, statusMessage: 'Voice is required' })
    }

    const finalPostId = postId
    let contentToConvert = text || script
    let resolvedLanguage: string | undefined
    let resolvedTranslationId: string | null = null

    if (typeof language === 'string' && language) {
        resolvedLanguage = language
    } else if (typeof options.language === 'string' && options.language) {
        resolvedLanguage = options.language
    }

    if (typeof translationId === 'string' && translationId) {
        resolvedTranslationId = translationId
    }

    if (finalPostId) {
        const postRepo = dataSource.getRepository(Post)
        const post = await postRepo.findOneBy({ id: finalPostId })
        if (!post) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }

        // 权限检查：只有作者或管理员可以生成音频
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

    const normalizedOptions = {
        ...options,
        language: resolvedLanguage || options.language,
    }

    const estimatedQuotaUnits = calculateQuotaUnits({
        category: mode === 'podcast' ? 'podcast' : 'tts',
        type: mode === 'podcast' ? 'podcast' : 'tts',
        payload: { text: contentToConvert, voice, mode, options: normalizedOptions },
        usageSnapshot: normalizeUsageSnapshot({
            category: mode === 'podcast' ? 'podcast' : 'tts',
            type: mode === 'podcast' ? 'podcast' : 'tts',
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
        category: mode === 'podcast' ? 'podcast' : 'tts',
        type: mode === 'podcast' ? 'podcast' : 'tts',
        payload: { text: contentToConvert, voice, mode, options: normalizedOptions },
        estimatedQuotaUnits,
        estimatedCost,
    })

    // 前端直出模式降级判断：serverless 环境或显式启用时，volcengine 走前端直连
    const useFrontendDirect = (isServerlessEnvironment() || TTS_FRONTEND_DIRECT)
        && (provider === 'volcengine' || !provider)
        && mode === 'speech'

    if (useFrontendDirect) {
        return {
            strategy: 'frontend-direct',
            provider: 'volcengine',
            mode,
            estimatedCost,
            estimatedQuotaUnits,
            message: 'Serverless 环境自动降级：请前端通过 POST /api/ai/tts/credentials 获取临时凭证后直连火山引擎 TTS API。',
        }
    }

    // 如果没有传 model，则根据 provider 获取其默认 model
    let finalModel = model
    if (!finalModel) {
        const providerObj = await TTSService.getProvider(provider || 'volcengine')
        finalModel = (providerObj as any).model || (providerObj as any).defaultModel || 'unknown'
    }

    const taskRepo = dataSource.getRepository(AITask)
    const task = taskRepo.create({
        category: mode === 'podcast' ? 'podcast' : 'tts',
        type: mode === 'podcast' ? 'podcast' : 'tts',
        postId: finalPostId || null,
        userId: user.id,
        provider,
        mode,
        voice,
        model: finalModel,
        script: contentToConvert,
        payload: JSON.stringify({
            postId: finalPostId || null,
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

    const backgroundTask = TTSService.processTask(task.id).catch((err) => {
        console.error('TTS Background Task Error:', err)
    })

    if (isServerlessEnvironment()) {
        // 在 Vercel 等 Serverless 运行时里显式登记后台任务，避免响应结束后任务被直接回收。
        event.waitUntil?.(backgroundTask)
    }

    return {
        taskId: task.id,
        estimatedCost,
        estimatedQuotaUnits,
    }
})
