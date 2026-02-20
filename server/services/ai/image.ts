import { getAIImageProvider } from '../../utils/ai'
import logger from '../../utils/logger'
import { uploadFromUrl } from '../upload'
import { AIBaseService } from './base'
import type { AIImageOptions, AIImageResponse } from '@/types/ai'

export class ImageService extends AIBaseService {
    /**
     * 生成图像（异步任务）
     */
    static async generateImage(
        options: AIImageOptions,
        userId: string,
    ) {
        const task = await this.recordTask({
            userId,
            category: 'image',
            type: 'image_generation',
            status: 'processing',
            payload: options,
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
        try {
            const provider = await getAIImageProvider()

            if (!provider.generateImage) {
                throw new Error(`Provider ${provider.name} does not support image generation`)
            }

            const response = await provider.generateImage(options)

            const persistedImages = await Promise.all(
                response.images.map(async (img, index) => {
                    const filename = response.images.length > 1 ? `${taskId}_${index}` : taskId
                    const uploadedImage = await uploadFromUrl(
                        img.url,
                        'ai-images',
                        userId,
                        filename,
                    )
                    return {
                        ...img,
                        url: uploadedImage.url,
                    }
                }),
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
            })
        }
    }
}
