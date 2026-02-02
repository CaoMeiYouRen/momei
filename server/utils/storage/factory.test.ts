import { describe, expect, it, vi } from 'vitest'
import { getFileStorage } from './factory'
import { S3Storage } from './s3'
import { VercelBlobStorage } from './vercel-blob'
import { LocalStorage } from './local'

// Mock storage implementations
vi.mock('./s3', () => ({
    S3Storage: vi.fn(),
}))

vi.mock('./vercel-blob', () => ({
    VercelBlobStorage: vi.fn(),
}))

vi.mock('./local', () => ({
    LocalStorage: vi.fn(),
}))

describe('storage factory utils', () => {
    describe('getFileStorage', () => {
        it('should return S3Storage for s3 type', () => {
            const env = {
                S3_ENDPOINT: 'https://s3.example.com',
                S3_REGION: 'us-east-1',
                S3_BUCKET: 'test-bucket',
                S3_ACCESS_KEY_ID: 'test-key',
                S3_SECRET_ACCESS_KEY: 'test-secret',
            }

            getFileStorage('s3', env as any)

            expect(S3Storage).toHaveBeenCalledWith(env)
        })

        it('should return VercelBlobStorage for vercel-blob type', () => {
            const env = {
                BLOB_READ_WRITE_TOKEN: 'test-token',
            }

            getFileStorage('vercel-blob', env as any)

            expect(VercelBlobStorage).toHaveBeenCalledWith(env)
        })

        it('should return LocalStorage for local type', () => {
            const env = {
                UPLOAD_DIR: '/uploads',
                BASE_URL: 'https://example.com',
            }

            getFileStorage('local', env as any)

            expect(LocalStorage).toHaveBeenCalledWith(env)
        })

        it('should throw error for unsupported storage type', () => {
            const env = {}

            expect(() => getFileStorage('unsupported', env as any)).toThrow(
                'Unsupported storage type: unsupported',
            )
        })

        it('should throw error for empty storage type', () => {
            const env = {}

            expect(() => getFileStorage('', env as any)).toThrow(
                'Unsupported storage type:',
            )
        })

        it('should handle mixed env with all storage configs', () => {
            const env = {
                S3_ENDPOINT: 'https://s3.example.com',
                S3_REGION: 'us-east-1',
                S3_BUCKET: 'test-bucket',
                S3_ACCESS_KEY_ID: 'test-key',
                S3_SECRET_ACCESS_KEY: 'test-secret',
                BLOB_READ_WRITE_TOKEN: 'test-token',
                UPLOAD_DIR: '/uploads',
                BASE_URL: 'https://example.com',
            }

            getFileStorage('s3', env as any)
            expect(S3Storage).toHaveBeenCalledWith(env)

            getFileStorage('vercel-blob', env as any)
            expect(VercelBlobStorage).toHaveBeenCalledWith(env)

            getFileStorage('local', env as any)
            expect(LocalStorage).toHaveBeenCalledWith(env)
        })
    })
})
