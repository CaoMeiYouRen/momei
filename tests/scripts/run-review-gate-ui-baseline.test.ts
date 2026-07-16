import path from 'node:path'
import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import {
    buildArtifactManifest,
    buildEvidence,
    classifyFailureOutput,
    formatTimestamp,
    getCurrentBranch,
    main,
    quoteWindowsArg,
    resetAuthState,
    runBaseline,
    sanitizeScope,
    toArtifactPath,
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

    it('falls back to manual branch when git command fails', () => {
        const branch = getCurrentBranch({
            execSyncFn: () => {
                throw new Error('git unavailable')
            },
        })

        expect(branch).toBe('manual')
    })

    it('normalizes artifact paths to forward slashes', () => {
        const converted = toArtifactPath(path.join('/workspaces/momei', 'artifacts', 'testing', 'ui-regression', 'x', 'evidence.md'))
        expect(converted).toContain('artifacts/testing/ui-regression')
        expect(converted.includes('\\')).toBe(false)
    })

    it('quotes windows args only when needed', () => {
        expect(quoteWindowsArg('pnpm')).toBe('pnpm')
        expect(quoteWindowsArg('playwright test')).toBe('"playwright test"')
    })

    it('removes stale auth state when file exists', async () => {
        let removedPath = ''
        await resetAuthState({
            authStatePath: '/tmp/auth-state.json',
            existsSyncFn: () => true,
            rmFn: (targetPath: string) => {
                removedPath = targetPath
                return Promise.resolve()
            },
        })

        expect(removedPath).toBe('/tmp/auth-state.json')
    })

    it('captures baseline run output and writes playwright log', async () => {
        const writes: { path: string, content: string }[] = []
        const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter, stderr: EventEmitter }
        child.stdout = new EventEmitter()
        child.stderr = new EventEmitter()

        const resultPromise = runBaseline({
            runDir: '/tmp/ui-baseline',
            htmlDir: '/tmp/ui-baseline/playwright-report',
            outputDir: '/tmp/ui-baseline/test-results',
            scope: 'auth-session',
        }, {
            spawnFn: () => {
                queueMicrotask(() => {
                    child.stdout.emit('data', Buffer.from('stdout line'))
                    child.stderr.emit('data', Buffer.from('stderr line'))
                    child.emit('exit', 0, null)
                })
                return child
            },
            writeFileFn: (targetPath: string, content: string) => {
                writes.push({ path: targetPath, content })
                return Promise.resolve()
            },
            stdoutWriter: { write: () => true },
            stderrWriter: { write: () => true },
            runtimeEnv: {},
        })

        const result = await resultPromise
        expect(result.ok).toBe(true)
        const expectedLogPath = path.normalize('/tmp/ui-baseline/playwright.log')
        expect(result.logPath).toContain(expectedLogPath)
        expect(writes[0]?.path).toContain(expectedLogPath)
        expect(writes[0]?.content).toContain('stdout line')
    })

    it('sets process exitCode on failed baseline result in main()', async () => {
        const fakeProcess: { exitCode?: number } = {}

        await main({
            argv: ['node', 'script', '--scope', 'ci-check'],
            now: new Date('2026-04-01T08:09:10Z'),
            parseCliOptionsFn: () => ({ keepAuthState: true, scope: 'ci-check' }),
            getCurrentBranchFn: () => 'master',
            mkdirFn: () => Promise.resolve(),
            runBaselineFn: () => Promise.resolve({
                ok: false,
                code: 3,
                signal: null,
                logPath: '/tmp/ui-baseline/playwright.log',
                output: 'Error: timed out',
            }),
            buildArtifactManifestFn: () => ({ test: true }),
            buildEvidenceFn: () => 'evidence content',
            writeFileFn: vi.fn(() => Promise.resolve()),
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
            processObj: fakeProcess,
        })

        expect(fakeProcess.exitCode).toBe(3)
    })
})
