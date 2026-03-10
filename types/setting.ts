/**
 * 系统设置键名定义
 * 建议所有的设置键名都在此处定义，以实现类型安全
 */
export enum SettingKey {
    // Site
    SITE_NAME = 'site_name',
    SITE_TITLE = 'site_title',
    SITE_URL = 'site_url',
    SITE_DESCRIPTION = 'site_description',
    SITE_KEYWORDS = 'site_keywords',
    SITE_COPYRIGHT = 'site_copyright',
    DEFAULT_LANGUAGE = 'default_language',

    // AI
    AI_ENABLED = 'ai_enabled',
    AI_PROVIDER = 'ai_provider',
    AI_API_KEY = 'ai_api_key',
    AI_MODEL = 'ai_model',
    AI_ENDPOINT = 'ai_endpoint',
    GEMINI_API_TOKEN = 'gemini_api_token',
    AI_QUOTA_ENABLED = 'ai_quota_enabled',
    AI_QUOTA_POLICIES = 'ai_quota_policies',
    AI_ALERT_THRESHOLDS = 'ai_alert_thresholds',
    AI_COST_FACTORS = 'ai_cost_factors',

    // AI Image
    AI_IMAGE_ENABLED = 'ai_image_enabled',
    AI_IMAGE_PROVIDER = 'ai_image_provider',
    AI_IMAGE_API_KEY = 'ai_image_api_key',
    AI_IMAGE_MODEL = 'ai_image_model',
    AI_IMAGE_ENDPOINT = 'ai_image_endpoint',

    // AI ASR (Speech to Text)
    ASR_ENABLED = 'asr_enabled',
    ASR_PROVIDER = 'asr_provider',
    ASR_API_KEY = 'asr_api_key',
    ASR_MODEL = 'asr_model',
    ASR_ENDPOINT = 'asr_endpoint',
    ASR_VOLCENGINE_APP_ID = 'asr_volcengine_app_id',
    ASR_VOLCENGINE_CLUSTER_ID = 'asr_volcengine_cluster_id',
    ASR_VOLCENGINE_ACCESS_KEY = 'asr_volcengine_access_key',
    ASR_VOLCENGINE_SECRET_KEY = 'asr_volcengine_secret_key',
    ASR_SILICONFLOW_API_KEY = 'asr_siliconflow_api_key', // Keep for compatibility if needed, but we will migrate
    ASR_SILICONFLOW_MODEL = 'asr_siliconflow_model',

    // Volcengine Global (Optional shared config)
    VOLCENGINE_APP_ID = 'volcengine_app_id',
    VOLCENGINE_ACCESS_KEY = 'volcengine_access_key',
    VOLCENGINE_SECRET_KEY = 'volcengine_secret_key',

    // AI TTS (Text to Speech)
    TTS_PROVIDER = 'tts_provider',
    TTS_ENABLED = 'tts_enabled',
    TTS_API_KEY = 'tts_api_key',
    TTS_MODEL = 'tts_model',
    TTS_ENDPOINT = 'tts_endpoint',

    // Email
    EMAIL_HOST = 'email_host',
    EMAIL_PORT = 'email_port',
    EMAIL_USER = 'email_user',
    EMAIL_PASS = 'email_pass',
    EMAIL_FROM = 'email_from',
    EMAIL_REQUIRE_VERIFICATION = 'email_require_verification',
    EMAIL_DAILY_LIMIT = 'email_daily_limit',
    EMAIL_SINGLE_USER_DAILY_LIMIT = 'email_single_user_daily_limit',
    EMAIL_LIMIT_WINDOW = 'email_limit_window',

