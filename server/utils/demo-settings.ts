import {
    FORCED_ENV_LOCKED_KEYS,
    INTERNAL_ONLY_KEYS,
    SETTING_ENV_MAP,
    doesSettingRequireRestart,
    getSettingDefaultValue,
} from '@/server/services/setting'
import { resolveSettingLevel, resolveSettingMaskType } from '@/server/utils/settings'
import type { NotificationDeliveryLogItem } from '@/types/notification'
import { SettingKey, type SettingAuditItem, type SettingItem, type SettingSource } from '@/types/setting'
import { type DonationLink, type SocialLink } from '@/utils/shared/commercial'
import { AdminNotificationEvent, NotificationDeliveryChannel, NotificationDeliveryStatus, NotificationType } from '@/utils/shared/notification'

const demoSettingValues: Partial<Record<string, string>> = {
    [SettingKey.SITE_NAME]: '墨梅 Demo',
    [SettingKey.SITE_TITLE]: '墨梅 Demo 博客',
    [SettingKey.SITE_URL]: 'https://demo.momei.app',
    [SettingKey.SITE_DESCRIPTION]: '用于展示 AI 创作、多语言发布与站点配置能力的演示环境。',
    [SettingKey.SITE_KEYWORDS]: 'nuxt,ai,blog,demo',
    [SettingKey.POST_COPYRIGHT]: 'all-rights-reserved',
    [SettingKey.SITE_COPYRIGHT_OWNER]: '墨梅 Demo 团队',
    [SettingKey.SITE_COPYRIGHT_START_YEAR]: '2025',
    [SettingKey.DEFAULT_LANGUAGE]: 'zh-CN',
    [SettingKey.AI_ENABLED]: 'true',
    [SettingKey.AI_PROVIDER]: 'openai',
    [SettingKey.AI_MODEL]: 'gpt-4o-mini',
    [SettingKey.AI_API_KEY]: 'sk-demo-openai-key',
    [SettingKey.AI_ENDPOINT]: 'https://api.demo.example/v1',
    [SettingKey.GEMINI_API_TOKEN]: 'demo-gemini-token',
    [SettingKey.AI_QUOTA_ENABLED]: 'true',
    [SettingKey.AI_QUOTA_POLICIES]: '[{"subjectType":"global","subjectValue":"*","scope":"all","period":"day","maxRequests":120,"maxQuotaUnits":800,"enabled":true}]',
    [SettingKey.AI_ALERT_THRESHOLDS]: '{"enabled":true,"quotaUsageRatios":[0.5,0.8,1],"costUsageRatios":[0.8,1],"failureBurst":{"enabled":true,"windowMinutes":10,"maxFailures":3,"categories":["image","asr","tts","podcast"]},"dedupeWindowMinutes":1440,"maxAlerts":10}',
    [SettingKey.AI_COST_FACTORS]: '{"currencyCode":"CNY","currencySymbol":"¥","quotaUnitPrice":0.12,"exchangeRates":{"CNY":1,"USD":7.1},"providerCurrencies":{"openai":"USD","anthropic":"USD","gemini":"USD","siliconflow":"CNY"}}',
    [SettingKey.AI_IMAGE_ENABLED]: 'true',
    [SettingKey.AI_IMAGE_PROVIDER]: 'gemini',
    [SettingKey.AI_IMAGE_MODEL]: 'gemini-2.0-flash-preview-image-generation',
    [SettingKey.AI_IMAGE_API_KEY]: 'demo-image-api-key',
    [SettingKey.AI_IMAGE_ENDPOINT]: 'https://api.demo.example/image',
    [SettingKey.ASR_ENABLED]: 'true',
    [SettingKey.ASR_PROVIDER]: 'siliconflow',
    [SettingKey.ASR_API_KEY]: 'demo-asr-key',
    [SettingKey.ASR_MODEL]: 'FunAudioLLM/SenseVoiceSmall',
    [SettingKey.ASR_ENDPOINT]: 'https://api.demo.example/asr',
    [SettingKey.ASR_VOLCENGINE_CLUSTER_ID]: 'demo-cluster',
    [SettingKey.VOLCENGINE_APP_ID]: 'demo-app-id',
    [SettingKey.VOLCENGINE_ACCESS_KEY]: 'demo-access-key',
    [SettingKey.VOLCENGINE_SECRET_KEY]: 'demo-secret-key',
    [SettingKey.TTS_ENABLED]: 'true',
    [SettingKey.TTS_PROVIDER]: 'openai',
    [SettingKey.TTS_API_KEY]: 'demo-tts-key',
    [SettingKey.TTS_MODEL]: 'gpt-4o-mini-tts',
    [SettingKey.TTS_ENDPOINT]: 'https://api.demo.example/tts',
    [SettingKey.EMAIL_HOST]: 'smtp.demo.example',
    [SettingKey.EMAIL_PORT]: '587',
    [SettingKey.EMAIL_USER]: 'notify@momei.app',
    [SettingKey.EMAIL_PASS]: 'demo-email-password',
    [SettingKey.EMAIL_FROM]: 'Momei Demo <notify@momei.app>',
    [SettingKey.EMAIL_REQUIRE_VERIFICATION]: 'true',
    [SettingKey.EMAIL_DAILY_LIMIT]: '200',
    [SettingKey.EMAIL_SINGLE_USER_DAILY_LIMIT]: '8',
    [SettingKey.EMAIL_LIMIT_WINDOW]: '86400',
    [SettingKey.STORAGE_TYPE]: 's3',
    [SettingKey.LOCAL_STORAGE_DIR]: '/demo/uploads',
    [SettingKey.LOCAL_STORAGE_BASE_URL]: 'https://cdn.demo.momei.app/uploads',
    [SettingKey.LOCAL_STORAGE_MIN_FREE_SPACE]: '104857600',
    [SettingKey.S3_ENDPOINT]: 'https://s3.demo.example',
    [SettingKey.S3_BUCKET]: 'momei-demo-assets',
    [SettingKey.S3_REGION]: 'ap-southeast-1',
    [SettingKey.S3_ACCESS_KEY]: 'demo-s3-access-key',
    [SettingKey.S3_SECRET_KEY]: 'demo-s3-secret-key',
    [SettingKey.S3_BASE_URL]: 'https://cdn.demo.momei.app',
    [SettingKey.S3_BUCKET_PREFIX]: 'assets/',
    [SettingKey.ASSET_PUBLIC_BASE_URL]: 'https://cdn.demo.momei.app',
    [SettingKey.ASSET_OBJECT_PREFIX]: 'blog/',
    [SettingKey.BAIDU_ANALYTICS]: 'demo-baidu-analytics',
    [SettingKey.GOOGLE_ANALYTICS]: 'G-DEMO1234',
    [SettingKey.CLARITY_ANALYTICS]: 'demo-clarity-project',
    [SettingKey.GITHUB_CLIENT_ID]: 'demo-github-client-id',
    [SettingKey.GITHUB_CLIENT_SECRET]: 'demo-github-client-secret',
    [SettingKey.GOOGLE_CLIENT_ID]: 'demo-google-client-id',
    [SettingKey.GOOGLE_CLIENT_SECRET]: 'demo-google-client-secret',
    [SettingKey.ANONYMOUS_LOGIN_ENABLED]: 'false',
    [SettingKey.ALLOW_REGISTRATION]: 'true',
    [SettingKey.ENABLE_CAPTCHA]: 'true',
    [SettingKey.CAPTCHA_PROVIDER]: 'cloudflare-turnstile',
    [SettingKey.CAPTCHA_SITE_KEY]: 'demo-turnstile-site-key',
    [SettingKey.CAPTCHA_SECRET_KEY]: 'demo-turnstile-secret-key',
    [SettingKey.ENABLE_COMMENT_REVIEW]: 'true',
    [SettingKey.BLACKLISTED_KEYWORDS]: 'spam\nfake\nviolation',
    [SettingKey.SHOW_COMPLIANCE_INFO]: 'true',
    [SettingKey.ICP_LICENSE_NUMBER]: '浙ICP备12345678号-1',
    [SettingKey.PUBLIC_SECURITY_NUMBER]: '浙公网安备12345678901234号',
    [SettingKey.FOOTER_CODE]: '<span>Demo Footer Badge</span>',
    [SettingKey.FRIEND_LINKS_ENABLED]: 'true',
    [SettingKey.FRIEND_LINKS_APPLICATION_ENABLED]: 'true',
    [SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES]: '欢迎技术博客与开源项目交换友链，请确保站点可正常访问。',
    [SettingKey.FRIEND_LINKS_FOOTER_ENABLED]: 'true',
    [SettingKey.FRIEND_LINKS_FOOTER_LIMIT]: '6',
    [SettingKey.FRIEND_LINKS_CHECK_INTERVAL_MINUTES]: '1440',
    [SettingKey.TRAVELLINGS_ENABLED]: 'true',
    [SettingKey.TRAVELLINGS_HEADER_ENABLED]: 'true',
    [SettingKey.TRAVELLINGS_FOOTER_ENABLED]: 'true',
    [SettingKey.TRAVELLINGS_SIDEBAR_ENABLED]: 'true',
    [SettingKey.LIVE2D_ENABLED]: 'true',
    [SettingKey.LIVE2D_SCRIPT_URL]: 'https://cdn.demo.momei.app/live2d/index.js',
    [SettingKey.LIVE2D_MODEL_URL]: 'https://cdn.demo.momei.app/live2d/model.json',
    [SettingKey.LIVE2D_OPTIONS_JSON]: '{"modelId":0,"drag":false,"logLevel":"warn"}',
    [SettingKey.LIVE2D_MOBILE_ENABLED]: 'false',
    [SettingKey.LIVE2D_MIN_WIDTH]: '1024',
    [SettingKey.LIVE2D_DATA_SAVER_BLOCK]: 'true',
    [SettingKey.CANVAS_NEST_ENABLED]: 'true',
    [SettingKey.CANVAS_NEST_OPTIONS_JSON]: '{"color":"30,41,59","pointColor":"14,116,144","opacity":0.35,"count":66,"zIndex":-1}',
    [SettingKey.CANVAS_NEST_MOBILE_ENABLED]: 'false',
    [SettingKey.CANVAS_NEST_MIN_WIDTH]: '1024',
    [SettingKey.CANVAS_NEST_DATA_SAVER_BLOCK]: 'true',
    [SettingKey.EFFECTS_MOBILE_ENABLED]: 'false',
    [SettingKey.EFFECTS_MIN_WIDTH]: '1024',
    [SettingKey.EFFECTS_DATA_SAVER_BLOCK]: 'true',
    [SettingKey.WEB_PUSH_VAPID_SUBJECT]: 'mailto:demo@momei.app',
    [SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]: 'BOr-demo-public-key-preview',
    [SettingKey.MAX_UPLOAD_SIZE]: '4.5MiB',
    [SettingKey.MAX_AUDIO_UPLOAD_SIZE]: '128MiB',
    [SettingKey.ALLOWED_FILE_TYPES]: '.jpg,.png,.webp,image/webp,audio/mpeg',
    [SettingKey.COMMENT_INTERVAL]: '30',
    [SettingKey.POSTS_PER_PAGE]: '12',
    [SettingKey.UPLOAD_DAILY_LIMIT]: '120',
    [SettingKey.UPLOAD_SINGLE_USER_DAILY_LIMIT]: '8',
    [SettingKey.UPLOAD_LIMIT_WINDOW]: '86400',
    [SettingKey.SITE_LOGO]: 'https://cdn.demo.momei.app/assets/logo-demo.svg',
    [SettingKey.SITE_FAVICON]: 'https://cdn.demo.momei.app/assets/favicon-demo.ico',
    [SettingKey.SITE_OPERATOR]: '墨梅演示团队',
    [SettingKey.CONTACT_EMAIL]: 'hello@momei.app',
    [SettingKey.THEME_PRESET]: 'aurora',
    [SettingKey.THEME_PRIMARY_COLOR]: '#0f766e',
    [SettingKey.THEME_ACCENT_COLOR]: '#ea580c',
    [SettingKey.THEME_SURFACE_COLOR]: '#fffaf5',
    [SettingKey.THEME_TEXT_COLOR]: '#1f2937',
    [SettingKey.THEME_DARK_PRIMARY_COLOR]: '#14b8a6',
    [SettingKey.THEME_DARK_ACCENT_COLOR]: '#fb923c',
    [SettingKey.THEME_DARK_SURFACE_COLOR]: '#111827',
    [SettingKey.THEME_DARK_TEXT_COLOR]: '#f8fafc',
    [SettingKey.THEME_BORDER_RADIUS]: '14px',
    [SettingKey.THEME_MOURNING_MODE]: 'false',
    [SettingKey.THEME_BACKGROUND_TYPE]: 'gradient',
    [SettingKey.THEME_BACKGROUND_VALUE]: 'linear-gradient(135deg, #fffaf5 0%, #f0fdfa 100%)',
    [SettingKey.LEGAL_MAIN_LANGUAGE]: 'zh-CN',
    [SettingKey.MEMOS_ENABLED]: 'true',
    [SettingKey.MEMOS_INSTANCE_URL]: 'https://memos.demo.example',
    [SettingKey.MEMOS_ACCESS_TOKEN]: 'demo-memos-token',
    [SettingKey.MEMOS_DEFAULT_VISIBILITY]: 'PUBLIC',
    [SettingKey.LISTMONK_ENABLED]: 'true',
    [SettingKey.LISTMONK_INSTANCE_URL]: 'https://listmonk.demo.example',
    [SettingKey.LISTMONK_USERNAME]: 'demo-admin',
    [SettingKey.LISTMONK_ACCESS_TOKEN]: 'demo-listmonk-token',
    [SettingKey.LISTMONK_DEFAULT_LIST_IDS]: '1,2',
    [SettingKey.LISTMONK_CATEGORY_LIST_MAP]: '{"demo-category":[3]}',
    [SettingKey.LISTMONK_TAG_LIST_MAP]: '{"demo-tag":[4]}',
    [SettingKey.LISTMONK_TEMPLATE_ID]: '9',
}

