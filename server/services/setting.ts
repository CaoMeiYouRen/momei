/* eslint-disable max-lines */
import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { Setting } from '@/server/entities/setting'
import { recordSettingAuditLogs, type SettingAuditChange, type SettingAuditContext } from '@/server/services/setting-audit'
import logger from '@/server/utils/logger'
import { isMaskedSettingPlaceholder, maskSettingValue, resolveSettingLevel, resolveSettingMaskType } from '@/server/utils/settings'
import {
    getLocalizedFallbackChain,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    normalizeLocalizedLegacyValue,
    readLocalizedLocaleValue,
    resolveRequestedAppLocale,
} from '@/utils/shared/localized-settings'
import {
    SettingKey,
    type LocalizedSettingDefinition,
    type LocalizedSettingMetadata,
    type LocalizedSettingScalar,
    type LocalizedSettingValueV1,
    type ResolvedLocalizedSetting,
    type SettingEffectiveSource,
    type SettingLockReason,
    type SettingResolvedItem,
    type SettingValue,
} from '@/types/setting'

/**
 * 数据库键名与环境变量键名的映射关系
 */
export const SETTING_ENV_MAP: Record<string, string> = {
    // Site
    [SettingKey.SITE_NAME]: 'NUXT_PUBLIC_APP_NAME',
    [SettingKey.SITE_DESCRIPTION]: 'NUXT_PUBLIC_SITE_DESCRIPTION',
    [SettingKey.SITE_KEYWORDS]: 'NUXT_PUBLIC_SITE_KEYWORDS',
    [SettingKey.POST_COPYRIGHT]: 'NUXT_PUBLIC_POST_COPYRIGHT',
    [SettingKey.SITE_COPYRIGHT_OWNER]: 'NUXT_PUBLIC_SITE_COPYRIGHT_OWNER',
    [SettingKey.SITE_COPYRIGHT_START_YEAR]: 'NUXT_PUBLIC_SITE_COPYRIGHT_START_YEAR',
    [SettingKey.SITE_URL]: 'NUXT_PUBLIC_SITE_URL',
    [SettingKey.DEFAULT_LANGUAGE]: 'NUXT_PUBLIC_DEFAULT_LANGUAGE',
    // AI
    [SettingKey.AI_ENABLED]: 'AI_ENABLED',
    [SettingKey.AI_PROVIDER]: 'AI_PROVIDER',
    [SettingKey.AI_API_KEY]: 'AI_API_KEY',
    [SettingKey.AI_MODEL]: 'AI_MODEL',
    [SettingKey.AI_ENDPOINT]: 'AI_API_ENDPOINT',
    [SettingKey.GEMINI_API_TOKEN]: 'GEMINI_API_TOKEN',
    [SettingKey.AI_QUOTA_ENABLED]: 'AI_QUOTA_ENABLED',
    [SettingKey.AI_QUOTA_POLICIES]: 'AI_QUOTA_POLICIES',
    [SettingKey.AI_ALERT_THRESHOLDS]: 'AI_ALERT_THRESHOLDS',
    [SettingKey.AI_COST_FACTORS]: 'AI_COST_FACTORS',
    // AI Image
    [SettingKey.AI_IMAGE_ENABLED]: 'AI_IMAGE_ENABLED',
    [SettingKey.AI_IMAGE_PROVIDER]: 'AI_IMAGE_PROVIDER',
    [SettingKey.AI_IMAGE_API_KEY]: 'AI_IMAGE_API_KEY',
    [SettingKey.AI_IMAGE_MODEL]: 'AI_IMAGE_MODEL',
    [SettingKey.AI_IMAGE_ENDPOINT]: 'AI_IMAGE_ENDPOINT',
    // Email
    [SettingKey.EMAIL_HOST]: 'EMAIL_HOST',
    [SettingKey.EMAIL_PORT]: 'EMAIL_PORT',
    [SettingKey.EMAIL_USER]: 'EMAIL_USER',
    [SettingKey.EMAIL_PASS]: 'EMAIL_PASS',
    [SettingKey.EMAIL_FROM]: 'EMAIL_FROM',
    [SettingKey.EMAIL_REQUIRE_VERIFICATION]: 'EMAIL_REQUIRE_VERIFICATION',
    [SettingKey.EMAIL_DAILY_LIMIT]: 'EMAIL_DAILY_LIMIT',
    [SettingKey.EMAIL_SINGLE_USER_DAILY_LIMIT]: 'EMAIL_SINGLE_USER_DAILY_LIMIT',
    [SettingKey.EMAIL_LIMIT_WINDOW]: 'EMAIL_LIMIT_WINDOW',
    // Storage
    [SettingKey.STORAGE_TYPE]: 'STORAGE_TYPE',
    [SettingKey.LOCAL_STORAGE_DIR]: 'LOCAL_STORAGE_DIR',
    [SettingKey.LOCAL_STORAGE_BASE_URL]: 'NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL',
    [SettingKey.LOCAL_STORAGE_MIN_FREE_SPACE]: 'LOCAL_STORAGE_MIN_FREE_SPACE',
    [SettingKey.S3_ENDPOINT]: 'S3_ENDPOINT',
    [SettingKey.S3_BUCKET]: 'S3_BUCKET_NAME',
    [SettingKey.S3_REGION]: 'S3_REGION',
    [SettingKey.S3_ACCESS_KEY]: 'S3_ACCESS_KEY_ID',
    [SettingKey.S3_SECRET_KEY]: 'S3_SECRET_ACCESS_KEY',
    [SettingKey.S3_BASE_URL]: 'S3_BASE_URL',
    [SettingKey.S3_BUCKET_PREFIX]: 'BUCKET_PREFIX',
    [SettingKey.ASSET_PUBLIC_BASE_URL]: 'ASSET_PUBLIC_BASE_URL',
    [SettingKey.ASSET_OBJECT_PREFIX]: 'ASSET_OBJECT_PREFIX',
    [SettingKey.VERCEL_BLOB_TOKEN]: 'BLOB_READ_WRITE_TOKEN',
    [SettingKey.CLOUDFLARE_R2_ACCOUNT_ID]: 'CLOUDFLARE_R2_ACCOUNT_ID',
    [SettingKey.CLOUDFLARE_R2_ACCESS_KEY]: 'CLOUDFLARE_R2_ACCESS_KEY',
    [SettingKey.CLOUDFLARE_R2_SECRET_KEY]: 'CLOUDFLARE_R2_SECRET_KEY',
    [SettingKey.CLOUDFLARE_R2_BUCKET]: 'CLOUDFLARE_R2_BUCKET',
    [SettingKey.CLOUDFLARE_R2_BASE_URL]: 'CLOUDFLARE_R2_BASE_URL',
    // Analytics
    [SettingKey.BAIDU_ANALYTICS]: 'NUXT_PUBLIC_BAIDU_ANALYTICS_ID',
    [SettingKey.GOOGLE_ANALYTICS]: 'NUXT_PUBLIC_GOOGLE_ANALYTICS_ID',
    [SettingKey.CLARITY_ANALYTICS]: 'NUXT_PUBLIC_CLARITY_PROJECT_ID',
    // Social Auth
    [SettingKey.GITHUB_CLIENT_ID]: 'NUXT_PUBLIC_GITHUB_CLIENT_ID',
    [SettingKey.GITHUB_CLIENT_SECRET]: 'GITHUB_CLIENT_SECRET',
    [SettingKey.GOOGLE_CLIENT_ID]: 'NUXT_PUBLIC_GOOGLE_CLIENT_ID',
    [SettingKey.GOOGLE_CLIENT_SECRET]: 'GOOGLE_CLIENT_SECRET',
    [SettingKey.ANONYMOUS_LOGIN_ENABLED]: 'ANONYMOUS_LOGIN_ENABLED',
    [SettingKey.ALLOW_REGISTRATION]: 'ALLOW_REGISTRATION',
    // Security & Captcha
    [SettingKey.ENABLE_CAPTCHA]: 'ENABLE_CAPTCHA',
    [SettingKey.CAPTCHA_PROVIDER]: 'NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER',
    [SettingKey.CAPTCHA_SITE_KEY]: 'NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY',
    [SettingKey.CAPTCHA_SECRET_KEY]: 'AUTH_CAPTCHA_SECRET_KEY',
    [SettingKey.ENABLE_COMMENT_REVIEW]: 'ENABLE_COMMENT_REVIEW',
    [SettingKey.BLACKLISTED_KEYWORDS]: 'BLACKLISTED_KEYWORDS',
    [SettingKey.SHOW_COMPLIANCE_INFO]: 'NUXT_PUBLIC_SHOW_COMPLIANCE_INFO',
    [SettingKey.ICP_LICENSE_NUMBER]: 'NUXT_PUBLIC_ICP_LICENSE_NUMBER',
    [SettingKey.PUBLIC_SECURITY_NUMBER]: 'NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER',
    [SettingKey.FOOTER_CODE]: 'NUXT_PUBLIC_FOOTER_CODE',
    [SettingKey.FRIEND_LINKS_ENABLED]: 'NUXT_PUBLIC_FRIEND_LINKS_ENABLED',
    [SettingKey.FRIEND_LINKS_APPLICATION_ENABLED]: 'NUXT_PUBLIC_FRIEND_LINKS_APPLICATION_ENABLED',
    [SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES]: 'NUXT_PUBLIC_FRIEND_LINKS_APPLICATION_GUIDELINES',
    [SettingKey.FRIEND_LINKS_FOOTER_ENABLED]: 'NUXT_PUBLIC_FRIEND_LINKS_FOOTER_ENABLED',
    [SettingKey.FRIEND_LINKS_FOOTER_LIMIT]: 'NUXT_PUBLIC_FRIEND_LINKS_FOOTER_LIMIT',
    [SettingKey.FRIEND_LINKS_CHECK_INTERVAL_MINUTES]: 'FRIEND_LINKS_CHECK_INTERVAL_MINUTES',
    [SettingKey.TRAVELLINGS_ENABLED]: 'NUXT_PUBLIC_TRAVELLINGS_ENABLED',
    [SettingKey.TRAVELLINGS_HEADER_ENABLED]: 'NUXT_PUBLIC_TRAVELLINGS_HEADER_ENABLED',
    [SettingKey.TRAVELLINGS_FOOTER_ENABLED]: 'NUXT_PUBLIC_TRAVELLINGS_FOOTER_ENABLED',
    [SettingKey.TRAVELLINGS_SIDEBAR_ENABLED]: 'NUXT_PUBLIC_TRAVELLINGS_SIDEBAR_ENABLED',
    [SettingKey.LIVE2D_ENABLED]: 'NUXT_PUBLIC_LIVE2D_ENABLED',
    [SettingKey.LIVE2D_SCRIPT_URL]: 'NUXT_PUBLIC_LIVE2D_SCRIPT_URL',
    [SettingKey.LIVE2D_MODEL_URL]: 'NUXT_PUBLIC_LIVE2D_MODEL_URL',
    [SettingKey.LIVE2D_OPTIONS_JSON]: 'NUXT_PUBLIC_LIVE2D_OPTIONS_JSON',
    [SettingKey.LIVE2D_MOBILE_ENABLED]: 'NUXT_PUBLIC_LIVE2D_MOBILE_ENABLED',
    [SettingKey.LIVE2D_MIN_WIDTH]: 'NUXT_PUBLIC_LIVE2D_MIN_WIDTH',
    [SettingKey.LIVE2D_DATA_SAVER_BLOCK]: 'NUXT_PUBLIC_LIVE2D_DATA_SAVER_BLOCK',
    [SettingKey.CANVAS_NEST_ENABLED]: 'NUXT_PUBLIC_CANVAS_NEST_ENABLED',
    [SettingKey.CANVAS_NEST_OPTIONS_JSON]: 'NUXT_PUBLIC_CANVAS_NEST_OPTIONS_JSON',
    [SettingKey.CANVAS_NEST_MOBILE_ENABLED]: 'NUXT_PUBLIC_CANVAS_NEST_MOBILE_ENABLED',
    [SettingKey.CANVAS_NEST_MIN_WIDTH]: 'NUXT_PUBLIC_CANVAS_NEST_MIN_WIDTH',
    [SettingKey.CANVAS_NEST_DATA_SAVER_BLOCK]: 'NUXT_PUBLIC_CANVAS_NEST_DATA_SAVER_BLOCK',
    [SettingKey.EFFECTS_MOBILE_ENABLED]: 'NUXT_PUBLIC_EFFECTS_MOBILE_ENABLED',
    [SettingKey.EFFECTS_MIN_WIDTH]: 'NUXT_PUBLIC_EFFECTS_MIN_WIDTH',
    [SettingKey.EFFECTS_DATA_SAVER_BLOCK]: 'NUXT_PUBLIC_EFFECTS_DATA_SAVER_BLOCK',
    // Web Push
    [SettingKey.WEB_PUSH_VAPID_SUBJECT]: 'WEB_PUSH_VAPID_SUBJECT',
    [SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]: 'WEB_PUSH_VAPID_PUBLIC_KEY',
    [SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY]: 'WEB_PUSH_VAPID_PRIVATE_KEY',
    // Limits
    [SettingKey.MAX_UPLOAD_SIZE]: 'NUXT_PUBLIC_MAX_UPLOAD_SIZE',
    [SettingKey.MAX_AUDIO_UPLOAD_SIZE]: 'NUXT_PUBLIC_MAX_AUDIO_UPLOAD_SIZE',
    [SettingKey.ALLOWED_FILE_TYPES]: 'NUXT_PUBLIC_ALLOWED_FILE_TYPES',
    [SettingKey.COMMENT_INTERVAL]: 'NUXT_PUBLIC_COMMENT_INTERVAL',
    [SettingKey.POSTS_PER_PAGE]: 'NUXT_PUBLIC_POSTS_PER_PAGE',
    [SettingKey.UPLOAD_DAILY_LIMIT]: 'UPLOAD_DAILY_LIMIT',
    [SettingKey.UPLOAD_SINGLE_USER_DAILY_LIMIT]: 'UPLOAD_SINGLE_USER_DAILY_LIMIT',
    [SettingKey.UPLOAD_LIMIT_WINDOW]: 'UPLOAD_LIMIT_WINDOW',
    // Branding
    [SettingKey.SITE_LOGO]: 'NUXT_PUBLIC_SITE_LOGO',
    [SettingKey.SITE_FAVICON]: 'NUXT_PUBLIC_SITE_FAVICON',
    [SettingKey.SITE_OPERATOR]: 'NUXT_PUBLIC_SITE_OPERATOR',
    [SettingKey.CONTACT_EMAIL]: 'NUXT_PUBLIC_CONTACT_EMAIL',
    [SettingKey.FEEDBACK_URL]: 'NUXT_PUBLIC_FEEDBACK_URL',
    // Theme
    [SettingKey.THEME_ACTIVE_CONFIG_ID]: 'THEME_ACTIVE_CONFIG_ID',
    [SettingKey.THEME_PRESET]: 'THEME_PRESET',
    [SettingKey.THEME_PRIMARY_COLOR]: 'THEME_PRIMARY_COLOR',
    [SettingKey.THEME_ACCENT_COLOR]: 'THEME_ACCENT_COLOR',
    [SettingKey.THEME_SURFACE_COLOR]: 'THEME_SURFACE_COLOR',
    [SettingKey.THEME_TEXT_COLOR]: 'THEME_TEXT_COLOR',
    [SettingKey.THEME_DARK_PRIMARY_COLOR]: 'THEME_DARK_PRIMARY_COLOR',
    [SettingKey.THEME_DARK_ACCENT_COLOR]: 'THEME_DARK_ACCENT_COLOR',
    [SettingKey.THEME_DARK_SURFACE_COLOR]: 'THEME_DARK_SURFACE_COLOR',
    [SettingKey.THEME_DARK_TEXT_COLOR]: 'THEME_DARK_TEXT_COLOR',
    [SettingKey.THEME_BORDER_RADIUS]: 'THEME_BORDER_RADIUS',
    [SettingKey.THEME_MOURNING_MODE]: 'THEME_MOURNING_MODE',
    [SettingKey.THEME_BACKGROUND_TYPE]: 'THEME_BACKGROUND_TYPE',
    [SettingKey.THEME_BACKGROUND_VALUE]: 'THEME_BACKGROUND_VALUE',
    // ASR
    [SettingKey.ASR_ENABLED]: 'ASR_ENABLED',
    [SettingKey.ASR_PROVIDER]: 'ASR_PROVIDER',
    [SettingKey.ASR_API_KEY]: 'ASR_API_KEY',
    [SettingKey.ASR_MODEL]: 'ASR_MODEL',
    [SettingKey.ASR_ENDPOINT]: 'ASR_ENDPOINT',
    [SettingKey.ASR_VOLCENGINE_APP_ID]: 'ASR_VOLCENGINE_APP_ID',
    [SettingKey.ASR_VOLCENGINE_CLUSTER_ID]: 'ASR_VOLCENGINE_CLUSTER_ID',
    [SettingKey.ASR_VOLCENGINE_ACCESS_KEY]: 'ASR_VOLCENGINE_ACCESS_KEY',
    [SettingKey.ASR_VOLCENGINE_SECRET_KEY]: 'ASR_VOLCENGINE_SECRET_KEY',
    [SettingKey.ASR_SILICONFLOW_API_KEY]: 'ASR_SILICONFLOW_API_KEY',
    [SettingKey.ASR_SILICONFLOW_MODEL]: 'ASR_SILICONFLOW_MODEL',
    // Volcengine Global
    [SettingKey.VOLCENGINE_APP_ID]: 'VOLCENGINE_APP_ID',
    [SettingKey.VOLCENGINE_ACCESS_KEY]: 'VOLCENGINE_ACCESS_KEY',
    [SettingKey.VOLCENGINE_SECRET_KEY]: 'VOLCENGINE_SECRET_KEY',
    // TTS
    [SettingKey.TTS_PROVIDER]: 'TTS_PROVIDER',
    [SettingKey.TTS_ENABLED]: 'TTS_ENABLED',
    [SettingKey.TTS_API_KEY]: 'TTS_API_KEY',
    [SettingKey.TTS_MODEL]: 'TTS_DEFAULT_MODEL',
    [SettingKey.TTS_ENDPOINT]: 'TTS_ENDPOINT',
    // Commercial
    [SettingKey.COMMERCIAL_SPONSORSHIP]: 'COMMERCIAL_SPONSORSHIP_JSON',
    // Third Party
    [SettingKey.MEMOS_ENABLED]: 'MEMOS_ENABLED',
    [SettingKey.MEMOS_INSTANCE_URL]: 'MEMOS_INSTANCE_URL',
    [SettingKey.MEMOS_ACCESS_TOKEN]: 'MEMOS_ACCESS_TOKEN',
    [SettingKey.MEMOS_DEFAULT_VISIBILITY]: 'MEMOS_DEFAULT_VISIBILITY',
    [SettingKey.LISTMONK_ENABLED]: 'LISTMONK_ENABLED',
    [SettingKey.LISTMONK_INSTANCE_URL]: 'LISTMONK_INSTANCE_URL',
    [SettingKey.LISTMONK_USERNAME]: 'LISTMONK_USERNAME',
    [SettingKey.LISTMONK_ACCESS_TOKEN]: 'LISTMONK_ACCESS_TOKEN',
    [SettingKey.LISTMONK_DEFAULT_LIST_IDS]: 'LISTMONK_DEFAULT_LIST_IDS',
    [SettingKey.LISTMONK_CATEGORY_LIST_MAP]: 'LISTMONK_CATEGORY_LIST_MAP',
    [SettingKey.LISTMONK_TAG_LIST_MAP]: 'LISTMONK_TAG_LIST_MAP',
    [SettingKey.LISTMONK_TEMPLATE_ID]: 'LISTMONK_TEMPLATE_ID',
}