    // Storage
    STORAGE_TYPE = 'storage_type',
    LOCAL_STORAGE_DIR = 'local_storage_dir',
    LOCAL_STORAGE_BASE_URL = 'local_storage_base_url',
    LOCAL_STORAGE_MIN_FREE_SPACE = 'local_storage_min_free_space',
    S3_ENDPOINT = 's3_endpoint',
    S3_BUCKET = 's3_bucket',
    S3_REGION = 's3_region',
    S3_ACCESS_KEY = 's3_access_key',
    S3_SECRET_KEY = 's3_secret_key',
    S3_BASE_URL = 's3_base_url',
    S3_BUCKET_PREFIX = 's3_bucket_prefix',
    ASSET_PUBLIC_BASE_URL = 'asset_public_base_url',
    ASSET_OBJECT_PREFIX = 'asset_object_prefix',
    VERCEL_BLOB_TOKEN = 'vercel_blob_token',
    CLOUDFLARE_R2_ACCOUNT_ID = 'cloudflare_r2_account_id',
    CLOUDFLARE_R2_ACCESS_KEY = 'cloudflare_r2_access_key',
    CLOUDFLARE_R2_SECRET_KEY = 'cloudflare_r2_secret_key',
    CLOUDFLARE_R2_BUCKET = 'cloudflare_r2_bucket',
    CLOUDFLARE_R2_BASE_URL = 'cloudflare_r2_base_url',

    // Analytics
    BAIDU_ANALYTICS = 'baidu_analytics',
    GOOGLE_ANALYTICS = 'google_analytics',
    CLARITY_ANALYTICS = 'clarity_analytics',

    // Social Auth
    GITHUB_CLIENT_ID = 'github_client_id',
    GITHUB_CLIENT_SECRET = 'github_client_secret',
    GOOGLE_CLIENT_ID = 'google_client_id',
    GOOGLE_CLIENT_SECRET = 'google_client_secret',
    ANONYMOUS_LOGIN_ENABLED = 'anonymous_login_enabled',
    ALLOW_REGISTRATION = 'allow_registration',

    // Security & Captcha
    ENABLE_CAPTCHA = 'enable_captcha',
    CAPTCHA_PROVIDER = 'captcha_provider',
    CAPTCHA_SITE_KEY = 'captcha_site_key',
    CAPTCHA_SECRET_KEY = 'captcha_secret_key',
    ENABLE_COMMENT_REVIEW = 'enable_comment_review',
    BLACKLISTED_KEYWORDS = 'blacklisted_keywords',
    SHOW_COMPLIANCE_INFO = 'show_compliance_info',
    ICP_LICENSE_NUMBER = 'icp_license_number',
    PUBLIC_SECURITY_NUMBER = 'public_security_number',
    FOOTER_CODE = 'footer_code',
    FRIEND_LINKS_ENABLED = 'friend_links_enabled',
    FRIEND_LINKS_APPLICATION_ENABLED = 'friend_links_application_enabled',
    FRIEND_LINKS_APPLICATION_GUIDELINES = 'friend_links_application_guidelines',
    FRIEND_LINKS_FOOTER_ENABLED = 'friend_links_footer_enabled',
    FRIEND_LINKS_FOOTER_LIMIT = 'friend_links_footer_limit',
    FRIEND_LINKS_CHECK_INTERVAL_MINUTES = 'friend_links_check_interval_minutes',
    TRAVELLINGS_ENABLED = 'travellings_enabled',
    TRAVELLINGS_HEADER_ENABLED = 'travellings_header_enabled',
    TRAVELLINGS_FOOTER_ENABLED = 'travellings_footer_enabled',
    TRAVELLINGS_SIDEBAR_ENABLED = 'travellings_sidebar_enabled',
    LIVE2D_ENABLED = 'live2d_enabled',
    LIVE2D_SCRIPT_URL = 'live2d_script_url',
    LIVE2D_MODEL_URL = 'live2d_model_url',
    LIVE2D_OPTIONS_JSON = 'live2d_options_json',
    LIVE2D_MOBILE_ENABLED = 'live2d_mobile_enabled',
    LIVE2D_MIN_WIDTH = 'live2d_min_width',
    LIVE2D_DATA_SAVER_BLOCK = 'live2d_data_saver_block',
    CANVAS_NEST_ENABLED = 'canvas_nest_enabled',
    CANVAS_NEST_OPTIONS_JSON = 'canvas_nest_options_json',
    CANVAS_NEST_MOBILE_ENABLED = 'canvas_nest_mobile_enabled',
    CANVAS_NEST_MIN_WIDTH = 'canvas_nest_min_width',
    CANVAS_NEST_DATA_SAVER_BLOCK = 'canvas_nest_data_saver_block',
    EFFECTS_MOBILE_ENABLED = 'effects_mobile_enabled',
    EFFECTS_MIN_WIDTH = 'effects_min_width',
    EFFECTS_DATA_SAVER_BLOCK = 'effects_data_saver_block',

