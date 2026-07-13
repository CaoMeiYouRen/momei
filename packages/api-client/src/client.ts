/**
 * Unified HTTP client for Momei API
 * Uses fetch with centralized error handling (MCP pattern)
 */

export interface MomeiApiClientConfig {
    apiUrl: string
    apiKey: string
    timeout?: number
}

export interface ApiEnvelope<TData> {
    code?: number
    data: TData
    message?: string
}

export class MomeiApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        public body: string,
    ) {
        super(`API Error (${status} ${statusText}): ${body}`)
        this.name = 'MomeiApiError'
    }
}

export class MomeiHttpClient {
    private config: MomeiApiClientConfig

    constructor(config: MomeiApiClientConfig) {
        this.config = {
            timeout: 30000,
            ...config,
        }
    }

    private async request<TData>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<TData>> {
        const url = `${this.config.apiUrl}${path}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!)

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.apiKey,
                    ...options.headers,
                },
                signal: controller.signal,
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new MomeiApiError(response.status, response.statusText, errorText)
            }

            return response.json() as Promise<ApiEnvelope<TData>>
        } finally {
            clearTimeout(timeoutId)
        }
    }

    async get<TData>(path: string): Promise<ApiEnvelope<TData>> {
        return this.request<TData>(path)
    }

    async post<TData>(path: string, data?: unknown): Promise<ApiEnvelope<TData>> {
        return this.request<TData>(path, {
            method: 'POST',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        })
    }

    async patch<TData>(path: string, data?: unknown): Promise<ApiEnvelope<TData>> {
        return this.request<TData>(path, {
            method: 'PATCH',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        })
    }

    async put<TData>(path: string, data?: unknown): Promise<ApiEnvelope<TData>> {
        return this.request<TData>(path, {
            method: 'PUT',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        })
    }

    async delete<TData>(path: string): Promise<ApiEnvelope<TData>> {
        return this.request<TData>(path, { method: 'DELETE' })
    }

    /**
     * Helper: build URL with query params
     */
    buildQueryString(params?: Record<string, unknown>): string {
        if (!params) {
            return ''
        }

        const searchParams = new URLSearchParams()
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value))
            }
        }

        const qs = searchParams.toString()
        return qs ? `?${qs}` : ''
    }
}