const demoLockedKeys = new Set<string>([
    SettingKey.SITE_URL,
    SettingKey.GITHUB_CLIENT_ID,
    SettingKey.GITHUB_CLIENT_SECRET,
    SettingKey.GOOGLE_CLIENT_ID,
    SettingKey.GOOGLE_CLIENT_SECRET,
    SettingKey.CAPTCHA_SITE_KEY,
    SettingKey.CAPTCHA_SECRET_KEY,
    ...FORCED_ENV_LOCKED_KEYS,
])

const demoSettingKeys = Array.from(new Set<string>([
    ...Object.values(SettingKey),
    ...Object.keys(SETTING_ENV_MAP),
]))

function getDemoSettingValue(key: string) {
    const explicitValue = demoSettingValues[key]

    if (explicitValue !== undefined) {
        return explicitValue
    }

    const defaultValue = getSettingDefaultValue(key)
    if (defaultValue !== null) {
        return defaultValue
    }

    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('enabled') || lowerKey.startsWith('allow_') || lowerKey.startsWith('show_')) {
        return 'false'
    }

    return ''
}

function getDemoSettingSource(key: string): SettingSource {
    if (demoLockedKeys.has(key)) {
        return 'env'
    }

    if (demoSettingValues[key] !== undefined) {
        return 'db'
    }

    return 'default'
}

