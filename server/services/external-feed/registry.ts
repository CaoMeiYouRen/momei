import { z } from 'zod'
import { resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'
import { getSettingDefaultValue, getSettings } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'
import type { ExternalFeedSourceConfig } from '@/types/external-feed'
import { toBoolean, toNumber } from '@/utils/shared/coerce'
import { normalizeDurationSeconds } from '@/utils/shared/duration'
import { externalFeedSourcesSchema, type ExternalFeedSourceConfigInput } from '@/utils/schemas/external-feed'

export interface ExternalFeedRegistryConfig {
    enabled: boolean
    homeEnabled: boolean
    homeLimit: number
    defaultCacheTtlSeconds: number
    defaultStaleWhileErrorSeconds: number
    sources: ExternalFeedSourceConfig[]
}

function readSettingOrDefault(settings: Record<string, string | null>, key: SettingKey) {
    return settings[key] ?? getSettingDefaultValue(key)
}

function normalizeExternalFeedSource(input: ExternalFeedSourceConfigInput): ExternalFeedSourceConfig {
    return {
        id: input.id,
        enabled: input.enabled,
        provider: input.provider,
        title: input.title,
        sourceUrl: input.sourceUrl,
        siteUrl: input.siteUrl ?? null,
        siteName: input.siteName ?? null,
        defaultLocale: input.defaultLocale ? resolveAppLocaleCode(input.defaultLocale) : null,
        localeStrategy: input.localeStrategy,
        includeInHome: input.includeInHome,
        badgeLabel: input.badgeLabel ?? null,
        priority: input.priority,
        timeoutMs: input.timeoutMs ?? null,
        cacheTtlSeconds: input.cacheTtlSeconds ?? null,
        staleWhileErrorSeconds: input.staleWhileErrorSeconds ?? null,
        maxItems: input.maxItems ?? null,
    }
}

function parseExternalFeedSources(value: string | null | undefined) {
    if (!value || value.trim().length === 0) {
        return []
    }

    try {
        return externalFeedSourcesSchema.parse(JSON.parse(value)).map(normalizeExternalFeedSource)
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Invalid external feed sources configuration',
            data: error instanceof z.ZodError ? z.treeifyError(error) : undefined,
        })
    }
}

export function resolveExternalFeedLocaleBucket(source: ExternalFeedSourceConfig, locale: AppLocaleCode) {
    if (source.localeStrategy === 'all') {
        return 'all'
    }

    if (source.localeStrategy === 'fixed') {
        return source.defaultLocale ?? locale
    }

    return locale
}

export async function getExternalFeedRegistryConfig(): Promise<ExternalFeedRegistryConfig> {
    const settings = await getSettings([
        SettingKey.EXTERNAL_FEED_ENABLED,
        SettingKey.EXTERNAL_FEED_HOME_ENABLED,
        SettingKey.EXTERNAL_FEED_HOME_LIMIT,
        SettingKey.EXTERNAL_FEED_CACHE_TTL_SECONDS,
        SettingKey.EXTERNAL_FEED_STALE_WHILE_ERROR_SECONDS,
        SettingKey.EXTERNAL_FEED_SOURCES,
    ])

    const enabled = toBoolean(readSettingOrDefault(settings, SettingKey.EXTERNAL_FEED_ENABLED), false)
    const homeEnabled = toBoolean(readSettingOrDefault(settings, SettingKey.EXTERNAL_FEED_HOME_ENABLED), false)
    const homeLimit = Math.max(1, Math.min(12, toNumber(readSettingOrDefault(settings, SettingKey.EXTERNAL_FEED_HOME_LIMIT), 6)))
    const defaultCacheTtlSeconds = normalizeDurationSeconds(
        readSettingOrDefault(settings, SettingKey.EXTERNAL_FEED_CACHE_TTL_SECONDS),
        900,
        { min: 60, max: 86400 },
    )
    const defaultStaleWhileErrorSeconds = normalizeDurationSeconds(
        readSettingOrDefault(settings, SettingKey.EXTERNAL_FEED_STALE_WHILE_ERROR_SECONDS),
        86400,
        { min: 60, max: 604800 },
    )
    const sources = parseExternalFeedSources(readSettingOrDefault(settings, SettingKey.EXTERNAL_FEED_SOURCES))

    return {
        enabled,
        homeEnabled,
        homeLimit,
        defaultCacheTtlSeconds,
        defaultStaleWhileErrorSeconds,
        sources: sources.filter((source) => source.enabled),
    }
}
