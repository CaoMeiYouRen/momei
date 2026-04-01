import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    buildArtifactManifest,
    buildEvidence,
    classifyFailureOutput,
    formatTimestamp,
    sanitizeScope,
} from '@/scripts/testing/run-review-gate-ui-baseline.mjs'

describe('run-review-gate-ui-baseline', () => {
    it('sanitizes scope values into stable artifact-safe names', () => {
        expect(sanitizeScope(' UI review gate / auth session ')).toBe('UI-review-gate-auth-session')
        expect(sanitizeScope('***')).toBe('manual')
    })

    it('formats timestamps with a stable sortable layout', () => {
        expect(formatTimestamp(new Date('2026-04-01T08:09:10Z'))).toBe('20260401-080910')
    })

    it('classifies build and connectivity failures ahead of scenario assertions', () => {
        const attribution = classifyFailureOutput([
            '[run-e2e] Building app before Playwright: source files changed after the last build',
            'Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3001/',
            '1) [chromium] › tests/e2e/auth-session-governance.e2e.test.ts › should keep authenticated settings page stable after refresh with bounded session fetches',
        ].join('\n'))

        expect(attribution).toMatchObject({
            category: 'boot-or-build',
            categoryLabel: '服务启动 / 构建产物',
            failingProjects: ['chromium'],
        })
        expect(attribution.firstErrorLine).toContain('ERR_CONNECTION_REFUSED')
    })

    it('classifies auth-state failures from login/bootstrap signals', () => {
        const attribution = classifyFailureOutput([
            '[Global Setup] Login failed: 401 unauthorized',
            '[Global Setup] Admin auth state not available, related tests may be skipped',
            '1) [webkit] › tests/e2e/mobile-critical.e2e.test.ts › should cover login entry, admin navigation, and basic editor interaction on mobile',
        ].join('\n'))

        expect(attribution).toMatchObject({
            category: 'auth-state',
            categoryLabel: '认证态 / 种子数据',
            failingProjects: ['webkit'],
        })
    })

    it('falls back to scenario assertions when boot and auth signals are absent', () => {
        const attribution = classifyFailureOutput([
            '1) [mobile-safari-critical] › tests/e2e/mobile-critical.e2e.test.ts › should cover login entry, admin navigation, and basic editor interaction on mobile',
            'Error: expect(locator).toBeVisible() failed',
        ].join('\n'))

        expect(attribution).toMatchObject({
            category: 'scenario-assertion',
            failingProjects: ['mobile-safari-critical'],
            failingTests: [
                'tests/e2e/mobile-critical.e2e.test.ts :: should cover login entry, admin navigation, and basic editor interaction on mobile',
            ],
        })
    })

    it('builds a manifest with canonical artifact paths and environment metadata', () => {
        const runDir = path.join(process.cwd(), 'artifacts', 'testing', 'ui-regression', '20260401-080910-auth-session')
        const outputDir = path.join(runDir, 'test-results')
        const htmlDir = path.join(runDir, 'playwright-report')
        const evidencePath = path.join(runDir, 'evidence.md')
        const logPath = path.join(runDir, 'playwright.log')

        const manifest = buildArtifactManifest({
            scope: 'auth-session',
            timestamp: '20260401-080910',
            runDir,
            outputDir,
            htmlDir,
            logPath,
            evidencePath,
            status: 'fail',
            branch: 'master',
            keepAuthState: false,
            attribution: {
                category: 'auth-state',
                categoryLabel: '认证态 / 种子数据',
                failingProjects: ['firefox'],
                failingTests: ['tests/e2e/auth-session-governance.e2e.test.ts :: should sync logout across tabs'],
                firstErrorLine: 'Error: login failed',
                matchingSignals: ['auth-state'],
                probableCause: 'auth state missing',
                nextStep: 'rebuild auth state',
            },
        })

        expect(manifest).toMatchObject({
            schemaVersion: 1,
            scope: 'auth-session',
            status: 'fail',
            reviewGateConclusion: 'Reject',
            branch: 'master',
            artifactNaming: {
                evidence: 'artifacts/testing/ui-regression/20260401-080910-auth-session/evidence.md',
                manifest: 'artifacts/testing/ui-regression/20260401-080910-auth-session/manifest.json',
                log: 'artifacts/testing/ui-regression/20260401-080910-auth-session/playwright.log',
            },
        })
        expect(manifest.environment.criticalProjects).toContain('webkit')
    })

    it('renders evidence with manifest and attribution details', () => {
        const runDir = path.join(process.cwd(), 'artifacts', 'testing', 'ui-regression', '20260401-080910-auth-session')
        const outputDir = path.join(runDir, 'test-results')
        const htmlDir = path.join(runDir, 'playwright-report')
        const evidencePath = path.join(runDir, 'evidence.md')
        const manifestPath = path.join(runDir, 'manifest.json')
        const logPath = path.join(runDir, 'playwright.log')

        const evidence = buildEvidence({
            scope: 'auth-session',
            timestamp: '20260401-080910',
            runDir,
            outputDir,
            htmlDir,
            logPath,
            evidencePath,
            manifestPath,
            ok: false,
            failureSummary: 'critical baseline failed',
            attribution: {
                category: 'scenario-assertion',
                categoryLabel: '具体场景断言',
                failingProjects: ['webkit'],
                failingTests: ['tests/e2e/auth-session-governance.e2e.test.ts :: should protect entered new draft from language switch before saving'],
                firstErrorLine: 'Error: expect(locator).toHaveValue failed',
                matchingSignals: ['scenario-assertion'],
                probableCause: 'scenario mismatch',
                nextStep: 'rerun the specific project',
            },
        })

        expect(evidence).toContain('## Artifact Naming Convention')
        expect(evidence).toContain('manifest.json')
        expect(evidence).toContain('category: 具体场景断言')
        expect(evidence).toContain('failing projects: webkit')
    })
})
