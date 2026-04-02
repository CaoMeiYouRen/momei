import { describe, expect, it } from 'vitest'
import {
    extractValidationIssues,
    mapValidationIssues,
    resolveRequestErrorMessage,
} from './request-feedback'

describe('request-feedback', () => {
    const translate = (key: string) => `translated:${key}`

    it('extracts validation issues from flat and nested payloads', () => {
        expect(extractValidationIssues({
            data: [
                { path: ['email'], message: 'Email is required' },
                { path: ['password'], message: 'Password is required' },
                { path: 'invalid', message: 'ignored' },
            ],
        })).toEqual([
            { path: ['email'], message: 'Email is required' },
            { path: ['password'], message: 'Password is required' },
        ])

        expect(extractValidationIssues({
            data: {
                data: [
                    { path: ['title'], message: 'Title is required' },
                ],
            },
        })).toEqual([
            { path: ['title'], message: 'Title is required' },
        ])
    })

    it('maps validation issues by first field and keeps first error per field', () => {
        const issues = [
            { path: ['email'], message: 'Email is required' },
            { path: ['email'], message: 'Email is invalid' },
            { path: ['profile', 'name'], message: 'Name is required' },
            { path: [0], message: 'Ignored numeric path' },
        ]

        expect(mapValidationIssues<'email' | 'profile'>(issues)).toEqual({
            email: 'Email is required',
            profile: 'Name is required',
        })
    })

    it('prefers i18n key, then code mapping, then status mapping, then fallback', () => {
        expect(resolveRequestErrorMessage({
            data: {
                i18nKey: 'common.i18n_error',
            },
        }, {
            fallbackKey: 'common.error',
            codeKeyMap: {
                INVALID: 'common.invalid',
            },
            statusKeyMap: {
                '404': 'common.not_found',
            },
        }, translate)).toBe('translated:common.i18n_error')

        expect(resolveRequestErrorMessage({
            data: {
                code: 'INVALID',
            },
        }, {
            fallbackKey: 'common.error',
            codeKeyMap: {
                INVALID: 'common.invalid',
            },
        }, translate)).toBe('translated:common.invalid')

        expect(resolveRequestErrorMessage({
            statusCode: 404,
        }, {
            fallbackKey: 'common.error',
            statusKeyMap: {
                '404': 'common.not_found',
            },
        }, translate)).toBe('translated:common.not_found')

        expect(resolveRequestErrorMessage({
            data: {
                code: 'UNKNOWN',
            },
        }, {
            fallbackKey: 'common.error',
            codeKeyMap: {
                INVALID: 'common.invalid',
            },
        }, translate)).toBe('translated:common.error')
    })
})
