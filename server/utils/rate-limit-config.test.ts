import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES, getRateLimitRules, matchRateLimitRule } from './rate-limit-config'

describe('rate-limit-config', () => {
    describe('DEFAULT_RULES', () => {
        it('should have all expected rules', () => {
            const names = DEFAULT_RULES.map((r) => r.name)
            expect(names).toContain('AUTH')
            expect(names).toContain('FILE')
            expect(names).toContain('AI')
            expect(names).toContain('EXTERNAL')
            expect(names).toContain('SEARCH')
            expect(names).toContain('DEFAULT_POST')
            expect(names).toContain('DEFAULT_GET')
        })

        it('should have valid window and max values', () => {
            for (const rule of DEFAULT_RULES) {
                expect(rule.window).toBeGreaterThan(0)
                expect(rule.max).toBeGreaterThanOrEqual(0)
            }
        })

        it('should have higher priority rules before lower priority', () => {
            const apiIndex = DEFAULT_RULES.findIndex((r) => r.prefix === '/api' && !r.methods)
            const apiPostIndex = DEFAULT_RULES.findIndex((r) => r.prefix === '/api' && r.methods?.length)
            const externalIndex = DEFAULT_RULES.findIndex((r) => r.name === 'EXTERNAL')

            // EXTERNAL (/api/external) should come before generic /api
            expect(externalIndex).toBeLessThan(apiIndex)
            expect(externalIndex).toBeLessThan(apiPostIndex)
        })
    })

    describe('matchRateLimitRule', () => {
        it('should match a path that starts with the prefix', () => {
            const rule = { name: 'TEST', prefix: '/api/external', window: 60, max: 10 }
            expect(matchRateLimitRule('/api/external/posts/validate', 'POST', rule)).toBe(true)
        })

        it('should not match a path that does not start with the prefix', () => {
            const rule = { name: 'TEST', prefix: '/api/external', window: 60, max: 10 }
            expect(matchRateLimitRule('/api/internal/posts', 'GET', rule)).toBe(false)
        })

        it('should respect method restrictions', () => {
            const rule = { name: 'TEST', prefix: '/api', window: 60, max: 10, methods: ['POST', 'PUT'] }
            expect(matchRateLimitRule('/api/posts', 'POST', rule)).toBe(true)
            expect(matchRateLimitRule('/api/posts', 'PUT', rule)).toBe(true)
            expect(matchRateLimitRule('/api/posts', 'GET', rule)).toBe(false)
        })

        it('should match any method when methods is not set', () => {
            const rule = { name: 'TEST', prefix: '/api', window: 60, max: 10 }
            expect(matchRateLimitRule('/api/posts', 'GET', rule)).toBe(true)
            expect(matchRateLimitRule('/api/posts', 'POST', rule)).toBe(true)
            expect(matchRateLimitRule('/api/posts', 'DELETE', rule)).toBe(true)
        })

        it('should skip auth routes', () => {
            const authRule = DEFAULT_RULES.find((r) => r.name === 'AUTH')!
            expect(authRule.skip).toBe(true)
            expect(matchRateLimitRule('/api/auth/signin', 'POST', authRule)).toBe(true)
        })
    })

    describe('getRateLimitRules', () => {
        it('should return all default rules', () => {
            const rules = getRateLimitRules()
            expect(rules.length).toBe(DEFAULT_RULES.length)
        })

        it('should pick the first matching rule for a given path', () => {
            const rules = getRateLimitRules()
            const externalRule = rules.find((r) => r.name === 'EXTERNAL')
            expect(externalRule).toBeDefined()
            expect(externalRule!.max).toBe(60)

            // /api/external should match EXTERNAL rule, not DEFAULT_POST
            const matchedForExternal = rules.find((r) => matchRateLimitRule('/api/external/posts', 'POST', r))
            expect(matchedForExternal?.name).toBe('EXTERNAL')
        })

        it('should fall back to DEFAULT_POST for non-external POST requests', () => {
            const rules = getRateLimitRules()
            const matched = rules.find((r) => matchRateLimitRule('/api/posts', 'POST', r))
            expect(matched?.name).toBe('DEFAULT_POST')
        })

        it('should match DEFAULT_GET for non-external GET requests', () => {
            const rules = getRateLimitRules()
            const matched = rules.find((r) => matchRateLimitRule('/api/posts', 'GET', r))
            expect(matched?.name).toBe('DEFAULT_GET')
        })
    })
})
