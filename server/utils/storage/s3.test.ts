import { describe, it, expect } from 'vitest'
import { shouldUseS3PathStyle, resolveS3Env } from './s3'

describe('server/utils/storage/s3.ts', () => {
    it('should use path style for non-AWS endpoints', () => {
        const env = resolveS3Env({
            S3_ENDPOINT: 'https://my-custom-s3.com',
            S3_BUCKET_NAME: 'test-bucket',
            S3_ACCESS_KEY_ID: 'key',
            S3_SECRET_ACCESS_KEY: 'secret',
        })
        expect(shouldUseS3PathStyle(env)).toBe(true)
    })

    it('should NOT use path style for standard AWS endpoints', () => {
        const env = resolveS3Env({
            S3_ENDPOINT: 'https://test-bucket.s3.us-east-1.amazonaws.com',
            S3_BUCKET_NAME: 'test-bucket',
            S3_ACCESS_KEY_ID: 'key',
            S3_SECRET_ACCESS_KEY: 'secret',
        })
        expect(shouldUseS3PathStyle(env)).toBe(false)
    })

    it('should NOT be fooled by malicious AWS-like endpoints', () => {
        const env = resolveS3Env({
            S3_ENDPOINT: 'https://evil-amazonaws.com.attacker.com',
            S3_BUCKET_NAME: 'test-bucket',
            S3_ACCESS_KEY_ID: 'key',
            S3_SECRET_ACCESS_KEY: 'secret',
        })
        expect(shouldUseS3PathStyle(env)).toBe(true)
    })

    it('should handle invalid URLs gracefully', () => {
        const env = resolveS3Env({
            S3_ENDPOINT: 'not-a-url',
            S3_BUCKET_NAME: 'test-bucket',
            S3_ACCESS_KEY_ID: 'key',
            S3_SECRET_ACCESS_KEY: 'secret',
        })
        // Should fall back to includes check
        expect(shouldUseS3PathStyle(env)).toBe(false)
    })
})
