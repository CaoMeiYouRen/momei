import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './[id].get'
import { dataSource } from '@/server/database'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/database')
vi.mock('@/server/utils/permission')

describe('GET /api/tasks/tts/[id]', () => {
    let mockRepo: { findOneBy: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        vi.clearAllMocks()
        mockRepo = {
            findOneBy: vi.fn(),
        }
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
    })

    it('should allow owner to read task', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-1', role: 'author' },
        } as any)

        mockRepo.findOneBy.mockResolvedValue({
            id: 'task-1',
            userId: 'user-1',
        })

        const result = await handler({
            context: {
                params: { id: 'task-1' },
            },
        } as any)

        expect(result).toEqual(expect.objectContaining({ id: 'task-1' }))
    })

    it('should reject non-owner non-admin', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'user-2', role: 'author' },
        } as any)

        mockRepo.findOneBy.mockResolvedValue({
            id: 'task-1',
            userId: 'user-1',
        })

        await expect(handler({
            context: {
                params: { id: 'task-1' },
            },
        } as any)).rejects.toThrow('Forbidden')
    })

    it('should allow admin to read other user task', async () => {
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' },
        } as any)

        mockRepo.findOneBy.mockResolvedValue({
            id: 'task-1',
            userId: 'user-1',
        })

        const result = await handler({
            context: {
                params: { id: 'task-1' },
            },
        } as any)

        expect(result).toEqual(expect.objectContaining({ id: 'task-1' }))
    })
})
