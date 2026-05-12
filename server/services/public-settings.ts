import { In } from 'typeorm'
import { initializeDatabaseConnection } from '@/server/database'
import { Setting } from '@/server/entities/setting'
import {
    getLocalizedSettingDefinition,
    getSettingDefaultValue,
    getSettingLookupKeys,
    resolveSettingEnvEntry,
} from '@/server/services/setting.constants'
import type {
    LocalizedSettingScalar,
    ResolvedLocalizedSetting,
    SettingKey,
    SettingValue,
} from '@/types/setting'
import {
    getLocalizedFallbackChain,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    normalizeLocalizedLegacyValue,
    readLocalizedLocaleValue,
    resolveRequestedAppLocale,
} from '@/utils/shared/localized-settings'

function createEmptyLocalizedResolvedSetting<T extends LocalizedSettingScalar>(
    key: string,
    requestedLocale: ReturnType<typeof resolveRequestedAppLocale>,
    fallbackChain: ReturnType<typeof getLocalizedFallbackChain>,
): ResolvedLocalizedSetting<T> {
    return {
        key,
        value: null,
        requestedLocale,
        resolvedLocale: null,
        fallbackChain,
        usedFallback: false,
        usedLegacyValue: false,
    }
}

function normalizeSettingValue(key: string, rawValue: string | null | undefined): SettingValue {
    if (rawValue === null || rawValue === undefined) {
        return null
    }

    const localizedDefinition = getLocalizedSettingDefinition(key)

    if (!localizedDefinition) {
        return rawValue
    }

    try {
        const parsedValue = JSON.parse(rawValue) as unknown

        if (isLocalizedSettingValue(parsedValue, localizedDefinition.valueType)) {
            return parsedValue
        }
    } catch {
        // Fall through to legacy localized parsing.
    }

    const legacyValue = normalizeLocalizedLegacyValue(rawValue, localizedDefinition.valueType)

    if (!hasMeaningfulLocalizedValue(legacyValue)) {
        return null
    }

    return {
        version: 1,
        type: localizedDefinition.valueType,
        locales: {},
        legacyValue,
    }
}

function resolveStoredSettingValue(recordMap: Map<string, Setting>, key: string): SettingValue {
    const { value: envValue } = resolveSettingEnvEntry(key)

    if (envValue !== undefined) {
        return normalizeSettingValue(key, envValue)
    }

    for (const lookupKey of getSettingLookupKeys(key)) {
        const record = recordMap.get(lookupKey)

        if (record) {
            return normalizeSettingValue(key, record.value)
        }
    }

    return normalizeSettingValue(key, getSettingDefaultValue(key))
}

function resolveLocalizedSettingFromValue<T extends LocalizedSettingScalar>(
    key: string,
    value: SettingValue,
    requestedLocale: ReturnType<typeof resolveRequestedAppLocale>,
): ResolvedLocalizedSetting<T> {
    const fallbackChain = getLocalizedFallbackChain(requestedLocale)
    const localizedDefinition = getLocalizedSettingDefinition(key)

    if (!localizedDefinition || !value || !isLocalizedSettingValue<T>(value, localizedDefinition.valueType)) {
        return createEmptyLocalizedResolvedSetting<T>(key, requestedLocale, fallbackChain)
    }

    for (const candidateLocale of fallbackChain) {
        const localeValue = readLocalizedLocaleValue<T>(value, candidateLocale)

        if (hasMeaningfulLocalizedValue(localeValue)) {
            return {
                key,
                value: localeValue,
                requestedLocale,
                resolvedLocale: candidateLocale,
                fallbackChain,
                usedFallback: candidateLocale !== requestedLocale,
                usedLegacyValue: false,
            }
        }
    }

    if (hasMeaningfulLocalizedValue(value.legacyValue)) {
        return {
            key,
            value: value.legacyValue as T,
            requestedLocale,
            resolvedLocale: 'legacy',
            fallbackChain,
            usedFallback: true,
            usedLegacyValue: true,
        }
    }

    return createEmptyLocalizedResolvedSetting<T>(key, requestedLocale, fallbackChain)
}

export async function getPublicSettings(keys: readonly (SettingKey | string)[]) {
    const dataSource = await initializeDatabaseConnection()

    if (!dataSource.isInitialized) {
        return null
    }

    const lookupKeys = [...new Set(keys.flatMap((key) => getSettingLookupKeys(key)))]
    const records = await dataSource.getRepository(Setting).find({
        where: {
            key: In(lookupKeys),
        },
    })
    const recordMap = new Map(records.map((record) => [record.key, record]))

    return Object.fromEntries(keys.map((key) => [key, resolveStoredSettingValue(recordMap, key)]))
}

export function resolvePublicLocalizedSettingsFromValues(
    values: Record<string, SettingValue>,
    keys: readonly (SettingKey | string)[],
    locale?: string | null,
): Record<string, ResolvedLocalizedSetting> {
    const requestedLocale = resolveRequestedAppLocale(locale)

    return Object.fromEntries(
        keys.map((key) => [
            key,
            resolveLocalizedSettingFromValue(key, values[key] ?? null, requestedLocale),
        ]),
    )
}
