import { describe, expect, it } from 'vitest'
import { buildInstallationDocResources } from './installation-doc-links'

describe('buildInstallationDocResources', () => {
    it('should prioritize locale-aware issue pages for translated locales', () => {
        const resources = buildInstallationDocResources({
            locale: 'en-US',
            issues: [
                {
                    code: 'missing_auth_secret',
                    severity: 'blocker',
                    envKeys: ['AUTH_SECRET'],
                    docsPage: 'deploy',
                },
                {
                    code: 'sqlite_serverless_conflict',
                    severity: 'blocker',
                    envKeys: ['DATABASE_URL'],
                    docsPage: 'quick-start',
                },
            ],
        })

        expect(resources.map((resource) => resource.href)).toEqual([
            'https://docs.momei.app/en-US/guide/deploy',
            'https://docs.momei.app/en-US/guide/quick-start',
            'https://docs.momei.app/en-US/guide/variables',
            '/feedback',
        ])
    })

    it('should omit untranslated variables page for ja-JP', () => {
        const resources = buildInstallationDocResources({
            locale: 'ja-JP',
            issues: [],
        })

        expect(resources.map((resource) => resource.href)).toEqual([
            'https://docs.momei.app/ja-JP/guide/quick-start',
            'https://docs.momei.app/ja-JP/guide/deploy',
            '/feedback',
        ])
    })
})