const LEGACY_SETTING_KEY_ALIASES: Partial<Record<string, string[]>> = {
    [SettingKey.POST_COPYRIGHT]: ['site_copyright'],
    [SettingKey.SITE_COPYRIGHT_OWNER]: ['footer_copyright_owner'],
    [SettingKey.SITE_COPYRIGHT_START_YEAR]: ['footer_copyright_start_year'],
}

const LEGACY_SETTING_ENV_ALIASES: Partial<Record<string, string[]>> = {
    [SettingKey.POST_COPYRIGHT]: ['NUXT_PUBLIC_DEFAULT_COPYRIGHT'],
    [SettingKey.SITE_COPYRIGHT_OWNER]: ['NUXT_PUBLIC_FOOTER_COPYRIGHT_OWNER'],
    [SettingKey.SITE_COPYRIGHT_START_YEAR]: ['NUXT_PUBLIC_FOOTER_COPYRIGHT_START_YEAR'],
}

const LEGACY_SETTING_KEY_SET = new Set<string>(Object.values(LEGACY_SETTING_KEY_ALIASES).flatMap((keys) => keys ?? []))
/**
 * 强制被环境变量锁定的键名 (无法从后台修改，仅能通过 ENV 修改)
 * 主要是因为目前部分底层库(如 Better-Auth)直接读取了 process.env 而非通过 Service 加载
 */
