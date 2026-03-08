import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
        ...actual,
        getRouterParam: (event: any, key: string) => event.params?.[key],
    }
})

import handler from './[id].get'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/services/ai')
vi.mock('@/server/utils/permission')

describe('GET /api/ai/task/status/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should hide raw data for non-admin callers', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)
        vi.mocked(TextService.getTaskStatus).mockResolvedValue({
            id: 'task-1',
            status: 'processing',
            progress: 50,
            error: null,
            updatedAt: '2026-03-09T00:00:00.000Z',
        } as any)

        const result = await handler({
            context: {},
            params: { id: 'task-1' },
        } as any)

        expect(TextService.getTaskStatus).toHaveBeenCalledWith('task-1', 'user-1', {
            isAdmin: false,
            includeRaw: false,
        })
        expect(result).toEqual({
            code: 200,
            data: {
                id: 'task-1',
                status: 'processing',
                progress: 50,
                error: null,
                updatedAt: '2026-03-09T00:00:00.000Z',
            },
        })
    })

    it('should allow admin callers to request raw data', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' },
        } as any)
        vi.mocked(TextService.getTaskStatus).mockResolvedValue({
            id: 'task-1',
            status: 'completed',
            progress: 100,
            result: {
                images: [{ url: '/image.png' }],
                raw: { requestId: 'req-1' },
            },
            error: null,
            updatedAt: '2026-03-09T00:00:00.000Z',
        } as any)

        const result = await handler({
            context: {},
            params: { id: 'task-1' },
        } as any)

        expect(TextService.getTaskStatus).toHaveBeenCalledWith('task-1', 'admin-1', {
            isAdmin: true,
            includeRaw: true,
        })
        expect(result).toEqual({
            code: 200,
            data: {
                id: 'task-1',
                status: 'completed',
                progress: 100,
                result: {
                    images: [{ url: '/image.png' }],
                    raw: { requestId: 'req-1' },
                },
                error: null,
                updatedAt: '2026-03-09T00:00:00.000Z',
            },
        })
    })
})
