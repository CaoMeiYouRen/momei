import type { MomeiHttpClient } from './client'
import type {
    MomeiCategory,
    MomeiCategoryBody,
    MomeiCategoryListQuery,
    MomeiCategoryListResponse,
} from './types'

export class CategoriesApi {
    constructor(private client: MomeiHttpClient) {}

    async list(query?: MomeiCategoryListQuery): Promise<MomeiCategoryListResponse> {
        const qs = this.client.buildQueryString(query as Record<string, unknown> | undefined)
        return this.client.get<MomeiCategoryListResponse>(`/api/external/categories${qs}`).then((r) => r.data)
    }

    async create(data: MomeiCategoryBody): Promise<MomeiCategory> {
        return this.client.post<MomeiCategory>('/api/external/categories', data).then((r) => r.data)
    }

    async update(id: string, data: Partial<MomeiCategoryBody>): Promise<MomeiCategory> {
        return this.client.put<MomeiCategory>(`/api/external/categories/${id}`, data).then((r) => r.data)
    }

    async delete(id: string): Promise<{ message: string }> {
        return this.client.delete<{ message: string }>(`/api/external/categories/${id}`).then((r) => r.data)
    }
}
