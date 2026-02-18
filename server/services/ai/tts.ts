import { getAIProvider } from '../../utils/ai'
import { dataSource } from '../../database'
import { Post } from '../../entities/post'
import { AITask } from '../../entities/ai-task'
import { uploadFromBuffer } from '../upload'
import logger from '../../utils/logger'
import { AIBaseService } from './base'
import type { TTSOptions, TTSAudioVoice } from '@/types/ai'

export class TTSService extends AIBaseService {
    static async generateSpeech(text: string, voice: string = 'default', options: TTSOptions = {}, userId?: string) {
        const provider = await getAIProvider('tts')

        try {
            if (!provider.generateSpeech) {
                throw new Error(`Provider ${provider.name} does not support text-to-speech`)
            }

            const response = await provider.generateSpeech(text, voice, options)

            this.logUsage({
                task: 'tts',
                response: {
                    model: (provider as any).config?.model || 'unknown',
                    content: `Audio generation for ${text.length} characters`,
                },
                userId,
            })

            await this.recordTask({
                userId,
                category: 'tts',
                type: 'tts',
                provider: provider.name,
                model: (provider as any).config?.model || 'unknown',
                payload: { text, voice, options },
                response: { status: 'success' },
            })

            return response
        } catch (error: any) {
            await this.recordTask({
                userId,
                category: 'tts',
                type: 'tts',
                provider: provider.name,
                model: 'unknown',
                payload: { text, voice, options },
                error,
            })
            throw error
        }
    }

    static async getVoices(): Promise<TTSAudioVoice[]> {
        const provider = await getAIProvider('tts')
        if (!provider.getVoices) {
            return []
        }
        return await provider.getVoices()
    }

    static async estimateCost(text: string, voice: string = 'default'): Promise<number> {
        const provider = await getAIProvider('tts')
        if (!provider.estimateTTSCost) {
            return 0
        }
        return await provider.estimateTTSCost(text, voice)
    }

    /**
     * 获取可用提供商
     */
    static async getAvailableProviders() {
        return Promise.resolve(['openai', 'siliconflow', 'azure', 'edge-tts'])
    }

    /**
     * 获取指定提供商
     */
    static async getProvider(name: string) {
        return await getAIProvider({ provider: name as any })
    }

    /**
     * 后台处理文章 TTS 任务
     */
    static async processTask(taskId: string) {
        const taskRepo = dataSource.getRepository(AITask)
        const postRepo = dataSource.getRepository(Post)

        const task = await taskRepo.findOneBy({ id: taskId })
        if (!task?.userId) { return }

        try {
            task.status = 'processing'
            await taskRepo.save(task)

            const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : (task.payload || {})
            const post = await postRepo.findOneBy({ id: payload.postId })
            if (!post) { throw new Error('Post not found') }

            const options = payload.options || {}
            const voice = payload.voice || 'default'
            const stream = await this.generateSpeech(post.content, voice, options, task.userId)

            // Convert stream to Buffer
            const reader = stream.getReader()
            const chunks: Uint8Array[] = []
            while (true) {
                const { done, value } = await reader.read()
                if (done) { break }
                chunks.push(value)
            }
            const buffer = Buffer.concat(chunks)

            // Upload to storage
            const filename = `tts_${Date.now()}.mp3`
            const uploadedFile = await uploadFromBuffer(
                buffer,
                `posts/${post.id}/tts/`,
                filename,
                'audio/mpeg',
                task.userId,
            )

            // Update Post
            post.audioUrl = uploadedFile.url
            await postRepo.save(post)

            // Mark Task Completed
            task.status = 'completed'
            task.result = JSON.stringify({ url: uploadedFile.url })
            await taskRepo.save(task)
        } catch (error: any) {
            logger.error(`[TTSService] Task ${taskId} failed:`, error)
            task.status = 'failed'
            task.error = error.message
            await taskRepo.save(task)
        }
    }
}
