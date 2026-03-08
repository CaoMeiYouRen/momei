import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readMultipartFormData } from 'h3'
import { checkUploadLimits, getUploadStorageContext, handleFileUploads, normalizeStorageType, resolveUploadedFileUrl, resolveUploadPrefix, UploadType } from './upload'
import { limiterStorage } from '@/server/database/storage'
import { getFileStorage } from '@/server/utils/storage/factory'
import { getSettings } from '~/server/services/setting'
import { MAX_UPLOAD_SIZE, MAX_AUDIO_UPLOAD_SIZE } from '@/utils/shared/env'

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: vi.fn(),
    },
}))

vi.mock('@/server/utils/storage/factory', () => ({
    getFileStorage: vi.fn(),
}))

vi.mock('~/server/services/setting', () => ({
    getSettings: vi.fn(),
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
        vi.mocked(getSettings).mockResolvedValue({
            storage_type: 'local',
            local_storage_dir: 'public/uploads',
            local_storage_base_url: '/uploads',
            local_storage_min_free_space: String(100 * 1024 * 1024),
            s3_endpoint: 'https://s3.example.com',
            s3_bucket: 'bucket',
            s3_region: 'auto',
            s3_access_key: 'key',
            s3_secret_key: 'secret',
            s3_base_url: 'https://cdn.example.com',
            s3_bucket_prefix: 'blog/',
            vercel_blob_token: 'blob-token',
            cloudflare_r2_account_id: 'account-id',
            cloudflare_r2_access_key: 'r2-key',
            cloudflare_r2_secret_key: 'r2-secret',
            cloudflare_r2_bucket: 'r2-bucket',
            cloudflare_r2_base_url: 'https://pub.example.com',
            max_upload_size: '10',
            max_audio_upload_size: '20',
            upload_limit_window: '86400',
            upload_daily_limit: '100',
            upload_single_user_daily_limit: '5',
        })
    })

    describe('storage normalization', () => {
        it('should normalize storage aliases', () => {
            expect(normalizeStorageType('r2')).toBe('s3')
            expect(normalizeStorageType('vercel_blob')).toBe('vercel-blob')
            expect(normalizeStorageType('s3')).toBe('s3')
        })

        it('should resolve upload prefix', () => {
            expect(resolveUploadPrefix(UploadType.IMAGE)).toBe('file/')
            expect(resolveUploadPrefix(UploadType.AUDIO)).toBe('audios/')
            expect(resolveUploadPrefix(UploadType.FILE, 'custom')).toBe('custom/')
        })

        it('should build s3-compatible env for r2 settings', async () => {
            vi.mocked(getSettings).mockResolvedValueOnce({
                storage_type: 'r2',
                s3_bucket_prefix: 'blog/',
                cloudflare_r2_account_id: 'account-id',
                cloudflare_r2_access_key: 'r2-key',
                cloudflare_r2_secret_key: 'r2-secret',
                cloudflare_r2_bucket: 'r2-bucket',
                cloudflare_r2_base_url: 'https://pub.example.com',
                local_storage_dir: 'public/uploads',
                local_storage_base_url: '/uploads',
                local_storage_min_free_space: String(100 * 1024 * 1024),
                max_upload_size: '10',
                max_audio_upload_size: '20',
            })

            const context = await getUploadStorageContext()

            expect(context.normalizedStorageType).toBe('s3')
            expect(context.env.S3_ENDPOINT).toBe('https://account-id.r2.cloudflarestorage.com')
            expect(context.env.S3_BUCKET_NAME).toBe('r2-bucket')
            expect(context.env.S3_BASE_URL).toBe('https://pub.example.com')
        })

        it('should prefer asset object prefix and asset public base url', async () => {
            vi.mocked(getSettings).mockResolvedValueOnce({
                storage_type: 's3',
                asset_object_prefix: 'assets/',
                asset_public_base_url: 'https://assets.example.com',
                s3_bucket_prefix: 'blog/',
                s3_bucket: 'bucket',
                s3_region: 'auto',
                s3_access_key: 'key',
                s3_secret_key: 'secret',
                s3_base_url: 'https://cdn.example.com',
                local_storage_dir: 'public/uploads',
                local_storage_base_url: '/uploads',
                local_storage_min_free_space: String(100 * 1024 * 1024),
                max_upload_size: '10',
                max_audio_upload_size: '20',
            })

            const context = await getUploadStorageContext()

            expect(context.bucketPrefix).toBe('assets/')
            expect(context.assetPublicBaseUrl).toBe('https://assets.example.com')
            expect(context.driverBaseUrl).toBe('https://assets.example.com')
        })

        it('should resolve uploaded file url with global asset prefix first', () => {
            expect(resolveUploadedFileUrl('file/test.jpg', {
                assetPublicBaseUrl: 'https://assets.example.com',
                driverBaseUrl: 'https://cdn.example.com',
            })).toBe('https://assets.example.com/file/test.jpg')
        })

        it('should resolve uploaded file url with driver base url when asset public base url is missing', () => {
            expect(resolveUploadedFileUrl('file/test.jpg', {
                assetPublicBaseUrl: '',
                driverBaseUrl: 'https://cdn.example.com',
            })).toBe('https://cdn.example.com/file/test.jpg')
        })

        it('should return object key directly when both base urls are missing', () => {
            expect(resolveUploadedFileUrl('file/test.jpg', {
                assetPublicBaseUrl: '',
                driverBaseUrl: '',
            })).toBe('file/test.jpg')
        })

        it('should handle trailing slashes in base url correctly', () => {
            expect(resolveUploadedFileUrl('file/test.jpg', {
                assetPublicBaseUrl: 'https://assets.example.com/',
                driverBaseUrl: 'https://cdn.example.com',
            })).toBe('https://assets.example.com/file/test.jpg')
        })

        it('should handle absolute paths without http protocol', () => {
            expect(resolveUploadedFileUrl('file/test.jpg', {
                assetPublicBaseUrl: '/uploads',
                driverBaseUrl: '',
            })).toBe('/uploads/file/test.jpg')
        })

        it('should normalize multiple slashes in non-http urls', () => {
            expect(resolveUploadedFileUrl('file/test.jpg', {
                assetPublicBaseUrl: '/uploads/',
                driverBaseUrl: '',
            })).toBe('/uploads/file/test.jpg')
        })
    })

    describe('checkUploadLimits', () => {
        it('should pass if limits are not exceeded', async () => {
            vi.mocked(limiterStorage.increment).mockResolvedValue(1)
            await expect(checkUploadLimits('user1')).resolves.not.toThrow()
        })

        it('should throw error if global limit exceeded', async () => {
            vi.mocked(limiterStorage.increment).mockImplementation((key) => {
                if (key === 'upload_global_limit') {
                    return Promise.resolve(1000000)
                }
                return Promise.resolve(1)
            })
            await expect(checkUploadLimits('user1')).rejects.toThrow('今日上传次数超出限制')
        })

        it('should throw error if user limit exceeded', async () => {
            vi.mocked(limiterStorage.increment).mockImplementation((key) => {
                if (key.startsWith('user_upload_limit:')) {
                    return Promise.resolve(1000000)
                }
                return Promise.resolve(1)
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
            expect(result[0]!.url).toMatch(/^\/uploads\/blog\/test\/.*\.jpg$/)
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

        it('should upload audio files successfully', async () => {
            const mockFiles = [
                { filename: 'test.mp3', data: Buffer.from('data'), type: 'audio/mpeg' },
            ]
            vi.mocked(readMultipartFormData).mockResolvedValue(mockFiles as any)
            const mockStorage = { upload: vi.fn().mockResolvedValue({ url: 'http://test.com/test.mp3' }) }
            vi.mocked(getFileStorage).mockReturnValue(mockStorage as any)

            const result = await handleFileUploads(mockEvent, { prefix: 'test/', type: UploadType.AUDIO })

            expect(result).toHaveLength(1)
            expect(result[0]!.url).toMatch(/^\/uploads\/blog\/test\/.*\.mp3$/)
            expect(mockStorage.upload).toHaveBeenCalled()
        })

        it('should throw error if image uploaded to audio type', async () => {
            const mockFiles = [
                { filename: 'test.jpg', data: Buffer.from('data'), type: 'image/jpeg' },
            ]
            vi.mocked(readMultipartFormData).mockResolvedValue(mockFiles as any)

            await expect(handleFileUploads(mockEvent, { prefix: 'test/', type: UploadType.AUDIO }))
                .rejects.toThrow('仅支持音频上传')
        })

        it('should allow larger files for audio type', async () => {
            // Create a buffer larger than MAX_UPLOAD_SIZE but smaller than MAX_AUDIO_UPLOAD_SIZE
            const largeData = Buffer.alloc(MAX_UPLOAD_SIZE + 1024)
            const mockFiles = [
                { filename: 'test.mp3', data: largeData, type: 'audio/mpeg' },
            ]
            vi.mocked(readMultipartFormData).mockResolvedValue(mockFiles as any)
            const mockStorage = { upload: vi.fn().mockResolvedValue({ url: 'http://test.com/test.mp3' }) }
            vi.mocked(getFileStorage).mockReturnValue(mockStorage as any)

            const result = await handleFileUploads(mockEvent, { prefix: 'test/', type: UploadType.AUDIO })

            expect(result).toHaveLength(1)
            expect(mockStorage.upload).toHaveBeenCalled()
        })

        it('should throw error if audio file exceeds audio limit', async () => {
            const tooLargeData = Buffer.alloc(MAX_AUDIO_UPLOAD_SIZE + 1024)
            const mockFiles = [
                { filename: 'test.mp3', data: tooLargeData, type: 'audio/mpeg' },
            ]
            vi.mocked(readMultipartFormData).mockResolvedValue(mockFiles as any)

            await expect(handleFileUploads(mockEvent, { prefix: 'test/', type: UploadType.AUDIO }))
                .rejects.toThrow(/文件大小超出/)
        })
    })
})