    // Web Push
    WEB_PUSH_VAPID_SUBJECT = 'web_push_vapid_subject',
    WEB_PUSH_VAPID_PUBLIC_KEY = 'web_push_vapid_public_key',
    WEB_PUSH_VAPID_PRIVATE_KEY = 'web_push_vapid_private_key',

    // Limits
    MAX_UPLOAD_SIZE = 'max_upload_size',
    MAX_AUDIO_UPLOAD_SIZE = 'max_audio_upload_size',
    ALLOWED_FILE_TYPES = 'allowed_file_types',
    COMMENT_INTERVAL = 'comment_interval',
    POSTS_PER_PAGE = 'posts_per_page',
    UPLOAD_DAILY_LIMIT = 'upload_daily_limit',
    UPLOAD_SINGLE_USER_DAILY_LIMIT = 'upload_single_user_daily_limit',
    UPLOAD_LIMIT_WINDOW = 'upload_limit_window',

    // Branding
    SITE_LOGO = 'site_logo',
    SITE_FAVICON = 'site_favicon',
    SITE_OPERATOR = 'site_operator',
    CONTACT_EMAIL = 'contact_email',

    // Theme
    THEME_ACTIVE_CONFIG_ID = 'theme_active_config_id',
    THEME_PRESET = 'theme_preset',
    THEME_PRIMARY_COLOR = 'theme_primary_color',
    THEME_ACCENT_COLOR = 'theme_accent_color',
    THEME_SURFACE_COLOR = 'theme_surface_color',
    THEME_TEXT_COLOR = 'theme_text_color',
    THEME_DARK_PRIMARY_COLOR = 'theme_dark_primary_color',
    THEME_DARK_ACCENT_COLOR = 'theme_dark_accent_color',
    THEME_DARK_SURFACE_COLOR = 'theme_dark_surface_color',
    THEME_DARK_TEXT_COLOR = 'theme_dark_text_color',
    THEME_BORDER_RADIUS = 'theme_border_radius',
    THEME_MOURNING_MODE = 'theme_mourning_mode',
    THEME_BACKGROUND_TYPE = 'theme_background_type',
    THEME_BACKGROUND_VALUE = 'theme_background_value',

    // Legal & Agreements
    LEGAL_MAIN_LANGUAGE = 'legal_main_language', // 法律效力版本的主语言 (如 zh-CN)
    LEGAL_USER_AGREEMENT_ID = 'legal_user_agreement_id', // 当前生效的用户协议 ID
    LEGAL_PRIVACY_POLICY_ID = 'legal_privacy_policy_id', // 当前生效的隐私政策 ID

    // Commercial
    COMMERCIAL_SPONSORSHIP = 'commercial_sponsorship',

    // Third Party
    MEMOS_ENABLED = 'memos_enabled',
    MEMOS_INSTANCE_URL = 'memos_instance_url',
    MEMOS_ACCESS_TOKEN = 'memos_access_token',
    MEMOS_DEFAULT_VISIBILITY = 'memos_default_visibility',
}

export type SettingMaskType = 'none' | 'password' | 'key' | 'email'

export type SettingSource = 'env' | 'db' | 'default'

export type SettingEffectiveSource = 'env' | 'db'

export type SettingLockReason = 'env_override' | 'forced_env_lock'

export type SettingAuditAction = 'create' | 'update'

export type SettingAuditSourceType = 'admin_ui' | 'theme_settings' | 'commercial_settings' | 'api'

export interface SettingItem {
    key: string
    value: string | null
    description: string
    level: number
    maskType: SettingMaskType
    source: SettingSource
    isLocked: boolean
    envKey?: string | null
    defaultUsed?: boolean
    lockReason?: SettingLockReason | null
    requiresRestart?: boolean
}

export interface SettingResolvedItem extends SettingItem {
    envKey: string | null
    defaultValue: string | null
    defaultUsed: boolean
    lockReason: SettingLockReason | null
    requiresRestart: boolean
}

