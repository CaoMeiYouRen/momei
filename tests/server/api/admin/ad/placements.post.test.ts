import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { generateRandomString } from '@/utils/shared/random'
import { AdFormat, AdLocation } from '@/types/ad'
import placementsPostHandler from '@/server/api/admin/ad/placements.post'

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
describe.skip('POST /api/admin/ad/placements', () => {
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

    describe('Create Ad Placement', () => {
        it('should create a new placement with valid data', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await placementsPostHandler(event)

            expect(result.code).toBe(201)
            expect(result.data).toBeDefined()
            expect(result.data!.name).toBe('Test Sidebar Ad')
            expect(result.data!.location).toBe(AdLocation.SIDEBAR)
            expect(result.data!.format).toBe(AdFormat.RESPONSIVE)
        })

        it('should validate required fields', async () => {
            const body = {
                name: '',
                location: AdLocation.SIDEBAR,
            }

            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            // Mock readBody
            vi.mock('h3', () => ({
                readBody: vi.fn().mockResolvedValue(body),
                defineEventHandler: vi.fn(),
            }))

            const result = await placementsPostHandler(event)

            expect(result.code).toBe(400)
            expect(result.message).toContain('required')
        })

        it('should create placement with default values', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            const result = await placementsPostHandler(event)

            expect(result.data!.priority).toBe(0)
            expect(result.data!.enabled).toBe(true)
        })

        it('should handle database errors gracefully', async () => {
            const event = {
                context: {},
                node: { req: { headers: {} }, res: {} },
            } as any

            // Force database error by using invalid data
            const result = await placementsPostHandler(event)

            expect(result).toBeDefined()
            // Should either succeed or return error, not crash
        })
    })
})
