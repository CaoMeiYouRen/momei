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

export interface SettingItem {
    key: string
    value: string | null
    description: string
    level: number
    maskType: 'none' | 'password' | 'key' | 'email'
    source: 'env' | 'db' | 'default'
    isLocked: boolean
}
