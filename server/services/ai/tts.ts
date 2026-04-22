import { buildPostUploadPrefix, buildUploadStoredFilename, uploadFromBuffer, UploadType } from '../upload'
import { getSettings } from '../setting'
import { AIBaseService } from './base'
import { estimateAICostBreakdown, estimateAIDisplayCost } from './cost-display'
import { getAIProvider } from '@/server/utils/ai'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { AITask } from '@/server/entities/ai-task'
import { calculateQuotaUnits, deriveChargeStatus, inferFailureStage, normalizeUsageSnapshot, serializeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import logger from '@/server/utils/logger'
import { applyPostMetadataPatch } from '@/server/utils/post-metadata'
import { withAITimeout } from '@/server/utils/ai/timeout'
import { sendInAppNotification } from '@/server/services/notification'
import { SettingKey } from '@/types/setting'
import { AI_HEAVY_TASK_TIMEOUT_MS, TTS_DEFAULT_VOICE } from '@/utils/shared/env'
import { NotificationType, buildAITaskDetailPath } from '@/utils/shared/notification'
import type { TTSOptions, TTSAudioVoice, TTSVoiceQuery } from '@/types/ai'

const MAX_AUDIO_COMPENSATION_ATTEMPTS = 2

type PodcastTaskCheckpointPhase = 'queued' | 'asset_uploaded'

interface PodcastTaskCheckpoint {
    phase: PodcastTaskCheckpointPhase
    uploadedAsset?: {
        url: string
        filename: string
        mimeType: string
        size: number
    }
    resumeAttempts?: number
    lastResumeAt?: string | null
}

function parseTaskResultRecord(taskResult: string | null | undefined): Record<string, unknown> | null {
    if (!taskResult) {
        return null
    }

    try {
        const parsed = JSON.parse(taskResult) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null
        }

        return parsed as Record<string, unknown>
    } catch {
        return null
    }
}

function parsePodcastTaskCheckpoint(taskResult: string | null | undefined) {
    const parsed = parseTaskResultRecord(taskResult)

    if (!parsed) {
        return null
    }

    if (typeof parsed.phase !== 'string') {
        return null
    }

    if (!['queued', 'asset_uploaded'].includes(parsed.phase)) {
        return null
    }

    return {
        phase: parsed.phase as PodcastTaskCheckpointPhase,
        uploadedAsset: parsed.uploadedAsset as PodcastTaskCheckpoint['uploadedAsset'],
        resumeAttempts: typeof parsed.resumeAttempts === 'number' ? parsed.resumeAttempts : undefined,
        lastResumeAt: typeof parsed.lastResumeAt === 'string' || parsed.lastResumeAt === null
            ? parsed.lastResumeAt
            : undefined,
    }
}

function normalizePodcastMode(mode?: string | null): 'podcast' | 'speech' | undefined {
    if (mode === 'podcast' || mode === 'speech') {
        return mode
    }

    return undefined
}

