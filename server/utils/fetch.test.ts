import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithoutBrotli, isBrotliEncoding, UnsafeContentEncodingError } from './fetch'

describe('isBrotliEncoding', () => {
    it('识别单段 Brotli 编码', () => {
        expect(isBrotliEncoding('br')).toBe(true)
        expect(isBrotliEncoding('BR')).toBe(true)
        expect(isBrotliEncoding(' brotli ')).toBe(true)
    })

    it('识别多段编码中的 Brotli', () => {
        expect(isBrotliEncoding('gzip, br')).toBe(true)
        expect(isBrotliEncoding('br, gzip')).toBe(true)
    })

    it('不误伤其他编码', () => {
        expect(isBrotliEncoding(null)).toBe(false)
        expect(isBrotliEncoding(undefined)).toBe(false)
        expect(isBrotliEncoding('')).toBe(false)
        expect(isBrotliEncoding('gzip')).toBe(false)
        expect(isBrotliEncoding('deflate, gzip')).toBe(false)
        expect(isBrotliEncoding('brand-new-encoding')).toBe(false)
    })
})

describe('fetchWithoutBrotli', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('无 Content-Encoding 时返回原始响应', async () => {
        const response = new Response('ok')
        const fetchMock = vi.fn().mockResolvedValue(response)
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchWithoutBrotli('https://example.com/image.png')).resolves.toBe(response)
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/image.png', undefined)
    })

    it('gzip 编码正常放行', async () => {
        const response = new Response('ok', { headers: { 'content-encoding': 'gzip' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).resolves.toBe(response)
    })

    it('拒绝 Brotli 编码并取消 body', async () => {
        const cancel = vi.fn().mockResolvedValue(undefined)
        const body = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array([0x1b, 0x2e, 0x00]))
            },
            cancel,
        })
        const response = new Response(body, { headers: { 'content-encoding': 'br' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).rejects.toBeInstanceOf(UnsafeContentEncodingError)
        expect(cancel).toHaveBeenCalled()
    })

    it('无 body 的 Brotli 响应同样拒绝', async () => {
        const response = new Response(null, { status: 204, headers: { 'content-encoding': 'br' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).rejects.toBeInstanceOf(UnsafeContentEncodingError)
    })

    it('多段编码中包含 Brotli 时拒绝', async () => {
        const response = new Response('ok', { headers: { 'content-encoding': 'gzip, br' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).rejects.toThrow('Brotli')
    })
})
