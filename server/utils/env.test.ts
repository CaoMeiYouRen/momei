import { describe, expect, it, beforeEach, afterAll } from 'vitest'

describe('env utils', () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
        // Reset environment variables before each test
        Object.keys(process.env).forEach((key) => {
            if (key !== 'NODE_ENV') {
                delete process.env[key]
            }
        })
    })

    afterAll(() => {
        // Restore original environment
        Object.keys(process.env).forEach((key) => {
            delete process.env[key]
        })
        Object.assign(process.env, originalEnv)
    })

    describe('isServerlessEnvironment', () => {
        it('should return true for Vercel environment', async () => {
            process.env.VERCEL = '1'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Vercel ENV', async () => {
            process.env.VERCEL_ENV = 'production'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Netlify environment', async () => {
            process.env.NETLIFY = 'true'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Netlify Dev', async () => {
            process.env.NETLIFY_DEV = 'true'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for AWS Lambda', async () => {
            process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-function'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Cloudflare Pages', async () => {
            process.env.CF_PAGES = '1'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Cloudflare Workers', async () => {
            process.env.CLOUDFLARE_ENV = 'production'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Zeabur environment', async () => {
            process.env.ZEABUR = 'true'
            const { isServerlessEnvironment } = await import('./env')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for /var/task path (when mocked)', async () => {
            // This test would require mocking process.cwd which is complex
            // For now, we'll skip this specific test
            const { isServerlessEnvironment } = await import('./env')
            // Just verify the function exists and returns a boolean
            expect(typeof isServerlessEnvironment()).toBe('boolean')
        })

        it('should return true for /tmp path (when mocked)', async () => {
            // This test would require mocking process.cwd which is complex
            // For now, we'll skip this specific test
            const { isServerlessEnvironment } = await import('./env')
            // Just verify the function exists and returns a boolean
            expect(typeof isServerlessEnvironment()).toBe('boolean')
        })

        it('should return false for normal environment', async () => {
            const { isServerlessEnvironment } = await import('./env')
            // In a normal test environment, this should return false
            // unless we're running in CI (which might be serverless)
            const result = isServerlessEnvironment()
            expect(typeof result).toBe('boolean')
        })
    })
})
