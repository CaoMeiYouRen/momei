import { describe, it, expect } from 'vitest'
import { APIError, Errors } from './error'

describe('server/utils/error', () => {
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
})