export const FORCED_ENV_LOCKED_KEYS: string[] = [
    SettingKey.SITE_URL,
    SettingKey.EMAIL_REQUIRE_VERIFICATION,
    SettingKey.GITHUB_CLIENT_ID,
    SettingKey.GITHUB_CLIENT_SECRET,
    SettingKey.GOOGLE_CLIENT_ID,
    SettingKey.GOOGLE_CLIENT_SECRET,
    SettingKey.CAPTCHA_SITE_KEY,
    SettingKey.CAPTCHA_SECRET_KEY,
]

/**
 * 仅作为宿主环境变量存在的后端私有键名
 */
export const INTERNAL_ONLY_ENV_KEYS: string[] = [
    'AUTH_SECRET',
    'BETTER_AUTH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'AXIOM_API_TOKEN',
]

/**
 * 使用 SettingKey 表示、但只允许后端从环境变量读取的键名
 */
export const INTERNAL_ONLY_SETTING_KEYS: string[] = [
    SettingKey.ASR_VOLCENGINE_SECRET_KEY,
    SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY,
]

/**
 * 极端敏感且仅限后端加载的键名 (完全不在后台设置 UI 中展示)
 */
export const INTERNAL_ONLY_KEYS: string[] = [
    ...INTERNAL_ONLY_ENV_KEYS,
    ...INTERNAL_ONLY_SETTING_KEYS,
]

