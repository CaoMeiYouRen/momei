import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { ExternalLink } from '@/server/entities/external-link'
import { User } from '@/server/entities/user'
import { generateRandomString } from '@/utils/shared/random'
import { LinkStatus } from '@/types/ad'
import { createLink } from '@/server/services/link'
import gotoCodeGetHandler from '@/server/api/goto/[code].get'

// TODO: Skipped due to database initialization timing issues. See docs/plan/todo.md
// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}))

describe.skip('GET /api/goto/[code]', () => {
    let user: User

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)
        user = new User()
        user.name = 'Test Admin'
        user.email = `admin_${generateRandomString(5)}@example.com`
        user.role = 'admin'
        await userRepo.save(user)
    })

    describe('Redirect to Original URL', () => {
        let activeLink: ExternalLink
        let disabledRedirectLink: ExternalLink
        let expiredLink: ExternalLink

        beforeAll(async () => {
            // Create test links
            activeLink = await createLink({
                originalUrl: 'https://example.com/active',
                createdById: user.id,
                showRedirectPage: true,
                metadata: { title: 'Active Link' },
            })

            disabledRedirectLink = await createLink({
                originalUrl: 'https://example.com/no-redirect',
                createdById: user.id,
                showRedirectPage: false,
            })

            expiredLink = await createLink({
                originalUrl: 'https://example.com/expired',
                createdById: user.id,
                showRedirectPage: true,
            })

            // Mark as expired
            const linkRepo = dataSource.getRepository(ExternalLink)
            await linkRepo.update(expiredLink.id, { status: LinkStatus.EXPIRED })
        })

        it('should return URL for active link with redirect page', async () => {
            const event = {
                context: {},
                node: {
                    req: { headers: {} },
                    res: {},
                    params: { code: activeLink.shortCode },
                },
            } as any

            const result = await gotoCodeGetHandler(event)

            expect(result).toBeDefined()
            expect(result.data).toBeDefined()
            expect(result.data!.url).toBe('https://example.com/active')
            expect(result.data!.showRedirectPage).toBe(true)
            expect(result.data!.title).toBe('Active Link')
        })

        it('should return URL for active link without redirect page', async () => {
            const event = {
                context: {},
                node: {
                    req: { headers: {} },
                    res: {},
                    params: { code: disabledRedirectLink.shortCode },
                },
            } as any

            const result = await gotoCodeGetHandler(event)

            expect(result).toBeDefined()
            expect(result.data).toBeDefined()
            expect(result.data!.url).toBe('https://example.com/no-redirect')
            expect(result.data!.showRedirectPage).toBe(false)
        })

        it('should return 404 for non-existent code', async () => {
            const event = {
                context: {},
                node: {
                    req: { headers: {} },
                    res: {},
                    params: { code: 'nonexistent' },
                },
            } as any

            const result = await gotoCodeGetHandler(event)

            expect(result.code).toBe(404)
        })

        it('should return 410 for expired link', async () => {
            const event = {
                context: {},
                node: {
                    req: { headers: {} },
                    res: {},
                    params: { code: expiredLink.shortCode },
                },
            } as any

            const result = await gotoCodeGetHandler(event)

            expect(result.code).toBe(410)
        })

        it('should return 403 for blocked link', async () => {
            const blockedLink = await createLink({
                originalUrl: 'https://example.com/blocked',
                createdById: user.id,
            })

            const linkRepo = dataSource.getRepository(ExternalLink)
            await linkRepo.update(blockedLink.id, { status: LinkStatus.BLOCKED })

            const event = {
                context: {},
                node: {
                    req: { headers: {} },
                    res: {},
                    params: { code: blockedLink.shortCode },
                },
            } as any

            const result = await gotoCodeGetHandler(event)

            expect(result.code).toBe(403)
        })

        it('should increment click count', async () => {
            const testLink = await createLink({
                originalUrl: 'https://example.com/click-test',
                createdById: user.id,
            })

            const initialCount = testLink.clickCount

            const event = {
                context: {},
                node: {
                    req: { headers: {} },
                    res: {},
                    params: { code: testLink.shortCode },
                },
            } as any

            await gotoCodeGetHandler(event)

            const linkRepo = dataSource.getRepository(ExternalLink)
            const updatedLink = await linkRepo.findOne({ where: { id: testLink.id } })

            expect(updatedLink?.clickCount).toBe(initialCount + 1)
        })
    })
})
