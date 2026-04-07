import { describe, expect, it, vi } from 'vitest'
import { VercelBlobStorage } from './vercel-blob'

const { putMock } = vi.hoisted(() => ({
    putMock: vi.fn(),
}))

vi.mock('@vercel/blob', () => ({
    put: putMock,
}))

describe('vercel blob storage', () => {
    it('uploads with the configured token and returns the blob url', async () => {
        putMock.mockResolvedValueOnce({
            url: 'https://blob.vercel-storage.com/demo/file.txt',
        })

        const storage = new VercelBlobStorage({
            VERCEL_BLOB_TOKEN: '',
            BLOB_READ_WRITE_TOKEN: 'rw-demo-token',
        })

        await expect(storage.upload(Buffer.from('hello'), 'file.txt', 'text/plain')).resolves.toEqual({
            url: 'https://blob.vercel-storage.com/demo/file.txt',
        })

        expect(putMock).toHaveBeenCalledWith('file.txt', Buffer.from('hello'), {
            token: 'rw-demo-token',
            access: 'public',
            contentType: 'text/plain',
            addRandomSuffix: false,
        })
    })
})
