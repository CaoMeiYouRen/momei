import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isServerlessEnvironment } from './env'

describe('env utils', () => {
    describe('isServerlessEnvironment', () => {
        const originalEnv = process.env
        const originalCwd = process.cwd

        beforeEach(() => {
            vi.resetModules()
            process.env = { ...originalEnv }
            process.cwd = originalCwd
        })

        afterEach(() => {
            process.env = originalEnv
            process.cwd = originalCwd
        })

        it('should return true for Vercel environment', () => {
            process.env.VERCEL = '1'
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Vercel ENV', () => {
            process.env.VERCEL_ENV = 'production'
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Netlify environment', () => {
            process.env.NETLIFY = 'true'
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Netlify Dev', () => {
            process.env.NETLIFY_DEV = 'true'
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for AWS Lambda', () => {
            process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-function'
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Cloudflare Pages', () => {
            process.env.CF_PAGES = '1'
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for Cloudflare Workers', () => {
            process.env.CLOUDFLARE_ENV = 'production'
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for /var/task path', () => {
            process.cwd = vi.fn(() => '/var/task/app')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return true for /tmp path', () => {
            process.cwd = vi.fn(() => '/tmp/app')
            expect(isServerlessEnvironment()).toBe(true)
        })

        it('should return false for normal environment', () => {
            delete process.env.VERCEL
            delete process.env.VERCEL_ENV
            delete process.env.NETLIFY
            delete process.env.NETLIFY_DEV
            delete process.env.AWS_LAMBDA_FUNCTION_NAME
            delete process.env.CF_PAGES
            delete process.env.CLOUDFLARE_ENV
            process.cwd = vi.fn(() => '/home/user/app')

            expect(isServerlessEnvironment()).toBe(false)
        })
    })
})
