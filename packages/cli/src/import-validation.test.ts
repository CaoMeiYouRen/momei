import { describe, expect, it } from 'vitest'
import { buildImportExecutionPlan } from './import-validation'
import type { CliImportValidationCandidate } from './import-validation'

function createCandidate(overrides: Partial<CliImportValidationCandidate> = {}): CliImportValidationCandidate {
    return {
        file: 'post.md',
        relativeFile: 'post.md',
        request: {
            title: 'Post',
            content: 'Body',
            visibility: 'public',
            status: 'draft',
        },
        report: {
            language: 'zh-CN',
            canonicalSlug: 'post',
            canonicalSource: 'slug',
            canImport: true,
            requiresConfirmation: false,
            hasBlockingIssues: false,
            summary: {
                accepted: 2,
                fallback: 0,
                repaired: 0,
                invalid: 0,
                conflict: 0,
                'needs-confirmation': 0,
                skipped: 0,
            },
            items: [],
        },
        ...overrides,
    }
}

describe('import validation plan', () => {
    it('builds a stable dry-run style summary', () => {
        const plan = buildImportExecutionPlan([
            createCandidate(),
            createCandidate({
                file: 'fallback.md',
                report: {
                    language: 'zh-CN',
                    canonicalSlug: 'fallback-post',
                    canonicalSource: 'fallback',
                    canImport: true,
                    requiresConfirmation: true,
                    hasBlockingIssues: false,
                    summary: {
                        accepted: 1,
                        fallback: 1,
                        repaired: 0,
                        invalid: 1,
                        conflict: 0,
                        'needs-confirmation': 0,
                        skipped: 0,
                    },
                    items: [],
                },
            }),
        ], { confirmPathAliases: false })

        expect(plan.summary.total).toBe(2)
        expect(plan.summary.ready).toBe(1)
        expect(plan.summary.skipped).toBe(1)
        expect(plan.summary.fallback).toBe(1)
        expect(plan.summary.invalid).toBe(1)
    })

    it('skips confirmation-required entries when confirmation is cancelled', () => {
        const plan = buildImportExecutionPlan([
            createCandidate({
                report: {
                    language: 'zh-CN',
                    canonicalSlug: 'fallback-post',
                    canonicalSource: 'fallback',
                    canImport: true,
                    requiresConfirmation: true,
                    hasBlockingIssues: false,
                    summary: {
                        accepted: 1,
                        fallback: 1,
                        repaired: 0,
                        invalid: 0,
                        conflict: 0,
                        'needs-confirmation': 0,
                        skipped: 0,
                    },
                    items: [],
                },
            }),
        ], { confirmPathAliases: false })

        expect(plan.items[0]?.action).toBe('skip')
        expect(plan.items[0]?.actionReason).toBe('confirmation-required')
        expect(plan.summary.requiresConfirmation).toBe(1)
    })

    it('is repeatable across reruns with the same validation input', () => {
        const candidates = [
            createCandidate(),
            createCandidate({
                file: 'conflict.md',
                report: {
                    language: 'zh-CN',
                    canonicalSlug: null,
                    canonicalSource: null,
                    canImport: false,
                    requiresConfirmation: false,
                    hasBlockingIssues: true,
                    summary: {
                        accepted: 0,
                        fallback: 0,
                        repaired: 0,
                        invalid: 0,
                        conflict: 1,
                        'needs-confirmation': 0,
                        skipped: 0,
                    },
                    items: [],
                },
            }),
        ]

        const first = buildImportExecutionPlan(candidates, { confirmPathAliases: false })
        const second = buildImportExecutionPlan(candidates, { confirmPathAliases: false })

        expect(second).toEqual(first)
    })
})
