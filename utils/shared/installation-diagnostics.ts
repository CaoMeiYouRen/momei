export type InstallationRuntime =
    | 'local-dev'
    | 'docker'
    | 'self-hosted-node'
    | 'vercel'
    | 'netlify'
    | 'cloudflare'
    | 'aws-lambda'
    | 'zeabur'
    | 'unknown'

export type InstallationDiagnosticSeverity = 'blocker' | 'warning'

export type InstallationDiagnosticCode =
    | 'database_connection_failed'
    | 'missing_auth_secret'
    | 'missing_site_url'
    | 'missing_auth_base_url'
    | 'auth_base_url_mismatch'
    | 'cloudflare_runtime_unsupported'
    | 'sqlite_serverless_conflict'
    | 'local_storage_serverless_conflict'

export interface InstallationDiagnosticIssue {
    code: InstallationDiagnosticCode
    severity: InstallationDiagnosticSeverity
    envKeys: string[]
    docsPage: 'quick-start' | 'deploy' | 'variables'
    docsHash?: string
}

export interface InstallationDiagnostics {
    runtime: InstallationRuntime
    platformSupported: boolean
    blockerCount: number
    warningCount: number
    hasBlockingIssues: boolean
    issues: InstallationDiagnosticIssue[]
}

export interface InstallationDiagnosticsInput {
    runtime: InstallationRuntime
    nodeEnv: string
    isDemoMode: boolean
    databaseConnected: boolean
    databaseType: string
    storageType: string
    requiredEnv: {
        authSecret: boolean
        siteUrl: boolean
        authBaseUrl: boolean
    }
    publicUrls: {
        siteUrl: string
        authBaseUrl: string
    }
}

export function isInstallationRuntimeServerless(runtime: InstallationRuntime) {
    return ['vercel', 'netlify', 'cloudflare', 'aws-lambda', 'zeabur'].includes(runtime)
}

function normalizeDatabaseType(databaseType: string) {
    if (databaseType === 'better-sqlite3') {
        return 'sqlite'
    }

    return databaseType
}

function normalizeStorageType(storageType: string) {
    return storageType === 'vercel-blob' ? 'vercel_blob' : storageType
}

function resolveOrigin(value: string) {
    try {
        const url = new URL(value)
        return `${url.protocol}//${url.host}`.toLowerCase()
    } catch {
        return null
    }
}

export function buildInstallationDiagnostics(input: InstallationDiagnosticsInput): InstallationDiagnostics {
    const issues: InstallationDiagnosticIssue[] = []
    const productionLike = input.nodeEnv === 'production' || isInstallationRuntimeServerless(input.runtime)
    const databaseType = normalizeDatabaseType(input.databaseType)
    const storageType = normalizeStorageType(input.storageType || 'local')
    const platformSupported = input.runtime !== 'cloudflare'

    if (!input.databaseConnected) {
        issues.push({
            code: 'database_connection_failed',
            severity: 'blocker',
            envKeys: ['DATABASE_URL'],
            docsPage: 'deploy',
            docsHash: 'troubleshooting',
        })
    }

    if (productionLike && !input.isDemoMode && !input.requiredEnv.authSecret) {
        issues.push({
            code: 'missing_auth_secret',
            severity: 'blocker',
            envKeys: ['AUTH_SECRET'],
            docsPage: 'deploy',
            docsHash: 'essential',
        })
    }

    if (productionLike && !input.isDemoMode && !input.requiredEnv.siteUrl) {
        issues.push({
            code: 'missing_site_url',
            severity: 'blocker',
            envKeys: ['NUXT_PUBLIC_SITE_URL'],
            docsPage: 'deploy',
            docsHash: 'essential',
        })
    }

    if (productionLike && !input.isDemoMode && !input.requiredEnv.authBaseUrl) {
        issues.push({
            code: 'missing_auth_base_url',
            severity: 'blocker',
            envKeys: ['NUXT_PUBLIC_AUTH_BASE_URL'],
            docsPage: 'deploy',
            docsHash: 'essential',
        })
    }

    if (input.requiredEnv.siteUrl && input.requiredEnv.authBaseUrl) {
        const siteOrigin = resolveOrigin(input.publicUrls.siteUrl)
        const authOrigin = resolveOrigin(input.publicUrls.authBaseUrl)

        if (siteOrigin && authOrigin && siteOrigin !== authOrigin) {
            issues.push({
                code: 'auth_base_url_mismatch',
                severity: 'warning',
                envKeys: ['NUXT_PUBLIC_SITE_URL', 'NUXT_PUBLIC_AUTH_BASE_URL'],
                docsPage: 'deploy',
                docsHash: 'troubleshooting',
            })
        }
    }

    if (input.runtime === 'cloudflare') {
        issues.push({
            code: 'cloudflare_runtime_unsupported',
            severity: 'blocker',
            envKeys: ['CF_PAGES', 'CLOUDFLARE_ENV'],
            docsPage: 'deploy',
            docsHash: 'deploying-to-major-platforms',
        })
    }

    if (isInstallationRuntimeServerless(input.runtime) && databaseType === 'sqlite' && !input.isDemoMode) {
        issues.push({
            code: 'sqlite_serverless_conflict',
            severity: 'blocker',
            envKeys: ['DATABASE_URL'],
            docsPage: 'quick-start',
            docsHash: 'minimal-paths',
        })
    }

    if (isInstallationRuntimeServerless(input.runtime) && storageType === 'local') {
        issues.push({
            code: 'local_storage_serverless_conflict',
            severity: 'warning',
            envKeys: ['STORAGE_TYPE'],
            docsPage: 'deploy',
            docsHash: 'recommended',
        })
    }

    const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length
    const warningCount = issues.filter((issue) => issue.severity === 'warning').length

    return {
        runtime: input.runtime,
        platformSupported,
        blockerCount,
        warningCount,
        hasBlockingIssues: blockerCount > 0,
        issues,
    }
}
