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
        info: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@/server/utils/i18n', () => ({
    loadLocaleMessages: vi.fn().mockResolvedValue({
        pages: {
            admin: {
                settings: {
                    system: {
                        email_templates: {
                            runtime: {
                                greeting: 'Hello,',
                                help_text: 'Need help? Contact our support team',
                            },
                        },
                    },
                },
            },
        },
    }),
}))

import { loadEmailShellMessages, resolvePreferredEmailLocale } from './locale'
import { dataSource } from '@/server/database'

describe('email locale utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        Object.defineProperty(dataSource, 'isInitialized', {
            configurable: true,
            value: true,
            writable: true,
        })
        vi.mocked(dataSource.getRepository).mockReturnValue({
            findOne: vi.fn().mockResolvedValue(null),
        } as never)
    })

    it('prefers explicit language input', async () => {
        const locale = await resolvePreferredEmailLocale({
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

        const locale = await resolvePreferredEmailLocale({
            email: 'test@example.com',
        })

        expect(locale).toBe('en-US')
        expect(findOne).toHaveBeenCalledWith({
            where: { email: 'test@example.com' },
        })
    })

    it('returns undefined when datasource is unavailable', async () => {
        Object.defineProperty(dataSource, 'isInitialized', {
            configurable: true,
            value: false,
            writable: true,
        })

        const locale = await resolvePreferredEmailLocale({
            email: 'test@example.com',
        })

        expect(locale).toBeUndefined()
    })

    it('loads localized shell messages for the selected locale', async () => {
        const shell = await loadEmailShellMessages('en-US')

        expect(shell.locale).toBe('en-US')
        expect(shell.greeting).toBe('Hello,')
        expect(shell.helpText).toBe('Need help? Contact our support team')
    })

    it('falls back to locale-aware shell copy when runtime keys are missing', async () => {
        const i18nModule = await import('@/server/utils/i18n')
        vi.mocked(i18nModule.loadLocaleMessages).mockResolvedValueOnce({})

        const shell = await loadEmailShellMessages('en-US')

        expect(shell.locale).toBe('en-US')
        expect(shell.helpText).toBe('Need help? Contact our support team')
        expect(shell.privacyPolicyLabel).toBe('Privacy Policy')
        expect(shell.allRightsReserved).toBe('All rights reserved.')
    })
})
