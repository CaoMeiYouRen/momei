import axios, { type AxiosInstance } from 'axios'
import type {
    CliAutomationTaskStartResponse,
    CliAutomationTaskStatusResponse,
    CliCategory,
    CliCategoryBody,
    CliCategoryRecommendationResult,
    CliImportPathAliasReport,
    CliImportPostRequest,
    CliLinkGovernanceReportData,
    CliLinkGovernanceRequest,
    CliPostVersion,
    CliSnippet,
    CliSnippetBody,
    CliSnippetConvertResult,
    CliTag,
    CliTagBody,
    CliTranslatePostRequest,
    ImportResult,
    MomeiPost,
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
    async createPost(post: CliImportPostRequest): Promise<{ code: number, data: { id: string | number } }> {
        const response = await this.client.post('/api/external/posts', post)
        return response.data
    }

    /**
     * 获取文章列表
     */
    async listPosts(query?: {
        status?: 'draft' | 'pending' | 'published' | 'rejected' | 'hidden'
        language?: string
        search?: string
        page?: number
        limit?: number
        orderBy?: string
        order?: 'ASC' | 'DESC'
    }): Promise<{ code: number, data: { items: MomeiPost[], total: number, page: number, limit: number } }> {
        const response = await this.client.get('/api/external/posts', { params: query })
        return response.data
    }

    /**
     * 更新文章
     */
    async updatePost(postId: string, data: Partial<MomeiPost>): Promise<{ code: number, data: MomeiPost }> {
        const response = await this.client.patch(`/api/external/posts/${postId}`, data)
        return response.data
    }

    /**
     * 删除文章
     */
    async deletePost(postId: string): Promise<{ code: number, message: string }> {
        const response = await this.client.delete(`/api/external/posts/${postId}`)
        return response.data
    }

    async validateImportPost(post: CliImportPostRequest): Promise<{ code: number, data: CliImportPathAliasReport }> {
        const response = await this.client.post('/api/external/posts/validate', post)
        return response.data
    }

    /**
   * 批量导入文章
   */
    async importPosts(
        posts: { file: string, post: CliImportPostRequest }[],
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

    async recommendCategories(payload: { postId: string, targetLanguage: string, sourceLanguage?: string, limit?: number }) {
        const response = await this.client.post('/api/external/ai/recommend-categories', payload)
        return response.data as { code: number, data: CliCategoryRecommendationResult }
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

    // ===== Category API Methods =====

    async listCategories(query?: {
        language?: string
        search?: string
        parentId?: string
        aggregate?: boolean
        page?: number
        limit?: number
        orderBy?: string
        order?: 'ASC' | 'DESC'
    }): Promise<{ code: number, data: { items: CliCategory[], total: number, page: number, limit: number } }> {
        const response = await this.client.get('/api/external/categories', { params: query })
        return response.data
    }

    async createCategory(data: CliCategoryBody): Promise<{ code: number, data: CliCategory }> {
        const response = await this.client.post('/api/external/categories', data)
        return response.data
    }

    async updateCategory(id: string, data: Partial<CliCategoryBody>): Promise<{ code: number, data: CliCategory }> {
        const response = await this.client.put(`/api/external/categories/${id}`, data)
        return response.data
    }

    async deleteCategory(id: string): Promise<{ code: number, message: string }> {
        const response = await this.client.delete(`/api/external/categories/${id}`)
        return response.data
    }

    // ===== Tag API Methods =====

    async listTags(query?: {
        language?: string
        search?: string
        aggregate?: boolean
        page?: number
        limit?: number
        orderBy?: string
        order?: 'ASC' | 'DESC'
    }): Promise<{ code: number, data: { items: CliTag[], total: number, page: number, limit: number } }> {
        const response = await this.client.get('/api/external/tags', { params: query })
        return response.data
    }

    async createTag(data: CliTagBody): Promise<{ code: number, data: CliTag }> {
        const response = await this.client.post('/api/external/tags', data)
        return response.data
    }

    async updateTag(id: string, data: Partial<CliTagBody>): Promise<{ code: number, data: CliTag }> {
        const response = await this.client.put(`/api/external/tags/${id}`, data)
        return response.data
    }

    async deleteTag(id: string): Promise<{ code: number, message: string }> {
        const response = await this.client.delete(`/api/external/tags/${id}`)
        return response.data
    }

    // ===== Snippet API Methods =====

    async listSnippets(query?: {
        status?: 'inbox' | 'converted' | 'archived'
        source?: string
        search?: string
        page?: number
        limit?: number
    }): Promise<{ code: number, data: { items: CliSnippet[], total: number, page: number, limit: number } }> {
        const response = await this.client.get('/api/external/snippets', { params: query })
        return response.data
    }

    async createSnippet(data: CliSnippetBody): Promise<{ code: number, message: string, data: CliSnippet }> {
        const response = await this.client.post('/api/external/snippets', data)
        return response.data
    }

    async getSnippet(id: string): Promise<{ code: number, data: CliSnippet }> {
        const response = await this.client.get(`/api/external/snippets/${id}`)
        return response.data
    }

    async updateSnippet(id: string, data: Partial<CliSnippetBody>): Promise<{ code: number, data: CliSnippet }> {
        const response = await this.client.put(`/api/external/snippets/${id}`, data)
        return response.data
    }

    async deleteSnippet(id: string): Promise<{ code: number, message: string }> {
        const response = await this.client.delete(`/api/external/snippets/${id}`)
        return response.data
    }

    async convertSnippetToPost(id: string): Promise<{ code: number, data: CliSnippetConvertResult }> {
        const response = await this.client.post(`/api/external/snippets/${id}/convert`)
        return response.data
    }

    // ===== Post Version API Methods =====

    async listPostVersions(postId: string): Promise<{ code: number, data: { items: CliPostVersion[], total: number } }> {
        const response = await this.client.get(`/api/external/posts/${postId}/versions`)
        return response.data
    }

    async createPostVersion(postId: string): Promise<{ code: number, data: { created: boolean, version: CliPostVersion } }> {
        const response = await this.client.post(`/api/external/posts/${postId}/versions`)
        return response.data
    }
}
