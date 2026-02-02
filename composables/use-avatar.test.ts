import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

// Mock hash utility
vi.mock('@/utils/shared/hash', () => ({
    sha256: vi.fn(async (input: string) =>
        // Simple mock hash function
        `hash-${input}`,
    ),
}))

// Mock avatar utility
vi.mock('@/utils/shared/avatar', () => ({
    getGravatarUrl: vi.fn((hash: string) => `https://gravatar.com/avatar/${hash}`),
}))

import { useAvatar } from './use-avatar'
import { sha256 } from '@/utils/shared/hash'
import { getGravatarUrl } from '@/utils/shared/avatar'

describe('useAvatar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should generate Gravatar URL from email', async () => {
        const { avatarUrl } = useAvatar('test@example.com', 'Test User')

        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(sha256).toHaveBeenCalledWith('test@example.com')
        expect(getGravatarUrl).toHaveBeenCalledWith('hash-test@example.com')
        expect(avatarUrl.value).toBe('https://gravatar.com/avatar/hash-test@example.com')
    })

    it('should use emailHash directly if provided', async () => {
        const { avatarUrl } = useAvatar('test@example.com', 'Test User', 'existing-hash')

        await nextTick()

        expect(sha256).not.toHaveBeenCalled()
        expect(getGravatarUrl).toHaveBeenCalledWith('existing-hash')
        expect(avatarUrl.value).toBe('https://gravatar.com/avatar/existing-hash')
    })

    it('should fallback to ui-avatars when no email provided', async () => {
        const { avatarUrl } = useAvatar(null, 'Test User')

        await nextTick()

        expect(sha256).not.toHaveBeenCalled()
        expect(avatarUrl.value).toContain('ui-avatars.com')
        expect(avatarUrl.value).toContain('name=Test%20User')
    })

    it('should use "User" as default name when no name provided', async () => {
        const { avatarUrl } = useAvatar(null, null)

        await nextTick()

        expect(avatarUrl.value).toContain('ui-avatars.com')
        expect(avatarUrl.value).toContain('name=User')
    })

    it('should handle hash generation error and fallback to ui-avatars', async () => {
        vi.mocked(sha256).mockRejectedValueOnce(new Error('Hash failed'))

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Mute console error in tests
        })

        const { avatarUrl } = useAvatar('test@example.com', 'Test User')

        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to generate gravatar hash',
            expect.any(Error),
        )
        expect(avatarUrl.value).toContain('ui-avatars.com')
        expect(avatarUrl.value).toContain('name=Test%20User')

        consoleErrorSpy.mockRestore()
    })

    it('should work with reactive email', async () => {
        const email = ref('test1@example.com')
        const { avatarUrl } = useAvatar(email, 'Test User')

        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(sha256).toHaveBeenCalledWith('test1@example.com')
        expect(avatarUrl.value).toBe('https://gravatar.com/avatar/hash-test1@example.com')

        // Change email
        email.value = 'test2@example.com'
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(sha256).toHaveBeenCalledWith('test2@example.com')
        expect(avatarUrl.value).toBe('https://gravatar.com/avatar/hash-test2@example.com')
    })

    it('should work with getter function', async () => {
        const email = ref('test@example.com')
        const { avatarUrl } = useAvatar(() => email.value, 'Test User')

        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(sha256).toHaveBeenCalledWith('test@example.com')
        expect(avatarUrl.value).toBe('https://gravatar.com/avatar/hash-test@example.com')
    })
})

