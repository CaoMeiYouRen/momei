import { describe, expect, it } from 'vitest'
import {
    classifyAlert,
    evaluateSecurityAlertGate,
    mapAuditRiskToDependabotAlert,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
} from '@/scripts/security/check-github-security-alerts.mjs'

describe('check-github-security-alerts', () => {
    it('classifies open Dependabot alerts with patches as immediate fixes', () => {
        const alert = normalizeDependabotAlert({
            number: 12,
            state: 'open',
            dependency: {
                package: {
                    ecosystem: 'npm',
                    name: 'vite',
                },
            },
            security_advisory: {
                severity: 'high',
                summary: 'vite vulnerability',
            },
            security_vulnerability: {
                package: {
                    ecosystem: 'npm',
                    name: 'vite',
                },
                severity: 'high',
                first_patched_version: {
                    identifier: '7.3.9',
                },
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'immediate-fix',
        })
    })

    it('classifies open Dependabot alerts without patches as deferred', () => {
        const alert = normalizeDependabotAlert({
            number: 18,
            state: 'open',
            dependency: {
                package: {
                    ecosystem: 'npm',
                    name: 'legacy-lib',
                },
            },
            security_advisory: {
                severity: 'critical',
                summary: 'legacy-lib vulnerability',
            },
            security_vulnerability: {
                package: {
                    ecosystem: 'npm',
                    name: 'legacy-lib',
                },
                severity: 'critical',
                first_patched_version: null,
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'defer',
        })
    })

    it('classifies high severity non-test code scanning alerts as immediate fixes', () => {
        const alert = normalizeCodeScanningAlert({
            number: 4,
            state: 'open',
            rule: {
                id: 'js/xss',
                severity: 'error',
                security_severity_level: 'high',
                description: 'Potential XSS',
            },
            tool: {
                name: 'CodeQL',
            },
            most_recent_instance: {
                location: {
                    path: 'server/api/search/index.get.ts',
                },
                classifications: [],
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'immediate-fix',
        })
    })

    it('downgrades test-only code scanning alerts to observe', () => {
        const alert = normalizeCodeScanningAlert({
            number: 7,
            state: 'open',
            rule: {
                id: 'js/path-injection',
                severity: 'error',
                security_severity_level: 'critical',
                description: 'Potential path injection',
            },
            tool: {
                name: 'CodeQL',
            },
            most_recent_instance: {
                location: {
                    path: 'tests/server/api/search/index.get.test.ts',
                },
                classifications: ['test'],
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'observe',
        })
    })

    it('maps pnpm audit fallback risks into Dependabot-like alerts', () => {
        const alert = mapAuditRiskToDependabotAlert({
            advisoryId: 'GHSA-1234-5678-9999',
            packageName: 'html-minifier',
            patchedVersions: '>=7.2.0',
            paths: ['.>mjml>html-minifier'],
            recommendation: 'Upgrade to 7.2.0',
            severity: 'high',
            source: 'https://github.com/advisories/GHSA-1234-5678-9999',
            title: 'html-minifier vulnerability',
        })

        expect(alert).toMatchObject({
            alertNumber: 'audit:html-minifier:GHSA-1234-5678-9999',
            packageName: 'html-minifier',
            patchAvailable: true,
            source: 'dependabot',
            state: 'open',
        })
    })

    it('treats pnpm audit sentinel patched versions as no patch available', () => {
        const alert = mapAuditRiskToDependabotAlert({
            advisoryId: 'GHSA-no-patch',
            packageName: 'legacy-lib',
            patchedVersions: '<0.0.0',
            paths: ['.>legacy-lib'],
            recommendation: 'Manual review required',
            severity: 'high',
            source: 'https://github.com/advisories/GHSA-no-patch',
            title: 'legacy-lib vulnerability',
        })

        expect(alert).toMatchObject({
            patchAvailable: false,
            patchedVersion: null,
        })
        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'defer',
        })
    })

    it('allows deferred high alerts only when exception baseline exists', () => {
        const deferredAlert = {
            alertNumber: '18',
            classification: {
                bucket: 'defer',
                reason: 'open Dependabot alert without patched version',
            },
            severity: 'critical',
            source: 'dependabot',
        }
        const immediateFixAlert = {
            alertNumber: '4',
            classification: {
                bucket: 'immediate-fix',
                reason: 'open high+ code scanning alert on non-test path',
            },
            severity: 'high',
            source: 'code-scanning',
        }

        const result = evaluateSecurityAlertGate({
            alerts: [deferredAlert, immediateFixAlert],
            exceptionEntries: normalizeExceptionEntries({
                entries: [
                    {
                        source: 'dependabot',
                        alertNumber: '18',
                        classification: 'defer',
                        reason: 'waiting upstream patch',
                        temporaryException: 'recheck next release',
                    },
                ],
            }),
            minSeverity: 'high',
        })

        expect(result.excepted).toHaveLength(1)
        expect(result.blocking).toHaveLength(1)
        expect(result.blocking[0]).toBe(immediateFixAlert)
    })

    it('rejects malformed exception entries', () => {
        expect(() => normalizeExceptionEntries({
            entries: [
                {
                    source: 'dependabot',
                    alertNumber: '18',
                    classification: 'defer',
                    reason: '',
                    temporaryException: 'recheck next release',
                },
            ],
        })).toThrow(/Invalid security alert exception entry/)
    })
})
