import axios, { type AxiosInstance } from 'axios'
import type { MomeiPost, ImportResult } from './types.js'

/**
 * Momei API 客户端
 */
export class MomeiApiClient {
    private client: AxiosInstance

    constructor(apiUrl: string, apiKey: string) {
        this.client = axios.create({
            baseURL: apiUrl,
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        })
    }

    /**
   * 创建文章
   */
    async createPost(post: MomeiPost): Promise<{ code: number, data: { id: number } }> {
        const response = await this.client.post('/api/external/posts', post)
        return response.data
    }

    /**
   * 批量导入文章
   */
    async importPosts(
        posts: Array<{ file: string, post: MomeiPost }>,
        options: {
            concurrency?: number
            onProgress?: (current: number, total: number, result: ImportResult) => void
        } = {},
    ): Promise<ImportResult[]> {
        const { concurrency = 3, onProgress } = options
        const results: ImportResult[] = []
        const total = posts.length

        // 分批处理
        for (let i = 0; i < posts.length; i += concurrency) {
            const batch = posts.slice(i, i + concurrency)
            const batchResults = await Promise.allSettled(
                batch.map(async ({ file, post }) => {
                    try {
                        const response = await this.createPost(post)
                        const result: ImportResult = {
                            success: true,
                            file,
                            postId: response.data.id,
                        }
                        if (onProgress) {
                            onProgress(i + batch.indexOf({ file, post }) + 1, total, result)
                        }
                        return result
                    } catch (error: any) {
                        const result: ImportResult = {
                            success: false,
                            file,
                            error: error.response?.data?.message || error.message || 'Unknown error',
                        }
                        if (onProgress) {
                            onProgress(i + batch.indexOf({ file, post }) + 1, total, result)
                        }
                        return result
                    }
                }),
            )

            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value)
                } else {
                    results.push({
                        success: false,
                        file: 'unknown',
                        error: result.reason?.message || 'Unknown error',
                    })
                }
            }
        }

        return results
    }

    /**
   * 测试 API 连接
   */
    async testConnection(): Promise<boolean> {
        try {
            // 尝试调用一个简单的 API 来测试连接
            await this.client.get('/api/health')
            return true
        } catch (error) {
            return false
        }
    }
}
