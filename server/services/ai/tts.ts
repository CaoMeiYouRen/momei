import { getAIProvider } from '../../utils/ai'
import { dataSource } from '../../database'
import { Post } from '../../entities/post'
import { AITask } from '../../entities/ai-task'
import { uploadFromBuffer } from '../upload'
import { getSettings } from '../setting'
import logger from '../../utils/logger'
import { AIBaseService } from './base'
import { SettingKey } from '@/types/setting'
import type { TTSOptions, TTSAudioVoice } from '@/types/ai'

export class TTSService extends AIBaseService {
    static async generateSpeech(text: string, voice: string = 'default', options: TTSOptions = {}, userId?: string, providerName?: string) {
        const provider = await getAIProvider('tts', providerName ? { provider: providerName as any } : undefined)

        try {
            if (!provider.generateSpeech) {
                throw new Error(`Provider ${provider.name} does not support text-to-speech`)
            }

            const response = await provider.generateSpeech(text, voice, options)

            this.logUsage({
                task: 'tts',
                response: {
                    model: (provider as any).model || (provider as any).defaultModel || (provider as any).config?.model || 'unknown',
                    content: `Audio generation for ${text.length} characters`,
                },
                userId,
            })

            await this.recordTask({
                userId,
                category: 'tts',
                type: 'tts',
                provider: provider.name,
                model: (provider as any).model || (provider as any).defaultModel || (provider as any).config?.model || 'unknown',
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
                model: (provider as any).model || (provider as any).defaultModel || (provider as any).config?.model || 'unknown',
                payload: { text, voice, options },
                error,
            })
            throw error
        }
    }

    /**
     * 合并生成与上传
     */
    static async generateAndUploadSpeech(text: string, voice: string = 'default', options: TTSOptions = {}, userId?: string, prefix: string = 'tts/') {
        const stream = await this.generateSpeech(text, voice, options, userId)

        // 复制流以便同时用于返回和上传
        const [userStream, ossStream] = stream.tee()

        // 后台异步上传
        this.uploadStreamToOSS(ossStream, userId, prefix, options.outputFormat || 'mp3').catch((err) => {
            logger.error('[TTSService] Background TTS upload failed:', err)
        })

        return userStream
    }

    /**
     * 将流上传至存储
     */
    private static async uploadStreamToOSS(stream: ReadableStream<Uint8Array>, userId: string | undefined, prefix: string, format: string) {
        const reader = stream.getReader()
        const chunks: Uint8Array[] = []
        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    break
                }
                chunks.push(value)
            }
            const buffer = Buffer.concat(chunks)
            const filename = `tts_${Date.now()}.${format}`
            const mimetype = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`

            return await uploadFromBuffer(
                buffer,
                prefix,
                filename,
                mimetype,
                userId,
            )
        } finally {
            reader.releaseLock()
        }
    }

    static async getVoices(providerName?: string): Promise<TTSAudioVoice[]> {
        const provider = await getAIProvider('tts', providerName ? { provider: providerName as any } : undefined)
        if (!provider.getVoices) {
            return []
        }
        return await provider.getVoices()
    }

    static async estimateCost(text: string, voice: string = 'default', providerName?: string): Promise<number> {
        const provider = await getAIProvider('tts', providerName ? { provider: providerName as any } : undefined)
        if (!provider.estimateTTSCost) {
            return 0
        }
        return await provider.estimateTTSCost(text, voice)
    }

    /**
     * 获取可用提供商
     */
    static async getAvailableProviders() {
        const settings = await getSettings([
            SettingKey.AI_API_KEY,
            SettingKey.TTS_API_KEY,
            SettingKey.ASR_VOLCENGINE_APP_ID,
            SettingKey.VOLCENGINE_APP_ID,
            SettingKey.VOLCENGINE_ACCESS_KEY,
            SettingKey.AI_PROVIDER,
            SettingKey.TTS_PROVIDER,
        ])

        const providers: string[] = []

        // OpenAI
        const hasOpenAI = settings[SettingKey.TTS_API_KEY] || settings[SettingKey.AI_API_KEY] || process.env.TTS_API_KEY || process.env.AI_API_KEY
        if (hasOpenAI) {
            providers.push('openai')
        }

        // SiliconFlow
        const isSF = settings[SettingKey.TTS_PROVIDER] === 'siliconflow' || settings[SettingKey.AI_PROVIDER] === 'siliconflow' || process.env.TTS_PROVIDER === 'siliconflow'
        if (isSF || hasOpenAI) {
            // 如果明确配置了 SiliconFlow，或者有通用 API Key (通常 SF 也可以用通用 Key 配 Endpoint)
            providers.push('siliconflow')
        }

        // Volcengine
        const hasVolc = settings[SettingKey.VOLCENGINE_APP_ID] || settings[SettingKey.ASR_VOLCENGINE_APP_ID] || process.env.VOLCENGINE_APP_ID
        if (hasVolc) {
            providers.push('volcengine')
        }

        return providers
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
        if (!task?.userId) {
            return
        }

        try {
            task.status = 'processing'
            await taskRepo.save(task)

            const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : (task.payload || {})
            const post = await postRepo.findOneBy({ id: payload.postId })
            if (!post) {
                throw new Error('Post not found')
            }

            const options = payload.options || {}
            const voice = payload.voice || 'default'
            const contentToUse = payload.script || post.content
            const stream = await this.generateSpeech(contentToUse, voice, options, task.userId, task.provider)

            // Convert stream to Buffer
            const reader = stream.getReader()
            const chunks: Uint8Array[] = []
            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    break
                }
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
