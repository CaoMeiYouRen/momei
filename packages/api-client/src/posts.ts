import type { MomeiHttpClient } from './client'
import type {
    MomeiImportPathAliasReport,
    MomeiImportPostRequest,
    MomeiPost,
    MomeiPostListQuery,
    MomeiPostListResponse,
} from './types'

export class PostsApi {
    constructor(private client: MomeiHttpClient) {}

    async list(query?: MomeiPostListQuery): Promise<MomeiPostListResponse> {
        const qs = this.client.buildQueryString(query as Record<string, unknown> | undefined)
        return this.client.get<MomeiPostListResponse>(`/api/external/posts${qs}`).then((r) => r.data)
    }

    async get(id: string): Promise<MomeiPost> {
        return this.client.get<MomeiPost>(`/api/external/posts/${id}`).then((r) => r.data)
    }

    async create(data: MomeiImportPostRequest): Promise<{ id: string | number }> {
        return this.client.post<{ id: string | number }>('/api/external/posts', data).then((r) => r.data)
    }

    async update(id: string, data: Partial<MomeiPost>): Promise<MomeiPost> {
        return this.client.patch<MomeiPost>(`/api/external/posts/${id}`, data).then((r) => r.data)
    }

    async delete(id: string): Promise<{ message: string }> {
        return this.client.delete<{ message: string }>(`/api/external/posts/${id}`).then((r) => r.data)
    }

    async publish(id: string): Promise<Record<string, unknown>> {
        return this.client.post<Record<string, unknown>>(`/api/external/posts/${id}/publish`).then((r) => r.data)
    }

    async validate(data: MomeiImportPostRequest): Promise<MomeiImportPathAliasReport> {
        return this.client.post<MomeiImportPathAliasReport>('/api/external/posts/validate', data).then((r) => r.data)
    }
}
