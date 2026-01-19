import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readMultipartFormData } from 'h3'
import { checkUploadLimits, handleFileUploads } from './upload'
import { limiterStorage } from '@/server/database/storage'
import { getFileStorage } from '@/server/utils/storage/factory'

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: vi.fn(),
    },
}))

vi.mock('@/server/utils/storage/factory', () => ({
    getFileStorage: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const original = await importOriginal<typeof import('h3')>()
    return {
        ...original,
        readMultipartFormData: vi.fn(),
    }
})

describe('UploadService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('checkUploadLimits', () => {
        it('should pass if limits are not exceeded', async () => {
            vi.mocked(limiterStorage.increment).mockResolvedValue(1)
            await expect(checkUploadLimits('user1')).resolves.not.toThrow()
        })

        it('should throw error if global limit exceeded', async () => {
            vi.mocked(limiterStorage.increment).mockImplementation(async (key) => {
                if (key === 'upload_global_limit') {
                    return 1000000
                }
                return 1
            })
            await expect(checkUploadLimits('user1')).rejects.toThrow('今日上传次数超出限制')
        })

        it('should throw error if user limit exceeded', async () => {
            vi.mocked(limiterStorage.increment).mockImplementation(async (key) => {
                if (key.startsWith('user_upload_limit:')) {
                    return 1000000
                }
                return 1
            })
            await expect(checkUploadLimits('user1')).rejects.toThrow('您今日上传次数超出限制')
        })
    })

    describe('handleFileUploads', () => {
        const mockEvent = {} as any

        it('should upload files successfully', async () => {
            const mockFiles = [
                { filename: 'test.jpg', data: Buffer.from('data'), type: 'image/jpeg' },
            ]
            vi.mocked(readMultipartFormData).mockResolvedValue(mockFiles as any)
            const mockStorage = { upload: vi.fn().mockResolvedValue({ url: 'http://test.com/test.jpg' }) }
            vi.mocked(getFileStorage).mockReturnValue(mockStorage as any)

            const result = await handleFileUploads(mockEvent, { prefix: 'test/' })

            expect(result).toHaveLength(1)
            expect(result[0]!.url).toBe('http://test.com/test.jpg')
            expect(mockStorage.upload).toHaveBeenCalled()
        })

        it('should throw error if no files uploaded', async () => {
            vi.mocked(readMultipartFormData).mockResolvedValue(undefined as any)
            await expect(handleFileUploads(mockEvent, { prefix: 'test/' }))
                .rejects.toThrow('No file uploaded')
        })

        it('should throw error if too many files', async () => {
            const mockFiles = Array(11).fill({ filename: 't.jpg', data: Buffer.from(''), type: 'image/jpeg' })
            vi.mocked(readMultipartFormData).mockResolvedValue(mockFiles as any)
            await expect(handleFileUploads(mockEvent, { prefix: 'test/', maxFiles: 10 }))
                .rejects.toThrow('最多允许同时上传 10 个文件')
        })
    })
})
