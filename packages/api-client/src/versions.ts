import type { MomeiHttpClient } from './client'
import type {
    MomeiCreateVersionResponse,
    MomeiPostVersionListResponse,
} from './types'

export class VersionsApi {
    constructor(private client: MomeiHttpClient) {}

    async list(postId: string): Promise<MomeiPostVersionListResponse> {
        return this.client.get<MomeiPostVersionListResponse>(`/api/external/posts/${postId}/versions`).then((r) => r.data)
    }

    async create(postId: string): Promise<MomeiCreateVersionResponse> {
        return this.client.post<MomeiCreateVersionResponse>(`/api/external/posts/${postId}/versions`).then((r) => r.data)
    }
}