export function getDemoSettingsPreview(): SettingItem[] {
    return demoSettingKeys
        .filter((key) => !INTERNAL_ONLY_KEYS.includes(key))
        .map((key) => {
            const value = getDemoSettingValue(key)
            const source = getDemoSettingSource(key)
            const isLocked = demoLockedKeys.has(key)

            return {
                key,
                value,
                description: '',
                level: resolveSettingLevel(key),
                maskType: resolveSettingMaskType(key, value),
                source,
                isLocked,
                envKey: isLocked ? (SETTING_ENV_MAP[key] ?? null) : null,
                defaultUsed: source === 'default',
                lockReason: (isLocked ? 'forced_env_lock' : null),
                requiresRestart: doesSettingRequireRestart(key),
            }
        })
}

export function getDemoCommercialSettingsPreview() {
    const socialLinks: SocialLink[] = [
        {
            platform: 'github',
            url: 'https://github.com/CaoMeiYouRen',
            label: 'GitHub',
        },
    ]

    const donationLinks: DonationLink[] = [
        {
            platform: 'github_sponsors',
            url: 'https://github.com/CaoMeiYouRen/cmyr-sponsor',
            label: 'GitHub Sponsors',
        },
    ]

    return {
        enabled: true,
        socialLinks,
        donationLinks,
        demoPreview: true,
    }
}

