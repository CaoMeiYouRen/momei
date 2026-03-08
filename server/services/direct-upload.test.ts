import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
    mockCheckUploadLimits,
    mockGetUploadStorageContext,
    mockResolveUploadPrefix,
    mockResolveUploadedFileUrl,
    mockValidateUploadPayload,
    mockBuildUploadObjectKey,
    mockCreateS3Client,
    mockGetSignedUrl,
    mockPutObjectCommand,
} = vi.hoisted(() => ({
    mockCheckUploadLimits: vi.fn(),
    mockGetUploadStorageContext: vi.fn(),
    mockResolveUploadPrefix: vi.fn(),
    mockResolveUploadedFileUrl: vi.fn(),
    mockValidateUploadPayload: vi.fn(),
    mockBuildUploadObjectKey: vi.fn(),
    mockCreateS3Client: vi.fn(),
    mockGetSignedUrl: vi.fn(),
    mockPutObjectCommand: vi.fn(),
}))

vi.mock('./upload', () => ({
    checkUploadLimits: mockCheckUploadLimits,
    getUploadStorageContext: mockGetUploadStorageContext,
    resolveUploadPrefix: mockResolveUploadPrefix,
    resolveUploadedFileUrl: mockResolveUploadedFileUrl,
    validateUploadPayload: mockValidateUploadPayload,
    buildUploadObjectKey: mockBuildUploadObjectKey,
    UploadType: {
        IMAGE: 'image',
        AUDIO: 'audio',
        FILE: 'file',
    },
}))

vi.mock('@/server/utils/storage/s3', () => ({
    createS3Client: mockCreateS3Client,
    resolveS3Env: vi.fn((env) => env),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: mockGetSignedUrl,
}))

vi.mock('@aws-sdk/client-s3', () => ({
    PutObjectCommand: mockPutObjectCommand,
}))

import { authorizeDirectUpload } from './direct-upload'

describe('direct upload service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockResolveUploadPrefix.mockReturnValue('file/')
        mockResolveUploadedFileUrl.mockReturnValue('https://cdn.example.com/file/generated.jpg')
        mockBuildUploadObjectKey.mockReturnValue('file/generated.jpg')
        mockCreateS3Client.mockReturnValue({ client: 's3' })
        mockGetSignedUrl.mockResolvedValue('https://storage.example.com/presigned')
        mockPutObjectCommand.mockImplementation(function (this: { input: unknown }, input) {
            this.input = input
        })
    })

    it('should fallback to proxy for unsupported storage', async () => {
        mockGetUploadStorageContext.mockResolvedValue({
            normalizedStorageType: 'local',
            bucketPrefix: '',
            assetPublicBaseUrl: '',
            driverBaseUrl: '',
            env: {},
            settings: {},
        })

        const result = await authorizeDirectUpload({
            userId: 'user-1',
            filename: 'test.jpg',
            contentType: 'image/jpeg',
            size: 1024,
        })

        expect(result).toEqual({ strategy: 'proxy' })
        expect(mockCheckUploadLimits).not.toHaveBeenCalled()
        expect(mockGetSignedUrl).not.toHaveBeenCalled()
    })

    it('should issue presigned put auth for s3-compatible storage', async () => {
        mockGetUploadStorageContext.mockResolvedValue({
            normalizedStorageType: 's3',
            bucketPrefix: 'blog/',
            assetPublicBaseUrl: 'https://assets.example.com',
            driverBaseUrl: 'https://cdn.example.com',
            env: {
                S3_BUCKET_NAME: 'media',
                S3_BASE_URL: 'https://cdn.example.com',
                S3_ENDPOINT: 'https://s3.example.com',
                S3_REGION: 'auto',
                S3_ACCESS_KEY_ID: 'key',
                S3_SECRET_ACCESS_KEY: 'secret',
            },
            settings: {},
        })

        const result = await authorizeDirectUpload({
            userId: 'user-1',
            filename: 'test.jpg',
            contentType: 'image/jpeg',
            size: 1024,
        })

        expect(mockCheckUploadLimits).toHaveBeenCalledWith('user-1')
        expect(mockPutObjectCommand).toHaveBeenCalledWith({
            Bucket: 'media',
            Key: 'file/generated.jpg',
            ContentType: 'image/jpeg',
        })
        expect(mockResolveUploadedFileUrl).toHaveBeenCalledWith('file/generated.jpg', expect.objectContaining({
            assetPublicBaseUrl: 'https://assets.example.com',
            driverBaseUrl: 'https://cdn.example.com',
        }))
        expect(result).toEqual({
            strategy: 'put-presign',
            method: 'PUT',
            url: 'https://storage.example.com/presigned',
            headers: {
                'content-type': 'image/jpeg',
            },
            publicUrl: 'https://cdn.example.com/file/generated.jpg',
            objectKey: 'file/generated.jpg',
            expiresIn: 300,
        })
    })
})
