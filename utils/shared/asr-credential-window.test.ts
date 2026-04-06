import { describe, expect, it } from 'vitest'
import {
    DEFAULT_ASR_CREDENTIAL_CLOCK_SKEW_MS,
    DEFAULT_ASR_CREDENTIAL_REFRESH_BUFFER_MS,
    hasASRCredentialsExpired,
    resolveASRCredentialEffectiveExpiresAt,
    shouldRefreshASRCredentials,
} from './asr-credential-window'

describe('asr credential window helpers', () => {
    const baseCredentials = {
        expiresAt: 1_000_000,
        expiresInMs: 600_000,
    }

    it('prefers the earlier receipt based expiry to absorb clock skew', () => {
        expect(resolveASRCredentialEffectiveExpiresAt(baseCredentials, 200_000)).toBe(800_000)
    })

    it('marks credentials as refreshable before their hard expiry', () => {
        const receivedAt = 200_000
        const now = 800_000 - DEFAULT_ASR_CREDENTIAL_REFRESH_BUFFER_MS + 1

        expect(shouldRefreshASRCredentials(baseCredentials, receivedAt, now)).toBe(true)
    })

    it('treats credentials as expired when only the clock skew safety window remains', () => {
        const receivedAt = 200_000
        const now = 800_000 - DEFAULT_ASR_CREDENTIAL_CLOCK_SKEW_MS + 1

        expect(hasASRCredentialsExpired(baseCredentials, receivedAt, now)).toBe(true)
    })

    it('falls back to absolute expiresAt when expiresInMs is invalid', () => {
        const credentials = {
            expiresAt: 900_000,
            expiresInMs: Number.NaN,
        }

        expect(resolveASRCredentialEffectiveExpiresAt(credentials, 200_000)).toBe(900_000)
        expect(shouldRefreshASRCredentials(credentials, 200_000, 900_000 - DEFAULT_ASR_CREDENTIAL_REFRESH_BUFFER_MS + 1)).toBe(true)
    })
})
