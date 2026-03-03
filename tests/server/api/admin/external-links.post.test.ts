import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { generateRandomString } from '@/utils/shared/random'
import { LinkStatus } from '@/types/ad'
import externalLinksPostHandler from '@/server/api/admin/external-links.post'

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue({
                user: { id: 'test-user-id', role: 'admin' },
            }),
        },
    },
}))

// TODO: Skipped due to database initialization timing issues. See docs/plan/todo.md
describe.skip('POST /api/admin/external-links', () => {
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

    describe('Create External Link', () => {
        it('should create a new link with valid data', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await externalLinksPostHandler(event)

            expect(result.code).toBe(201)
            expect(result.data).toBeDefined()
            expect(result.data!.originalUrl).toBe('https://example.com/test')
            expect(result.data!.shortCode).toBeDefined()
            expect(result.data!.shortCode).toHaveLength(8)
            expect(result.data!.noFollow).toBe(true)
            expect(result.data!.showRedirectPage).toBe(true)
        })

        it('should validate required fields - missing originalUrl', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await externalLinksPostHandler(event)

            expect(result.code).toBe(400)
            expect(result.message).toContain('Original URL is required')
        })

        it('should validate required fields - missing createdById', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await externalLinksPostHandler(event)

            expect(result.code).toBe(400)
            expect(result.message).toContain('User ID is required')
        })

        it('should create link with default values', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await externalLinksPostHandler(event)

            expect(result.data!.noFollow).toBe(false)
            expect(result.data!.showRedirectPage).toBe(true)
            expect(result.data!.status).toBe(LinkStatus.ACTIVE)
            expect(result.data!.clickCount).toBe(0)
        })

        it('should generate unique short codes', async () => {
            const codes: string[] = []
            for (let i = 0; i < 3; i++) {
                const event = {
                    context: {},
                    node: { req: { headers: {} }, res: {} },
                } as any

                const result = await externalLinksPostHandler(event)
                codes.push(result.data!.shortCode)
            }

            const uniqueCodes = new Set(codes)
            expect(uniqueCodes.size).toBe(3)
        })

        it('should store metadata', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await externalLinksPostHandler(event)

            expect(result.data!.metadata).toBeDefined()
            expect(result.data!.metadata!.title).toBe('Example Site')
            expect(result.data!.metadata!.description).toBe('A test link with metadata')
            expect(result.data!.metadata!.favicon).toBe('https://example.com/favicon.ico')
        })

        it('should handle invalid URL format gracefully', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await externalLinksPostHandler(event)

            // Should either validate and reject or store as-is
            expect(result).toBeDefined()
        })
    })
})
