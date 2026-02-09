import type { MomeiApiConfig } from './config'

export class MomeiApi {
    constructor(private config: MomeiApiConfig) {}

    private async request(path: string, options: RequestInit = {}) {
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

        return response.json()
    }

    async listPosts(query: Record<string, any> = {}) {
        const searchParams = new URLSearchParams()
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
            }
        })
        const queryString = searchParams.toString()
        return this.request(`/api/external/posts${queryString ? `?${queryString}` : ''}`)
    }

    async getPost(id: string) {
        return this.request(`/api/external/posts/${id}`)
    }

    async createPost(data: any) {
        return this.request('/api/external/posts', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updatePost(id: string, data: any) {
        return this.request(`/api/external/posts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    }

    async publishPost(id: string) {
        return this.request(`/api/external/posts/${id}/publish`, {
            method: 'POST',
        })
    }

    async deletePost(id: string) {
        return this.request(`/api/external/posts/${id}`, {
            method: 'DELETE',
        })
    }
}
