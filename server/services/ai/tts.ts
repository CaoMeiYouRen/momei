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

            // Only record if not explicitly skipped
            // If options.taskId is provided, we prefer updating that task instead of skipping or creating new
            if (!options.skipRecording) {
                this.logUsage({
                    task: 'tts',
                    response: {
                        model: (provider as any).model || (provider as any).defaultModel || (provider as any).config?.model || 'unknown',
                        content: `Audio generation for ${text.length} characters`,
                    },
                    userId,
                })

                await this.recordTask({
                    id: options.taskId,
                    userId,
                    category: 'tts',
                    type: 'tts',
                    provider: provider.name,
                    model: (provider as any).model || (provider as any).defaultModel || (provider as any).config?.model || 'unknown',
                    payload: { text, voice, options },
                    response: { status: 'success' },
                })
            }

            return response
        } catch (error: any) {
            if (!options.skipRecording) {
                await this.recordTask({
                    id: options.taskId,
                    userId,
                    category: 'tts',
                    type: 'tts',
                    provider: provider.name,
                    model: (provider as any).model || (provider as any).defaultModel || (provider as any).config?.model || 'unknown',
                    payload: { text, voice, options },
                    error,
                })
            }
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

        // Volcengine (暂时下线，因接口对接问题)
        /*
        const hasVolc = settings[SettingKey.VOLCENGINE_APP_ID] || settings[SettingKey.ASR_VOLCENGINE_APP_ID] || process.env.VOLCENGINE_APP_ID
        if (hasVolc) {
            providers.push('volcengine')
        }
        */

        return providers
    }

    /**
     * 获取指定提供商
     */
    static async getProvider(name: string) {
        return await getAIProvider('tts', { provider: name as any })
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
            const postId = payload.postId

            const post = postId ? await postRepo.findOneBy({ id: postId }) : null

            const options = payload.options || {}
            const voice = payload.voice || 'default'
            const contentToUse = payload.text || payload.script || (post ? post.content : '')

            if (!contentToUse) {
                throw new Error('No content to generate speech from')
            }

            // Ensure model from task is passed to options if not present
            if (task.model && !options.model) {
                options.model = task.model
            }

            logger.info(`[TTSService] Starting speech synthesis for task ${taskId}. Text length: ${contentToUse.length}, Provider: ${task.provider}`)
            const stream = await this.generateSpeech(contentToUse, voice, { ...options, skipRecording: true }, task.userId, task.provider)

            // 任务开始处理时，如果模型字段为空，尝试补全
            if (!task.model) {
                const providerObj = await getAIProvider('tts', { provider: task.provider as any })
                task.model = (providerObj as any).model || (providerObj as any).defaultModel || 'unknown'
                await taskRepo.save(task)
            }

            // Convert stream to Buffer
            const reader = stream.getReader()
            const chunks: Uint8Array[] = []
            let receivedBytes = 0
            let lastProgressUpdateBytes = 0

            // 设置读取超时 (60秒内没收到任何数据或总处理超时则报错)
            const READ_TIMEOUT = 60000
            const MAX_TOTAL_TIME = 120000
            const startTime = Date.now()

            try {
                let chunkCount = 0
                while (true) {
                    // 检查总时间是否超限
                    if (Date.now() - startTime > MAX_TOTAL_TIME) {
                        throw new Error(`Speech synthesis timed out total execution time exceeded ${MAX_TOTAL_TIME}ms`)
                    }

                    // 使用可以清理的超时
                    let timeoutId: any
                    const timeoutPromise = new Promise<{ done: boolean, value?: Uint8Array }>((_, reject) => {
                        timeoutId = setTimeout(() => reject(new Error('Stream read timeout: No data received for 60 seconds')), READ_TIMEOUT)
                    })

                    try {
                        const result = await Promise.race([
                            reader.read(),
                            timeoutPromise as any,
                        ])
                        clearTimeout(timeoutId) // 成功读取，取消超时

                        const { done, value } = result

                        if (done) {
                            logger.info(`[TTSService] Stream reading completed for task ${taskId}. Total chunks: ${chunkCount}, Total bytes: ${receivedBytes}`)
                            break
                        }
                        if (value && value.length > 0) {
                            chunkCount++
                            if (receivedBytes === 0) {
                                logger.info(`[TTSService] First audio chunk received for task ${taskId} (${value.length} bytes)`)
                                task.progress = 5
                                await taskRepo.save(task).catch(() => { /* ignore */ })
                            }
                            chunks.push(value)
                            receivedBytes += value.length
                            // 每收到一些数据就更新进度 (每 50KB 或每收到块)，最高到 95%
                            if (receivedBytes - lastProgressUpdateBytes >= 51200) {
                                lastProgressUpdateBytes = receivedBytes
                                // 步进式增加进度，在没有总大小参考时，采用平滑增长
                                const currentProgress = typeof task.progress === 'number' ? task.progress : 5
                                task.progress = Math.min(95, currentProgress + 1)
                                logger.debug(`[TTSService] Task ${taskId} progress: ${task.progress}% (${receivedBytes} bytes)`)
                                await taskRepo.save(task).catch((e) => logger.warn(`[TTSService] Task progress save failed (taskId: ${taskId}):`, e))
                            }
                        }
                    } catch (readErr) {
                        clearTimeout(timeoutId)
                        throw readErr
                    }
                }
            } catch (readError) {
                logger.error(`[TTSService] Stream reading failed for task ${taskId}:`, readError)
                throw readError
            } finally {
                reader.releaseLock()
            }

            if (receivedBytes === 0) {
                throw new Error('Received empty audio data from provider. Please check model and voice settings.')
            }

            logger.info(`[TTSService] Audio collected for task ${taskId}. Bytes: ${receivedBytes}. Starting OSS upload...`)
            task.progress = 96
            await taskRepo.save(task)

            const buffer = Buffer.concat(chunks)

            // Debug: Save audio file to local .data directory
            try {
                const fs = await import('node:fs/promises')
                const path = await import('node:path')
                const debugDir = path.join(process.cwd(), '.data', 'debug-tts')
                await fs.mkdir(debugDir, { recursive: true })
                const debugFilePath = path.join(debugDir, `debug_${taskId}_${Date.now()}.mp3`)
                await fs.writeFile(debugFilePath, buffer)
                logger.info(`[TTSService] Debug: Audio saved to local file: ${debugFilePath}`)
            } catch (debugErr) {
                logger.warn(`[TTSService] Debug: Failed to save vocal file to .data:`, debugErr)
            }

            // Upload to storage
            const format = options.outputFormat || 'mp3'
            const filename = `tts_${Date.now()}.${format}`
            const mimetype = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`

            const uploadPath = post ? `posts/${post.id}/tts/` : `tts/${task.userId}/`

            const uploadedFile = await uploadFromBuffer(
                buffer,
                uploadPath,
                filename,
                mimetype,
                task.userId,
            )

            // Update Post if exists
            if (post) {
                post.audioUrl = uploadedFile.url
                await postRepo.save(post)
            }

            // Mark Task Completed
            task.status = 'completed'
            task.progress = 100
            task.textLength = contentToUse.length
            task.audioSize = buffer.length
            task.result = JSON.stringify({
                url: uploadedFile.url,
                audioUrl: uploadedFile.url,
                filename: uploadedFile.filename,
            })
            await taskRepo.save(task)

            // Log usage for analytical purposes
            this.logUsage({
                task: 'tts',
                response: {
                    model: task.model || 'unknown',
                    content: `Audio generation for ${contentToUse.length} characters (Task: ${taskId})`,
                },
                userId: task.userId,
            })

            logger.info(`[TTSService] Task ${taskId} completed successfully. URL: ${uploadedFile.url}`)
        } catch (error: any) {
            logger.error(`[TTSService] Task ${taskId} failed:`, error)
            task.status = 'failed'
            task.error = error.message
            await taskRepo.save(task)
        }
    }
}
