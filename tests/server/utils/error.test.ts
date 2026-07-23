import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted to top, so mock factory must not reference top-level const.
// Use vi.hoisted to create mock functions that survive hoisting.
const { mockT, mockGetLocale } = vi.hoisted(() => ({
    mockT: vi.fn((key: string, params?: Record<string, any>) => {
        if (key === 'error.unauthorized') {
            return '未授权'
        }
        if (key === 'error.forbidden') {
            return '禁止访问'
        }
        if (key === 'error.notFound') {
            return `未找到: ${params?.resource || 'unknown'}`
        }
        if (key === 'error.validation') {
            return `验证失败: ${params?.field || ''}`
        }
        if (key === 'error.rateLimited') {
            return '请求过于频繁'
        }
        if (key === 'error.internal') {
            return '服务器内部错误'
        }
        return key
    }),
    mockGetLocale: vi.fn(() => 'zh-CN'),
}))

vi.mock('@/server/utils/i18n', () => ({
    t: mockT,
    getLocale: mockGetLocale,
}))

import { APIError, throwLocalizedError, Errors, createLocalizedResponse } from '@/server/utils/error'

describe('server/utils/error', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('APIError', () => {
        it('creates an APIError with key, statusCode and params', () => {
            const err = new APIError('error.notFound', 404, { resource: 'post' })
            expect(err).toBeInstanceOf(Error)
            expect(err.name).toBe('APIError')
            expect(err.key).toBe('error.notFound')
            expect(err.statusCode).toBe(404)
            expect(err.params).toEqual({ resource: 'post' })
        })

        it('defaults statusCode to 400 and params to undefined', () => {
            const err = new APIError('error.validation')
            expect(err.statusCode).toBe(400)
            expect(err.params).toBeUndefined()
        })
    })

    describe('Errors factory', () => {
        it('UNAUTHORIZED returns APIError with 401', () => {
            const err = Errors.UNAUTHORIZED()
            expect(err).toBeInstanceOf(APIError)
            expect(err.key).toBe('error.unauthorized')
            expect(err.statusCode).toBe(401)
        })

        it('FORBIDDEN returns APIError with 403', () => {
            const err = Errors.FORBIDDEN()
            expect(err.key).toBe('error.forbidden')
            expect(err.statusCode).toBe(403)
        })

        it('NOT_FOUND returns APIError with 404 and resource param', () => {
            const err = Errors.NOT_FOUND('article')
            expect(err.key).toBe('error.notFound')
            expect(err.statusCode).toBe(404)
            expect(err.params).toEqual({ resource: 'article' })
        })

        it('VALIDATION_FAILED returns APIError with 400 and field param', () => {
            const err = Errors.VALIDATION_FAILED('email')
            expect(err.key).toBe('error.validation')
            expect(err.statusCode).toBe(400)
            expect(err.params).toEqual({ field: 'email' })
        })

        it('RATE_LIMITED returns APIError with 429', () => {
            const err = Errors.RATE_LIMITED()
            expect(err.key).toBe('error.rateLimited')
            expect(err.statusCode).toBe(429)
        })
    })

    describe('throwLocalizedError', () => {
        it('throws a localized error with createError', async () => {
            try {
                await throwLocalizedError('error.unauthorized', 401)
                expect(true).toBe(false)
            } catch (err: any) {
                expect(err.statusCode).toBe(401)
                expect(err.statusMessage).toBe('未授权')
                expect(err.data).toEqual({
                    code: 401,
                    message: '未授权',
                    locale: 'zh-CN',
                    key: 'error.unauthorized',
                })
                expect(mockT).toHaveBeenCalledWith('error.unauthorized', undefined)
                expect(mockGetLocale).toHaveBeenCalled()
            }
        })

        it('throws with custom params', async () => {
            try {
                await throwLocalizedError('error.notFound', 404, { resource: 'post' })
            } catch (err: any) {
                expect(err.statusCode).toBe(404)
                expect(err.statusMessage).toBe('未找到: post')
                expect(err.data.key).toBe('error.notFound')
            }
        })
    })

    describe('createLocalizedResponse', () => {
        it('transforms a plain Error into a localized response', async () => {
            const result = await createLocalizedResponse(new Error('Generic error'))
            expect(result.code).toBe(500)
            expect(result.message).toBe('服务器内部错误')
            expect(result.locale).toBe('zh-CN')
            expect(result.data).toBeNull()
        })

        it('transforms an APIError into a localized response', async () => {
            const apiErr = new APIError('error.forbidden', 403)
            const result = await createLocalizedResponse(apiErr)
            expect(result.code).toBe(403)
            expect(result.message).toBe('禁止访问')
        })

        it('extracts key from error.data for already-processed errors', async () => {
            const metaErr = new Error('already processed')
            ;(metaErr as any).data = { key: 'error.validation', params: { field: 'email' } }
            ;(metaErr as any).statusCode = 400
            const result = await createLocalizedResponse(metaErr)
            expect(result.code).toBe(400)
            expect(result.message).toBe('验证失败: email')
        })
    })
})
