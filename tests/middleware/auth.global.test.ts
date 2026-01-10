import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const mockNavigateTo = vi.fn((path) => path)
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useFetch', vi.fn())
vi.stubGlobal('useRequestHeaders', vi.fn(() => ({})))
vi.stubGlobal('defineNuxtRouteMiddleware', (cb: any) => cb)

// Delay import until globals are stubbed
const authMiddleware = (await import('@/middleware/auth.global')).default
const { authClient } = await import('@/lib/auth-client')

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(),
    },
}))

describe('auth.global middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should allow access to public home page', async () => {
        const result = await (authMiddleware as any)({ path: '/' }, {})
        expect(result).toBe(true)
    })

    it('should allow access to explicit public paths', async () => {
        const result = await (authMiddleware as any)({ path: '/login' }, {})
        expect(result).toBe(true)
    })

    it('should allow access to post pages', async () => {
        const result = await (authMiddleware as any)({ path: '/posts/123' }, {})
        expect(result).toBe(true)
    })

    it('should allow access to auth API paths except admin', async () => {
        const result = await (authMiddleware as any)({ path: '/api/auth/login' }, {})
        expect(result).toBe(true)
    })

    it('should redirect to login if session is missing', async () => {
        vi.mocked(authClient.useSession).mockReturnValue(Promise.resolve({ data: ref(null) }) as any)

        const result = await (authMiddleware as any)({ path: '/settings' }, {})
        // In Nuxt test environment, navigateTo might throw or return a redirect
        // We just want to ensure it's not true/undefined
        expect(result).not.toBe(true)
    })

    it('should allow access if session exists', async () => {
        vi.mocked(authClient.useSession).mockReturnValue(Promise.resolve({
            data: ref({ user: { id: '1', role: 'user' } }),
        }) as any)

        const result = await (authMiddleware as any)({ path: '/settings' }, {})
        expect(result).toBe(true)
    })

    it('should redirect from admin page if user is not admin', async () => {
        vi.mocked(authClient.useSession).mockReturnValue(Promise.resolve({
            data: ref({ user: { id: '1', role: 'user' } }),
        }) as any)

        const result = await (authMiddleware as any)({ path: '/admin/users' }, {})
        expect(result).not.toBe(true)
    })

    it('should allow admin to access admin page', async () => {
        vi.mocked(authClient.useSession).mockReturnValue(Promise.resolve({
            data: ref({ user: { id: '1', role: 'admin' } }),
        }) as any)

        const result = await (authMiddleware as any)({ path: '/admin/users' }, {})
        expect(result).toBe(true)
    })
})
