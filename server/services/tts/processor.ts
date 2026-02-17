import { dataSource } from '../../database'
import { AITask } from '../../entities/ai-task'
import { Post } from '../../entities/post'
import { uploadFromBuffer } from '../upload'
import { TTSService } from '../tts'
import logger from '../../utils/logger'

/**
 * 异步处理 TTS 任务
 * @param taskId 任务 ID
 */
export async function processTTSTask(taskId: string): Promise<void> {
    const taskRepo = dataSource.getRepository(AITask)
    const postRepo = dataSource.getRepository(Post)

    const task = await taskRepo.findOneBy({ id: taskId })
    if (!task) {
        logger.error(`TTS Task ${taskId} not found`)
        return
    }

    try {
        task.status = 'processing'
        task.startedAt = new Date()
        await taskRepo.save(task)

        const post = await postRepo.findOneBy({ id: task.postId })
        if (!post) {
            throw new Error(`Post ${task.postId} not found`)
        }

        const ttsProvider = await TTSService.getProvider(task.provider)

        // 优先使用任务中指定的朗读稿，否则读取文章内容并进行简单净化
        let textToProcess = task.script
        if (!textToProcess) {
            textToProcess = post.content
                .replace(/[#*`~]/g, '') // 简单移除一些 Markdown 符号
                .trim()
        }

        if (!textToProcess) {
            throw new Error('文章内容为空，无法生成音频')
        }

        // 1. 生成语音流
        const stream = await ttsProvider.generateSpeech(textToProcess, task.voice, {
            mode: task.mode as any,
            outputFormat: 'mp3',
        })

        // 2. 将流转换为 Buffer
        const chunks: Uint8Array[] = []
        const reader = stream.getReader()
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            chunks.push(value)
        }
        const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)))

        // 3. 上传到存储
        const filename = `post-${post.id}-${Date.now()}.mp3`
        const uploadResult = await uploadFromBuffer(buffer, 'audio/', filename, 'audio/mpeg', task.userId)

        // 4. 更新 Task 状态
        task.status = 'completed'
        task.completedAt = new Date()
        task.progress = 100
        // 计算实际成本
        task.actualCost = await ttsProvider.estimateCost(textToProcess, task.voice)
        task.result = JSON.stringify({
            audioUrl: uploadResult.url,
            audioSize: buffer.length,
            audioMimeType: 'audio/mpeg',
        })
        await taskRepo.save(task)

        // 5. 更新 Post 记录
        post.audioUrl = uploadResult.url
        post.audioMimeType = 'audio/mpeg'
        post.audioSize = buffer.length
        post.ttsProvider = task.provider
        post.ttsVoice = task.voice
        post.ttsGeneratedAt = new Date()
        // 注意：目前尚未集成音频时长获取工具（如 ffmpeg/ffprobe），后续可补充
        await postRepo.save(post)

        logger.info(`TTS Task ${taskId} completed successfully for post ${post.id}`)
    } catch (error: any) {
        logger.error(`Failed to process TTS Task ${taskId}:`, error)
        task.status = 'failed'
        task.error = error.message || String(error)
        task.completedAt = new Date()
        await taskRepo.save(task)
    }
}
