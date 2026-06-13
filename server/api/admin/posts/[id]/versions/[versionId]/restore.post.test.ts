import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './restore.post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { restorePostVersionService } from '@/server/services/post-version'

vi.mock('@/server/utils/permission')
vi.mock('@/server/services/post-version', () => ({
    restorePostVersionService: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, getRequestHeader: vi.fn(() => 'test-agent'), getRequestIP: vi.fn(() => '127.0.0.1') }
})

const { getRouterParam, createError } = global as any

describe('POST /api/admin/posts/[id]/versions/[versionId]/restore', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as any)
        vi.mocked(getRouterParam).mockImplementation((_e: any, name: string) => name === 'id' ? 'post-1' : 'ver-1')
        vi.mocked(restorePostVersionService).mockResolvedValue({ title: 'Restored' } as any)
    })

    it('should restore a post version successfully', async () => {
        const result = await handler({} as any)
        expect(result?.code).toBe(200)
        expect(restorePostVersionService).toHaveBeenCalledWith('post-1', 'ver-1', expect.any(Object), expect.any(Object))
    })

    it('should throw when params are missing', async () => {
        vi.mocked(getRouterParam).mockReturnValue(undefined)
        await expect(handler({} as any)).rejects.toThrow()
    })

    it('should require admin or author permission', async () => {
        vi.mocked(requireAdminOrAuthor).mockRejectedValue(new Error('Forbidden'))
        await expect(handler({} as any)).rejects.toThrow('Forbidden')
    })
})
