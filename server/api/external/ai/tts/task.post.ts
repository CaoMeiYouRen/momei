import { defineEventHandler, createError, readBody } from 'h3'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { AITask } from '@/server/entities/ai-task'
import { TTSService } from '@/server/services/ai'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import { calculateQuotaUnits, deriveChargeStatus, normalizeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import { isServerlessEnvironment } from '@/server/utils/env'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const body = await readBody(event)
    const { postId, text, provider, mode = 'speech', voice, model, script, options = {} } = body

    if (!voice) {
        throw createError({ statusCode: 400, statusMessage: 'Voice is required' })
    }

    const finalPostId = postId
    let contentToConvert = text || script

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
    }

    if (!contentToConvert) {
        throw createError({ statusCode: 400, statusMessage: 'Text or postId is required' })
    }

    const estimatedQuotaUnits = calculateQuotaUnits({
        category: mode === 'podcast' ? 'podcast' : 'tts',
        type: mode === 'podcast' ? 'podcast' : 'tts',
        payload: { text: contentToConvert, voice, mode, options },
        usageSnapshot: normalizeUsageSnapshot({
            category: mode === 'podcast' ? 'podcast' : 'tts',
            type: mode === 'podcast' ? 'podcast' : 'tts',
            payload: { text: contentToConvert, voice, mode, options },
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
        payload: { text: contentToConvert, voice, mode, options },
        estimatedQuotaUnits,
        estimatedCost,
    })

    let finalModel = model
    if (!finalModel) {
        const providerObj = await TTSService.getProvider(provider || 'volcengine')
        finalModel = (providerObj as { model?: string, defaultModel?: string }).model
            || (providerObj as { model?: string, defaultModel?: string }).defaultModel
            || 'unknown'
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
            options,
        }),
        status: 'pending',
        progress: 0,
        estimatedCost,
        estimatedQuotaUnits,
        chargeStatus: deriveChargeStatus({
            status: 'pending',
            quotaUnits: estimatedQuotaUnits,
            settlementSource: 'estimated',
        }),
    })

    await taskRepo.save(task)

    const backgroundTask = TTSService.processTask(task.id).catch((error) => {
        console.error('TTS Background Task Error:', error)
    })

    if (isServerlessEnvironment()) {
        event.waitUntil?.(backgroundTask)
    }

    return {
        code: 200,
        data: {
            taskId: task.id,
            status: task.status,
            estimatedCost,
            estimatedQuotaUnits,
        },
    }
})