export class TTSService extends AIBaseService {
    private static async finalizeUploadedTask(options: {
        task: AITask
        post: Post | null
        payload: Record<string, any>
        voice: string
        contentToUse: string
        uploadedFile: {
            url: string
            filename: string
        }
        mimeType: string
        bufferSize: number
        effectiveLanguage: string | null
        effectiveTranslationId: string | null
        mode?: string
    }) {
        const {
            task,
            post,
            payload,
            voice,
            contentToUse,
            uploadedFile,
            mimeType,
            bufferSize,
            effectiveLanguage,
            effectiveTranslationId,
            mode,
        } = options
        const normalizedMode = normalizePodcastMode(mode)
        const postRepo = dataSource.getRepository(Post)
        const taskRepo = dataSource.getRepository(AITask)

        if (post) {
            applyPostMetadataPatch(post, {
                metadata: {
                    ...post.metadata,
                    audio: {
                        ...post.metadata?.audio,
                        url: uploadedFile.url,
                        size: bufferSize,
                        mimeType,
                        language: effectiveLanguage,
                        translationId: effectiveTranslationId,
                        postId: post.id,
                        mode: normalizedMode,
                    },
                    tts: {
                        ...post.metadata?.tts,
                        provider: task.provider || null,
                        voice,
                        generatedAt: new Date(),
                        language: effectiveLanguage,
                        translationId: effectiveTranslationId,
                        postId: post.id,
                        mode: normalizedMode,
                    },
                },
            })
            await postRepo.save(post)
        }

        const usageSnapshot = normalizeUsageSnapshot({
            category: task.category || task.type,
            type: task.type,
            payload,
            response: { audioUrl: uploadedFile.url },
            audioSize: bufferSize,
            textLength: contentToUse.length,
        })
        task.status = 'completed'
        task.progress = 100
        task.textLength = contentToUse.length
        task.audioSize = bufferSize
        task.quotaUnits = calculateQuotaUnits({
            category: task.category || task.type,
            type: task.type,
            payload,
            usageSnapshot,
        })
        task.actualCost = await estimateAIDisplayCost({
            category: task.category || task.type,
            type: task.type,
            provider: task.provider || null,
            quotaUnits: task.quotaUnits,
            payload,
            usageSnapshot,
        })
        task.chargeStatus = deriveChargeStatus({
            status: 'completed',
            quotaUnits: task.quotaUnits,
            settlementSource: 'estimated',
        })
        task.failureStage = null
        task.usageSnapshot = serializeUsageSnapshot(usageSnapshot)
        task.completedAt = new Date()
        task.durationMs = task.startedAt ? task.completedAt.getTime() - task.startedAt.getTime() : task.durationMs
        task.result = JSON.stringify({
            url: uploadedFile.url,
            audioUrl: uploadedFile.url,
            filename: uploadedFile.filename,
        })
        await taskRepo.save(task)

        await sendInAppNotification({
            userId: task.userId,
            type: NotificationType.SYSTEM,
            title: '语音合成完成',
            content: '您的语音合成任务已完成，可点击查看音频结果。',
            link: buildAITaskDetailPath(task.id),
        }).catch((notificationError) => {
            logger.error('[TTSService] Failed to send completion notification:', notificationError)
        })

        this.logUsage({
            task: 'tts',
            response: {
                model: task.model || 'unknown',
                content: `Audio generation for ${contentToUse.length} characters (Task: ${task.id})`,
            },
            userId: task.userId,
        })

        logger.info(`[TTSService] Task ${task.id} completed successfully. URL: ${uploadedFile.url}`)
    }

    private static resolveVoice(voice?: string | null) {
        if (!voice || voice === 'default') {
            return TTS_DEFAULT_VOICE
        }

        return voice
    }

