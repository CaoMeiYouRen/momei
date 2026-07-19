/**
 * CLI API Client
 *
 * Thin wrapper around @momei-blog/api-client that adds CLI-specific functionality
 * (batch import with progress, connection test).
 * All standard API methods are delegated to the shared client.
 */
import { createMomeiApi, MomeiHttpClient, MomeiApiError, type MomeiApiClientConfig } from '@momei-blog/api-client'
import type {
    CliDirectUploadAuthorization,
    CliDirectUploadRequest,
    CliImportPostRequest,
    ImportResult,
} from './types'
import { RateLimiter, type RateLimiterOptions } from './rate-limiter'

export type { MomeiApiClientConfig }

export class MomeiApiClient {
    public api: ReturnType<typeof createMomeiApi>
    private client: MomeiHttpClient
    private rateLimiter?: RateLimiter

    constructor(apiUrl: string, apiKey: string, rateLimiterOptions?: RateLimiterOptions) {
        const config: MomeiApiClientConfig = { apiUrl, apiKey }
        this.api = createMomeiApi(config)
        this.client = this.api.client
        if (rateLimiterOptions) {
            this.rateLimiter = new RateLimiter(rateLimiterOptions)
        }
    }

    // ===== Delegated post methods =====

    async createPost(post: CliImportPostRequest): Promise<{ code: number, data: { id: string | number } }> {
        const execute = () => this.api.posts.create(post)
        const data = this.rateLimiter
            ? await this.rateLimiter.execute(execute)
            : await execute()
        return { code: 200, data }
    }

    async listPosts(query?: Record<string, unknown>): Promise<{ code: number, data: { items: unknown[], total: number, page: number, limit: number } }> {
        const data = await this.api.posts.list(query as Parameters<typeof this.api.posts.list>[0])
        return { code: 200, data }
    }

    async updatePost(postId: string, data: Record<string, unknown>): Promise<{ code: number, data: unknown }> {
        const result = await this.api.posts.update(postId, data)
        return { code: 200, data: result }
    }

    async deletePost(postId: string): Promise<{ code: number, message: string }> {
        const result = await this.api.posts.delete(postId)
        return { code: 200, ...result }
    }

    async getPost(postId: string): Promise<{ code: number, data: Record<string, unknown> }> {
        const result = await this.api.posts.get(postId)
        return { code: 200, data: result as unknown as Record<string, unknown> }
    }

    async publishPost(postId: string): Promise<{ code: number, data: Record<string, unknown> }> {
        const result = await this.api.posts.publish(postId)
        return { code: 200, data: result }
    }

