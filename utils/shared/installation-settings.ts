import type { CopyrightType } from '@/types/copyright'
import {
    SettingKey,
    type AdminLanguageCode,
    type LocalizedSettingScalar,
    type LocalizedSettingType,
    type LocalizedSettingValueV1,
} from '@/types/setting'
import {
    cloneLocalizedSettingValue,
    createEmptyLocalizedSettingValue,
    getLocalizedFallbackChain,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    normalizeLocalizedLegacyValue,
    normalizeLocalizedStringList,
    readLocalizedLocaleValue,
    resolveRequestedAppLocale,
    serializeLocalizedStringList,
} from '@/utils/shared/localized-settings'

export interface InstallationSiteConfigModel {
    siteTitle: LocalizedSettingValueV1<string>
    siteDescription: LocalizedSettingValueV1<string>
    siteKeywords: LocalizedSettingValueV1<string[]>
    siteUrl: string
    postCopyright: CopyrightType | ''
    siteCopyrightOwner: LocalizedSettingValueV1<string>
    siteCopyrightStartYear: string
    defaultLanguage: AdminLanguageCode
}

export interface InstallationExtraConfigModel {
    aiProvider: string
    aiApiKey: string
    aiModel: string
    aiEndpoint: string
    emailHost: string
    emailPort: number
    emailUser: string
    emailPass: string
    emailFrom: string
    storageType: string
    localStorageDir: string
    localStorageBaseUrl: string
    s3Endpoint: string
    s3Bucket: string
    s3Region: string
    s3AccessKey: string
    s3SecretKey: string
    s3BaseUrl: string
    s3BucketPrefix: string
    assetPublicBaseUrl: string
    assetObjectPrefix: string
    baiduAnalytics: string
    googleAnalytics: string
    clarityAnalytics: string
}

export type InstallationSiteFieldErrors = Partial<Record<keyof InstallationSiteConfigModel, string>>
export type InstallationExtraFieldErrors = Partial<Record<keyof InstallationExtraConfigModel, string>>

export const INSTALLATION_SITE_LOCALIZED_FIELD_META = {
    siteTitle: {
        settingKey: SettingKey.SITE_TITLE,
        valueType: 'localized-text',
    },
    siteDescription: {
        settingKey: SettingKey.SITE_DESCRIPTION,
        valueType: 'localized-text',
    },
    siteKeywords: {
        settingKey: SettingKey.SITE_KEYWORDS,
        valueType: 'localized-string-list',
    },
    siteCopyrightOwner: {
        settingKey: SettingKey.SITE_COPYRIGHT_OWNER,
        valueType: 'localized-text',
    },
} as const satisfies Record<string, { settingKey: SettingKey, valueType: LocalizedSettingType }>

export type InstallationLocalizedSiteFieldKey = keyof typeof INSTALLATION_SITE_LOCALIZED_FIELD_META
export interface InstallationLocalizedSiteFieldValueMap {
    siteTitle: LocalizedSettingValueV1<string>
    siteDescription: LocalizedSettingValueV1<string>
    siteKeywords: LocalizedSettingValueV1<string[]>
    siteCopyrightOwner: LocalizedSettingValueV1<string>
}

export const INSTALLATION_SITE_SETTING_KEYS = {
    siteTitle: SettingKey.SITE_TITLE,
    siteDescription: SettingKey.SITE_DESCRIPTION,
    siteKeywords: SettingKey.SITE_KEYWORDS,
    siteUrl: SettingKey.SITE_URL,
    postCopyright: SettingKey.POST_COPYRIGHT,
    siteCopyrightOwner: SettingKey.SITE_COPYRIGHT_OWNER,
    siteCopyrightStartYear: SettingKey.SITE_COPYRIGHT_START_YEAR,
    defaultLanguage: SettingKey.DEFAULT_LANGUAGE,
} as const

export const INSTALLATION_EXTRA_ENV_BACKFILL_MAP = {
    [SettingKey.AI_PROVIDER]: 'aiProvider',
    [SettingKey.AI_API_KEY]: 'aiApiKey',
    [SettingKey.AI_MODEL]: 'aiModel',
    [SettingKey.AI_ENDPOINT]: 'aiEndpoint',
    [SettingKey.EMAIL_HOST]: 'emailHost',
    [SettingKey.EMAIL_PORT]: 'emailPort',
    [SettingKey.EMAIL_USER]: 'emailUser',
    [SettingKey.EMAIL_PASS]: 'emailPass',
    [SettingKey.EMAIL_FROM]: 'emailFrom',
    [SettingKey.STORAGE_TYPE]: 'storageType',
    [SettingKey.LOCAL_STORAGE_DIR]: 'localStorageDir',
    [SettingKey.LOCAL_STORAGE_BASE_URL]: 'localStorageBaseUrl',
    [SettingKey.S3_ENDPOINT]: 's3Endpoint',
    [SettingKey.S3_BUCKET]: 's3Bucket',
    [SettingKey.S3_REGION]: 's3Region',
    [SettingKey.S3_ACCESS_KEY]: 's3AccessKey',
    [SettingKey.S3_SECRET_KEY]: 's3SecretKey',
    [SettingKey.S3_BASE_URL]: 's3BaseUrl',
    [SettingKey.S3_BUCKET_PREFIX]: 's3BucketPrefix',
    [SettingKey.ASSET_PUBLIC_BASE_URL]: 'assetPublicBaseUrl',
    [SettingKey.ASSET_OBJECT_PREFIX]: 'assetObjectPrefix',
    [SettingKey.BAIDU_ANALYTICS]: 'baiduAnalytics',
    [SettingKey.GOOGLE_ANALYTICS]: 'googleAnalytics',
    [SettingKey.CLARITY_ANALYTICS]: 'clarityAnalytics',
} as const satisfies Record<string, keyof InstallationExtraConfigModel>

