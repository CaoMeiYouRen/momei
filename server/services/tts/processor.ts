import { dataSource } from '../../database'
import { TTSTask } from '../../entities/tts-task'
import { Post } from '../../entities/post'
import { uploadFromBuffer } from '../upload'
import { TTSService } from '../tts'
import logger from '../../utils/logger'

/**
 * 异步处理 TTS 任务
 * @param taskId 任务 ID
 */
export async function processTTSTask(taskId: string): Promise<void> {
    const taskRepo = dataSource.getRepository(TTSTask)
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

        const ttsProvider = TTSService.getInstance(task.provider)

        // 默认处理全文内容
        // 移除 Markdown 标签以获得更好的朗读效果（可选）
        const textToProcess = post.content
            .replace(/[#*`~]/g, '') // 简单移除一些 Markdown 符号
            .trim()

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
        task.errorMessage = error.message || String(error)
        task.completedAt = new Date()
        await taskRepo.save(task)
    }
}