export function getDemoAdminNotificationSettingsPreview() {
    return {
        items: Object.values(AdminNotificationEvent).map((event, index) => ({
            event,
            isEmailEnabled: true,
            isBrowserEnabled: index % 2 === 0,
        })),
        webPush: {
            subject: {
                value: demoSettingValues[SettingKey.WEB_PUSH_VAPID_SUBJECT] || '',
                source: 'db',
                isLocked: false,
                envKey: 'WEB_PUSH_VAPID_SUBJECT',
                defaultUsed: false,
                lockReason: null,
                requiresRestart: false,
            },
            publicKey: {
                value: demoSettingValues[SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY] || '',
                source: 'db',
                isLocked: false,
                envKey: 'WEB_PUSH_VAPID_PUBLIC_KEY',
                defaultUsed: false,
                lockReason: null,
                requiresRestart: false,
            },
            privateKeyConfigured: true,
            isConfigured: true,
        },
        demoPreview: true,
    }
}

const demoAuditLogSeed: SettingAuditItem[] = [
    {
        id: 'demo-audit-1',
        settingKey: SettingKey.AI_PROVIDER,
        action: 'update',
        oldValue: 'openai',
        newValue: 'gemini',
        maskType: 'none',
        effectiveSource: 'db',
        isOverriddenByEnv: false,
        source: 'admin_ui',
        reason: 'system_settings_update',
        ipAddress: null,
        userAgent: null,
        createdAt: '2025-02-18T09:30:00.000Z',
        operator: {
            id: 'demo-admin-1',
            name: 'Demo Admin',
            email: 'admin-demo@momei.app',
        },
    },
    {
        id: 'demo-audit-2',
        settingKey: SettingKey.COMMERCIAL_SPONSORSHIP,
        action: 'update',
        oldValue: '{"enabled":false}',
        newValue: '{"enabled":true}',
        maskType: 'none',
        effectiveSource: 'db',
        isOverriddenByEnv: false,
        source: 'commercial_settings',
        reason: 'commercial_settings_update',
        ipAddress: null,
        userAgent: null,
        createdAt: '2025-02-17T14:15:00.000Z',
        operator: {
            id: 'demo-admin-2',
            name: 'Demo Operator',
            email: 'ops-demo@momei.app',
        },
    },
    {
        id: 'demo-audit-3',
        settingKey: SettingKey.THEME_PRIMARY_COLOR,
        action: 'create',
        oldValue: null,
        newValue: '#0f766e',
        maskType: 'none',
        effectiveSource: 'env',
        isOverriddenByEnv: true,
        source: 'theme_settings',
        reason: 'theme_settings_update',
        ipAddress: null,
        userAgent: null,
        createdAt: '2025-02-16T08:00:00.000Z',
        operator: {
            id: 'demo-admin-3',
            name: 'Theme Curator',
            email: 'theme-demo@momei.app',
        },
    },
]

