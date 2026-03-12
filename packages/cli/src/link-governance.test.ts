import { describe, expect, it } from 'vitest'
import { buildLinkGovernanceRequest, buildLinkGovernanceSeeds, parseCliLinkGovernanceScopes } from './link-governance'
import type { ParsedHexoPost } from './types'

function createEntry(overrides: Partial<ParsedHexoPost> = {}): ParsedHexoPost {
    return {
        file: '/tmp/source/hello-world.md',
        relativeFile: 'posts/hello-world.md',
        frontMatter: {
            title: 'Hello World',
            date: '2024-02-03T00:00:00.000Z',
            permalink: '/:year/:month/:day/:slug/',
            categories: ['Guides'],
        },
        content: '# hello',
        post: {
            title: 'Hello World',
            content: '# hello',
            slug: 'hello-world',
            language: 'zh-CN',
            status: 'published',
            visibility: 'public',
        },
        ...overrides,
    }
}

describe('cli link governance helpers', () => {
    it('should render legacy permalink templates into exact seeds', () => {
        const seeds = buildLinkGovernanceSeeds([createEntry()], {
            legacyOrigin: 'https://legacy.example.com',
        })

        expect(seeds).toEqual(expect.arrayContaining([
            expect.objectContaining({
                source: '/2024/02/03/hello-world',
                sourceKind: 'root-relative',
                targetRef: { slug: 'hello-world' },
            }),
            expect.objectContaining({
                source: 'https://legacy.example.com/2024/02/03/hello-world',
                sourceKind: 'absolute',
            }),
        ]))
    })

    it('should skip unresolved permalink templates', () => {
        const seeds = buildLinkGovernanceSeeds([createEntry({
            frontMatter: {
                title: 'Hello World',
                permalink: '/:unknown/:slug/',
            },
        })])

        expect(seeds).toEqual([])
    })

    it('should build governance request with retry and relative options', () => {
        const request = buildLinkGovernanceRequest([createEntry()], {
            scopes: ['post-link', 'permalink-rule'],
            domains: ['legacy.example.com'],
            pathPrefixes: ['/uploads'],
            validationMode: 'static+online',
            allowRelativeLinks: true,
            retryFailuresFromReportId: 'report-1',
            skipConfirmation: true,
            reportFormat: 'markdown',
        })

        expect(request.scopes).toEqual(['post-link', 'permalink-rule'])
        expect(request.filters).toEqual({
            domains: ['legacy.example.com'],
            pathPrefixes: ['/uploads'],
            contentTypes: ['post'],
        })
        expect(request.options).toEqual({
            reportFormat: 'markdown',
            validationMode: 'static+online',
            allowRelativeLinks: true,
            retryFailuresFromReportId: 'report-1',
            skipConfirmation: true,
        })
        expect(request.seeds?.length).toBe(1)
    })

    it('should reject unsupported scopes from cli input', () => {
        expect(() => parseCliLinkGovernanceScopes(['post-link', 'invalid-scope'])).toThrow('Unsupported scopes: invalid-scope')
    })

    it('should read category alias when rendering permalink replacements', () => {
        const seeds = buildLinkGovernanceSeeds([createEntry({
            frontMatter: {
                title: 'Hello World',
                date: '2024-02-03T00:00:00.000Z',
                permalink: '/:category/:slug/',
                category: ['Guides'],
            },
        })])

        expect(seeds[0]).toEqual(expect.objectContaining({
            source: '/guides/hello-world',
        }))
    })
})