    async validateImportPost(post: CliImportPostRequest): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiImportPathAliasReport }> {
        const execute = () => this.api.posts.validate(post)
        const data = this.rateLimiter
            ? await this.rateLimiter.execute(execute)
            : await execute()
        return { code: 200, data }
    }

    async authorizeDirectUpload(payload: CliDirectUploadRequest): Promise<{ code: number, data: CliDirectUploadAuthorization }> {
        const data = await this.client.post<CliDirectUploadAuthorization>('/api/external/upload/direct-auth', payload).then((response) => response.data)
        return { code: 200, data }
    }

    // ===== Delegated AI methods =====

    async suggestTitles(payload: { content: string, language?: string }): Promise<{ code: number, data: string[] }> {
        const data = await this.api.ai.suggestTitles(payload)
        return { code: 200, data }
    }

    async recommendTags(payload: { content: string, existingTags?: string[], language?: string }): Promise<{ code: number, data: string[] }> {
        const data = await this.api.ai.recommendTags(payload)
        return { code: 200, data }
    }

    async recommendCategories(payload: { postId: string, targetLanguage: string, sourceLanguage?: string, limit?: number }): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiCategoryRecommendationResult }> {
        const data = await this.api.ai.recommendCategories(payload)
        return { code: 200, data }
    }

    async translatePost(payload: import('@momei-blog/api-client').MomeiTranslatePostRequest): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiAutomationTaskStartResponse }> {
        const data = await this.api.ai.translatePost(payload)
        return { code: 200, data }
    }

    async generateCoverImage(payload: import('@momei-blog/api-client').MomeiCoverImagePayload): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiAutomationTaskStartResponse }> {
        const data = await this.api.ai.generateCoverImage(payload)
        return { code: 200, data }
    }

    async createTTSTask(payload: import('@momei-blog/api-client').MomeiCreateTTSPayload): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiAutomationTaskStartResponse }> {
        const data = await this.api.ai.createTTSTask(payload)
        return { code: 200, data }
    }

    async getAITask(taskId: string): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiAutomationTaskStatusResponse }> {
        const data = await this.api.ai.getTask(taskId)
        return { code: 200, data }
    }

    // ===== Delegated Category methods =====

    async listCategories(query?: Record<string, unknown>): Promise<{ code: number, data: { items: unknown[], total: number, page: number, limit: number } }> {
        const data = await this.api.categories.list(query as Parameters<typeof this.api.categories.list>[0])
        return { code: 200, data }
    }

    async createCategory(data: Record<string, unknown>): Promise<{ code: number, data: unknown }> {
        const result = await this.api.categories.create(data as unknown as Parameters<typeof this.api.categories.create>[0])
        return { code: 200, data: result }
    }

    async updateCategory(id: string, data: Record<string, unknown>): Promise<{ code: number, data: unknown }> {
        const result = await this.api.categories.update(id, data)
        return { code: 200, data: result }
    }

    async deleteCategory(id: string): Promise<{ code: number, message: string }> {
        const result = await this.api.categories.delete(id)
        return { code: 200, ...result }
    }

    // ===== Delegated Tag methods =====

    async listTags(query?: Record<string, unknown>): Promise<{ code: number, data: { items: unknown[], total: number, page: number, limit: number } }> {
        const data = await this.api.tags.list(query as Parameters<typeof this.api.tags.list>[0])
        return { code: 200, data }
    }

    async createTag(data: Record<string, unknown>): Promise<{ code: number, data: unknown }> {
        const result = await this.api.tags.create(data as unknown as Parameters<typeof this.api.tags.create>[0])
        return { code: 200, data: result }
    }

    async updateTag(id: string, data: Record<string, unknown>): Promise<{ code: number, data: unknown }> {
        const result = await this.api.tags.update(id, data)
        return { code: 200, data: result }
    }

    async deleteTag(id: string): Promise<{ code: number, message: string }> {
        const result = await this.api.tags.delete(id)
        return { code: 200, ...result }
    }

    // ===== Delegated Snippet methods =====

    async listSnippets(query?: Record<string, unknown>): Promise<{ code: number, data: { items: unknown[], total: number, page: number, limit: number } }> {
        const data = await this.api.snippets.list(query as Parameters<typeof this.api.snippets.list>[0])
        return { code: 200, data }
    }

    async createSnippet(data: Record<string, unknown>): Promise<{ code: number, message: string, data: unknown }> {
        const result = await this.api.snippets.create(data as unknown as Parameters<typeof this.api.snippets.create>[0])
        return { code: 200, message: 'ok', data: result }
    }

    async getSnippet(id: string): Promise<{ code: number, data: unknown }> {
        const result = await this.api.snippets.get(id)
        return { code: 200, data: result }
    }

    async updateSnippet(id: string, data: Record<string, unknown>): Promise<{ code: number, data: unknown }> {
        const result = await this.api.snippets.update(id, data)
        return { code: 200, data: result }
    }

    async deleteSnippet(id: string): Promise<{ code: number, message: string }> {
        const result = await this.api.snippets.delete(id)
        return { code: 200, ...result }
    }

    async convertSnippetToPost(id: string): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiSnippetConvertResult }> {
        const data = await this.api.snippets.convertToPost(id)
        return { code: 200, data }
    }

    // ===== Delegated Post Version methods =====

    async listPostVersions(postId: string): Promise<{ code: number, data: { items: unknown[], total: number } }> {
        const data = await this.api.versions.list(postId)
        return { code: 200, data }
    }

    async createPostVersion(postId: string): Promise<{ code: number, data: { created: boolean, version: unknown } }> {
        const data = await this.api.versions.create(postId)
        return { code: 200, data }
    }

    // ===== Delegated Migration methods =====

    async dryRunLinkGovernance(request: import('@momei-blog/api-client').MomeiLinkGovernanceRequest): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiLinkGovernanceReportData }> {
        const data = await this.api.migrations.dryRunLinkGovernance(request)
        return { code: 200, data }
    }

    async applyLinkGovernance(request: import('@momei-blog/api-client').MomeiLinkGovernanceRequest): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiLinkGovernanceReportData }> {
        const data = await this.api.migrations.applyLinkGovernance(request)
        return { code: 200, data }
    }

    async getLinkGovernanceReport(reportId: string): Promise<{ code: number, data: import('@momei-blog/api-client').MomeiLinkGovernanceReportData }> {
        const data = await this.api.migrations.getLinkGovernanceReport(reportId)
        return { code: 200, data }
    }

    // ===== CLI-specific methods =====

    async testConnection(): Promise<boolean> {
        try {
            await this.client.get('/api/health')
            return true
        } catch {
            return false
        }
    }

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
                    } catch (error: unknown) {
                        const errorMessage = error instanceof MomeiApiError
                            ? error.body
                            : (error as Error)?.message || 'Unknown error'
                        const result: ImportResult = {
                            success: false,
                            file,
                            error: errorMessage,
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
}
