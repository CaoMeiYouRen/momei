import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({
    dataSource: {
        isInitialized: true,
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        warn: vi.fn(),
    },
}))

import { dataSource } from '@/server/database'
import { resolveEmailLocale } from './locale'

describe('email locale utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue({
            findOne: vi.fn().mockResolvedValue(null),
        } as never)
    })

    it('prefers explicit language input', async () => {
        const locale = await resolveEmailLocale({
            email: 'test@example.com',
            language: 'ja-JP',
        })

        expect(locale).toBe('ja-JP')
        expect(dataSource.getRepository).not.toHaveBeenCalled()
    })

    it('falls back to persisted user language by email', async () => {
        const findOne = vi.fn().mockResolvedValue({
            email: 'test@example.com',
            language: 'en-US',
        })
        vi.mocked(dataSource.getRepository).mockReturnValue({ findOne } as never)

        const locale = await resolveEmailLocale({
            email: 'test@example.com',
        })

        expect(locale).toBe('en-US')
        expect(findOne).toHaveBeenCalledWith({
            where: { email: 'test@example.com' },
        })
    })

    it('returns undefined when datasource is unavailable', async () => {
        vi.mocked(dataSource).isInitialized = false

        const locale = await resolveEmailLocale({
            email: 'test@example.com',
        })

        expect(locale).toBeUndefined()
    })
})