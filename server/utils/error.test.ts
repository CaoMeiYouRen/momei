import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockTranslate } = vi.hoisted(() => ({
    mockTranslate: vi.fn(async (key: string) => `translated:${key}`),
}))

vi.mock('./i18n', () => ({
    t: mockTranslate,
    getLocale: () => 'en-US',
}))

import { APIError, Errors, createLocalizedResponse, throwLocalizedError } from './error'

describe('server/utils/error', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('createError', vi.fn((options: Record<string, unknown>) => Object.assign(new Error(String(options.statusMessage)), options)))
    })

    describe('APIError', () => {
        it('creates an error with key and default status 400', () => {
            const err = new APIError('error.unauthorized')
            expect(err.key).toBe('error.unauthorized')
            expect(err.statusCode).toBe(400)
            expect(err.name).toBe('APIError')
            expect(err).toBeInstanceOf(Error)
        })

        it('accepts custom status code and params', () => {
            const err = new APIError('error.notFound', 404, { resource: 'Post' })
            expect(err.statusCode).toBe(404)
            expect(err.params).toEqual({ resource: 'Post' })
        })

        it('is an instance of Error', () => {
            expect(new APIError('error.test')).toBeInstanceOf(Error)
        })
    })

    describe('Errors factory', () => {
        it('UNAUTHORIZED returns 401 error', () => {
            const err = Errors.UNAUTHORIZED()
            expect(err.statusCode).toBe(401)
            expect(err.key).toBe('error.unauthorized')
        })

        it('FORBIDDEN returns 403 error', () => {
            const err = Errors.FORBIDDEN()
            expect(err.statusCode).toBe(403)
        })

        it('NOT_FOUND returns 404 with resource param', () => {
            const err = Errors.NOT_FOUND('Post')
            expect(err.statusCode).toBe(404)
            expect(err.params).toEqual({ resource: 'Post' })
        })

        it('VALIDATION_FAILED returns 400 with field param', () => {
            const err = Errors.VALIDATION_FAILED('email')
            expect(err.statusCode).toBe(400)
            expect(err.params).toEqual({ field: 'email' })
        })

        it('RATE_LIMITED returns 429 error', () => {
            const err = Errors.RATE_LIMITED()
            expect(err.statusCode).toBe(429)
        })
    })

    describe('throwLocalizedError', () => {
        it('throws a localized h3-compatible error payload', async () => {
            await expect(throwLocalizedError('error.forbidden', 403, { scope: 'admin' })).rejects.toMatchObject({
                statusCode: 403,
                statusMessage: 'translated:error.forbidden',
                data: {
                    code: 403,
                    message: 'translated:error.forbidden',
                    locale: 'en-US',
                    key: 'error.forbidden',
                },
            })

            expect(mockTranslate).toHaveBeenCalledWith('error.forbidden', { scope: 'admin' })
        })
    })

    describe('createLocalizedResponse', () => {
        it('localizes APIError instances', async () => {
            await expect(createLocalizedResponse(new APIError('error.notFound', 404, { resource: 'Post' }))).resolves.toEqual({
                code: 404,
                message: 'translated:error.notFound',
                locale: 'en-US',
                data: null,
            })
        })

        it('reuses embedded keys for preprocessed errors', async () => {
            await expect(createLocalizedResponse({
                statusCode: 422,
                data: {
                    key: 'error.validation',
                    params: { field: 'title' },
                },
            })).resolves.toEqual({
                code: 422,
                message: 'translated:error.validation',
                locale: 'en-US',
                data: null,
            })
        })

        it('falls back to internal errors for generic exceptions', async () => {
            await expect(createLocalizedResponse(new Error('boom'))).resolves.toEqual({
                code: 500,
                message: 'translated:error.internal',
                locale: 'en-US',
                data: null,
            })
        })
    })
})
