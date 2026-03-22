import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import {
    assertSupportedAuditReport,
    evaluateDependencyRiskGate,
    normalizeAllowlistDefinition,
    parseAuditReport,
} from '@/scripts/security/check-dependency-risk.mjs'

const execFileAsync = promisify(execFile)

describe('check-dependency-risk', () => {
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
            await expect(execFileAsync('node', [
                resolve(process.cwd(), 'scripts/security/check-dependency-risk.mjs'),
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
})
