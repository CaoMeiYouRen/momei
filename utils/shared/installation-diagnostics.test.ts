import { describe, expect, it } from 'vitest'
import { buildInstallationDiagnostics, isInstallationRuntimeServerless } from './installation-diagnostics'

describe('buildInstallationDiagnostics', () => {
    it('should only mark known serverless runtimes as serverless', () => {
        expect(isInstallationRuntimeServerless('vercel')).toBe(true)
        expect(isInstallationRuntimeServerless('unknown')).toBe(false)
        expect(isInstallationRuntimeServerless('self-hosted-node')).toBe(false)
    })

    it('should keep local development zero-config path unblocked', () => {
        const diagnostics = buildInstallationDiagnostics({
            runtime: 'local-dev',
            nodeEnv: 'development',
            isDemoMode: false,
            databaseConnected: true,
            databaseType: 'better-sqlite3',
            storageType: 'local',
            requiredEnv: {
                authSecret: false,
                siteUrl: false,
                authBaseUrl: false,
            },
            publicUrls: {
                siteUrl: '',
                authBaseUrl: '',
            },
        })

        expect(diagnostics.hasBlockingIssues).toBe(false)
        expect(diagnostics.issues).toEqual([])
    })

    it('should report missing core production env values as blockers', () => {
        const diagnostics = buildInstallationDiagnostics({
            runtime: 'self-hosted-node',
            nodeEnv: 'production',
            isDemoMode: false,
            databaseConnected: true,
            databaseType: 'postgres',
            storageType: 's3',
            requiredEnv: {
                authSecret: false,
                siteUrl: false,
                authBaseUrl: false,
            },
            publicUrls: {
                siteUrl: '',
                authBaseUrl: '',
            },
        })

        expect(diagnostics.blockerCount).toBe(3)
        expect(diagnostics.issues.map((issue) => issue.code)).toEqual([
            'missing_auth_secret',
            'missing_site_url',
            'missing_auth_base_url',
        ])
    })

    it('should flag unsupported Cloudflare runtime as blocker', () => {
        const diagnostics = buildInstallationDiagnostics({
            runtime: 'cloudflare',
            nodeEnv: 'production',
            isDemoMode: false,
            databaseConnected: false,
            databaseType: 'sqlite',
            storageType: 'local',
            requiredEnv: {
                authSecret: true,
                siteUrl: true,
                authBaseUrl: true,
            },
            publicUrls: {
                siteUrl: 'https://example.com',
                authBaseUrl: 'https://example.com',
            },
        })

        expect(diagnostics.platformSupported).toBe(false)
        expect(diagnostics.issues.some((issue) => issue.code === 'cloudflare_runtime_unsupported')).toBe(true)
    })

    it('should flag serverless sqlite and local storage conflicts', () => {
        const diagnostics = buildInstallationDiagnostics({
            runtime: 'vercel',
            nodeEnv: 'production',
            isDemoMode: false,
            databaseConnected: true,
            databaseType: 'better-sqlite3',
            storageType: 'local',
            requiredEnv: {
                authSecret: true,
                siteUrl: true,
                authBaseUrl: true,
            },
            publicUrls: {
                siteUrl: 'https://blog.example.com',
                authBaseUrl: 'https://blog.example.com',
            },
        })

        expect(diagnostics.issues.map((issue) => issue.code)).toContain('sqlite_serverless_conflict')
        expect(diagnostics.issues.map((issue) => issue.code)).toContain('local_storage_serverless_conflict')
    })

    it('should warn when auth callback origin drifts from site url', () => {
        const diagnostics = buildInstallationDiagnostics({
            runtime: 'self-hosted-node',
            nodeEnv: 'production',
            isDemoMode: false,
            databaseConnected: true,
            databaseType: 'postgres',
            storageType: 's3',
            requiredEnv: {
                authSecret: true,
                siteUrl: true,
                authBaseUrl: true,
            },
            publicUrls: {
                siteUrl: 'https://blog.example.com',
                authBaseUrl: 'https://auth.example.com',
            },
        })

        expect(diagnostics.warningCount).toBe(1)
        expect(diagnostics.issues[0]?.code).toBe('auth_base_url_mismatch')
    })
})
