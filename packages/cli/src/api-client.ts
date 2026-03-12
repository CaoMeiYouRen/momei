import axios, { type AxiosInstance } from 'axios'
import type {
    CliAutomationTaskStartResponse,
    CliAutomationTaskStatusResponse,
    CliLinkGovernanceReportData,
    CliLinkGovernanceRequest,
    CliTranslatePostRequest,
    MomeiPost,
    ImportResult,
} from './types'

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
        posts: { file: string, post: MomeiPost }[],
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
                batch.map(async ({ file, post }, batchIndex) => {
                    try {
                        const response = await this.createPost(post)
                        const result: ImportResult = {
                            success: true,
                            file,
                            postId: response.data.id,
                        }
                        if (onProgress) {
                            onProgress(i + batchIndex + 1, total, result)
                        }
                        return result
                    } catch (error: any) {
                        const result: ImportResult = {
                            success: false,
                            file,
                            error: error.response?.data?.message || error.message || 'Unknown error',
                        }
                        if (onProgress) {
                            onProgress(i + batchIndex + 1, total, result)
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
        } catch {
            return false
        }
    }

    async dryRunLinkGovernance(request: CliLinkGovernanceRequest): Promise<{ code: number, data: CliLinkGovernanceReportData }> {
        const response = await this.client.post('/api/external/migrations/link-governance/dry-run', request)
        return response.data
    }

    async applyLinkGovernance(request: CliLinkGovernanceRequest): Promise<{ code: number, data: CliLinkGovernanceReportData }> {
        const response = await this.client.post('/api/external/migrations/link-governance/apply', request)
        return response.data
    }

    async getLinkGovernanceReport(reportId: string): Promise<{ code: number, data: CliLinkGovernanceReportData }> {
        const response = await this.client.get(`/api/external/migrations/link-governance/reports/${reportId}`)
        return response.data
    }

    async getPost(postId: string) {
        const response = await this.client.get(`/api/external/posts/${postId}`)
        return response.data as { code: number, data: Record<string, unknown> }
    }

    async publishPost(postId: string) {
        const response = await this.client.post(`/api/external/posts/${postId}/publish`)
        return response.data as { code: number, data: Record<string, unknown> }
    }

    async suggestTitles(payload: { content: string, language?: string }) {
        const response = await this.client.post('/api/external/ai/suggest-titles', payload)
        return response.data as { code: number, data: string[] }
    }

    async recommendTags(payload: { content: string, existingTags?: string[], language?: string }) {
        const response = await this.client.post('/api/external/ai/recommend-tags', payload)
        return response.data as { code: number, data: string[] }
    }

    async translatePost(payload: CliTranslatePostRequest) {
        const response = await this.client.post('/api/external/ai/translate-post', payload)
        return response.data as { code: number, data: CliAutomationTaskStartResponse }
    }

    async generateCoverImage(payload: {
        prompt: string
        postId: string
        model?: string
        size?: string
        aspectRatio?: string
        quality?: 'standard' | 'hd'
        style?: 'vivid' | 'natural'
        n?: number
    }) {
        const response = await this.client.post('/api/external/ai/image/generate', payload)
        return response.data as { code: number, data: CliAutomationTaskStartResponse }
    }

    async createTTSTask(payload: {
        postId?: string
        text?: string
        provider?: string
        mode?: 'speech' | 'podcast'
        voice: string
        model?: string
        script?: string
        options?: Record<string, unknown>
    }) {
        const response = await this.client.post('/api/external/ai/tts/task', payload)
        return response.data as { code: number, data: CliAutomationTaskStartResponse }
    }

    async getAITask(taskId: string) {
        const response = await this.client.get(`/api/external/ai/tasks/${taskId}`)
        return response.data as { code: number, data: CliAutomationTaskStatusResponse }
    }
}
