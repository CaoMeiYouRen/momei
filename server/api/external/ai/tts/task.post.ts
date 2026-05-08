import { defineEventHandler, createError } from 'h3'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { createTTSTask } from '@/server/utils/ai/tts-task-shared'
import { aiExternalTTSTaskSchema } from '@/utils/schemas/ai'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const { postId, text, provider, mode, voice, model, script, options } =
        await readValidatedBody(event, (payload) => aiExternalTTSTaskSchema.parse(payload))

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

    const { task, estimatedCost, estimatedQuotaUnits } = await createTTSTask({
        userId: user.id,
        postId: finalPostId,
        content: contentToConvert,
        voice,
        provider,
        mode,
        model,
        extraPayload: { options },
    })

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
