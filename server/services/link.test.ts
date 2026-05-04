import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createLink,
    deleteLink,
    extractFaviconUrl,
    generateShortCode,
    generateUniqueShortCode,
    getAllLinks,
    getLinkById,
    getLinkByShortCode,
    getLinkStats,
    isBlacklistedUrl,
    isValidUrl,
    recordClick,
    updateLink,
    updateLinkClickCount,
    updateLinkStatus,
    updateLinkStatusBulk,
} from './link'
import { dataSource, initializeDB } from '@/server/database'
import { ExternalLink } from '@/server/entities/external-link'
import { User } from '@/server/entities/user'
import { LinkStatus } from '@/types/ad'

describe('link service (pure functions)', () => {
    describe('generateShortCode', () => {
        it('generates a code of default length 6', () => {
            const code = generateShortCode()
            expect(code).toHaveLength(6)
        })

        it('generates a code of specified length', () => {
            expect(generateShortCode(4)).toHaveLength(4)
            expect(generateShortCode(8)).toHaveLength(8)
        })

        it('only contains alphanumeric characters', () => {
            const code = generateShortCode(20)
            expect(code).toMatch(/^[0-9a-zA-Z]+$/)
        })

        it('generates unique codes on successive calls', () => {
            const codes = new Set(Array.from({ length: 50 }, () => generateShortCode()))
            expect(codes.size).toBeGreaterThan(45)
        })
    })

    describe('isValidUrl', () => {
        it('returns true for valid http URL', () => {
            expect(isValidUrl('http://example.com')).toBe(true)
        })

        it('returns true for valid https URL', () => {
            expect(isValidUrl('https://example.com/path?q=1')).toBe(true)
        })

        it('returns false for ftp URL', () => {
            expect(isValidUrl('ftp://example.com')).toBe(false)
        })

        it('returns false for non-URL string', () => {
            expect(isValidUrl('not-a-url')).toBe(false)
            expect(isValidUrl('')).toBe(false)
        })

        it('returns false for javascript: protocol', () => {
            expect(isValidUrl('javascript:alert(1)')).toBe(false)
        })
    })

    describe('isBlacklistedUrl', () => {
        it('returns false when URL is not on blacklist', () => {
            expect(isBlacklistedUrl('https://example.com', ['bad.com', 'evil.org'])).toBe(false)
        })

        it('returns true when hostname exactly matches blacklist', () => {
            expect(isBlacklistedUrl('https://bad.com/path', ['bad.com'])).toBe(true)
        })

        it('returns true for subdomains of blacklisted domain', () => {
            expect(isBlacklistedUrl('https://sub.bad.com', ['bad.com'])).toBe(true)
        })

        it('returns false when only suffix matches (not subdomain)', () => {
            expect(isBlacklistedUrl('https://notbad.com', ['bad.com'])).toBe(false)
        })

        it('returns true for invalid URL (cannot be parsed)', () => {
            expect(isBlacklistedUrl('not-a-url', [])).toBe(true)
        })

        it('returns false with empty blacklist', () => {
            expect(isBlacklistedUrl('https://example.com', [])).toBe(false)
        })

        it('is case-insensitive for comparison', () => {
            expect(isBlacklistedUrl('https://BAD.COM', ['bad.com'])).toBe(true)
        })
    })

    describe('extractFaviconUrl', () => {
        it('extracts favicon URL from valid https URL', () => {
            expect(extractFaviconUrl('https://example.com/page')).toBe('https://example.com/favicon.ico')
        })

        it('extracts favicon URL from valid http URL', () => {
            expect(extractFaviconUrl('http://sub.example.com/path')).toBe('http://sub.example.com/favicon.ico')
        })

        it('returns empty string for invalid URL', () => {
            expect(extractFaviconUrl('not-a-url')).toBe('')
        })
    })
})

