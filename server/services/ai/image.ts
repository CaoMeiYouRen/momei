import { uploadFromUrl } from '../upload'
import { AIBaseService } from './base'
import { getAIImageProvider } from '@/server/utils/ai'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { deriveChargeStatus, inferFailureStage } from '@/server/utils/ai/cost-governance'
import { withAITimeout } from '@/server/utils/ai/timeout'
import logger from '@/server/utils/logger'
import type { AIFailureStage, AIImageOptions, AIImageResponse } from '@/types/ai'

export class ImageService extends AIBaseService {
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

        this.processImageGeneration(task.id, options, userId).catch((err) => {
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
    ) {
        let failureStage: AIFailureStage = 'provider_processing'
        try {
            const post = options.postId
                ? await dataSource.getRepository(Post).findOneBy({ id: options.postId })
                : null
            const provider = await getAIImageProvider()

            if (!provider.generateImage) {
                throw new Error(`Provider ${provider.name} does not support image generation`)
            }

            const response = await withAITimeout(
                provider.generateImage(options),
                'Image generation',
            )

            failureStage = 'post_process'

            const persistedImages = await withAITimeout(
                Promise.all(
                    response.images.map(async (img, index) => {
                        const filename = response.images.length > 1 ? `${taskId}_${index}` : taskId
                        const uploadedImage = await uploadFromUrl(
                            img.url,
                            post ? `posts/${post.id}/image/ai/` : 'image/ai/',
                            userId,
                            filename,
                        )
                        return {
                            ...img,
                            url: uploadedImage.url,
                        }
                    }),
                ),
                'Image persistence',
            )

            const finalResponse: AIImageResponse = {
                images: persistedImages,
                usage: response.usage,
                model: response.model,
                raw: response.raw,
            }

            this.logUsage({ task: 'image-generation', response: finalResponse, userId })
            await this.recordTask({
                id: taskId,
                userId,
                category: 'image',
                type: 'image_generation',
                provider: provider.name,
                model: finalResponse.model,
                payload: options,
                response: finalResponse,
                chargeStatus: deriveChargeStatus({ status: 'completed', quotaUnits: finalResponse.images.length, settlementSource: 'actual' }),
                settlementSource: 'actual',
            })
        } catch (error: any) {
            logger.error(`AI Image Generation Error (Task ${taskId}):`, error)
            await this.recordTask({
                id: taskId,
                userId,
                category: 'image',
                type: 'image_generation',
                payload: options,
                error,
                failureStage: inferFailureStage(error, failureStage),
                settlementSource: failureStage === 'post_process' ? 'actual' : 'estimated',
            })
        }
    }
}
