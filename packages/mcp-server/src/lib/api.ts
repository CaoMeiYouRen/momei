import type { MomeiApiConfig } from './config'

type JsonRecord = Record<string, unknown>

interface ApiEnvelope<TData> {
    code?: number
    data: TData
    message?: string
}

interface RemotePostRecord extends JsonRecord {
    content: string
    language?: string
    tags?: unknown
}

export class MomeiApi {
    constructor(private config: MomeiApiConfig) {}

    private async request<TData>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<TData>> {
        const url = `${this.config.apiUrl}${path}`
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.config.apiKey,
                ...options.headers,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API Error (${response.status} ${response.statusText}): ${errorText}`)
        }

        return response.json() as Promise<ApiEnvelope<TData>>
    }

    async listPosts(query: JsonRecord = {}): Promise<ApiEnvelope<JsonRecord>> {
        const searchParams = new URLSearchParams()
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
            }
        })
        const queryString = searchParams.toString()
        return this.request<JsonRecord>(`/api/external/posts${queryString ? `?${queryString}` : ''}`)
    }

    async getPost(id: string): Promise<ApiEnvelope<RemotePostRecord>> {
        return this.request<RemotePostRecord>(`/api/external/posts/${id}`)
    }

    async createPost(data: JsonRecord): Promise<ApiEnvelope<JsonRecord & { id: string }>> {
        return this.request<JsonRecord & { id: string }>('/api/external/posts', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updatePost(id: string, data: JsonRecord): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>(`/api/external/posts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    }

    async publishPost(id: string): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>(`/api/external/posts/${id}/publish`, {
            method: 'POST',
        })
    }

    async deletePost(id: string): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>(`/api/external/posts/${id}`, {
            method: 'DELETE',
        })
    }

    async suggestTitles(payload: { content: string, language?: string }): Promise<ApiEnvelope<string[]>> {
        return this.request<string[]>('/api/external/ai/suggest-titles', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    }

    async recommendTags(payload: { content: string, existingTags?: string[], language?: string }): Promise<ApiEnvelope<string[]>> {
        return this.request<string[]>('/api/external/ai/recommend-tags', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    }

    async recommendCategories(payload: { postId: string, targetLanguage: string, sourceLanguage?: string, limit?: number }): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>('/api/external/ai/recommend-categories', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    }

    async translatePost(payload: {
        sourcePostId: string
        targetLanguage: string
        sourceLanguage?: string
        targetPostId?: string | null
        scopes?: string[]
        targetStatus?: 'draft' | 'pending'
        slugStrategy?: 'source' | 'translate' | 'ai'
        categoryStrategy?: 'cluster' | 'suggest'
        confirmationMode?: 'auto' | 'require' | 'confirmed'
        previewTaskId?: string
        approvedSlug?: string | null
        approvedCategoryId?: string | null
    }): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>('/api/external/ai/translate-post', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    }

    async generateCoverImage(payload: {
        postId: string
        prompt: string
        model?: string
        size?: string
        aspectRatio?: string
        quality?: 'standard' | 'hd'
        style?: 'vivid' | 'natural'
        n?: number
    }): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>('/api/external/ai/image/generate', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
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
    }): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>('/api/external/ai/tts/task', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    }

    async getAITask(taskId: string): Promise<ApiEnvelope<JsonRecord>> {
        return this.request<JsonRecord>(`/api/external/ai/tasks/${taskId}`)
    }
}
