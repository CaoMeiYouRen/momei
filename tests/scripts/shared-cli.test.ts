import { describe, expect, it } from 'vitest'
import { ensureAllowedValue, getCliArgs, parseCliOptions } from '@/scripts/shared/cli.mjs'

describe('scripts/shared/cli', () => {
    it('keeps already-sliced CLI args intact', () => {
        expect(getCliArgs(['--mode=warn', '--scope=review-gate'])).toEqual(['--mode=warn', '--scope=review-gate'])
        expect(getCliArgs(['node', 'script.mjs', '--mode=warn'])).toEqual(['--mode=warn'])
    })

    it('parses whitelisted key=value options and flags declaratively', () => {
        const options = parseCliOptions(['node', 'script.mjs', '--mode=warn', '--scope=ui-regression', '--keep-auth-state'], {
            defaults: {
                keepAuthState: false,
                mode: 'error',
                scope: null,
            },
            flags: {
                '--keep-auth-state': { key: 'keepAuthState' },
            },
            values: {
                '--mode': {
                    key: 'mode',
                    allowedValues: ['warn', 'error'],
                    invalidMessage: (value) => `Unsupported mode: ${value}`,
                },
                '--scope': { key: 'scope' },
            },
        })

        expect(options).toMatchObject({
            keepAuthState: true,
            mode: 'warn',
            scope: 'ui-regression',
        })
    })

    it('ignores the pnpm argument separator while continuing to parse forwarded options', () => {
        const options = parseCliOptions(['node', 'script.mjs', '--', '--mode=warn', '--scope=ui-regression'], {
            defaults: {
                mode: 'error',
                scope: null,
            },
            values: {
                '--mode': {
                    key: 'mode',
                    allowedValues: ['warn', 'error'],
                    invalidMessage: (value) => `Unsupported mode: ${value}`,
                },
                '--scope': { key: 'scope' },
            },
        })

        expect(options).toMatchObject({
            mode: 'warn',
            scope: 'ui-regression',
        })
    })

    it('supports collectors for repeated list-style options', () => {
        const options = parseCliOptions(['--locale=zh-CN,en-US', '--locale=ja-JP'], {
            defaults: {
                locales: [],
            },
            values: {
                '--locale': {
                    key: 'locales',
                    parse: (value) => value.split(','),
                    collect: (current = [], next = []) => [...current, ...next],
                },
            },
        })

        expect(options.locales).toEqual(['zh-CN', 'en-US', 'ja-JP'])
    })

    it('rejects unsupported arguments by default', () => {
        expect(() => parseCliOptions(['--unexpected=value'], {
            defaults: {},
        })).toThrow('Unsupported argument: --unexpected=value')
    })

    it('rejects enum values outside the whitelist', () => {
        expect(() => ensureAllowedValue('strict', ['warn', 'error'], (value) => `Unsupported mode: ${value}`)).toThrow('Unsupported mode: strict')
    })
})
