import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { handleExternalLinkError } from './external-links-shared'

function createZodError(message: string): z.ZodError {
    return new z.ZodError([{ code: 'custom', message, path: [] }])
}

describe('handleExternalLinkError', () => {
    it('should return 400 with ZodError issue message', () => {
        const zodError = createZodError('Invalid url format')
        const result = handleExternalLinkError(zodError, 'fallback')
        expect(result).toEqual({ code: 400, data: null, message: 'Invalid url format' })
    })

    it('should return 400 with fallback message when ZodError has no issues', () => {
        const zodError = new z.ZodError([])
        const result = handleExternalLinkError(zodError, 'fallback')
        expect(result).toEqual({ code: 400, data: null, message: 'Invalid request body' })
    })

    it('should return 400 with "Invalid URL" error message', () => {
        const error = new Error('Invalid URL')
        const result = handleExternalLinkError(error, 'fallback')
        expect(result).toEqual({ code: 400, data: null, message: 'Invalid URL' })
    })

    it('should return 400 with "URL is blacklisted" error message', () => {
        const error = new Error('URL is blacklisted')
        const result = handleExternalLinkError(error, 'fallback')
        expect(result).toEqual({ code: 400, data: null, message: 'URL is blacklisted' })
    })

    it('should return 500 with generic Error message', () => {
        const error = new Error('Internal server error')
        const result = handleExternalLinkError(error, 'fallback')
        expect(result).toEqual({ code: 500, data: null, message: 'Internal server error' })
    })

    it('should return 500 with fallback message when error is not an Error instance', () => {
        expect(handleExternalLinkError(null, 'null fallback')).toEqual({ code: 500, data: null, message: 'null fallback' })
        expect(handleExternalLinkError(undefined, 'undefined fallback')).toEqual({ code: 500, data: null, message: 'undefined fallback' })
        expect(handleExternalLinkError('string error', 'string fallback')).toEqual({ code: 500, data: null, message: 'string fallback' })
        expect(handleExternalLinkError(42, 'number fallback')).toEqual({ code: 500, data: null, message: 'number fallback' })
        expect(handleExternalLinkError({ arbitrary: 'object' }, 'object fallback')).toEqual({ code: 500, data: null, message: 'object fallback' })
    })

    it('should return 500 with empty string when Error has empty message', () => {
        // new Error() produces message='', function returns error.message before fallback
        const error = new Error()
        const result = handleExternalLinkError(error, 'empty error fallback')
        expect(result).toEqual({ code: 500, data: null, message: '' })
    })

    it('should return 500 with empty string when Error message is empty string', () => {
        const error = new Error('')
        const result = handleExternalLinkError(error, 'empty string fallback')
        expect(result).toEqual({ code: 500, data: null, message: '' })
    })
})
