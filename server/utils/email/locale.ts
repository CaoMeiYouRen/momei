import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import logger from '@/server/utils/logger'
import { resolveRequestedAppLocale } from '@/utils/shared/localized-settings'

export async function resolveEmailLocale(options: {
    email?: string | null
    language?: string | null
}) {
    const normalizedLanguage = typeof options.language === 'string'
        ? options.language.trim()
        : ''

    if (normalizedLanguage) {
        return resolveRequestedAppLocale(normalizedLanguage)
    }

    const normalizedEmail = typeof options.email === 'string'
        ? options.email.trim().toLowerCase()
        : ''

    if (!normalizedEmail || !dataSource.isInitialized) {
        return undefined
    }

    try {
        const userRepo = dataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { email: normalizedEmail } })
        const userLanguage = typeof user?.language === 'string' ? user.language.trim() : ''

        return userLanguage ? resolveRequestedAppLocale(userLanguage) : undefined
    } catch (error) {
        logger.warn('Failed to resolve email locale from user profile', {
            email: normalizedEmail,
            error,
        })
        return undefined
    }
}