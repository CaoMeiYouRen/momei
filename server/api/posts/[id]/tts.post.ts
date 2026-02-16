import { defineEventHandler, createError, readBody } from 'h3'
import { dataSource } from '../../../database'
import { Post } from '../../../entities/post'
import { TTSTask } from '../../../entities/tts-task'
import { TTSService } from '../../../services/tts'
import { processTTSTask } from '../../../services/tts/processor'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const postId = event.context.params?.id
    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOneBy({ id: postId })
    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // 权限检查：只有作者或管理员可以生成音频
    if (post.authorId !== user.id && !isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readBody(event)
    const { provider, mode = 'speech', voice, model, script } = body

    if (!voice) {
        throw createError({ statusCode: 400, statusMessage: 'Voice is required' })
    }

    const ttsProvider = await TTSService.getProvider(provider)
    const textToEstimate = script || post.content
    const estimatedCost = await ttsProvider.estimateCost(textToEstimate, voice)

    const taskRepo = dataSource.getRepository(TTSTask)
    const task = taskRepo.create({
        postId,
        userId: user.id,
        provider: provider || ttsProvider.name,
        mode,
        voice,
        model: model || (ttsProvider as any).defaultModel,
        script: script || null,
        status: 'pending',
        estimatedCost,
    })

    await taskRepo.save(task)

    // 异步处理任务
    // 在生产环境中，这应该通过消息队列（如 Redis/BullMQ）处理
    // 在目前单机架构下，直接通过异步 Promise 触发执行
    processTTSTask(task.id).catch((err) => {

        console.error('TTS Background Task Error:', err)
    })

    return {
        taskId: task.id,
        estimatedCost,
    }
})
