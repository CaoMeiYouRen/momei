import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './[id].delete'
import { submissionService } from '~/server/services/submission'
import { requireAdmin } from '~/server/utils/permission'

vi.mock('~/server/services/submission')
vi.mock('~/server/utils/permission')

const { getRouterParam } = global as any

describe('DELETE /api/admin/submissions/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should require admin before deleting submission', async () => {
        vi.mocked(requireAdmin).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' },
        } as any)
        vi.mocked(getRouterParam).mockReturnValue('12')
        vi.mocked(submissionService.deleteSubmission).mockResolvedValue(undefined)

        const result = await handler({} as any)

        expect(requireAdmin).toHaveBeenCalled()
        expect(submissionService.deleteSubmission).toHaveBeenCalledWith(12)
        expect(result).toEqual({
            code: 200,
            message: 'Submission deleted',
        })
    })

    it('should throw when admin auth fails', async () => {
        vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'))

        await expect(handler({} as any)).rejects.toThrow('Forbidden')
    })
})
