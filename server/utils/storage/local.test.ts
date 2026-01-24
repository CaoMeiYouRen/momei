import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as envUtils from '../env'
import { LocalStorage } from './local'

vi.mock('../env', () => ({
    isServerlessEnvironment: vi.fn(),
}))

vi.mock('node:fs/promises', () => ({
    default: {
        mkdir: vi.fn(),
        statfs: vi.fn(),
        writeFile: vi.fn(),
    },
}))

describe('LocalStorage', () => {
    const mockEnv = {
        LOCAL_STORAGE_DIR: 'public/uploads',
        LOCAL_STORAGE_BASE_URL: '/uploads',
        LOCAL_STORAGE_MIN_FREE_SPACE: 100 * 1024 * 1024, // 100MiB
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(envUtils.isServerlessEnvironment).mockReturnValue(false)
    })

    it('should upload image successfully', async () => {
        const storage = new LocalStorage(mockEnv)
        const buffer = Buffer.from('fake image data')
        const filename = 'test.jpg'
        const contentType = 'image/jpeg'

        vi.mocked(fs.statfs).mockResolvedValue({
            bavail: 1000,
            bsize: 1024 * 1024,
        } as any)

        const result = await storage.upload(buffer, filename, contentType)

        expect(result.url).toBe('/uploads/test.jpg')
        expect(fs.writeFile).toHaveBeenCalled()
    })

    it('should throw error in serverless environment', async () => {
        vi.mocked(envUtils.isServerlessEnvironment).mockReturnValue(true)
        const storage = new LocalStorage(mockEnv)

        await expect(storage.upload(Buffer.from(''), 'test.jpg', 'image/jpeg'))
            .rejects.toThrow('无服务器 (Serverless) 环境')
    })

    it('should throw error for non-image files', async () => {
        const storage = new LocalStorage(mockEnv)

        await expect(storage.upload(Buffer.from(''), 'test.txt', 'text/plain'))
            .rejects.toThrow('仅允许上传图片文件')
    })

    it('should throw error when disk space is low', async () => {
        const storage = new LocalStorage(mockEnv)
        vi.mocked(fs.statfs).mockResolvedValue({
            bavail: 10,
            bsize: 1024 * 1024, // 10MiB free space
        } as any)

        await expect(storage.upload(Buffer.from(''), 'test.jpg', 'image/jpeg'))
            .rejects.toThrow('服务器磁盘空间不足')
    })

    it('should handle subdirectories in filename', async () => {
        const storage = new LocalStorage(mockEnv)
        const filename = 'sub/dir/test.jpg'

        vi.mocked(fs.statfs).mockResolvedValue({
            bavail: 1000,
            bsize: 1024 * 1024,
        } as any)

        const result = await storage.upload(Buffer.from(''), filename, 'image/jpeg')

        expect(result.url).toBe('/uploads/sub/dir/test.jpg')
        expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining(path.join('public/uploads', 'sub/dir')), { recursive: true })
    })

    it('should support absolute URL for static/dynamic separation', async () => {
        const absoluteEnv = {
            ...mockEnv,
            LOCAL_STORAGE_BASE_URL: 'https://cdn.example.com/uploads',
        }
        const storage = new LocalStorage(absoluteEnv)
        const filename = 'test.jpg'

        vi.mocked(fs.statfs).mockResolvedValue({
            bavail: 1000,
            bsize: 1024 * 1024,
        } as any)

        const result = await storage.upload(Buffer.from(''), filename, 'image/jpeg')

        expect(result.url).toBe('https://cdn.example.com/uploads/test.jpg')
    })
})
