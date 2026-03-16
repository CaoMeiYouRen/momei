import { defineEventHandler, createError, readBody } from 'h3'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { AITask } from '@/server/entities/ai-task'
import { TTSService } from '@/server/services/ai'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import { calculateQuotaUnits, deriveChargeStatus, normalizeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'

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

    // 异步处理任务
    TTSService.processTask(task.id).catch((err) => {
        console.error('TTS Background Task Error:', err)
    })

    return {
        taskId: task.id,
        estimatedCost,
        estimatedQuotaUnits,
    }
})
