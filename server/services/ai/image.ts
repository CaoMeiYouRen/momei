import { uploadFromUrl } from '../upload'
import { AIBaseService } from './base'
import { getAIImageProvider } from '@/server/utils/ai'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { Post } from '@/server/entities/post'
import { applyPostMetadataPatch } from '@/server/utils/post-metadata'
import { deriveChargeStatus, inferFailureStage } from '@/server/utils/ai/cost-governance'
import { withAITimeout } from '@/server/utils/ai/timeout'
import logger from '@/server/utils/logger'
import { sendInAppNotification } from '@/server/services/notification'
import { NotificationType, buildAITaskDetailPath } from '@/utils/shared/notification'
import type { AIFailureStage, AIImageOptions, AIImageResponse } from '@/types/ai'

const MAX_IMAGE_COMPENSATION_ATTEMPTS = 2

type ImageTaskCheckpointPhase = 'queued' | 'provider_completed' | 'assets_uploaded'

interface ImageTaskCheckpoint {
    phase: ImageTaskCheckpointPhase
    providerResponse?: AIImageResponse
    persistedImages?: AIImageResponse['images']
    resumeAttempts?: number
    lastResumeAt?: string | null
}

function parseImageTaskCheckpoint(taskResult: string | null | undefined) {
    if (!taskResult) {
        return null
    }

    try {
        const parsed = JSON.parse(taskResult) as Partial<ImageTaskCheckpoint>
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || typeof parsed.phase !== 'string') {
            return null
        }

        if (!['queued', 'provider_completed', 'assets_uploaded'].includes(parsed.phase)) {
            return null
        }

        return parsed as ImageTaskCheckpoint
    } catch {
        return null
    }
}

function shouldApplyGeneratedCover(post: Post, options: AIImageOptions) {
    if (options.assetUsage && options.assetUsage !== 'post-cover') {
        return false
    }

    if (options.applyMode === 'manual-confirm') {
        return false
    }

    if (options.applyToPost === false) {
        return false
    }

    if (options.overwriteExistingCover === false && post.coverImage) {
        return false
    }

    if (options.targetLanguage && options.targetLanguage !== post.language) {
        return false
    }

    if (options.translationId && post.translationId && options.translationId !== post.translationId) {
        return false
    }

    return true
}

export class ImageService extends AIBaseService {
    private static async persistTaskCheckpoint(
        task: AITask,
        checkpoint: ImageTaskCheckpoint,
        patch: Partial<AITask> = {},
    ) {
        const taskRepo = dataSource.getRepository(AITask)
        Object.assign(task, {
            status: 'processing',
            error: null,
            startedAt: task.startedAt || new Date(),
            result: JSON.stringify(checkpoint),
            ...patch,
        })
        return await taskRepo.save(task)
    }

    private static async finalizeTaskFromResponse(
        task: AITask,
        options: AIImageOptions,
        providerResponse: AIImageResponse,
        checkpoint: ImageTaskCheckpoint | null,
    ) {
        const post = options.postId
            ? await dataSource.getRepository(Post).findOneBy({ id: options.postId })
            : null

        let persistedImages = checkpoint?.persistedImages
        if (!persistedImages?.length) {
            persistedImages = await withAITimeout(
                Promise.all(
                    providerResponse.images.map(async (img) => {
                        const uploadedImage = await uploadFromUrl(
                            img.url,
                            post ? `posts/${post.id}/image/ai/` : 'image/ai/',
                            task.userId,
                        )
                        return {
                            ...img,
                            url: uploadedImage.url,
                        }
                    }),
                ),
                'Image persistence',
            )

            await this.persistTaskCheckpoint(task, {
                phase: 'assets_uploaded',
                providerResponse,
                persistedImages,
                resumeAttempts: checkpoint?.resumeAttempts || 0,
                lastResumeAt: checkpoint?.lastResumeAt || null,
            }, {
                progress: Math.max(task.progress || 0, 85),
            })
        }

        const finalResponse: AIImageResponse = {
            images: persistedImages,
            usage: providerResponse.usage,
            model: providerResponse.model,
            raw: providerResponse.raw,
        }

        if (post && persistedImages[0]?.url && shouldApplyGeneratedCover(post, options)) {
            const nextCoverAsset = {
                usage: 'post-cover' as const,
                url: persistedImages[0].url,
                source: 'ai' as const,
                prompt: options.prompt,
                promptModel: options.promptDimensions,
                applyMode: options.applyMode || 'auto-apply',
                language: options.targetLanguage || post.language,
                translationId: options.translationId ?? post.translationId ?? null,
                postId: post.id,
                generatedAt: new Date(),
            }
            const visualAssets = Array.isArray(post.metadata?.visualAssets)
                ? post.metadata.visualAssets.filter((asset) => asset?.usage !== 'post-cover')
                : []

            post.coverImage = persistedImages[0].url
            applyPostMetadataPatch(post, {
                metadata: {
                    ...post.metadata,
                    cover: {
                        ...post.metadata?.cover,
                        url: persistedImages[0].url,
                        source: 'ai',
                        prompt: options.prompt,
                        promptModel: options.promptDimensions,
                        assetUsage: options.assetUsage || 'post-cover',
                        applyMode: options.applyMode || 'auto-apply',
                        language: options.targetLanguage || post.language,
                        translationId: options.translationId ?? post.translationId ?? null,
                        postId: post.id,
                        generatedAt: new Date(),
                    },
                    visualAssets: [...visualAssets, nextCoverAsset],
                },
            })
            await dataSource.getRepository(Post).save(post)
        }

        this.logUsage({ task: 'image-generation', response: finalResponse, userId: task.userId })
        await this.recordTask({
            id: task.id,
            userId: task.userId,
            category: 'image',
            type: 'image_generation',
            provider: task.provider,
            model: finalResponse.model || task.model,
            payload: options,
            response: finalResponse,
            chargeStatus: deriveChargeStatus({ status: 'completed', quotaUnits: finalResponse.images.length, settlementSource: 'actual' }),
            settlementSource: 'actual',
        })

        await sendInAppNotification({
            userId: task.userId,
            type: NotificationType.SYSTEM,
            title: 'AI 图片生成完成',
            content: `您的图片生成任务已完成，共生成 ${finalResponse.images.length} 张图片。`,
            link: buildAITaskDetailPath(task.id),
        }).catch((error) => logger.error('[ImageService] Failed to send completion notification:', error))
    }