const INTERNAL_ONLY_SETTING_KEY_SET = new Set<string>(INTERNAL_ONLY_SETTING_KEYS)

const SETTING_DEFAULT_MAP: Partial<Record<string, string>> = {
    [SettingKey.DEFAULT_LANGUAGE]: 'zh-CN',
    [SettingKey.AI_QUOTA_ENABLED]: 'false',
    [SettingKey.AI_QUOTA_POLICIES]: '[]',
    [SettingKey.AI_ALERT_THRESHOLDS]: '{"enabled":true,"quotaUsageRatios":[0.5,0.8,1],"costUsageRatios":[0.8,1],"failureBurst":{"enabled":true,"windowMinutes":10,"maxFailures":3,"categories":["image","asr","tts","podcast"]},"dedupeWindowMinutes":1440,"maxAlerts":10}',
    [SettingKey.AI_COST_FACTORS]: '{"currencyCode":"CNY","currencySymbol":"¥","quotaUnitPrice":0.1,"exchangeRates":{"CNY":1,"USD":7.0},"providerCurrencies":{"openai":"USD","anthropic":"USD","gemini":"USD","groq":"USD","siliconflow":"CNY","volcengine":"CNY","doubao":"CNY","deepseek":"CNY"}}',
    [SettingKey.EMAIL_PORT]: '587',
    [SettingKey.POSTS_PER_PAGE]: '10',
    [SettingKey.FRIEND_LINKS_ENABLED]: 'true',
    [SettingKey.FRIEND_LINKS_APPLICATION_ENABLED]: 'true',
    [SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES]: '',
    [SettingKey.FRIEND_LINKS_FOOTER_ENABLED]: 'true',
    [SettingKey.FRIEND_LINKS_FOOTER_LIMIT]: '6',
    [SettingKey.FRIEND_LINKS_CHECK_INTERVAL_MINUTES]: '1440',
    [SettingKey.TRAVELLINGS_ENABLED]: 'true',
    [SettingKey.TRAVELLINGS_HEADER_ENABLED]: 'true',
    [SettingKey.TRAVELLINGS_FOOTER_ENABLED]: 'true',
    [SettingKey.TRAVELLINGS_SIDEBAR_ENABLED]: 'true',
    [SettingKey.LIVE2D_MIN_WIDTH]: '1024',
    [SettingKey.CANVAS_NEST_MIN_WIDTH]: '1024',
    [SettingKey.EFFECTS_MIN_WIDTH]: '1024',
}