export const INSTALLATION_SITE_ENV_BACKFILL_MAP = {
    [SettingKey.SITE_TITLE]: 'siteTitle',
    [SettingKey.SITE_DESCRIPTION]: 'siteDescription',
    [SettingKey.SITE_KEYWORDS]: 'siteKeywords',
    [SettingKey.SITE_URL]: 'siteUrl',
    [SettingKey.POST_COPYRIGHT]: 'postCopyright',
    [SettingKey.SITE_COPYRIGHT_OWNER]: 'siteCopyrightOwner',
    [SettingKey.SITE_COPYRIGHT_START_YEAR]: 'siteCopyrightStartYear',
    [SettingKey.DEFAULT_LANGUAGE]: 'defaultLanguage',
} as const satisfies Record<string, keyof InstallationSiteConfigModel>

export const DEFAULT_INSTALLATION_SITE_CONFIG: InstallationSiteConfigModel = {
    siteTitle: createEmptyLocalizedSettingValue('localized-text') as LocalizedSettingValueV1<string>,
    siteDescription: createEmptyLocalizedSettingValue('localized-text') as LocalizedSettingValueV1<string>,
    siteKeywords: createEmptyLocalizedSettingValue('localized-string-list') as LocalizedSettingValueV1<string[]>,
    siteUrl: '',
    postCopyright: 'all-rights-reserved',
    siteCopyrightOwner: createEmptyLocalizedSettingValue('localized-text') as LocalizedSettingValueV1<string>,
    siteCopyrightStartYear: '',
    defaultLanguage: 'zh-CN',
}

export const DEFAULT_INSTALLATION_EXTRA_CONFIG: InstallationExtraConfigModel = {
    aiProvider: 'openai',
    aiApiKey: '',
    aiModel: 'gpt-4o',
    aiEndpoint: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    emailFrom: '',
    storageType: 'local',
    localStorageDir: 'public/uploads',
    localStorageBaseUrl: '/uploads',
    s3Endpoint: '',
    s3Bucket: '',
    s3Region: 'auto',
    s3AccessKey: '',
    s3SecretKey: '',
    s3BaseUrl: '',
    s3BucketPrefix: '',
    assetPublicBaseUrl: '',
    assetObjectPrefix: '',
    baiduAnalytics: '',
    googleAnalytics: '',
    clarityAnalytics: '',
}

function resolveInstallationLocalizedSiteFieldMeta(fieldKey: InstallationLocalizedSiteFieldKey) {
    return INSTALLATION_SITE_LOCALIZED_FIELD_META[fieldKey]
}

function isInstallationStringListField(fieldKey: InstallationLocalizedSiteFieldKey): fieldKey is 'siteKeywords' {
    return resolveInstallationLocalizedSiteFieldMeta(fieldKey).valueType === 'localized-string-list'
}

function parseInstallationLocalizedFieldValue<K extends InstallationLocalizedSiteFieldKey>(
    fieldKey: K,
    value: unknown,
): NonNullable<InstallationLocalizedSiteFieldValueMap[K]> {
    const { valueType } = resolveInstallationLocalizedSiteFieldMeta(fieldKey)

    if (isLocalizedSettingValue(value, valueType)) {
        return cloneLocalizedSettingValue(value) as NonNullable<InstallationLocalizedSiteFieldValueMap[K]>
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        try {
            const parsedValue = JSON.parse(value) as unknown
            if (isLocalizedSettingValue(parsedValue, valueType)) {
                return cloneLocalizedSettingValue(parsedValue) as NonNullable<InstallationLocalizedSiteFieldValueMap[K]>
            }
        } catch {
            // Fall through to legacy compatibility below.
        }
    }

    return createEmptyLocalizedSettingValue(
        valueType,
        typeof value === 'string'
            ? normalizeLocalizedLegacyValue(value, valueType)
            : null,
    ) as NonNullable<InstallationLocalizedSiteFieldValueMap[K]>
}

function formatInstallationLocalizedFieldValue(
    fieldKey: InstallationLocalizedSiteFieldKey,
    value: LocalizedSettingScalar | null | undefined,
): string {
    if (!hasMeaningfulLocalizedValue(value)) {
        return ''
    }

    if (resolveInstallationLocalizedSiteFieldMeta(fieldKey).valueType === 'localized-string-list') {
        return serializeLocalizedStringList(Array.isArray(value) ? value : normalizeLocalizedStringList(String(value ?? '')))
    }

    return typeof value === 'string' ? value : ''
}

