import { createMomeiApi, type MomeiApiClientConfig } from '@momei-blog/api-client'
import type { MomeiApiConfig } from './config'

type JsonRecord = Record<string, unknown>

interface ApiEnvelope<TData> {
    code?: number
    data: TData
    message?: string
}

/**
 * MCP API Client
 *
 * Thin wrapper around @momei-blog/api-client that keeps the same method signatures
 * for backward compatibility with existing tool registration files.
 * Tool registration layer stays unchanged.
 */
export class MomeiApi {
    private api: ReturnType<typeof createMomeiApi>

    constructor(config: MomeiApiConfig) {
        const clientConfig: MomeiApiClientConfig = {
            apiUrl: config.apiUrl,
            apiKey: config.apiKey,
        }
        this.api = createMomeiApi(clientConfig)
    }

    // ===== Post Methods =====

    async listPosts(query: JsonRecord = {}): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.posts.list(query as Parameters<typeof this.api.posts.list>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async getPost(id: string): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.posts.get(id)
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async createPost(data: JsonRecord): Promise<ApiEnvelope<JsonRecord & { id: string }>> {
        const result = await this.api.posts.create(data as unknown as Parameters<typeof this.api.posts.create>[0])
        return { code: 200, data: result as JsonRecord & { id: string } }
    }

    async updatePost(id: string, data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.posts.update(id, data)
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async publishPost(id: string): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.posts.publish(id)
        return { code: 200, data: result }
    }

    async deletePost(id: string): Promise<ApiEnvelope<JsonRecord>> {
        await this.api.posts.delete(id)
        return { code: 200, data: { deleted: true } }
    }

    // ===== AI Methods =====

    async suggestTitles(payload: { content: string, language?: string }): Promise<ApiEnvelope<string[]>> {
        const data = await this.api.ai.suggestTitles(payload)
        return { code: 200, data }
    }

    async recommendTags(payload: { content: string, existingTags?: string[], language?: string }): Promise<ApiEnvelope<string[]>> {
        const data = await this.api.ai.recommendTags(payload)
        return { code: 200, data }
    }

    async recommendCategories(payload: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.ai.recommendCategories(payload as unknown as Parameters<typeof this.api.ai.recommendCategories>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async translatePost(payload: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.ai.translatePost(payload as unknown as Parameters<typeof this.api.ai.translatePost>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async generateCoverImage(payload: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.ai.generateCoverImage(payload as unknown as Parameters<typeof this.api.ai.generateCoverImage>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async createTTSTask(payload: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.ai.createTTSTask(payload as unknown as Parameters<typeof this.api.ai.createTTSTask>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async getAITask(taskId: string): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.ai.getTask(taskId)
        return { code: 200, data: data as unknown as JsonRecord }
    }

    // ===== Migration Methods =====

    async validateImportPost(data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.posts.validate(data as unknown as Parameters<typeof this.api.posts.validate>[0])
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async dryRunLinkGovernance(request: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.migrations.dryRunLinkGovernance(request as unknown as Parameters<typeof this.api.migrations.dryRunLinkGovernance>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async applyLinkGovernance(request: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.migrations.applyLinkGovernance(request as unknown as Parameters<typeof this.api.migrations.applyLinkGovernance>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async getLinkGovernanceReport(reportId: string): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.migrations.getLinkGovernanceReport(reportId)
        return { code: 200, data: data as unknown as JsonRecord }
    }

    // ===== Category Methods =====

    async listCategories(query: JsonRecord = {}): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.categories.list(query as Parameters<typeof this.api.categories.list>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async createCategory(data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.categories.create(data as unknown as Parameters<typeof this.api.categories.create>[0])
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async updateCategory(id: string, data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.categories.update(id, data)
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async deleteCategory(id: string): Promise<ApiEnvelope<JsonRecord>> {
        await this.api.categories.delete(id)
        return { code: 200, data: { deleted: true } }
    }

    // ===== Tag Methods =====

    async listTags(query: JsonRecord = {}): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.tags.list(query as Parameters<typeof this.api.tags.list>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async createTag(data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.tags.create(data as unknown as Parameters<typeof this.api.tags.create>[0])
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async updateTag(id: string, data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.tags.update(id, data)
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async deleteTag(id: string): Promise<ApiEnvelope<JsonRecord>> {
        await this.api.tags.delete(id)
        return { code: 200, data: { deleted: true } }
    }

    // ===== Snippet Methods =====

    async listSnippets(query: JsonRecord = {}): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.snippets.list(query as Parameters<typeof this.api.snippets.list>[0])
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async createSnippet(data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.snippets.create(data as unknown as Parameters<typeof this.api.snippets.create>[0])
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async getSnippet(id: string): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.snippets.get(id)
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async updateSnippet(id: string, data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        const result = await this.api.snippets.update(id, data)
        return { code: 200, data: result as unknown as JsonRecord }
    }

    async deleteSnippet(id: string): Promise<ApiEnvelope<JsonRecord>> {
        await this.api.snippets.delete(id)
        return { code: 200, data: { deleted: true } }
    }

    async convertSnippetToPost(id: string): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.snippets.convertToPost(id)
        return { code: 200, data: data as unknown as JsonRecord }
    }

    // ===== Post Version Methods =====

    async listPostVersions(postId: string): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.versions.list(postId)
        return { code: 200, data: data as unknown as JsonRecord }
    }

    async createPostVersion(postId: string): Promise<ApiEnvelope<JsonRecord>> {
        const data = await this.api.versions.create(postId)
        return { code: 200, data: data as unknown as JsonRecord }
    }
}
