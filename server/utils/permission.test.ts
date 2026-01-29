import { describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { requireAdmin, requireAdminOrAuthor, requireAuth, requireRole } from './permission'
import { UserRole } from '@/utils/shared/roles'

// Mock auth module
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}))

describe('permission utils', () => {
    describe('requireAuth', () => {
        it('应该在用户已登录时返回 session', async () => {
            const mockSession = {
                user: { id: '1', name: 'Test User', role: UserRole.USER },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            const result = await requireAuth(mockEvent)
            expect(result).toEqual(mockSession)
        })

        it('应该在用户未登录时抛出 401 错误', async () => {
            const mockEvent = {
                context: {},
                headers: new Headers(),
            } as unknown as H3Event

            const { auth } = await import('@/lib/auth')
            vi.mocked(auth.api.getSession).mockResolvedValue(null)

            await expect(requireAuth(mockEvent)).rejects.toThrow()
        })

        it('应该在 session 存在但无 user 时抛出 401 错误', async () => {
            const mockEvent = {
                context: {},
                headers: new Headers(),
            } as unknown as H3Event

            const { auth } = await import('@/lib/auth')
            vi.mocked(auth.api.getSession).mockResolvedValue({} as any)

            await expect(requireAuth(mockEvent)).rejects.toThrow()
        })
    })

    describe('requireRole', () => {
        it('应该在用户具有指定角色时返回 session', async () => {
            const mockSession = {
                user: { id: '1', name: 'Admin', role: UserRole.ADMIN },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            const result = await requireRole(mockEvent, [UserRole.ADMIN])
            expect(result).toEqual(mockSession)
        })

        it('应该在用户不具有指定角色时抛出 403 错误', async () => {
            const mockSession = {
                user: { id: '1', name: 'User', role: UserRole.USER },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            await expect(requireRole(mockEvent, [UserRole.ADMIN])).rejects.toThrow()
        })

        it('应该支持多个角色检查', async () => {
            const mockSession = {
                user: { id: '1', name: 'Author', role: UserRole.AUTHOR },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            const result = await requireRole(mockEvent, [UserRole.ADMIN, UserRole.AUTHOR])
            expect(result).toEqual(mockSession)
        })
    })

    describe('requireAdmin', () => {
        it('应该在用户是管理员时返回 session', async () => {
            const mockSession = {
                user: { id: '1', name: 'Admin', role: UserRole.ADMIN },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            const result = await requireAdmin(mockEvent)
            expect(result).toEqual(mockSession)
        })

        it('应该在用户不是管理员时抛出 403 错误', async () => {
            const mockSession = {
                user: { id: '1', name: 'User', role: UserRole.USER },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            await expect(requireAdmin(mockEvent)).rejects.toThrow()
        })
    })

    describe('requireAdminOrAuthor', () => {
        it('应该在用户是管理员时返回 session', async () => {
            const mockSession = {
                user: { id: '1', name: 'Admin', role: UserRole.ADMIN },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            const result = await requireAdminOrAuthor(mockEvent)
            expect(result).toEqual(mockSession)
        })

        it('应该在用户是作者时返回 session', async () => {
            const mockSession = {
                user: { id: '1', name: 'Author', role: UserRole.AUTHOR },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            const result = await requireAdminOrAuthor(mockEvent)
            expect(result).toEqual(mockSession)
        })

        it('应该在用户既不是管理员也不是作者时抛出 403 错误', async () => {
            const mockSession = {
                user: { id: '1', name: 'User', role: UserRole.USER },
            }
            const mockEvent = {
                context: { auth: mockSession },
                headers: new Headers(),
            } as unknown as H3Event

            await expect(requireAdminOrAuthor(mockEvent)).rejects.toThrow()
        })
    })
})