async function createUser() {
    const user = new User()
    user.name = 'Link Tester'
    user.email = `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
    user.role = 'author'
    return dataSource.getRepository(User).save(user)
}

describe('link service (integration)', () => {
    beforeAll(async () => {
        await initializeDB()
    })

    beforeEach(async () => {
        delete process.env.EXTERNAL_LINK_BLACKLIST
        await dataSource.getRepository(ExternalLink).clear()
        await dataSource.getRepository(User).clear()
    })

    afterEach(() => {
        delete process.env.EXTERNAL_LINK_BLACKLIST
        vi.restoreAllMocks()
    })

    it('creates a link, extracts favicon, and exposes it through lookup helpers', async () => {
        const user = await createUser()
        const link = await createLink({
            originalUrl: 'https://docs.example.com/guide',
            createdById: user.id,
            noFollow: true,
            showRedirectPage: false,
            metadata: {
                title: 'Docs',
            },
        })

        expect(link.status).toBe(LinkStatus.ACTIVE)
        expect(link.noFollow).toBe(true)
        expect(link.showRedirectPage).toBe(false)
        expect(link.metadata?.favicon).toBe('https://docs.example.com/favicon.ico')

        const byId = await getLinkById(link.id)
        const byShortCode = await getLinkByShortCode(link.shortCode)
        const stats = await getLinkStats(link.id)

        expect(byId?.createdBy.id).toBe(user.id)
        expect(byShortCode?.id).toBe(link.id)
        expect(stats).toEqual(expect.objectContaining({
            id: link.id,
            shortCode: link.shortCode,
            originalUrl: 'https://docs.example.com/guide',
            clickCount: 0,
            status: LinkStatus.ACTIVE,
        }))
    })

    it('rejects blacklisted urls when EXTERNAL_LINK_BLACKLIST is configured', async () => {
        const user = await createUser()
        process.env.EXTERNAL_LINK_BLACKLIST = 'blocked.example.com, evil.test '

        await expect(createLink({
            originalUrl: 'https://blocked.example.com/post',
            createdById: user.id,
        })).rejects.toThrow('URL is blacklisted')
    })

    it('lists links with relations and ignores createdBy relation updates', async () => {
        const user = await createUser()
        const otherUser = await createUser()
        const first = await createLink({
            originalUrl: 'https://example.com/a',
            createdById: user.id,
        })
        await createLink({
            originalUrl: 'https://example.com/b',
            createdById: user.id,
        })

        const links = await getAllLinks()
        expect(links).toHaveLength(2)
        expect(links[0]?.createdBy).toBeDefined()
        expect(links[1]?.createdBy).toBeDefined()

        const updated = await updateLink(first.id, {
            originalUrl: 'https://example.com/a-updated',
            noFollow: true,
            createdBy: otherUser,
        } as ExternalLink)

        expect(updated?.originalUrl).toBe('https://example.com/a-updated')
        expect(updated?.noFollow).toBe(true)
        expect(updated?.createdById).toBe(user.id)
    })

    it('updates statuses individually and in bulk', async () => {
        const user = await createUser()
        const first = await createLink({
            originalUrl: 'https://example.com/a',
            createdById: user.id,
        })
        const second = await createLink({
            originalUrl: 'https://example.com/b',
            createdById: user.id,
        })
        const third = await createLink({
            originalUrl: 'https://example.com/c',
            createdById: user.id,
        })

        const expired = await updateLinkStatus(first.id, LinkStatus.EXPIRED)
        await updateLinkStatusBulk([second.id, third.id], LinkStatus.BLOCKED)

        const reloadedSecond = await getLinkById(second.id)
        const reloadedThird = await getLinkById(third.id)

        expect(expired?.status).toBe(LinkStatus.EXPIRED)
        expect(reloadedSecond?.status).toBe(LinkStatus.BLOCKED)
        expect(reloadedThird?.status).toBe(LinkStatus.BLOCKED)
    })

    it('increments click counts by short code and by id', async () => {
        const user = await createUser()
        const link = await createLink({
            originalUrl: 'https://example.com/clicks',
            createdById: user.id,
        })

        const clicked = await recordClick(link.shortCode)
        await updateLinkClickCount(link.id)
        const refreshed = await getLinkById(link.id)

        expect(clicked?.clickCount).toBe(1)
        expect(refreshed?.clickCount).toBe(2)
    })

    it('supports delete, invalid update rejection, and missing stats', async () => {
        const user = await createUser()
        const link = await createLink({
            originalUrl: 'https://example.com/delete-me',
            createdById: user.id,
        })

        await expect(updateLink(link.id, { originalUrl: 'not-a-url' })).rejects.toThrow('Invalid URL')
        await expect(getLinkStats('missing-link-id')).resolves.toBeNull()
        await expect(deleteLink(link.id)).resolves.toBe(true)
        await expect(getLinkById(link.id)).resolves.toBeNull()
    })

    it('falls back to a longer short code after repeated collisions', async () => {
        const repositoryStub = {
            findOne: vi.fn().mockResolvedValue({ id: 'existing-link' }),
        }
        vi.spyOn(dataSource, 'getRepository').mockReturnValue(repositoryStub as never)

        const shortCode = await generateUniqueShortCode(2)

        expect(repositoryStub.findOne).toHaveBeenCalledTimes(2)
        expect(shortCode).toHaveLength(8)
    })

    it('swallows repository failures for delete and click tracking updates', async () => {
        const repositoryStub = {
            delete: vi.fn().mockRejectedValue(new Error('delete failed')),
            increment: vi.fn().mockRejectedValue(new Error('increment failed')),
        }
        vi.spyOn(dataSource, 'getRepository').mockReturnValue(repositoryStub as never)

        await expect(deleteLink('missing-link')).resolves.toBe(false)
        await expect(updateLinkClickCount('missing-link')).resolves.toBeUndefined()
    })
})
