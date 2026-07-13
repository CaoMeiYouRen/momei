import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MomeiHttpClient, MomeiApiError } from './client'

describe('MomeiHttpClient', () => {
    let client: MomeiHttpClient
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
        client = new MomeiHttpClient({ apiUrl: 'http://test.api', apiKey: 'test-key' })
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should make GET request', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ code: 200, data: { id: '1' } }),
        })

        const result = await client.get('/api/external/posts/1')

        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts/1',
            expect.objectContaining({
                headers: { 'Content-Type': 'application/json', 'X-API-Key': 'test-key' },
            }),
        )
        expect(result).toEqual({ code: 200, data: { id: '1' } })
    })

    it('should make POST request with body', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ code: 200, data: { id: 'new' } }),
        })

        const result = await client.post('/api/external/posts', { title: 'Test' })

        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ title: 'Test' }),
            }),
        )
        expect(result).toEqual({ code: 200, data: { id: 'new' } })
    })

    it('should make PUT request', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ code: 200, data: { id: '1', title: 'Updated' } }),
        })

        const result = await client.put('/api/external/posts/1', { title: 'Updated' })

        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts/1',
            expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'Updated' }) }),
        )
        expect((result.data as Record<string, string>).title).toBe('Updated')
    })

    it('should make PATCH request', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ code: 200, data: { status: 'published' } }),
        })

        const result = await client.patch('/api/external/posts/1', { status: 'published' })

        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts/1',
            expect.objectContaining({ method: 'PATCH' }),
        )
        expect((result.data as Record<string, string>).status).toBe('published')
    })

    it('should make DELETE request', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ code: 200, message: 'Deleted' }),
        })

        const result = await client.delete('/api/external/posts/1')

        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts/1',
            expect.objectContaining({ method: 'DELETE' }),
        )
        expect(result.message).toBe('Deleted')
    })

    it('should throw MomeiApiError on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            text: () => Promise.resolve('Invalid API key'),
        })

        const error = await client.get('/api/external/posts').catch((e) => e)
        expect(error).toBeInstanceOf(MomeiApiError)
        expect(error.message).toBe('API Error (401 Unauthorized): Invalid API key')
        expect(error.status).toBe(401)
    })

    it('should throw MomeiApiError on 500 response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve('Server error'),
        })

        try {
            await client.get('/api/external/posts')
        } catch (error) {
            expect(error).toBeInstanceOf(MomeiApiError)
            expect((error as MomeiApiError).status).toBe(500)
            expect((error as MomeiApiError).body).toBe('Server error')
        }
    })

    it('should use custom timeout', async () => {
        const fastClient = new MomeiHttpClient({ apiUrl: 'http://test.api', apiKey: 'key', timeout: 5000 })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ data: 'ok' }),
        })

        const result = await fastClient.get('/api/health')
        expect(result).toEqual({ data: 'ok' })
    })
})

describe('MomeiApiError', () => {
    it('should create error with status, text, and body', () => {
        const error = new MomeiApiError(403, 'Forbidden', 'Access denied')
        expect(error.status).toBe(403)
        expect(error.statusText).toBe('Forbidden')
        expect(error.body).toBe('Access denied')
        expect(error.message).toBe('API Error (403 Forbidden): Access denied')
        expect(error.name).toBe('MomeiApiError')
    })
})