    static async generateSpeech(text: string, voice: string = TTS_DEFAULT_VOICE, options: TTSOptions = {}, userId?: string, providerName?: string) {
        const provider = await getAIProvider('tts', providerName ? { provider: providerName as any } : undefined)
        const resolvedVoice = this.resolveVoice(voice)

        try {
            if (!provider.generateSpeech) {
                throw new Error(`Provider ${provider.name} does not support text-to-speech`)
            }

            const response = await provider.generateSpeech(text, resolvedVoice, options)

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
                    payload: { text, voice: resolvedVoice, options },
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
                    payload: { text, voice: resolvedVoice, options },
                    error,
                })
            }
            throw error
        }
    }

    /**
     * 合并生成与上传
     */
    static async generateAndUploadSpeech(text: string, voice: string = TTS_DEFAULT_VOICE, options: TTSOptions = {}, userId?: string, prefix: string = 'tts/') {
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
            const filename = buildUploadStoredFilename({
                extension: format,
            })
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

    static async getVoices(providerName?: string, query: TTSVoiceQuery = {}): Promise<TTSAudioVoice[]> {
        const provider = await getAIProvider('tts', providerName ? { provider: providerName as any } : undefined)
        if (!provider.getVoices) {
            return []
        }
        return await provider.getVoices(query)
    }

    static async estimateProviderCost(text: string, voice: string = TTS_DEFAULT_VOICE, providerName?: string): Promise<number> {
        const provider = await getAIProvider('tts', providerName ? { provider: providerName as any } : undefined)
        const estimateFn = provider.estimateTTSCost?.bind(provider) || provider.estimateCost?.bind(provider)
        if (!estimateFn) {
            return 0
        }

        return await estimateFn(text, this.resolveVoice(voice))
    }

    static async estimateCostBreakdown(
        text: string,
        voice: string = TTS_DEFAULT_VOICE,
        providerName?: string,
        options: Pick<TTSOptions, 'mode'> & {
            quotaUnits?: number
        } = {},
    ) {
        const provider = await getAIProvider('tts', providerName ? { provider: providerName as any } : undefined)
        const resolvedVoice = this.resolveVoice(voice)
        const providerCost = await this.estimateProviderCost(text, resolvedVoice, providerName)
        const category = options.mode === 'podcast' ? 'podcast' : 'tts'
        const payload = { text, voice: resolvedVoice, mode: options.mode || 'speech' }
        const quotaUnits = options.quotaUnits || calculateQuotaUnits({
            category,
            type: category,
            payload,
        })
        const usageSnapshot = normalizeUsageSnapshot({
            category,
            type: category,
            payload,
            textLength: text.length,
        })

        const breakdown = await estimateAICostBreakdown({
            category,
            type: category,
            provider: provider.name,
            providerCost,
            quotaUnits,
            payload,
            usageSnapshot,
        })

        return {
            ...breakdown,
            quotaUnits,
        }
    }

    static async estimateCost(
        text: string,
        voice: string = TTS_DEFAULT_VOICE,
        providerName?: string,
        options: Pick<TTSOptions, 'mode'> & {
            quotaUnits?: number
        } = {},
    ): Promise<number> {
        const estimate = await this.estimateCostBreakdown(text, voice, providerName, options)
        return estimate.displayCost
    }

    /**
     * 获取可用提供商
     */
    static async getAvailableProviders() {
        const settings = await getSettings([
            SettingKey.AI_API_KEY,
            SettingKey.TTS_API_KEY,
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
        const hasVolc = settings[SettingKey.VOLCENGINE_APP_ID] || process.env.VOLCENGINE_APP_ID
        if (hasVolc) {
            providers.push('volcengine')
        }


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
    static async processTask(taskId: string, existingTask?: AITask) {
        const taskRepo = dataSource.getRepository(AITask)
        const postRepo = dataSource.getRepository(Post)

        const task = existingTask || await taskRepo.findOneBy({ id: taskId })
        if (!task?.userId) {
            return
        }

        try {
            task.status = 'processing'
            task.startedAt = task.startedAt || new Date()
            await taskRepo.save(task)

            const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : (task.payload || {})
            const postId = payload.postId

            const post = postId ? await postRepo.findOneBy({ id: postId }) : null

            const options = {
                ...(payload.options || {}),
                mode: payload.mode || task.mode || payload.options?.mode || 'speech',
            }
            const voice = this.resolveVoice(payload.voice)
            const effectiveLanguage = post?.language || payload.language || options.language || null
            const effectiveTranslationId = post?.translationId ?? payload.translationId ?? null
            const checkpoint = task.type === 'podcast' ? parsePodcastTaskCheckpoint(task.result) : null

            if (effectiveLanguage && !options.language) {
                options.language = effectiveLanguage
            }

            const contentToUse = payload.text || payload.script || (post ? post.content : '')

            if (!contentToUse) {
                throw new Error('No content to generate speech from')
            }

            if (task.type === 'podcast' && checkpoint?.phase === 'asset_uploaded' && checkpoint.uploadedAsset?.url) {
                await this.finalizeUploadedTask({
                    task,
                    post,
                    payload,
                    voice,
                    contentToUse,
                    uploadedFile: checkpoint.uploadedAsset,
                    mimeType: checkpoint.uploadedAsset.mimeType,
                    bufferSize: checkpoint.uploadedAsset.size,
                    effectiveLanguage,
                    effectiveTranslationId,
                    mode: options.mode,
                })
                return
            }

            // Ensure model from task is passed to options if not present
            if (task.model && !options.model) {
                options.model = task.model
            }

            logger.info(`[TTSService] Starting speech synthesis for task ${taskId}. Text length: ${contentToUse.length}, Provider: ${task.provider}`)
            const stream = await withAITimeout(
                this.generateSpeech(contentToUse, voice, { ...options, skipRecording: true }, task.userId, task.provider),
                'TTS generation',
            )

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

            // 设置读取超时与总处理超时（可通过 AI_HEAVY_TASK_TIMEOUT 环境变量统一配置，默认 5 分钟）
            const READ_TIMEOUT = AI_HEAVY_TASK_TIMEOUT_MS
            const MAX_TOTAL_TIME = AI_HEAVY_TASK_TIMEOUT_MS
            const startTime = Date.now()
            let isReadTimeoutAfterReceivingData = false

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
                        timeoutId = setTimeout(() => reject(new Error(`Stream read timeout: No data received for ${Math.round(READ_TIMEOUT / 1000)} seconds`)), READ_TIMEOUT)
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
                        const message = readErr instanceof Error ? readErr.message : String(readErr)
                        if (message.includes('Stream read timeout') && receivedBytes > 0) {
                            isReadTimeoutAfterReceivingData = true
                            logger.warn(`[TTSService] Stream timeout after receiving data for task ${taskId}. Continue with current audio buffer (${receivedBytes} bytes).`)
                            break
                        }
                        throw readErr
                    }
                }

                if (isReadTimeoutAfterReceivingData) {
                    logger.info(`[TTSService] Continue post-processing after timeout with partial/complete stream data for task ${taskId}. Bytes: ${receivedBytes}`)
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

            // Upload to storage
            const format = options.outputFormat || 'mp3'
            const filename = buildUploadStoredFilename({
                extension: format,
            })
            const mimetype = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`

            const uploadPath = post
                ? buildPostUploadPrefix({
                    postId: post.id,
                    type: UploadType.AUDIO,
                    usage: 'tts',
                })
                : 'audio/tts/'

            const uploadedFile = await uploadFromBuffer(
                buffer,
                uploadPath,
                filename,
                mimetype,
                task.userId,
            )

            if (task.type === 'podcast') {
                task.result = JSON.stringify({
                    phase: 'asset_uploaded',
                    uploadedAsset: {
                        url: uploadedFile.url,
                        filename: uploadedFile.filename,
                        mimeType: mimetype,
                        size: buffer.length,
                    },
                    resumeAttempts: checkpoint?.resumeAttempts || 0,
                    lastResumeAt: checkpoint?.lastResumeAt || null,
                } satisfies PodcastTaskCheckpoint)
                task.progress = 98
                await taskRepo.save(task)
            }

            await this.finalizeUploadedTask({
                task,
                post,
                payload,
                voice,
                contentToUse,
                uploadedFile,
                mimeType: mimetype,
                bufferSize: buffer.length,
                effectiveLanguage,
                effectiveTranslationId,
                mode: options.mode,
            })
        } catch (error: any) {
            logger.error(`[TTSService] Task ${taskId} failed:`, error)
            task.status = 'failed'
            task.error = error.message
            task.failureStage = inferFailureStage(error, task.progress >= 96 ? 'post_process' : 'provider_processing')
            task.chargeStatus = deriveChargeStatus({
                status: 'failed',
                failureStage: task.failureStage,
                quotaUnits: task.failureStage === 'post_process' ? (task.estimatedQuotaUnits || task.quotaUnits) : 0,
                settlementSource: 'estimated',
            })
            task.quotaUnits = task.chargeStatus === 'waived' ? 0 : (task.quotaUnits || task.estimatedQuotaUnits)
            task.actualCost = task.chargeStatus === 'waived' ? 0 : (task.actualCost || task.estimatedCost)
            task.completedAt = new Date()
            task.durationMs = task.startedAt ? task.completedAt.getTime() - task.startedAt.getTime() : task.durationMs
            await taskRepo.save(task)

            await sendInAppNotification({
                userId: task.userId,
                type: NotificationType.SYSTEM,
                title: '语音合成失败',
                content: `您的语音合成任务失败: ${error.message || '未知错误'}`,
                link: buildAITaskDetailPath(taskId),
            }).catch((notificationError) => {
                logger.error('[TTSService] Failed to send failure notification:', notificationError)
            })
        }
    }

    static async compensateStaleTask(taskId: string) {
        const taskRepo = dataSource.getRepository(AITask)
        const task = await taskRepo.findOneBy({ id: taskId })

        if (task?.type !== 'podcast' && task?.type !== 'tts') {
            return 'skipped' as const
        }

        const taskType = task.type

        const finalStatus = task.status

        if (finalStatus === 'completed') {
            return 'completed' as const
        }

        if (finalStatus === 'failed') {
            return 'failed' as const
        }

        const checkpoint = taskType === 'podcast' ? parsePodcastTaskCheckpoint(task.result) : null
        if (taskType === 'podcast' && checkpoint?.phase === 'asset_uploaded' && checkpoint.uploadedAsset?.url) {
            await this.processTask(task.id, task)

            const latestTask = await taskRepo.findOneBy({ id: task.id }) || task

            if (latestTask.status === 'completed') {
                return 'completed' as const
            }

            if (latestTask.status === 'failed') {
                return 'failed' as const
            }

            return 'resumed' as const
        }

        const resultRecord = parseTaskResultRecord(task.result)
        const previousAttempts = typeof resultRecord?.resumeAttempts === 'number' ? resultRecord.resumeAttempts : 0
        const nextAttempts = previousAttempts + 1

        if (nextAttempts > MAX_AUDIO_COMPENSATION_ATTEMPTS) {
            task.status = 'failed'
            task.error = `${taskType === 'podcast' ? 'Podcast' : 'TTS'} generation task timed out and exceeded compensation attempts`
            task.failureStage = 'provider_processing'
            task.chargeStatus = deriveChargeStatus({
                status: 'failed',
                failureStage: 'provider_processing',
                quotaUnits: 0,
                settlementSource: 'estimated',
            })
            task.completedAt = new Date()
            task.durationMs = task.startedAt ? task.completedAt.getTime() - task.startedAt.getTime() : task.durationMs
            await taskRepo.save(task)
            return 'failed' as const
        }

        task.status = 'processing'
        task.error = null
        task.startedAt = task.startedAt || new Date()
        task.result = JSON.stringify({
            ...(resultRecord || {}),
            ...(taskType === 'podcast'
                ? {
                    phase: checkpoint?.phase || 'queued',
                    uploadedAsset: checkpoint?.uploadedAsset,
                }
                : {}),
            resumeAttempts: nextAttempts,
            lastResumeAt: new Date().toISOString(),
        })
        task.progress = Math.max(task.progress || 0, 10)
        await taskRepo.save(task)

        await this.processTask(task.id, task)

        const latestTask = await taskRepo.findOneBy({ id: task.id }) || task

        if (latestTask.status === 'completed') {
            return 'completed' as const
        }

        if (latestTask.status === 'failed') {
            return 'failed' as const
        }

        return 'resumed' as const
    }
}