export function coerceInstallationLocalizedSiteFieldValue<K extends InstallationLocalizedSiteFieldKey>(
    fieldKey: K,
    value: unknown,
): InstallationLocalizedSiteFieldValueMap[K] {
    return parseInstallationLocalizedFieldValue(fieldKey, value)
}

export function resolveInstallationLocalizedSiteFieldInputValue(
    fieldKey: InstallationLocalizedSiteFieldKey,
    value: unknown,
    locale?: string | null,
): string {
    const normalizedValue = parseInstallationLocalizedFieldValue(fieldKey, value)
    const fallbackChain = getLocalizedFallbackChain(locale)

    if (isInstallationStringListField(fieldKey)) {
        const typedValue = normalizedValue as LocalizedSettingValueV1<string[]>

        for (const candidateLocale of fallbackChain) {
            const localeValue = readLocalizedLocaleValue(typedValue, candidateLocale)
            if (hasMeaningfulLocalizedValue(localeValue)) {
                return formatInstallationLocalizedFieldValue(fieldKey, localeValue)
            }
        }

        return formatInstallationLocalizedFieldValue(fieldKey, typedValue.legacyValue)
    }

    const typedValue = normalizedValue as LocalizedSettingValueV1<string>

    for (const candidateLocale of fallbackChain) {
        const localeValue = readLocalizedLocaleValue(typedValue, candidateLocale)
        if (hasMeaningfulLocalizedValue(localeValue)) {
            return formatInstallationLocalizedFieldValue(fieldKey, localeValue)
        }
    }

    return formatInstallationLocalizedFieldValue(fieldKey, typedValue.legacyValue)
}

function omitLocalizedLocaleValue<T extends LocalizedSettingScalar>(
    value: LocalizedSettingValueV1<T>,
    locale: string,
) {
    value.locales = Object.fromEntries(
        Object.entries(value.locales).filter(([localeKey]) => localeKey !== locale),
    ) as LocalizedSettingValueV1<T>['locales']
}

export function updateInstallationLocalizedSiteFieldValue<K extends InstallationLocalizedSiteFieldKey>(
    fieldKey: K,
    currentValue: unknown,
    locale: string | null | undefined,
    nextInputValue: string,
): InstallationLocalizedSiteFieldValueMap[K] {
    const normalizedValue = parseInstallationLocalizedFieldValue(fieldKey, currentValue)
    const targetLocale = resolveRequestedAppLocale(locale)

    if (isInstallationStringListField(fieldKey)) {
        const nextValue = cloneLocalizedSettingValue(normalizedValue as LocalizedSettingValueV1<string[]>)
        const normalizedList = normalizeLocalizedStringList(nextInputValue)
        if (normalizedList.length > 0) {
            nextValue.locales[targetLocale] = normalizedList
        } else {
            omitLocalizedLocaleValue(nextValue, targetLocale)
        }

        return nextValue as InstallationLocalizedSiteFieldValueMap[K]
    }

    const nextValue = cloneLocalizedSettingValue(normalizedValue as LocalizedSettingValueV1<string>)

    if (nextInputValue.trim().length > 0) {
        nextValue.locales[targetLocale] = nextInputValue
    } else {
        omitLocalizedLocaleValue(nextValue, targetLocale)
    }

    return nextValue as InstallationLocalizedSiteFieldValueMap[K]
}

export function mergeInstallationLocalizedSiteFieldValue<K extends InstallationLocalizedSiteFieldKey>(
    fieldKey: K,
    existingValue: unknown,
    incomingValue: unknown,
): InstallationLocalizedSiteFieldValueMap[K] {
    const nextValue = parseInstallationLocalizedFieldValue(fieldKey, incomingValue)

    if (isInstallationStringListField(fieldKey)) {
        const mergedValue = cloneLocalizedSettingValue(parseInstallationLocalizedFieldValue(fieldKey, existingValue) as LocalizedSettingValueV1<string[]>)
        const typedNextValue = nextValue as LocalizedSettingValueV1<string[]>

        mergedValue.locales = {
            ...mergedValue.locales,
            ...typedNextValue.locales,
        }

        if (hasMeaningfulLocalizedValue(typedNextValue.legacyValue)) {
            mergedValue.legacyValue = typedNextValue.legacyValue
        }

        return mergedValue as InstallationLocalizedSiteFieldValueMap[K]
    }

    const mergedValue = cloneLocalizedSettingValue(parseInstallationLocalizedFieldValue(fieldKey, existingValue) as LocalizedSettingValueV1<string>)
    const typedNextValue = nextValue as LocalizedSettingValueV1<string>

    mergedValue.locales = {
        ...mergedValue.locales,
        ...typedNextValue.locales,
    }

    if (hasMeaningfulLocalizedValue(typedNextValue.legacyValue)) {
        mergedValue.legacyValue = typedNextValue.legacyValue
    }

    return mergedValue as InstallationLocalizedSiteFieldValueMap[K]
}