const RESTART_REQUIRED_KEYS = new Set<string>(FORCED_ENV_LOCKED_KEYS)

export const LOCALIZED_SETTING_DEFINITIONS: Partial<Record<string, LocalizedSettingDefinition>> = {
    [SettingKey.SITE_TITLE]: {
        key: SettingKey.SITE_TITLE,
        valueType: 'localized-text',
        publicReadable: true,
        adminEditable: true,
        fallbackMode: 'locale-registry',
        legacyCompatibility: true,
    },
    [SettingKey.SITE_DESCRIPTION]: {
        key: SettingKey.SITE_DESCRIPTION,
        valueType: 'localized-text',
        publicReadable: true,
        adminEditable: true,
        fallbackMode: 'locale-registry',
        legacyCompatibility: true,
    },
    [SettingKey.SITE_KEYWORDS]: {
        key: SettingKey.SITE_KEYWORDS,
        valueType: 'localized-string-list',
        publicReadable: true,
        adminEditable: true,
        fallbackMode: 'locale-registry',
        legacyCompatibility: true,
    },
    [SettingKey.SITE_OPERATOR]: {
        key: SettingKey.SITE_OPERATOR,
        valueType: 'localized-text',
        publicReadable: true,
        adminEditable: true,
        fallbackMode: 'locale-registry',
        legacyCompatibility: true,
    },
    [SettingKey.SITE_COPYRIGHT_OWNER]: {
        key: SettingKey.SITE_COPYRIGHT_OWNER,
        valueType: 'localized-text',
        publicReadable: true,
        adminEditable: true,
        fallbackMode: 'locale-registry',
        legacyCompatibility: true,
    },
    [SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES]: {
        key: SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES,
        valueType: 'localized-text',
        publicReadable: true,
        adminEditable: true,
        fallbackMode: 'locale-registry',
        legacyCompatibility: true,
    },
}

interface ParsedLocalizedSettingState {
    payload: LocalizedSettingValueV1 | null
    legacyValue: LocalizedSettingScalar | null
    structured: boolean
    legacyFormat: boolean
    availableLocales: string[]
}

function uniqValues(values: (string | undefined | null)[]) {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function isSettingWriteEnvelope(value: unknown): value is {
    value?: unknown
    description?: string | null
    level?: number | null
    maskType?: string | null
} {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false
    }

    return 'value' in value
        || 'description' in value
        || 'level' in value
        || 'maskType' in value
}

export function getLocalizedSettingDefinition(key: string): LocalizedSettingDefinition | null {
    return LOCALIZED_SETTING_DEFINITIONS[key as SettingKey] ?? null
}

export function isLocalizedSettingKey(key: string) {
    return getLocalizedSettingDefinition(key) !== null
}

function parseStoredLocalizedSettingValue(key: string, rawValue: string | null | undefined): ParsedLocalizedSettingState | null {
    const definition = getLocalizedSettingDefinition(key)

    if (!definition) {
        return null
    }

    if (!rawValue || rawValue.trim().length === 0) {
        return {
            payload: null,
            legacyValue: null,
            structured: false,
            legacyFormat: false,
            availableLocales: [],
        }
    }

    try {
        const parsedValue = JSON.parse(rawValue) as unknown
        if (isLocalizedSettingValue(parsedValue, definition.valueType)) {
            return {
                payload: parsedValue,
                legacyValue: parsedValue.legacyValue ?? null,
                structured: true,
                legacyFormat: false,
                availableLocales: Object.keys(parsedValue.locales),
            }
        }
    } catch {
        // Fall through to legacy single-value compatibility.
    }

    return {
        payload: null,
        legacyValue: normalizeLocalizedLegacyValue(rawValue, definition.valueType),
        structured: false,
        legacyFormat: true,
        availableLocales: [],
    }
}

