import type { ASRCredentials } from '~/types/asr'

export const DEFAULT_ASR_CREDENTIAL_CLOCK_SKEW_MS = 30_000
export const DEFAULT_ASR_CREDENTIAL_REFRESH_BUFFER_MS = 60_000

export function resolveASRCredentialEffectiveExpiresAt(
    credentials: Pick<ASRCredentials, 'expiresAt' | 'expiresInMs'>,
    receivedAt = Date.now(),
) {
    const expiresAtFromReceipt = Number.isFinite(credentials.expiresInMs)
        ? receivedAt + Math.max(0, credentials.expiresInMs)
        : Number.POSITIVE_INFINITY

    return Math.min(credentials.expiresAt, expiresAtFromReceipt)
}

export function hasASRCredentialsExpired(
    credentials: Pick<ASRCredentials, 'expiresAt' | 'expiresInMs'>,
    receivedAt = Date.now(),
    now = Date.now(),
    clockSkewMs = DEFAULT_ASR_CREDENTIAL_CLOCK_SKEW_MS,
) {
    return now >= resolveASRCredentialEffectiveExpiresAt(credentials, receivedAt) - Math.max(0, clockSkewMs)
}

export function shouldRefreshASRCredentials(
    credentials: Pick<ASRCredentials, 'expiresAt' | 'expiresInMs'>,
    receivedAt = Date.now(),
    now = Date.now(),
    refreshBufferMs = DEFAULT_ASR_CREDENTIAL_REFRESH_BUFFER_MS,
    clockSkewMs = DEFAULT_ASR_CREDENTIAL_CLOCK_SKEW_MS,
) {
    const safeBufferMs = Math.max(0, refreshBufferMs, clockSkewMs)
    return now >= resolveASRCredentialEffectiveExpiresAt(credentials, receivedAt) - safeBufferMs
}
