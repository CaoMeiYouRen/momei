import type { MomeiHttpClient } from './client'
import type {
    MomeiSnippet,
    MomeiSnippetBody,
    MomeiSnippetConvertResult,
    MomeiSnippetListQuery,
    MomeiSnippetListResponse,
} from './types'

export class SnippetsApi {
    constructor(private client: MomeiHttpClient) {}

    async list(query?: MomeiSnippetListQuery): Promise<MomeiSnippetListResponse> {
        const qs = this.client.buildQueryString(query as Record<string, unknown> | undefined)
        return this.client.get<MomeiSnippetListResponse>(`/api/external/snippets${qs}`).then((r) => r.data)
    }

    async get(id: string): Promise<MomeiSnippet> {
        return this.client.get<MomeiSnippet>(`/api/external/snippets/${id}`).then((r) => r.data)
    }

    async create(data: MomeiSnippetBody): Promise<MomeiSnippet> {
        return this.client.post<MomeiSnippet>('/api/external/snippets', data).then((r) => r.data)
    }

    async update(id: string, data: Partial<MomeiSnippetBody>): Promise<MomeiSnippet> {
        return this.client.put<MomeiSnippet>(`/api/external/snippets/${id}`, data).then((r) => r.data)
    }

    async delete(id: string): Promise<{ message: string }> {
        return this.client.delete<{ message: string }>(`/api/external/snippets/${id}`).then((r) => r.data)
    }

    async convertToPost(id: string): Promise<MomeiSnippetConvertResult> {
        return this.client.post<MomeiSnippetConvertResult>(`/api/external/snippets/${id}/convert`).then((r) => r.data)
    }
}