    private static async continueTask(task: AITask, options: AIImageOptions) {
        let failureStage: AIFailureStage = 'provider_processing'
        try {
            let checkpoint = parseImageTaskCheckpoint(task.result)
            let providerResponse = checkpoint?.providerResponse

            if (!providerResponse) {
                const provider = await getAIImageProvider()

                if (!provider.generateImage) {
                    throw new Error(`Provider ${provider.name} does not support image generation`)
                }

                providerResponse = await withAITimeout(
                    provider.generateImage(options),
                    'Image generation',
                )
                task.provider = provider.name
                task.model = providerResponse.model || task.model
                checkpoint = {
                    phase: 'provider_completed',
                    providerResponse,
                    resumeAttempts: checkpoint?.resumeAttempts || 0,
                    lastResumeAt: checkpoint?.lastResumeAt || null,
                }

                await this.persistTaskCheckpoint(task, checkpoint, {
                    provider: task.provider,
                    model: task.model,
                    progress: Math.max(task.progress || 0, 60),
                })
            }

            failureStage = 'post_process'
            await this.finalizeTaskFromResponse(task, options, providerResponse, checkpoint)
            return 'completed' as const
        } catch (error: any) {
            logger.error(`AI Image Generation Error (Task ${task.id}):`, error)
            await this.recordTask({
                id: task.id,
                userId: task.userId,
                category: 'image',
                type: 'image_generation',
                payload: options,
                error,
                failureStage: inferFailureStage(error, failureStage),
                settlementSource: failureStage === 'post_process' ? 'actual' : 'estimated',
            })

            await sendInAppNotification({
                userId: task.userId,
                type: NotificationType.SYSTEM,
                title: 'AI 图片生成失败',
                content: `您的图片生成任务失败: ${error.message || '未知错误'}`,
                link: buildAITaskDetailPath(task.id),
            }).catch((notificationError) => logger.error('[ImageService] Failed to send failure notification:', notificationError))

            return 'failed' as const
        }
    }

    /**
     * 生成图像（异步任务）
     */
    static async generateImage(
        options: AIImageOptions,
        userId: string,
    ) {
        await this.assertQuotaAllowance({
            userId,
            category: 'image',
            type: 'image_generation',
            payload: options,
        })

        const task = await this.recordTask({
            userId,
            category: 'image',
            type: 'image_generation',
            status: 'processing',
            payload: options,
            postId: options.postId,
            settlementSource: 'estimated',
        })

        if (!task) {
            throw new Error('Failed to create AI task')
        }

        this.processImageGeneration(task.id, options, userId, task).catch((err) => {
            logger.error(`Failed to process image generation task ${task.id}:`, err)
        })

        return task
    }

    /**
     * 后台处理图像生成
     */
    private static async processImageGeneration(
        taskId: string,
        options: AIImageOptions,
        userId: string,
        existingTask?: AITask,
    ) {
        const task = existingTask || await dataSource.getRepository(AITask).findOneBy({ id: taskId, userId })
        if (!task) {
            return
        }

        await this.continueTask(task, options)
    }

    static async compensateStaleTask(taskId: string) {
        const taskRepo = dataSource.getRepository(AITask)
        const task = await taskRepo.findOneBy({ id: taskId })

        if (task?.type !== 'image_generation') {
            return 'skipped' as const
        }

        if (task.status === 'completed') {
            return 'completed' as const
        }

        if (task.status === 'failed') {
            return 'failed' as const
        }

        const options = JSON.parse(task.payload || '{}') as AIImageOptions
        const checkpoint = parseImageTaskCheckpoint(task.result)
        const nextAttempts = (checkpoint?.resumeAttempts || 0) + 1

        if (!checkpoint?.providerResponse && nextAttempts > MAX_IMAGE_COMPENSATION_ATTEMPTS) {
            await this.recordTask({
                id: task.id,
                userId: task.userId,
                category: 'image',
                type: 'image_generation',
                payload: options,
                error: new Error('Image generation task timed out and exceeded compensation attempts'),
                failureStage: 'provider_processing',
                settlementSource: 'estimated',
            })
            return 'failed' as const
        }

        await this.persistTaskCheckpoint(task, {
            phase: checkpoint?.phase || 'queued',
            providerResponse: checkpoint?.providerResponse,
            persistedImages: checkpoint?.persistedImages,
            resumeAttempts: nextAttempts,
            lastResumeAt: new Date().toISOString(),
        }, {
            progress: Math.max(task.progress || 0, 15),
        })

        return await this.continueTask(task, options)
    }
}
