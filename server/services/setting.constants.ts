import { SettingKey, type LocalizedSettingDefinition, type SettingEffectiveSource, type SettingLockReason } from '@/types/setting'

export const SETTING_ENV_MAP: Record<string, string> = {
    [SettingKey.SITE_NAME]: 'NUXT_PUBLIC_APP_NAME',
    [SettingKey.SITE_DESCRIPTION]: 'NUXT_PUBLIC_SITE_DESCRIPTION',
    [SettingKey.SITE_KEYWORDS]: 'NUXT_PUBLIC_SITE_KEYWORDS',
    [SettingKey.POST_COPYRIGHT]: 'NUXT_PUBLIC_POST_COPYRIGHT',
    [SettingKey.SITE_COPYRIGHT_OWNER]: 'NUXT_PUBLIC_SITE_COPYRIGHT_OWNER',
    [SettingKey.SITE_COPYRIGHT_START_YEAR]: 'NUXT_PUBLIC_SITE_COPYRIGHT_START_YEAR',
    [SettingKey.SITE_URL]: 'NUXT_PUBLIC_SITE_URL',
    [SettingKey.DEFAULT_LANGUAGE]: 'NUXT_PUBLIC_DEFAULT_LANGUAGE',
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
    [SettingKey.AI_IMAGE_ENABLED]: 'AI_IMAGE_ENABLED',
    [SettingKey.AI_IMAGE_PROVIDER]: 'AI_IMAGE_PROVIDER',
    [SettingKey.AI_IMAGE_API_KEY]: 'AI_IMAGE_API_KEY',
    [SettingKey.AI_IMAGE_MODEL]: 'AI_IMAGE_MODEL',
    [SettingKey.AI_IMAGE_ENDPOINT]: 'AI_IMAGE_ENDPOINT',
    [SettingKey.EMAIL_HOST]: 'EMAIL_HOST',
    [SettingKey.EMAIL_PORT]: 'EMAIL_PORT',
    [SettingKey.EMAIL_USER]: 'EMAIL_USER',
    [SettingKey.EMAIL_PASS]: 'EMAIL_PASS',
    [SettingKey.EMAIL_FROM]: 'EMAIL_FROM',
    [SettingKey.EMAIL_REQUIRE_VERIFICATION]: 'EMAIL_REQUIRE_VERIFICATION',
    [SettingKey.EMAIL_DAILY_LIMIT]: 'EMAIL_DAILY_LIMIT',
    [SettingKey.EMAIL_SINGLE_USER_DAILY_LIMIT]: 'EMAIL_SINGLE_USER_DAILY_LIMIT',
    [SettingKey.EMAIL_LIMIT_WINDOW]: 'EMAIL_LIMIT_WINDOW',
    [SettingKey.EMAIL_TEMPLATE_CONFIGS]: 'EMAIL_TEMPLATE_CONFIGS',
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
    [SettingKey.BAIDU_ANALYTICS]: 'NUXT_PUBLIC_BAIDU_ANALYTICS_ID',
    [SettingKey.GOOGLE_ANALYTICS]: 'NUXT_PUBLIC_GOOGLE_ANALYTICS_ID',
    [SettingKey.CLARITY_ANALYTICS]: 'NUXT_PUBLIC_CLARITY_PROJECT_ID',
    [SettingKey.GITHUB_CLIENT_ID]: 'NUXT_PUBLIC_GITHUB_CLIENT_ID',
    [SettingKey.GITHUB_CLIENT_SECRET]: 'GITHUB_CLIENT_SECRET',
    [SettingKey.GOOGLE_CLIENT_ID]: 'NUXT_PUBLIC_GOOGLE_CLIENT_ID',
    [SettingKey.GOOGLE_CLIENT_SECRET]: 'GOOGLE_CLIENT_SECRET',
    [SettingKey.ANONYMOUS_LOGIN_ENABLED]: 'ANONYMOUS_LOGIN_ENABLED',
    [SettingKey.ALLOW_REGISTRATION]: 'ALLOW_REGISTRATION',
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
    [SettingKey.WEB_PUSH_VAPID_SUBJECT]: 'WEB_PUSH_VAPID_SUBJECT',
    [SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]: 'WEB_PUSH_VAPID_PUBLIC_KEY',
    [SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY]: 'WEB_PUSH_VAPID_PRIVATE_KEY',
    [SettingKey.MAX_UPLOAD_SIZE]: 'NUXT_PUBLIC_MAX_UPLOAD_SIZE',
    [SettingKey.MAX_AUDIO_UPLOAD_SIZE]: 'NUXT_PUBLIC_MAX_AUDIO_UPLOAD_SIZE',
    [SettingKey.ALLOWED_FILE_TYPES]: 'NUXT_PUBLIC_ALLOWED_FILE_TYPES',
    [SettingKey.COMMENT_INTERVAL]: 'NUXT_PUBLIC_COMMENT_INTERVAL',
    [SettingKey.POSTS_PER_PAGE]: 'NUXT_PUBLIC_POSTS_PER_PAGE',
    [SettingKey.UPLOAD_DAILY_LIMIT]: 'UPLOAD_DAILY_LIMIT',
    [SettingKey.UPLOAD_SINGLE_USER_DAILY_LIMIT]: 'UPLOAD_SINGLE_USER_DAILY_LIMIT',
    [SettingKey.UPLOAD_LIMIT_WINDOW]: 'UPLOAD_LIMIT_WINDOW',
    [SettingKey.SITE_LOGO]: 'NUXT_PUBLIC_SITE_LOGO',
    [SettingKey.SITE_FAVICON]: 'NUXT_PUBLIC_SITE_FAVICON',
    [SettingKey.SITE_OPERATOR]: 'NUXT_PUBLIC_SITE_OPERATOR',
    [SettingKey.CONTACT_EMAIL]: 'NUXT_PUBLIC_CONTACT_EMAIL',
    [SettingKey.FEEDBACK_URL]: 'NUXT_PUBLIC_FEEDBACK_URL',
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
    [SettingKey.ASR_ENABLED]: 'ASR_ENABLED',
    [SettingKey.ASR_PROVIDER]: 'ASR_PROVIDER',
    [SettingKey.ASR_API_KEY]: 'ASR_API_KEY',
    [SettingKey.ASR_MODEL]: 'ASR_MODEL',
    [SettingKey.ASR_ENDPOINT]: 'ASR_ENDPOINT',
    [SettingKey.ASR_CREDENTIAL_TTL_SECONDS]: 'ASR_CREDENTIAL_TTL_SECONDS',
    [SettingKey.ASR_VOLCENGINE_APP_ID]: 'ASR_VOLCENGINE_APP_ID',
    [SettingKey.ASR_VOLCENGINE_CLUSTER_ID]: 'ASR_VOLCENGINE_CLUSTER_ID',
    [SettingKey.ASR_VOLCENGINE_ACCESS_KEY]: 'ASR_VOLCENGINE_ACCESS_KEY',
    [SettingKey.ASR_VOLCENGINE_SECRET_KEY]: 'ASR_VOLCENGINE_SECRET_KEY',
    [SettingKey.ASR_SILICONFLOW_API_KEY]: 'ASR_SILICONFLOW_API_KEY',
    [SettingKey.ASR_SILICONFLOW_MODEL]: 'ASR_SILICONFLOW_MODEL',
    [SettingKey.VOLCENGINE_APP_ID]: 'VOLCENGINE_APP_ID',
    [SettingKey.VOLCENGINE_ACCESS_KEY]: 'VOLCENGINE_ACCESS_KEY',
    [SettingKey.VOLCENGINE_SECRET_KEY]: 'VOLCENGINE_SECRET_KEY',
    [SettingKey.TTS_PROVIDER]: 'TTS_PROVIDER',
    [SettingKey.TTS_ENABLED]: 'TTS_ENABLED',
    [SettingKey.TTS_API_KEY]: 'TTS_API_KEY',
    [SettingKey.TTS_MODEL]: 'TTS_DEFAULT_MODEL',
    [SettingKey.TTS_ENDPOINT]: 'TTS_ENDPOINT',
    [SettingKey.COMMERCIAL_SPONSORSHIP]: 'COMMERCIAL_SPONSORSHIP_JSON',
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
    [SettingKey.HEXO_SYNC_ENABLED]: 'HEXO_SYNC_ENABLED',
    [SettingKey.HEXO_SYNC_PROVIDER]: 'HEXO_SYNC_PROVIDER',
    [SettingKey.HEXO_SYNC_OWNER]: 'HEXO_SYNC_OWNER',
    [SettingKey.HEXO_SYNC_REPO]: 'HEXO_SYNC_REPO',
    [SettingKey.HEXO_SYNC_BRANCH]: 'HEXO_SYNC_BRANCH',
    [SettingKey.HEXO_SYNC_POSTS_DIR]: 'HEXO_SYNC_POSTS_DIR',
    [SettingKey.HEXO_SYNC_ACCESS_TOKEN]: 'HEXO_SYNC_ACCESS_TOKEN',
    [SettingKey.EXTERNAL_FEED_ENABLED]: 'NUXT_PUBLIC_EXTERNAL_FEED_ENABLED',
    [SettingKey.EXTERNAL_FEED_SOURCES]: 'EXTERNAL_FEED_SOURCES',
    [SettingKey.EXTERNAL_FEED_HOME_ENABLED]: 'NUXT_PUBLIC_EXTERNAL_FEED_HOME_ENABLED',
    [SettingKey.EXTERNAL_FEED_HOME_LIMIT]: 'NUXT_PUBLIC_EXTERNAL_FEED_HOME_LIMIT',
    [SettingKey.EXTERNAL_FEED_CACHE_TTL_SECONDS]: 'EXTERNAL_FEED_CACHE_TTL_SECONDS',
    [SettingKey.EXTERNAL_FEED_STALE_WHILE_ERROR_SECONDS]: 'EXTERNAL_FEED_STALE_WHILE_ERROR_SECONDS',
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

export const INTERNAL_ONLY_ENV_KEYS: string[] = [
    'AUTH_SECRET',
    'BETTER_AUTH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'AXIOM_API_TOKEN',
]

export const INTERNAL_ONLY_SETTING_KEYS: string[] = [
    SettingKey.ASR_VOLCENGINE_SECRET_KEY,
    SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY,
    SettingKey.HEXO_SYNC_ENABLED,
    SettingKey.HEXO_SYNC_PROVIDER,
    SettingKey.HEXO_SYNC_OWNER,
    SettingKey.HEXO_SYNC_REPO,
    SettingKey.HEXO_SYNC_BRANCH,
    SettingKey.HEXO_SYNC_POSTS_DIR,
    SettingKey.HEXO_SYNC_ACCESS_TOKEN,
]

export const ADMIN_SETTINGS_EXCLUDED_KEYS: string[] = [
    SettingKey.HEXO_SYNC_ENABLED,
    SettingKey.HEXO_SYNC_PROVIDER,
    SettingKey.HEXO_SYNC_OWNER,
    SettingKey.HEXO_SYNC_REPO,
    SettingKey.HEXO_SYNC_BRANCH,
    SettingKey.HEXO_SYNC_POSTS_DIR,
    SettingKey.HEXO_SYNC_ACCESS_TOKEN,
]

export const INTERNAL_ONLY_KEYS: string[] = [
    ...INTERNAL_ONLY_ENV_KEYS,
    ...INTERNAL_ONLY_SETTING_KEYS,
]

const INTERNAL_ONLY_SETTING_KEY_SET = new Set<string>(INTERNAL_ONLY_SETTING_KEYS)
const ADMIN_SETTINGS_EXCLUDED_KEY_SET = new Set<string>(ADMIN_SETTINGS_EXCLUDED_KEYS)

const SETTING_DEFAULT_MAP: Partial<Record<string, string>> = {
    [SettingKey.DEFAULT_LANGUAGE]: 'zh-CN',
    [SettingKey.AI_QUOTA_ENABLED]: 'false',
    [SettingKey.AI_QUOTA_POLICIES]: '[]',
    [SettingKey.AI_ALERT_THRESHOLDS]: '{"enabled":true,"quotaUsageRatios":[0.5,0.8,1],"costUsageRatios":[0.8,1],"failureBurst":{"enabled":true,"windowMinutes":10,"maxFailures":3,"categories":["image","asr","tts","podcast"]},"dedupeWindowMinutes":1440,"maxAlerts":10}',
    [SettingKey.AI_COST_FACTORS]: '{"currencyCode":"CNY","currencySymbol":"¥","quotaUnitPrice":0.1,"exchangeRates":{"CNY":1,"USD":7.0},"providerCurrencies":{"openai":"USD","anthropic":"USD","gemini":"USD","groq":"USD","siliconflow":"CNY","volcengine":"CNY","doubao":"CNY","deepseek":"CNY"}}',
    [SettingKey.EMAIL_PORT]: '587',
    [SettingKey.EMAIL_TEMPLATE_CONFIGS]: '{"version":1,"templates":{}}',
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
    [SettingKey.HEXO_SYNC_ENABLED]: 'false',
    [SettingKey.HEXO_SYNC_PROVIDER]: 'github',
    [SettingKey.HEXO_SYNC_BRANCH]: 'main',
    [SettingKey.HEXO_SYNC_POSTS_DIR]: 'source/_posts',
    [SettingKey.EXTERNAL_FEED_ENABLED]: 'false',
    [SettingKey.EXTERNAL_FEED_SOURCES]: '[]',
    [SettingKey.EXTERNAL_FEED_HOME_ENABLED]: 'false',
    [SettingKey.EXTERNAL_FEED_HOME_LIMIT]: '6',
    [SettingKey.EXTERNAL_FEED_CACHE_TTL_SECONDS]: '900',
    [SettingKey.EXTERNAL_FEED_STALE_WHILE_ERROR_SECONDS]: '86400',
    [SettingKey.LIVE2D_MIN_WIDTH]: '1024',
    [SettingKey.CANVAS_NEST_MIN_WIDTH]: '1024',
    [SettingKey.EFFECTS_MIN_WIDTH]: '1024',
    [SettingKey.ASR_CREDENTIAL_TTL_SECONDS]: '600',
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

function uniqValues(values: (string | undefined | null)[]) {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

export function getLocalizedSettingDefinition(key: string): LocalizedSettingDefinition | null {
    return LOCALIZED_SETTING_DEFINITIONS[key as SettingKey] ?? null
}

export function isLocalizedSettingKey(key: string) {
    return getLocalizedSettingDefinition(key) !== null
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

export function isInternalOnlySettingKey(key: string) {
    return INTERNAL_ONLY_SETTING_KEY_SET.has(key)
}

export function isAdminSettingsExcludedKey(key: string) {
    return ADMIN_SETTINGS_EXCLUDED_KEY_SET.has(key)
}

export function isLegacyOnlySettingKey(key: string) {
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
