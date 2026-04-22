import { getLocaleRegistryItem, resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'
import type {
    LocalizedSettingScalar,
    LocalizedSettingType,
    LocalizedSettingValueV1,
} from '@/types/setting'

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isMeaningfulString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0
}

function cloneStringArray(value: readonly string[]): string[] {
    return value.slice()
}

export function normalizeLocalizedStringList(value: string | string[] | null | undefined): string[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => item.trim())
            .filter(Boolean)
    }

    if (!value) {
        return []
    }

    return value
        .split(/[;,，、]+/)
        .map((item) => item.trim())
        .filter(Boolean)
}

export function serializeLocalizedStringList(value: string[] | null | undefined): string {
    return (value ?? []).join(', ')
}

export function hasMeaningfulLocalizedValue(value: LocalizedSettingScalar | null | undefined): boolean {
    if (typeof value === 'string') {
        return value.trim().length > 0
    }

    if (Array.isArray(value)) {
        return value.some((item) => item.trim().length > 0)
    }

    return false
}

export function isLocalizedSettingValue<T extends LocalizedSettingScalar = LocalizedSettingScalar>(
    value: unknown,
    expectedType?: LocalizedSettingType,
): value is LocalizedSettingValueV1<T> {
    if (!isRecord(value) || value.version !== 1) {
        return false
    }

    if (value.type !== 'localized-text' && value.type !== 'localized-string-list') {
        return false
    }

    if (expectedType && value.type !== expectedType) {
        return false
    }

    if (!isRecord(value.locales)) {
        return false
    }

    const localeValues = Object.values(value.locales)
    const isText = value.type === 'localized-text'
    const localesValid = localeValues.every((item) => item === null || item === undefined || (isText ? typeof item === 'string' : isStringArray(item)))

    if (!localesValid) {
        return false
    }

    if (!Object.hasOwn(value, 'legacyValue')) {
        return true
    }

    return value.legacyValue === null
        || value.legacyValue === undefined
        || (isText ? typeof value.legacyValue === 'string' : isStringArray(value.legacyValue))
}

export function cloneLocalizedSettingValue<T extends LocalizedSettingScalar>(
    value: LocalizedSettingValueV1<T>,
): LocalizedSettingValueV1<T> {
    return {
        version: 1,
        type: value.type,
        locales: Object.fromEntries(
            Object.entries(value.locales).map(([locale, localeValue]) => [
                locale,
                Array.isArray(localeValue) ? cloneStringArray(localeValue) as T : localeValue,
            ]),
        ),
        legacyValue: Array.isArray(value.legacyValue) ? cloneStringArray(value.legacyValue) as T : value.legacyValue,
    }
}

export function getLocalizedFallbackChain(locale?: string | null): AppLocaleCode[] {
    return [...getLocaleRegistryItem(locale).fallbackChain]
}

export function resolveRequestedAppLocale(locale?: string | null): AppLocaleCode {
    return resolveAppLocaleCode(locale)
}

export function readLocalizedLocaleValue<T extends LocalizedSettingScalar>(
    value: LocalizedSettingValueV1<T>,
    locale: AppLocaleCode,
): T | null {
    const localeValue = value.locales[locale]
    return hasMeaningfulLocalizedValue(localeValue) ? (localeValue ?? null) : null
}

export function createEmptyLocalizedSettingValue(
    type: LocalizedSettingType,
    legacyValue?: LocalizedSettingScalar | null,
): LocalizedSettingValueV1 {
    return {
        version: 1,
        type,
        locales: {},
        legacyValue: legacyValue ?? null,
    }
}

export function normalizeLocalizedLegacyValue(
    value: string | null | undefined,
    type: LocalizedSettingType,
): LocalizedSettingScalar | null {
    if (!isMeaningfulString(value)) {
        return null
    }

    if (type === 'localized-string-list') {
        const listValue = normalizeLocalizedStringList(value)
        return listValue.length > 0 ? listValue : null
    }

    return value
}
