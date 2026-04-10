import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StepHealthCheck from './step-health-check.vue'

describe('StepHealthCheck', () => {
    const baseStatus = {
        databaseConnected: true,
        databaseType: 'postgres',
        databaseVersion: '16.0',
        isServerless: true,
        isNodeVersionSafe: true,
        nodeVersion: 'v22.0.0',
        os: 'Linux',
        runtime: 'vercel' as const,
        deploymentDiagnostics: {
            runtime: 'vercel' as const,
            platformSupported: true,
            blockerCount: 1,
            warningCount: 1,
            hasBlockingIssues: true,
            issues: [
                {
                    code: 'missing_auth_secret' as const,
                    severity: 'blocker' as const,
                    envKeys: ['AUTH_SECRET'],
                    docsPage: 'deploy' as const,
                },
                {
                    code: 'local_storage_serverless_conflict' as const,
                    severity: 'warning' as const,
                    envKeys: ['STORAGE_TYPE'],
                    docsPage: 'deploy' as const,
                },
            ],
        },
    }

    it('disables next when blocking deployment issues exist', async () => {
        const wrapper = await mountSuspended(StepHealthCheck, {
            props: {
                installationStatus: baseStatus,
            },
        })

        const button = wrapper.find('button')
        expect(button.exists()).toBe(true)
        expect(button.attributes('disabled')).toBeDefined()
        expect(wrapper.text()).toContain('AUTH_SECRET')
    })

    it('renders troubleshooting entry links for the current issue set', async () => {
        const wrapper = await mountSuspended(StepHealthCheck, {
            props: {
                installationStatus: {
                    ...baseStatus,
                    deploymentDiagnostics: {
                        ...baseStatus.deploymentDiagnostics,
                        blockerCount: 0,
                        hasBlockingIssues: false,
                        issues: [],
                    },
                },
            },
        })

        const links = wrapper.findAll('.installation-wizard__diagnostics-resource')
        const hrefs = links.map((link) => link.attributes('href'))

        expect(hrefs.some((href) => href?.includes('/guide/quick-start'))).toBe(true)
        expect(hrefs.some((href) => href?.includes('/guide/deploy'))).toBe(true)
        expect(hrefs.some((href) => href?.includes('/guide/variables'))).toBe(true)
        expect(hrefs).toContain('/feedback')
    })
})
