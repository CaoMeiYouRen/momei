import type { MomeiHttpClient } from './client'
import type {
    MomeiTag,
    MomeiTagBody,
    MomeiTagListQuery,
    MomeiTagListResponse,
} from './types'

export class TagsApi {
    constructor(private client: MomeiHttpClient) {}

    async list(query?: MomeiTagListQuery): Promise<MomeiTagListResponse> {
        const qs = this.client.buildQueryString(query as Record<string, unknown> | undefined)
        return this.client.get<MomeiTagListResponse>(`/api/external/tags${qs}`).then((r) => r.data)
    }

    async create(data: MomeiTagBody): Promise<MomeiTag> {
        return this.client.post<MomeiTag>('/api/external/tags', data).then((r) => r.data)
    }

    async update(id: string, data: Partial<MomeiTagBody>): Promise<MomeiTag> {
        return this.client.put<MomeiTag>(`/api/external/tags/${id}`, data).then((r) => r.data)
    }

    async delete(id: string): Promise<{ message: string }> {
        return this.client.delete<{ message: string }>(`/api/external/tags/${id}`).then((r) => r.data)
    }
}
