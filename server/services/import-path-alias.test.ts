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