function getLocalizedSettingMetadata(key: string, rawValue: string | null | undefined): LocalizedSettingMetadata | null {
    const definition = getLocalizedSettingDefinition(key)
    const parsedState = parseStoredLocalizedSettingValue(key, rawValue)

    if (!definition || !parsedState) {
        return null
    }

    return {
        valueType: definition.valueType,
        structured: parsedState.structured,
        legacyFormat: parsedState.legacyFormat,
        legacyValuePresent: hasMeaningfulLocalizedValue(parsedState.legacyValue),
        availableLocales: parsedState.availableLocales.map((locale) => resolveRequestedAppLocale(locale)),
    }
}

function normalizeResolvedSettingValue(key: string, rawValue: unknown): SettingValue {
    const definition = getLocalizedSettingDefinition(key)

    if (definition && typeof rawValue === 'string') {
        const parsedState = parseStoredLocalizedSettingValue(key, rawValue)
        if (parsedState?.structured && parsedState.payload) {
            return parsedState.payload
        }
    }

    if (isLocalizedSettingValue(rawValue, definition?.valueType)) {
        return rawValue
    }

    return normalizeSettingValue(rawValue)
}

export function getSettingLookupKeys(key: string) {
    return uniqValues([key, ...(LEGACY_SETTING_KEY_ALIASES[key] ?? [])])
}

function getSettingEnvKeys(key: string) {
    return uniqValues([SETTING_ENV_MAP[key], ...(LEGACY_SETTING_ENV_ALIASES[key] ?? [])])
}

export function resolveSettingEnvEntry(key: string) {
    const envKeys = getSettingEnvKeys(key)

    for (const envKey of envKeys) {
        if (process.env[envKey] !== undefined) {
            return {
                envKey,
                value: process.env[envKey],
            }
        }
    }

    return {
        envKey: envKeys[0] ?? null,
        value: undefined,
    }
}

function resolveSettingRecordFromMap(settingsMap: Map<string, Setting>, key: string) {
    for (const lookupKey of getSettingLookupKeys(key)) {
        const setting = settingsMap.get(lookupKey)
        if (setting) {
            return setting
        }
    }

    return null
}

async function findSettingRecord(key: string) {
    const settingRepo = dataSource.getRepository(Setting)
    const records = await settingRepo.find({ where: { key: In(getSettingLookupKeys(key)) } })
    const settingsMap = new Map<string, Setting>(records.map((setting) => [setting.key, setting]))
    return resolveSettingRecordFromMap(settingsMap, key)
}

export function isInternalOnlySettingKey(key: string) {
    return INTERNAL_ONLY_SETTING_KEY_SET.has(key)
}

function isLegacyOnlySettingKey(key: string) {
    return LEGACY_SETTING_KEY_SET.has(key)
}

export function isSettingEnvLocked(key: string) {
    const { value } = resolveSettingEnvEntry(key)
    return Boolean(
        isInternalOnlySettingKey(key)
        || value !== undefined
        || FORCED_ENV_LOCKED_KEYS.includes(key),
    )
}

export function getSettingEffectiveSource(key: string): SettingEffectiveSource {
    if (isInternalOnlySettingKey(key)) {
        return 'env'
    }

    return resolveSettingEnvEntry(key).value !== undefined ? 'env' : 'db'
}

export function getSettingDefaultValue(key: string) {
    return SETTING_DEFAULT_MAP[key] ?? null
}

export function getSettingLockReason(key: string): SettingLockReason | null {
    if (resolveSettingEnvEntry(key).value !== undefined) {
        return 'env_override'
    }

    if (isInternalOnlySettingKey(key)) {
        return 'forced_env_lock'
    }

    if (FORCED_ENV_LOCKED_KEYS.includes(key)) {
        return 'forced_env_lock'
    }

    return null
}

export function doesSettingRequireRestart(key: string) {
    return RESTART_REQUIRED_KEYS.has(key)
}

function normalizeSettingValue(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return String(value)
    }

    try {
        return JSON.stringify(value)
    } catch {
        return null
    }
}

function inferSettingLevel(key: string, explicitLevel?: unknown) {
    if (isInternalOnlySettingKey(key)) {
        return 3
    }

    return resolveSettingLevel(key, explicitLevel)
}

function createResolvedSettingItem(
    key: string,
    dbSetting?: Setting | null,
    explicitDefaultValue?: unknown,
): SettingResolvedItem {
    const effectiveDbSetting = isInternalOnlySettingKey(key) ? null : dbSetting
    const { envKey, value: envValue } = resolveSettingEnvEntry(key)
    const defaultValue = normalizeResolvedSettingValue(key, explicitDefaultValue) ?? normalizeResolvedSettingValue(key, getSettingDefaultValue(key))

    let rawValue: unknown = defaultValue
    let source: SettingResolvedItem['source'] = 'default'

    if (envValue !== undefined) {
        rawValue = envValue
        source = 'env'
    } else if (effectiveDbSetting?.value !== null && effectiveDbSetting?.value !== undefined) {
        rawValue = effectiveDbSetting.value
        source = 'db'
    }

    const value = normalizeResolvedSettingValue(key, rawValue) ?? ''
    let rawStringValue: string | null = null

    if (typeof rawValue === 'string') {
        rawStringValue = rawValue
    } else if (typeof value === 'string') {
        rawStringValue = value
    }

    const maskType = resolveSettingMaskType(key, rawStringValue ?? '', effectiveDbSetting?.maskType)
    const level = inferSettingLevel(key, effectiveDbSetting?.level)

    return {
        key,
        value,
        description: effectiveDbSetting?.description ?? '',
        level,
        maskType,
        source,
        isLocked: isSettingEnvLocked(key),
        envKey,
        defaultValue,
        defaultUsed: source === 'default',
        lockReason: getSettingLockReason(key),
        requiresRestart: doesSettingRequireRestart(key),
        localized: getLocalizedSettingMetadata(key, rawStringValue),
    }
}

