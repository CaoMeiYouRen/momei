import { dataSource } from '@/server/database'
import { Setting } from '@/server/entities/setting'
import { SettingKey } from '@/types/setting'
import { inferSettingMaskType, isMaskedSettingPlaceholder, maskSettingValue } from '@/server/utils/settings'

/**
 * 数据库键名与环境变量键名的映射关系
 */
export const SETTING_ENV_MAP: Record<string, string> = {
    // Site
    [SettingKey.SITE_NAME]: 'NUXT_PUBLIC_APP_NAME',
    [SettingKey.SITE_TITLE]: 'NUXT_PUBLIC_APP_NAME',
    [SettingKey.SITE_DESCRIPTION]: 'NUXT_PUBLIC_SITE_DESCRIPTION',
    [SettingKey.SITE_KEYWORDS]: 'NUXT_PUBLIC_SITE_KEYWORDS',
    [SettingKey.SITE_COPYRIGHT]: 'NUXT_PUBLIC_DEFAULT_COPYRIGHT',
    [SettingKey.SITE_URL]: 'NUXT_PUBLIC_AUTH_BASE_URL',
    [SettingKey.DEFAULT_LANGUAGE]: 'NUXT_PUBLIC_DEFAULT_LANGUAGE',
    // AI
    [SettingKey.AI_ENABLED]: 'AI_ENABLED',
    [SettingKey.AI_PROVIDER]: 'AI_PROVIDER',
    [SettingKey.AI_API_KEY]: 'AI_API_KEY',
    [SettingKey.AI_MODEL]: 'AI_MODEL',
    [SettingKey.AI_ENDPOINT]: 'AI_API_ENDPOINT',
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
    [SettingKey.ASR_SILICONFLOW_API_KEY]: 'ASR_SILICONFLOW_API_KEY',
    [SettingKey.ASR_SILICONFLOW_MODEL]: 'ASR_SILICONFLOW_MODEL',
    [SettingKey.ASR_VOLCENGINE_APP_ID]: 'ASR_VOLCENGINE_APP_ID',
    [SettingKey.ASR_VOLCENGINE_ACCESS_KEY]: 'ASR_VOLCENGINE_ACCESS_KEY',
    [SettingKey.ASR_VOLCENGINE_SECRET_KEY]: 'ASR_VOLCENGINE_SECRET_KEY',
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
}

/**
 * 强制被环境变量锁定的键名 (无法从后台修改，仅能通过 ENV 修改)
 * 主要是因为目前部分底层库(如 Better-Auth)直接读取了 process.env 而非通过 Service 加载
 */
export const FORCED_ENV_LOCKED_KEYS: string[] = [
    SettingKey.SITE_URL,
    SettingKey.GITHUB_CLIENT_ID,
    SettingKey.GITHUB_CLIENT_SECRET,
    SettingKey.GOOGLE_CLIENT_ID,
    SettingKey.GOOGLE_CLIENT_SECRET,
    SettingKey.CAPTCHA_SITE_KEY,
    SettingKey.CAPTCHA_SECRET_KEY,
]

/**
 * 极端敏感且仅限后端加载的键名 (完全不在后台设置 UI 中展示)
 */
export const INTERNAL_ONLY_KEYS: string[] = [
    'AUTH_SECRET',
    'BETTER_AUTH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'AXIOM_API_TOKEN',
]

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
    const envKey = SETTING_ENV_MAP[key]
    if (envKey && process.env[envKey] !== undefined) {
        return process.env[envKey]
    }

    // 如果数据库未初始化，返回默认值
    if (!dataSource.isInitialized) {
        return defaultValue
    }

    try {
        const settingRepo = dataSource.getRepository(Setting)
        const setting = await settingRepo.findOne({ where: { key } })
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
        const envKey = SETTING_ENV_MAP[key]
        if (envKey && process.env[envKey] !== undefined) {
            result[key] = process.env[envKey]!
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

        settings.forEach((s: Setting) => {
            if (keys.includes(s.key)) {
                // 如果环境变量没配，才用数据库的
                if (result[s.key] === null) {
                    result[s.key] = s.value
                }
            }
        })
    } catch (error) {
        logger.error('Failed to get settings from database:', error)
    }

    return result
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
) => {
    // 检查是否受环境变量锁定
    const envKey = SETTING_ENV_MAP[key]
    if ((envKey && process.env[envKey] !== undefined) || FORCED_ENV_LOCKED_KEYS.includes(key)) {
        return // 跳过锁定的配置项
    }

    const settingRepo = dataSource.getRepository(Setting)
    let setting = await settingRepo.findOne({ where: { key } })

    if (setting) {
        setting.value = value
        if (options?.description !== undefined) {
            setting.description = options.description
        }
        if (options?.level !== undefined) {
            setting.level = options.level
        }
        if (options?.maskType !== undefined) {
            setting.maskType = options.maskType
        }
    } else {
        setting = settingRepo.create({
            key,
            value,
            description: options?.description ?? '',
            level: options?.level ?? 2,
            maskType: options?.maskType ?? 'none',
        })
    }

    await settingRepo.save(setting)
}

