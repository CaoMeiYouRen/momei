import { getAIImageProvider } from '../../utils/ai'
import logger from '../../utils/logger'
import { dataSource } from '../../database'
import { AITask } from '../../entities/ai-task'
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
        const repo = dataSource.getRepository(AITask)
        const task = repo.create({
            userId,
            type: 'image_generation',
            status: 'processing',
            payload: JSON.stringify(options),
        })
        await repo.save(task)

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
        const repo = dataSource.getRepository(AITask)
        const task = await repo.findOneBy({ id: taskId })
        if (!task) { return }

        try {
            const provider = await getAIImageProvider()
            task.provider = provider.name
            task.model = (provider as any).config?.model || 'unknown'
            await repo.save(task)

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
            }

            task.status = 'completed'
            task.result = JSON.stringify(finalResponse)
            await repo.save(task)
        } catch (error: any) {
            logger.error(`AI Image Generation Error (Task ${taskId}):`, error)
            task.status = 'failed'
            task.error = error.message
            await repo.save(task)
        }
    }
}