export async function resolveSetting(key: SettingKey | string, defaultValue: unknown = null) {
    if (!dataSource.isInitialized) {
        return createResolvedSettingItem(key, null, defaultValue)
    }

    try {
        const setting = await findSettingRecord(key)
        return createResolvedSettingItem(key, setting, defaultValue)
    } catch (error) {
        logger.error(`Failed to resolve setting ${key} from database:`, error)
        return createResolvedSettingItem(key, null, defaultValue)
    }
}

export const resolveSettings = async (keys: (SettingKey | string)[]) => {
    const result: SettingResolvedItem[] = []

    if (!dataSource.isInitialized) {
        keys.forEach((key) => {
            result.push(createResolvedSettingItem(key))
        })
        return result
    }

    try {
        const settingRepo = dataSource.getRepository(Setting)
        const settings = await settingRepo.find()
        const settingsMap = new Map<string, Setting>(settings.map((setting) => [setting.key, setting]))

        keys.forEach((key) => {
            result.push(createResolvedSettingItem(key, resolveSettingRecordFromMap(settingsMap, key)))
        })
    } catch (error) {
        logger.error('Failed to resolve settings from database:', error)
        keys.forEach((key) => {
            result.push(createResolvedSettingItem(key))
        })
    }

    return result
}

/**
 * 获取指定键的设置值
 * 遵循优先从环境变量获取，其次数据库的原则
 *
 * @param key 设置键名
 * @param defaultValue 默认值 (当环境变量和数据库都没有时返回)
 * @returns 设置值
 */
export async function getSetting<T = string>(key: SettingKey | string, defaultValue: T | null = null): Promise<string | T | null> {
    // 优先从环境变量获取
    const { value: envValue } = resolveSettingEnvEntry(key)
    if (envValue !== undefined) {
        return envValue
    }

    if (isInternalOnlySettingKey(key)) {
        return defaultValue
    }

    // 如果数据库未初始化，返回默认值
    if (!dataSource.isInitialized) {
        return defaultValue
    }

    try {
        const setting = await findSettingRecord(key)
        return setting?.value ?? (defaultValue as any)
    } catch (error) {
        logger.error(`Failed to get setting ${key} from database:`, error)
        return defaultValue
    }
}

/**
 * 获取多个设置值
 * 遵循优先从环境变量获取，其次数据库的原则
 *
 * @param keys 设置键名数组
 * @returns 键值对对象
 */
export const getSettings = async (keys: (SettingKey | string)[]): Promise<Record<string, string | null>> => {
    const result: Record<string, string | null> = {}

    // 初始化默认值，优先从环境变量获取
    keys.forEach((key) => {
        const { value } = resolveSettingEnvEntry(key)
        if (value !== undefined) {
            result[key] = value
        } else {
            result[key] = null
        }
    })

    // 如果数据库未初始化，直接返回从环境变量获取的结果
    if (!dataSource.isInitialized) {
        return result
    }

    try {
        const settingRepo = dataSource.getRepository(Setting)
        const settings = await settingRepo.find()
        const settingsMap = new Map<string, Setting>(settings.map((setting) => [setting.key, setting]))

        keys.forEach((key) => {
            const setting = resolveSettingRecordFromMap(settingsMap, key)
            if (result[key] === null && setting && !isInternalOnlySettingKey(setting.key)) {
                result[key] = setting.value
            }
        })
    } catch (error) {
        logger.error('Failed to get settings from database:', error)
    }

    return result
}

