import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    assertSupportedAuditReport,
    evaluateDependencyRiskGate,
    main as dependencyRiskMain,
    normalizeAllowlistDefinition,
    parseAuditReport,
} from '@/scripts/security/check-dependency-risk.mjs'

const execFileAsync = promisify(execFile)

function getNodeCliExecution() {
    const scriptPath = resolve(process.cwd(), 'scripts/security/check-dependency-risk.mjs')

    return {
        command: process.execPath,
        args: [scriptPath],
    }
}

describe('check-dependency-risk', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        process.exitCode = undefined
    })

    it('parses legacy pnpm audit advisories and keeps risk paths', () => {
        const risks = parseAuditReport({
            advisories: {
                '1105440': {
                    id: 1105440,
                    title: 'html-minifier high risk',
                    module_name: 'html-minifier',
                    severity: 'high',
                    url: 'https://github.com/advisories/GHSA-pfq8-rq6v-vf5m',
                    github_advisory_id: 'GHSA-pfq8-rq6v-vf5m',
                    recommendation: 'None',
                    patched_versions: '<0.0.0',
                    findings: [{ paths: ['.>mjml>mjml-cli>html-minifier'] }],
                },
            },
        })

        expect(risks).toHaveLength(1)
        expect(risks[0]).toMatchObject({
            advisoryId: 'GHSA-pfq8-rq6v-vf5m',
            packageName: 'html-minifier',
            severity: 'high',
        })
        expect(risks[0].paths).toEqual(['.>mjml>mjml-cli>html-minifier'])
    })

    it('allows known high risks while still blocking new high and critical risks', () => {
        const allowlistEntries = normalizeAllowlistDefinition({
            entries: [
                {
                    advisoryId: 'GHSA-pfq8-rq6v-vf5m',
                    packageName: 'html-minifier',
                    approvedPaths: ['.>mjml>mjml-cli>html-minifier'],
                    severity: 'high',
                    reason: 'known upstream issue',
                    source: 'https://github.com/advisories/GHSA-pfq8-rq6v-vf5m',
                    temporaryException: 'temporary release exception',
                },
            ],
        })

        const result = evaluateDependencyRiskGate({
            allowlistEntries,
            minSeverity: 'high',
            risks: [
                {
                    advisoryId: 'GHSA-pfq8-rq6v-vf5m',
                    key: 'html-minifier:GHSA-pfq8-rq6v-vf5m:high',
                    packageName: 'html-minifier',
                    patchedVersions: 'unavailable',
                    paths: ['.>mjml>mjml-cli>html-minifier'],
                    recommendation: 'None',
                    severity: 'high',
                    source: 'https://github.com/advisories/GHSA-pfq8-rq6v-vf5m',
                    title: 'html-minifier high risk',
                },
                {
                    advisoryId: 'GHSA-new-critical',
                    key: 'serialize-javascript:GHSA-new-critical:critical',
                    packageName: 'serialize-javascript',
                    patchedVersions: '>=7.0.3',
                    paths: ['.>serialize-javascript'],
                    recommendation: 'Upgrade serialize-javascript to 7.0.3',
                    severity: 'critical',
                    source: 'https://github.com/advisories/GHSA-new-critical',
                    title: 'serialize-javascript critical risk',
                },
                {
                    advisoryId: 'GHSA-moderate-only',
                    key: 'mjml:GHSA-moderate-only:moderate',
                    packageName: 'mjml',
                    patchedVersions: 'unavailable',
                    paths: ['.>mjml'],
                    recommendation: 'None',
                    severity: 'moderate',
                    source: 'https://github.com/advisories/GHSA-moderate-only',
                    title: 'mjml moderate risk',
                },
            ],
        })

        expect(result.allowlisted).toHaveLength(1)
        expect(result.blocking).toHaveLength(1)
        expect(result.blocking[0].packageName).toBe('serialize-javascript')
    })

    it('blocks allowlisted advisories when they appear on unapproved dependency paths', () => {
        const allowlistEntries = normalizeAllowlistDefinition({
            entries: [
                {
                    advisoryId: 'GHSA-pfq8-rq6v-vf5m',
                    packageName: 'html-minifier',
                    approvedPaths: ['.>mjml>mjml-cli>html-minifier'],
                    severity: 'high',
                    reason: 'known upstream issue',
                    source: 'https://github.com/advisories/GHSA-pfq8-rq6v-vf5m',
                    temporaryException: 'temporary release exception',
                },
            ],
        })

        const result = evaluateDependencyRiskGate({
            allowlistEntries,
            minSeverity: 'high',
            risks: [
                {
                    advisoryId: 'GHSA-pfq8-rq6v-vf5m',
                    key: 'html-minifier:GHSA-pfq8-rq6v-vf5m:high',
                    packageName: 'html-minifier',
                    patchedVersions: 'unavailable',
                    paths: ['.>another-chain>html-minifier'],
                    recommendation: 'None',
                    severity: 'high',
                    source: 'https://github.com/advisories/GHSA-pfq8-rq6v-vf5m',
                    title: 'html-minifier high risk',
                },
            ],
        })

        expect(result.allowlisted).toHaveLength(0)
        expect(result.blocking).toHaveLength(1)
    })

    it('fails closed when audit payload is missing schema or carries an explicit error', () => {
        expect(() => assertSupportedAuditReport({})).toThrow(/missing advisories\/vulnerabilities data/)
        expect(() => assertSupportedAuditReport({ error: 'registry unavailable' })).toThrow(/registry unavailable/)
    })

    it('fails closed for invalid --input payloads at the CLI boundary', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'dependency-risk-gate-'))
        const inputPath = resolve(directory, 'invalid-audit.json')

        await writeFile(inputPath, JSON.stringify({ error: 'registry unavailable' }), 'utf8')

        try {
            const execution = getNodeCliExecution()
            await expect(execFileAsync(execution.command, [
                ...execution.args,
                `--input=${inputPath}`,
                '--allowlist=.github/security/dependency-risk-allowlist.json',
                '--min-severity=high',
                '--mode=error',
            ])).rejects.toMatchObject({
                code: 1,
                stderr: expect.stringContaining('registry unavailable'),
            })
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('parses modern vulnerability reports from npm audit compatible payloads', () => {
        const risks = parseAuditReport({
            vulnerabilities: {
                quill: {
                    name: 'quill',
                    severity: 'low',
                    via: [
                        {
                            source: 1112197,
                            name: 'quill',
                            severity: 'low',
                            title: 'Quill is vulnerable to XSS via HTML export feature',
                            url: 'https://github.com/advisories/GHSA-v3m3-f69x-jf25',
                        },
                    ],
                    nodes: ['node_modules/quill'],
                    fixAvailable: false,
                },
            },
        })

        expect(risks).toHaveLength(1)
        expect(risks[0]).toMatchObject({
            advisoryId: 'https://github.com/advisories/GHSA-v3m3-f69x-jf25',
            packageName: 'quill',
            severity: 'low',
        })
    })

    it('dedupes repeated risk records and merges their dependency paths', () => {
        const risks = parseAuditReport({
            vulnerabilities: {
                serializeJavascript: {
                    name: 'serialize-javascript',
                    severity: 'high',
                    via: [
                        {
                            source: 'GHSA-dup-risk',
                            name: 'serialize-javascript',
                            severity: 'high',
                            title: 'serialize-javascript high risk',
                            url: 'https://github.com/advisories/GHSA-dup-risk',
                        },
                    ],
                    nodes: ['node_modules/serialize-javascript'],
                    fixAvailable: false,
                },
                serializeJavascriptNested: {
                    name: 'serialize-javascript',
                    severity: 'high',
                    via: [
                        {
                            source: 'GHSA-dup-risk',
                            name: 'serialize-javascript',
                            severity: 'high',
                            title: 'serialize-javascript high risk',
                            url: 'https://github.com/advisories/GHSA-dup-risk',
                        },
                    ],
                    nodes: ['node_modules/some-wrapper/node_modules/serialize-javascript'],
                    fixAvailable: false,
                },
            },
        })

        expect(risks).toHaveLength(1)
        expect(risks[0]?.paths).toEqual([
            'node_modules/serialize-javascript',
            'node_modules/some-wrapper/node_modules/serialize-javascript',
        ])
    })

    it('uses fixAvailable objects as patched version recommendations', () => {
        const risks = parseAuditReport({
            vulnerabilities: {
                vite: {
                    name: 'vite',
                    severity: 'high',
                    via: [],
                    nodes: ['node_modules/vite'],
                    title: 'vite vulnerability',
                    fixAvailable: {
                        name: 'vite',
                        version: '7.3.9',
                    },
                },
            },
        })

        expect(risks).toHaveLength(1)
        expect(risks[0]).toMatchObject({
            patchedVersions: 'vite@7.3.9',
            recommendation: 'No direct upgrade recommendation from audit source',
        })
    })

    it('rejects malformed allowlist entries and unsupported severities', () => {
        expect(() => normalizeAllowlistDefinition({
            entries: [{
                advisoryId: 'GHSA-invalid',
                packageName: 'vite',
                approvedPaths: ['node_modules/vite'],
                severity: 'unknown',
                reason: 'test',
                source: 'https://github.com/advisories/GHSA-invalid',
                temporaryException: 'temporary',
            }],
        })).toThrow(/Unsupported severity/)

        expect(() => normalizeAllowlistDefinition({
            entries: [{
                advisoryId: 'GHSA-invalid',
                packageName: 'vite',
                approvedPaths: [],
                severity: 'high',
                reason: 'test',
                source: 'https://github.com/advisories/GHSA-invalid',
                temporaryException: 'temporary',
            }],
        })).toThrow(/Invalid allowlist entry/)
    })

    it('runs main with an input snapshot and exits cleanly when all high risks are allowlisted', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'dependency-risk-main-pass-'))
        const inputPath = resolve(directory, 'audit.json')
        const allowlistPath = resolve(directory, 'allowlist.json')
        const originalArgv = process.argv
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

        await writeFile(inputPath, JSON.stringify({
            vulnerabilities: {
                vite: {
                    name: 'vite',
                    severity: 'high',
                    via: [{
                        source: 'GHSA-vite-risk',
                        name: 'vite',
                        severity: 'high',
                        title: 'vite vulnerability',
                        url: 'https://github.com/advisories/GHSA-vite-risk',
                    }],
                    nodes: ['node_modules/vite'],
                    fixAvailable: false,
                },
            },
        }), 'utf8')
        await writeFile(allowlistPath, JSON.stringify({
            entries: [{
                advisoryId: 'https://github.com/advisories/GHSA-vite-risk',
                approvedPaths: ['node_modules/vite'],
                packageName: 'vite',
                reason: 'temporary upstream exception',
                severity: 'high',
                source: 'https://github.com/advisories/GHSA-vite-risk',
                temporaryException: 'recheck next vite release',
            }],
        }), 'utf8')

        process.argv = [
            process.argv[0] || 'node',
            'check-dependency-risk.mjs',
            `--input=${inputPath}`,
            `--allowlist=${allowlistPath}`,
            '--min-severity=high',
            '--mode=error',
        ]
        process.exitCode = undefined

        try {
            await dependencyRiskMain()

            expect(process.exitCode).toBeUndefined()
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Dependency Risk Gate'))
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('No blocking dependency risks found.'))
        } finally {
            process.argv = originalArgv
            process.exitCode = originalExitCode
            infoSpy.mockRestore()
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('runs main in error mode and marks blocking dependency risks as failures', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'dependency-risk-main-fail-'))
        const inputPath = resolve(directory, 'audit.json')
        const allowlistPath = resolve(directory, 'allowlist.json')
        const originalArgv = process.argv
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

        await writeFile(inputPath, JSON.stringify({
            vulnerabilities: {
                serializeJavascript: {
                    name: 'serialize-javascript',
                    severity: 'critical',
                    via: [{
                        source: 'GHSA-serialize-critical',
                        name: 'serialize-javascript',
                        severity: 'critical',
                        title: 'serialize critical risk',
                        url: 'https://github.com/advisories/GHSA-serialize-critical',
                    }],
                    nodes: ['node_modules/serialize-javascript'],
                    fixAvailable: {
                        name: 'serialize-javascript',
                        version: '7.0.3',
                    },
                },
            },
        }), 'utf8')
        await writeFile(allowlistPath, JSON.stringify({ entries: [] }), 'utf8')

        process.argv = [
            process.argv[0] || 'node',
            'check-dependency-risk.mjs',
            `--input=${inputPath}`,
            `--allowlist=${allowlistPath}`,
            '--min-severity=high',
            '--mode=error',
        ]
        process.exitCode = undefined

        try {
            await dependencyRiskMain()

            expect(process.exitCode).toBe(1)
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Blocking risks:'))
        } finally {
            process.argv = originalArgv
            process.exitCode = originalExitCode
            infoSpy.mockRestore()
            await rm(directory, { force: true, recursive: true })
        }
    })
})