export function getDemoSettingAuditLogsPreview(page: number, limit: number) {
    const startIndex = (page - 1) * limit
    const items = demoAuditLogSeed.slice(startIndex, startIndex + limit)

    return {
        items,
        total: demoAuditLogSeed.length,
        page,
        limit,
        totalPages: Math.ceil(demoAuditLogSeed.length / limit),
        demoPreview: true,
    }
}

const demoNotificationDeliveryLogSeed: NotificationDeliveryLogItem[] = [
    {
        id: 'demo-notification-log-1',
        notificationId: 'demo-notification-1',
        userId: 'demo-admin-1',
        channel: NotificationDeliveryChannel.EMAIL,
        status: NotificationDeliveryStatus.SUCCESS,
        notificationType: NotificationType.SYSTEM,
        title: '新评论待审核',
        recipient: 'admin-demo@momei.app',
        targetUrl: '/admin/comments',
        errorMessage: null,
        sentAt: '2025-02-18T09:32:00.000Z',
        createdAt: '2025-02-18T09:32:00.000Z',
    },
    {
        id: 'demo-notification-log-2',
        notificationId: 'demo-notification-1',
        userId: 'demo-admin-1',
        channel: NotificationDeliveryChannel.WEB_PUSH,
        status: NotificationDeliveryStatus.SKIPPED,
        notificationType: NotificationType.SYSTEM,
        title: '新评论待审核',
        recipient: 'admin-demo@momei.app',
        targetUrl: '/admin/comments',
        errorMessage: 'online_sse_delivery',
        sentAt: '2025-02-18T09:32:01.000Z',
        createdAt: '2025-02-18T09:32:01.000Z',
    },
    {
        id: 'demo-notification-log-3',
        notificationId: 'demo-notification-2',
        userId: 'demo-user-1',
        channel: NotificationDeliveryChannel.WEB_PUSH,
        status: NotificationDeliveryStatus.FAILED,
        notificationType: NotificationType.SYSTEM,
        title: 'AI 转录已完成',
        recipient: 'writer-demo@momei.app',
        targetUrl: '/admin/ai',
        errorMessage: 'web_push_unavailable',
        sentAt: '2025-02-17T14:20:00.000Z',
        createdAt: '2025-02-17T14:20:00.000Z',
    },
    {
        id: 'demo-notification-log-4',
        notificationId: null,
        userId: null,
        channel: NotificationDeliveryChannel.LISTMONK,
        status: NotificationDeliveryStatus.SUCCESS,
        notificationType: NotificationType.MARKETING,
        title: '周刊第 12 期',
        recipient: 'listmonk:128',
        targetUrl: '/admin/marketing',
        errorMessage: null,
        sentAt: '2025-02-19T07:15:00.000Z',
        createdAt: '2025-02-19T07:15:00.000Z',
    },
]

export function getDemoNotificationDeliveryLogsPreview(page: number, limit: number) {
    const startIndex = (page - 1) * limit
    const items = demoNotificationDeliveryLogSeed.slice(startIndex, startIndex + limit)

    return {
        items,
        total: demoNotificationDeliveryLogSeed.length,
        page,
        limit,
        totalPages: Math.ceil(demoNotificationDeliveryLogSeed.length / limit),
        demoPreview: true,
    }
}