export async function getLocalizedSetting<T extends LocalizedSettingScalar = string>(
    key: SettingKey | string,
    locale?: string | null,
): Promise<ResolvedLocalizedSetting<T>> {
    const definition = getLocalizedSettingDefinition(key)
    const requestedLocale = resolveRequestedAppLocale(locale)
    const fallbackChain = getLocalizedFallbackChain(requestedLocale)
    const rawValue = await getSetting<string>(key, null)

    if (!definition || typeof rawValue !== 'string' || rawValue.trim().length === 0) {
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

    const parsedState = parseStoredLocalizedSettingValue(key, rawValue)

    if (!parsedState) {
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

    if (parsedState.payload) {
        for (const candidateLocale of fallbackChain) {
            const localeValue = readLocalizedLocaleValue(parsedState.payload, candidateLocale)
            if (hasMeaningfulLocalizedValue(localeValue)) {
                return {
                    key,
                    value: localeValue as T,
                    requestedLocale,
                    resolvedLocale: candidateLocale,
                    fallbackChain,
                    usedFallback: candidateLocale !== requestedLocale,
                    usedLegacyValue: false,
                }
            }
        }
    }

    if (hasMeaningfulLocalizedValue(parsedState.legacyValue)) {
        return {
            key,
            value: parsedState.legacyValue as T,
            requestedLocale,
            resolvedLocale: 'legacy',
            fallbackChain,
            usedFallback: true,
            usedLegacyValue: true,
        }
    }

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

export async function getLocalizedSettings(
    keys: (SettingKey | string)[],
    locale?: string | null,
): Promise<Record<string, ResolvedLocalizedSetting>> {
    const entries = await Promise.all(keys.map(async (key) => [key, await getLocalizedSetting(key, locale)] as const))
    return Object.fromEntries(entries)
}

/**
 * 设置或更新配置项
 *
 * @param key 设置键名
 * @param value 设置值
 * @param options 配置选项 (级别、描述、脱敏类型)
 */
export const setSetting = async (
    key: string,
    value: string | null,
    options?: {
        level?: number
        description?: string
        maskType?: string
    },
    auditContext?: SettingAuditContext,
) => {
    await setSettings({
        [key]: {
            value,
            description: options?.description,
            level: options?.level,
            maskType: options?.maskType,
        },
    }, auditContext)
}

/**
 * 获取所有设置项 (Admin 仅限)
 * @param includeSecrets 是否包含机密信息 (level 3)
 * @param shouldMask 是否执行脱敏
 */
export const getAllSettings = async (options?: { includeSecrets?: boolean, shouldMask?: boolean }) => {
    const settingRepo = dataSource.getRepository(Setting)
    // 先读取全部数据库记录，再按归一化后的 level 过滤，避免旧数据在查询阶段被提前排除。
    const dbSettings: Setting[] = await settingRepo.createQueryBuilder('setting').getMany()
    const dbSettingsMap = new Map<string, Setting>(dbSettings.map((s: Setting) => [s.key, s]))

    // 确保所有在 SETTING_ENV_MAP 中定义的键都能出现在列表中，即使数据库中不存在
    const allKeys = new Set<string>([...Object.keys(SETTING_ENV_MAP), ...dbSettingsMap.keys()])

    const result: Omit<SettingResolvedItem, 'defaultValue'>[] = []
    for (const key of allKeys) {
        if (isLegacyOnlySettingKey(key)) {
            continue
        }

        // 如果是极端敏感的内部键，则完全跳过，不在 UI 展示
        if (isInternalOnlySettingKey(key)) {
            continue
        }

        const dbSetting = resolveSettingRecordFromMap(dbSettingsMap, key)

        const resolved = createResolvedSettingItem(key, dbSetting)

        if (!options?.includeSecrets && resolved.level >= 3) {
            continue
        }

        const maskedValue = options?.shouldMask && typeof resolved.value === 'string'
            ? maskSettingValue(resolved.value ?? '', resolved.maskType)
            : resolved.value

        result.push({
            key,
            value: maskedValue,
            description: resolved.description,
            level: resolved.level,
            maskType: resolved.maskType,
            source: resolved.source,
            isLocked: resolved.isLocked,
            envKey: resolved.envKey,
            defaultUsed: resolved.defaultUsed,
            lockReason: resolved.lockReason,
            requiresRestart: resolved.requiresRestart,
            localized: resolved.localized ?? null,
        })
    }

    return result
}

/**
 * 批量设置配置项
 *
 * @param settings 键值对对象，key 也可以是对象包含具体属性
 */
export const setSettings = async (settings: Record<string, any>, auditContext?: SettingAuditContext) => {
    const settingRepo = dataSource.getRepository(Setting)
    const entries = Object.entries(settings)
    const auditChanges: SettingAuditChange[] = []

    for (const [key, val] of entries) {
        if (isInternalOnlySettingKey(key)) {
            logger.warn(`[Settings] Ignored attempt to persist internal-only setting: ${key}`)
            continue
        }

        if (isSettingEnvLocked(key)) {
            continue // 跳过锁定的配置项
        }

        const existingSetting = await findSettingRecord(key)
        let setting = existingSetting?.key === key ? existingSetting : null

        const value = isSettingWriteEnvelope(val) ? val.value : val
        const previousValue = existingSetting?.value ?? null
        const extraMaskType = isSettingWriteEnvelope(val) && typeof val.maskType === 'string' ? val.maskType : undefined
        const extraDescription = isSettingWriteEnvelope(val) ? val.description : undefined
        const extraLevel = isSettingWriteEnvelope(val) ? val.level : undefined
        const previousMaskType = resolveSettingMaskType(key, previousValue ?? '', existingSetting?.maskType ?? extraMaskType)
        const normalizedIncomingValue = normalizeSettingValue(value)
        const currentMaskType = resolveSettingMaskType(key, previousValue ?? '', existingSetting?.maskType)
        const isExistingMaskedPlaceholder = normalizedIncomingValue !== null
            && existingSetting !== null
            && existingSetting !== undefined
            && (
                isMaskedSettingPlaceholder(normalizedIncomingValue, existingSetting.maskType)
                || isMaskedSettingPlaceholder(normalizedIncomingValue, currentMaskType)
            )
        const nextValue: string | null = isExistingMaskedPlaceholder
            ? existingSetting.value
            : normalizedIncomingValue
        const nextMaskType = resolveSettingMaskType(key, nextValue ?? '', extraMaskType ?? existingSetting?.maskType)
        const nextLevel = inferSettingLevel(key, extraLevel ?? existingSetting?.level)

        if (setting) {
            // 如果是脱敏过的值且没有变化（即用户提交的是脱敏后的占位符），则跳过值更新
            if (!(normalizedIncomingValue !== null && (
                isMaskedSettingPlaceholder(normalizedIncomingValue, setting.maskType)
                || isMaskedSettingPlaceholder(normalizedIncomingValue, nextMaskType)
            ))) {
                setting.value = nextValue
            }

            if (extraDescription !== undefined) {
                setting.description = String(extraDescription)
            }
            setting.level = nextLevel
            setting.maskType = nextMaskType
        } else {
            setting = settingRepo.create({
                key,
                value: nextValue,
                description: String(extraDescription ?? ''),
                level: nextLevel,
                maskType: nextMaskType,
            })
        }
        await settingRepo.save(setting)

        const legacyKeys = getSettingLookupKeys(key).filter((lookupKey) => lookupKey !== key)
        if (legacyKeys.length > 0) {
            await settingRepo.delete({ key: In(legacyKeys) })
        }

        if (!existingSetting || previousValue !== nextValue || previousMaskType !== nextMaskType) {
            auditChanges.push({
                key,
                action: existingSetting ? 'update' : 'create',
                oldValue: previousValue,
                newValue: nextValue,
                maskType: nextMaskType,
                effectiveSource: getSettingEffectiveSource(key),
                isOverriddenByEnv: getSettingEffectiveSource(key) === 'env',
            })
        }
    }

    if (auditChanges.length > 0) {
        await recordSettingAuditLogs(auditChanges, auditContext)
    }
}
