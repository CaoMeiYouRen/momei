import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateImportPathAliases } from './import-path-alias'
import { dataSource } from '@/server/database'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

describe('import path alias validation service', () => {
    const findOne = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        findOne.mockResolvedValue(null)
        vi.mocked(dataSource.getRepository).mockReturnValue({ findOne } as never)
    })

    it('accepts a valid slug without confirmation', async () => {
        const report = await validateImportPathAliases({
            title: 'Hexo Post',
            slug: 'hexo-post',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(false)
        expect(report.canonicalSlug).toBe('hexo-post')
        expect(report.items.find((item) => item.field === 'canonical')?.status).toBe('accepted')
    })

    it('accepts abbrlink as canonical when slug is absent', async () => {
        const report = await validateImportPathAliases({
            title: 'Abbrlink Only',
            abbrlink: 'abbrlink-only-post',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(false)
        expect(report.canonicalSlug).toBe('abbrlink-only-post')
        expect(report.canonicalSource).toBe('abbrlink')
        expect(report.items.find((item) => item.field === 'canonical')?.status).toBe('accepted')
    })

    it('repairs non-canonical slugs and requires confirmation before import', async () => {
        const report = await validateImportPathAliases({
            title: 'Hello World',
            slug: 'Hello, World!',
            language: 'en-US',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.canonicalSlug).toBe('hello-world')
        expect(report.canonicalSource).toBe('repair')
        expect(report.items.find((item) => item.field === 'slug')?.status).toBe('repaired')
        expect(report.items.find((item) => item.field === 'canonical')?.status).toBe('repaired')
    })

    it('rejects repaired slugs when the normalized alias still conflicts in the same language', async () => {
        findOne.mockImplementation(({ where }: { where: { slug: string } }) => where.slug === 'hello-world' ? { id: 'post-1' } : null)

        const report = await validateImportPathAliases({
            title: 'Hello World',
            slug: 'Hello, World!',
            language: 'en-US',
        })

        expect(report.canImport).toBe(false)
        expect(report.hasBlockingIssues).toBe(true)
        expect(report.canonicalSlug).toBeNull()
        expect(report.items.find((item) => item.field === 'slug')?.status).toBe('conflict')
        expect(report.items.find((item) => item.field === 'slug')?.resolvedValue).toBe('hello-world')
    })

    it('falls back to abbrlink when the slug hits a reserved word', async () => {
        const report = await validateImportPathAliases({
            title: 'About Post',
            slug: 'about',
            abbrlink: 'about-post',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.canonicalSlug).toBe('about-post')
        expect(report.items.find((item) => item.field === 'slug')?.status).toBe('conflict')
        expect(report.items.find((item) => item.field === 'canonical')?.status).toBe('fallback')
    })

    it('rejects same-language slug conflicts when no fallback is available', async () => {
        findOne.mockImplementation(({ where }: { where: { slug: string } }) => where.slug === 'taken-post' ? { id: 'post-1' } : null)

        const report = await validateImportPathAliases({
            title: 'Taken Post',
            slug: 'taken-post',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(false)
        expect(report.hasBlockingIssues).toBe(true)
        expect(report.canonicalSlug).toBeNull()
        expect(report.items.find((item) => item.field === 'slug')?.status).toBe('conflict')
    })

    it('falls back to a source-file-derived slug when explicit aliases are unusable', async () => {
        const report = await validateImportPathAliases({
            title: 'Imported Post',
            slug: 'about',
            sourceFile: 'C:\\imports\\posts\\source-file-post.md',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.canonicalSlug).toBe('source-file-post')
        expect(report.canonicalSource).toBe('source-file')
        expect(report.items.find((item) => item.field === 'canonical')?.status).toBe('fallback')
    })

    it('derives the canonical slug from title when no explicit alias is provided', async () => {
        const report = await validateImportPathAliases({
            title: 'Title Only Post',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(false)
        expect(report.canonicalSlug).toBe('title-only-post')
        expect(report.canonicalSource).toBe('title')
        expect(report.items.find((item) => item.field === 'canonical')?.status).toBe('accepted')
    })

    it('marks snowflake-like aliases as invalid', async () => {
        const report = await validateImportPathAliases({
            title: 'Snowflake Alias',
            slug: '1234567890abcde',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.canonicalSlug).toBe('snowflake-alias')
        expect(report.canonicalSource).toBe('title')
        expect(report.items.find((item) => item.field === 'slug')?.reason).toBe('snowflake-id')
        expect(report.items.find((item) => item.field === 'canonical')?.status).toBe('fallback')
    })

    it('marks reserved permalink paths as confirmation-required instead of silently ignoring them', async () => {
        const report = await validateImportPathAliases({
            title: 'Policy Post',
            slug: 'policy-post',
            permalink: '/privacy-policy/',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.items.find((item) => item.field === 'permalink')?.status).toBe('needs-confirmation')
    })

    it('marks reserved admin permalink prefixes as confirmation-required', async () => {
        const report = await validateImportPathAliases({
            title: 'Admin Prefix Post',
            slug: 'admin-prefix-post',
            permalink: '/admin/tools/admin-prefix-post',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.items.find((item) => item.field === 'permalink')?.reason).toBe('reserved-permalink-path')
    })

    it('flags permalink templates with unknown tokens for manual confirmation', async () => {
        const report = await validateImportPathAliases({
            title: 'Series Post',
            slug: 'series-post',
            permalink: '/:series/:slug',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.items.find((item) => item.field === 'permalink')?.reason).toBe('unknown-permalink-token')
    })

    it('flags permalink templates with missing token context for manual confirmation', async () => {
        const report = await validateImportPathAliases({
            title: 'Missing Category',
            slug: 'missing-category',
            permalink: '/:category/:slug',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(true)
        expect(report.items.find((item) => item.field === 'permalink')?.reason).toBe('missing-permalink-token')
    })

    it('accepts absolute permalinks that resolve to the canonical post path', async () => {
        const report = await validateImportPathAliases({
            title: 'Canonical Link',
            slug: 'canonical-link',
            permalink: 'https://momei.app/posts/:slug',
            language: 'en-US',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(false)
        expect(report.items.find((item) => item.field === 'permalink')?.status).toBe('accepted')
        expect(report.items.find((item) => item.field === 'permalink')?.resolvedValue).toBe('/posts/canonical-link')
    })

    it('rejects malformed absolute permalink URLs that cannot be parsed', async () => {
        const report = await validateImportPathAliases({
            title: 'Malformed URL',
            slug: 'malformed-url',
            permalink: 'https://%zz',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.items.find((item) => item.field === 'permalink')?.status).toBe('invalid')
        expect(report.items.find((item) => item.field === 'permalink')?.reason).toBe('invalid-format')
    })

    it('rejects permalinks that normalize to an empty path', async () => {
        const report = await validateImportPathAliases({
            title: 'Empty Permalink',
            slug: 'empty-permalink',
            permalink: '////',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.items.find((item) => item.field === 'permalink')?.status).toBe('invalid')
        expect(report.items.find((item) => item.field === 'permalink')?.reason).toBe('invalid-format')
    })

    it('rejects permalinks whose path segments collapse during normalization', async () => {
        const report = await validateImportPathAliases({
            title: 'Collapsed Segment',
            slug: 'collapsed-segment',
            permalink: '/posts/!!!/:slug',
            language: 'zh-CN',
        })

        expect(report.canImport).toBe(true)
        expect(report.items.find((item) => item.field === 'permalink')?.status).toBe('invalid')
        expect(report.items.find((item) => item.field === 'permalink')?.reason).toBe('invalid-format')
    })

    it('renders UTC date tokens in permalink templates via shared date helpers', async () => {
        const report = await validateImportPathAliases({
            title: 'Dated Post',
            slug: 'dated-post',
            permalink: '/:year/:month/:day/:slug/',
            createdAt: '2026-03-12T23:30:00.000Z',
            language: 'en-US',
        })

        expect(report.canImport).toBe(true)
        expect(report.requiresConfirmation).toBe(false)
        expect(report.items.find((item) => item.field === 'permalink')?.resolvedValue).toBe('/2026/03/12/dated-post')
    })
})