export interface SettingAuditActor {
    id: string | null
    name: string | null
    email: string | null
}

export interface SettingAuditItem {
    id: string
    settingKey: string
    action: SettingAuditAction
    oldValue: string | null
    newValue: string | null
    maskType: SettingMaskType
    effectiveSource: SettingEffectiveSource
    isOverriddenByEnv: boolean
    source: string
    reason: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
    operator: SettingAuditActor | null
}

export type SettingFormValue = string | number | boolean | null

export interface SettingFieldMetadata {
    isLocked?: boolean
    source?: SettingSource
    description?: string
    envKey?: string | null
    defaultUsed?: boolean
    lockReason?: SettingLockReason | null
    requiresRestart?: boolean
}

export type SettingMetadataMap<Key extends string = string> = Partial<Record<Key, SettingFieldMetadata>>

export type AdminLanguageCode = 'zh-CN' | 'en-US' | (string & {})

export type AdminAIProvider = 'openai' | 'groq' | 'ollama' | 'anthropic' | 'google' | (string & {})

export type AdminAIImageProvider = 'openai' | 'gemini' | 'stable-diffusion' | 'doubao' | 'siliconflow' | (string & {})

export type AdminASRProvider = 'siliconflow' | 'volcengine' | (string & {})

export type AdminTTSProvider = 'openai' | 'siliconflow' | 'volcengine' | (string & {})

export interface GeneralSettingsFields {
    site_title: string | null
    site_name: string | null
    site_description: string | null
    site_keywords: string | null
    site_copyright: string | null
    default_language: AdminLanguageCode | null
    site_logo: string | null
    site_favicon: string | null
    site_operator: string | null
    contact_email: string | null
    show_compliance_info: boolean
    icp_license_number: string | null
    public_security_number: string | null
    footer_code: string | null
    friend_links_enabled: boolean
    friend_links_application_enabled: boolean
    friend_links_footer_enabled: boolean
    friend_links_footer_limit: number | null
    friend_links_check_interval_minutes: number | null
    friend_links_application_guidelines: string | null
    travellings_enabled: boolean
    travellings_header_enabled: boolean
    travellings_footer_enabled: boolean
    travellings_sidebar_enabled: boolean
    live2d_enabled: boolean
    live2d_script_url: string | null
    live2d_model_url: string | null
    live2d_options_json: string | null
    live2d_mobile_enabled: boolean
    live2d_min_width: number | null
    live2d_data_saver_block: boolean
    canvas_nest_enabled: boolean
    canvas_nest_options_json: string | null
    canvas_nest_mobile_enabled: boolean
    canvas_nest_min_width: number | null
    canvas_nest_data_saver_block: boolean
    effects_mobile_enabled: boolean
    effects_min_width: number | null
    effects_data_saver_block: boolean
}

export type GeneralSettingsModel = Record<string, SettingFormValue> & Partial<GeneralSettingsFields>

export type GeneralSettingsMetadata = SettingMetadataMap<keyof GeneralSettingsFields>

export interface AISettingsFields {
    ai_enabled: boolean
    ai_provider: AdminAIProvider | null
    ai_model: string | null
    ai_api_key: string | null
    ai_endpoint: string | null
    gemini_api_token: string | null
    ai_quota_enabled: boolean
    ai_quota_policies: string | null
    ai_alert_thresholds: string | null
    ai_cost_factors: string | null
    ai_image_enabled: boolean
    ai_image_provider: AdminAIImageProvider | null
    ai_image_model: string | null
    ai_image_api_key: string | null
    ai_image_endpoint: string | null
    asr_enabled: boolean
    asr_provider: AdminASRProvider | null
    asr_api_key: string | null
    asr_model: string | null
    asr_endpoint: string | null
    asr_volcengine_cluster_id: string | null
    volcengine_app_id: string | null
    volcengine_access_key: string | null
    volcengine_secret_key: string | null
    tts_enabled: boolean
    tts_provider: AdminTTSProvider | null
    tts_api_key: string | null
    tts_model: string | null
    tts_endpoint: string | null
}

export type AISettingsModel = Record<string, SettingFormValue> & Partial<AISettingsFields>

export type AISettingsMetadata = SettingMetadataMap<keyof AISettingsFields>