/**
 * 获取所有设置项 (Admin 仅限)
 * @param includeSecrets 是否包含机密信息 (level 3)
 * @param shouldMask 是否执行脱敏
 */
export const getAllSettings = async (options?: { includeSecrets?: boolean, shouldMask?: boolean }) => {
    const settingRepo = dataSource.getRepository(Setting)
    let query = settingRepo.createQueryBuilder('setting')

    if (!options?.includeSecrets) {
        query = query.where('setting.level < :level', { level: 3 })
    }

    const dbSettings: Setting[] = await query.getMany()
    const dbSettingsMap = new Map<string, Setting>(dbSettings.map((s: Setting) => [s.key, s]))

    // 确保所有在 SETTING_ENV_MAP 中定义的键都能出现在列表中，即使数据库中不存在
    const allKeys = new Set<string>([...Object.keys(SETTING_ENV_MAP), ...dbSettingsMap.keys()])

    const result: any[] = []
    for (const key of allKeys) {
        // 如果是极端敏感的内部键，则完全跳过，不在 UI 展示
        if (INTERNAL_ONLY_KEYS.includes(key)) {
            continue
        }

        const dbSetting = dbSettingsMap.get(key)

        // 如果配置在数据库中存在且级别过高，则根据选项过滤
        if (dbSetting && !options?.includeSecrets && Number(dbSetting.level) >= 3) {
            continue
        }

        const envKey = (SETTING_ENV_MAP)[key]
        const envValue = envKey ? process.env[envKey] : undefined
        const isLocked = envValue !== undefined || FORCED_ENV_LOCKED_KEYS.includes(key)
        // 优先使用环境变量的值，其次是数据库的值，最后是空字符串
        const value = isLocked ? (envValue ?? '') : (dbSetting?.value ?? '')

        // 尝试推断或从数据库获取元数据
        let maskType = dbSetting?.maskType ?? 'none'
        const description = dbSetting?.description ?? ''
        let level = Number(dbSetting?.level ?? 2)

        // 如果数据库中没有该配置项，尝试从 key 关键字推断元数据
        if (!dbSetting) {
            maskType = inferSettingMaskType(key, value)

            if (key.includes('api_key') || key.includes('secret') || key.includes('pass')) {
                level = 3 // 默认为强机密级别
            }
        }

        result.push({
            key,
            value: options?.shouldMask ? maskSettingValue(value, maskType) : value,
            description,
            level,
            maskType,
            source: isLocked ? 'env' : 'db',
            isLocked,
        })
    }

    return result
}

/**
 * 批量设置配置项
 *
 * @param settings 键值对对象，key 也可以是对象包含具体属性
 */
export const setSettings = async (settings: Record<string, any>) => {
    const settingRepo = dataSource.getRepository(Setting)
    const entries = Object.entries(settings)

    for (const [key, val] of entries) {
        // 检查是否受环境变量锁定
        const envKey = SETTING_ENV_MAP[key]
        if ((envKey && process.env[envKey] !== undefined) || FORCED_ENV_LOCKED_KEYS.includes(key)) {
            continue // 跳过锁定的配置项
        }

        let setting = await settingRepo.findOne({ where: { key } })

        const value = typeof val === 'object' && val !== null ? val.value : val
        const extra = typeof val === 'object' && val !== null ? val : {}

        if (setting) {
            // 如果是脱敏过的值且没有变化（即用户提交的是脱敏后的占位符），则跳过值更新
            if (!isMaskedSettingPlaceholder(value, setting.maskType)) {
                setting.value = value
            }

            if (extra.description !== undefined) {
                setting.description = String(extra.description)
            }
            if (extra.level !== undefined) {
                setting.level = Number(extra.level)
            }
            if (extra.maskType !== undefined) {
                setting.maskType = String(extra.maskType)
            }
        } else {
            setting = settingRepo.create({
                key,
                value,
                description: String(extra.description ?? ''),
                level: Number(extra.level ?? 2),
                maskType: String(extra.maskType ?? 'none'),
            })
        }
        await settingRepo.save(setting)
    }
}
