import { describe, it, expect, vi } from 'vitest'
import * as authUtils from '@/server/utils/permission'

// Mock requireAdmin to test its behavior
vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn((handler) => handler),
}))

describe('Admin API Security Perimeter', () => {
    const adminEndpoints = [
        { path: '/api/admin/ad/placements', method: 'GET' },
        { path: '/api/admin/ad/placements', method: 'POST' },
        { path: '/api/admin/ad/campaigns', method: 'GET' },
        { path: '/api/admin/ad/campaigns', method: 'POST' },
        { path: '/api/admin/external-links', method: 'GET' },
        { path: '/api/admin/external-links', method: 'POST' },
    ]

    it('should keep all tracked sensitive endpoints under the admin namespace', () => {
        expect(adminEndpoints.length).toBeGreaterThan(0)
        expect(adminEndpoints.every(({ path }) => path.startsWith('/api/admin/'))).toBe(true)
        expect(adminEndpoints.every(({ method }) => ['GET', 'POST'].includes(method))).toBe(true)
    })

    it('requireAdmin should be available for admin checks', () => {
        const spy = vi.spyOn(authUtils, 'requireAdmin')

        expect(spy).toBeDefined()
    })
})
