import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth } from '@/server/utils/permission'
import { checkUploadLimits, handleFileUploads } from '@/server/services/upload'
import { auth } from '@/lib/auth'
import handler from '@/server/api/user/avatar.post'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            updateUser: vi.fn(),
        },
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAuth: vi.fn(),
}))

vi.mock('@/server/services/upload', () => ({
    checkUploadLimits: vi.fn(),
    handleFileUploads: vi.fn(),
}))

describe('avatar.post API handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should upload avatar and update user image', async () => {
        const mockUser = { id: 'user-1' }
        const mockSession = { user: mockUser }
        const mockEvent = {
            headers: new Headers(),
        } as any

        vi.mocked(requireAuth).mockResolvedValue(mockSession as any)
        vi.mocked(checkUploadLimits).mockResolvedValue(undefined)
        vi.mocked(handleFileUploads).mockResolvedValue([
            { url: 'http://test.com/avatar.jpg' },
        ] as any)

        const result = await handler(mockEvent)

        expect(requireAuth).toHaveBeenCalledWith(mockEvent)
        expect(checkUploadLimits).toHaveBeenCalledWith('user-1')
        expect(handleFileUploads).toHaveBeenCalledWith(mockEvent, expect.objectContaining({
            prefix: 'avatars/user-1/',
            maxFiles: 1,
            mustBeImage: true,
        }))
        expect(auth.api.updateUser).toHaveBeenCalledWith({
            headers: mockEvent.headers,
            body: {
                image: 'http://test.com/avatar.jpg',
            },
        })
        expect(result).toEqual({
            code: 200,
            data: {
                url: 'http://test.com/avatar.jpg',
            },
        })
    })

    it('should throw error if requireAuth fails', async () => {
        const mockEvent = {} as any
        const error = new Error('Unauthorized')
        vi.mocked(requireAuth).mockRejectedValue(error)

        await expect(handler(mockEvent)).rejects.toThrow('Unauthorized')
    })
})
