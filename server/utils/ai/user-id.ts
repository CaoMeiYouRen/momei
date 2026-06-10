const PROVIDER_USER_ID_REGEX = /^[a-zA-Z0-9\-_]+$/
const PROVIDER_USER_ID_MAX_LENGTH = 512

/**
 * Normalize user id before sending it to upstream AI providers.
 * Invalid values are dropped to avoid provider-side request rejection.
 */
export function toProviderUserId(userId: string | undefined): string | undefined {
    const normalizedUserId = userId?.trim()
    if (!normalizedUserId) {
        return undefined
    }

    if (normalizedUserId.length > PROVIDER_USER_ID_MAX_LENGTH) {
        return undefined
    }

    if (!PROVIDER_USER_ID_REGEX.test(normalizedUserId)) {
        return undefined
    }

    return normalizedUserId
}
