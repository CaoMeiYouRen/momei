import { dataSource } from '@/server/database'
import { Setting } from '@/server/entities/setting'

/**
 * 数据库键名与环境变量键名的映射关系
 */
export const SETTING_ENV_MAP: Record<string, string> = {
    // Site
    site_title: 'NUXT_PUBLIC_APP_NAME',
    site_description: 'NUXT_PUBLIC_SITE_DESCRIPTION',
    site_keywords: 'NUXT_PUBLIC_SITE_KEYWORDS',
    site_copyright: 'NUXT_PUBLIC_DEFAULT_COPYRIGHT',
    default_language: 'NUXT_PUBLIC_DEFAULT_LANGUAGE',
    // AI
    ai_enabled: 'AI_ENABLED',
    ai_provider: 'AI_PROVIDER',
    ai_api_key: 'AI_API_KEY',
    ai_model: 'AI_MODEL',
    ai_endpoint: 'AI_API_ENDPOINT',
    // Email
    email_host: 'EMAIL_HOST',
    email_port: 'EMAIL_PORT',
    email_user: 'EMAIL_USER',
    email_pass: 'EMAIL_PASS',
    email_from: 'EMAIL_FROM',
    // Storage
    storage_type: 'STORAGE_TYPE',
    local_storage_dir: 'LOCAL_STORAGE_DIR',
    local_storage_base_url: 'NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL',
    s3_endpoint: 'S3_ENDPOINT',
    s3_bucket: 'S3_BUCKET_NAME',
    s3_region: 'S3_REGION',
    s3_access_key: 'S3_ACCESS_KEY_ID',
    s3_secret_key: 'S3_SECRET_ACCESS_KEY',
    s3_base_url: 'S3_BASE_URL',
    s3_bucket_prefix: 'BUCKET_PREFIX',
    // Analytics
    baidu_analytics: 'NUXT_PUBLIC_BAIDU_ANALYTICS_ID',
    google_analytics: 'NUXT_PUBLIC_GOOGLE_ANALYTICS_ID',
    clarity_analytics: 'NUXT_PUBLIC_CLARITY_PROJECT_ID',
    // Social Auth
    github_client_id: 'NUXT_PUBLIC_GITHUB_CLIENT_ID',
    github_client_secret: 'GITHUB_CLIENT_SECRET',
    google_client_id: 'NUXT_PUBLIC_GOOGLE_CLIENT_ID',
    google_client_secret: 'GOOGLE_CLIENT_SECRET',
    anonymous_login_enabled: 'ANONYMOUS_LOGIN_ENABLED',
    allow_registration: 'ALLOW_REGISTRATION',
    // Security & Captcha
    captcha_provider: 'NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER',
    captcha_site_key: 'NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY',
    captcha_secret_key: 'AUTH_CAPTCHA_SECRET_KEY',
    show_compliance_info: 'NUXT_PUBLIC_SHOW_COMPLIANCE_INFO',
    icp_license_number: 'NUXT_PUBLIC_ICP_LICENSE_NUMBER',
    public_security_number: 'NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER',
    footer_code: 'NUXT_PUBLIC_FOOTER_CODE',
    // Limits
    max_upload_size: 'NUXT_PUBLIC_MAX_UPLOAD_SIZE',
    max_audio_upload_size: 'NUXT_PUBLIC_MAX_AUDIO_UPLOAD_SIZE',
    posts_per_page: 'NUXT_PUBLIC_POSTS_PER_PAGE',
    email_require_verification: 'EMAIL_REQUIRE_VERIFICATION',
    // Branding
    site_logo: 'NUXT_PUBLIC_SITE_LOGO',
    site_favicon: 'NUXT_PUBLIC_SITE_FAVICON',
    site_operator: 'NUXT_PUBLIC_SITE_OPERATOR',
    contact_email: 'NUXT_PUBLIC_CONTACT_EMAIL',
}

/**
 * 值的脱敏处理
 */
export const maskValue = (value: string | null, type: string): string | null => {
    if (!value) {
        return value
    }
    switch (type) {
        case 'password':
            return '********'
        case 'key':
            if (value.length <= 8) {
                return '********'
            }
            return `${value.substring(0, 4)}****${value.substring(value.length - 4)}`
        case 'email': {
            const parts = value.split('@')
            const userPart = parts[0]
            const domainPart = parts[1]
            if (!userPart || !domainPart) {
                return '********'
            }
            return `${userPart.substring(0, Math.min(3, userPart.length))}***@${domainPart}`
        }
        default:
            return value
    }
}

/**
 * 获取指定键的设置值
 * 遵循优先从环境变量获取，其次数据库的原则
 *
 * @param key 设置键名
 * @returns 设置值或 null
 */
export const getSetting = async (key: string): Promise<string | null> => {
    // 优先从环境变量获取
    const envKey = SETTING_ENV_MAP[key]
    if (envKey && process.env[envKey] !== undefined) {
        return process.env[envKey]!
    }

    const settingRepo = dataSource.getRepository(Setting)
    const setting = await settingRepo.findOne({ where: { key } })
    return setting?.value ?? null
}

/**
 * 获取多个设置值
 * 遵循优先从环境变量获取，其次数据库的原则
 *
 * @param keys 设置键名数组
 * @returns 键值对对象
 */
export const getSettings = async (keys: string[]): Promise<Record<string, string | null>> => {
    const settingRepo = dataSource.getRepository(Setting)
    const settings = await settingRepo.find()
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

    settings.forEach((s: Setting) => {
        if (keys.includes(s.key)) {
            // 如果环境变量没配，才用数据库的
            if (result[s.key] === null) {
                result[s.key] = s.value
            }
        }
    })

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
        const dbSetting = dbSettingsMap.get(key)

        // 如果配置在数据库中存在且级别过高，则根据选项过滤
        if (dbSetting && !options?.includeSecrets && Number(dbSetting.level) >= 3) {
            continue
        }

        const envKey = (SETTING_ENV_MAP as Record<string, string>)[key]
        const envValue = envKey ? process.env[envKey] : undefined
        const isLocked = envValue !== undefined
        // 优先使用环境变量的值，其次是数据库的值，最后是空字符串
        const value = isLocked ? envValue! : (dbSetting?.value ?? '')

        // 尝试推断或从数据库获取元数据
        let maskType = dbSetting?.maskType ?? 'none'
        const description = dbSetting?.description ?? ''
        let level = Number(dbSetting?.level ?? 2)

        // 如果数据库中没有该配置项，尝试从 key 关键字推断元数据
        if (!dbSetting) {
            if (key.includes('pass') || key.includes('secret')) {
                maskType = 'password'
            } else if (key.includes('key')) {
                maskType = 'key'
            } else if (key.includes('email') || key.includes('user')) {
                if (value.includes('@')) {
                    maskType = 'email'
                }
            }

            if (key.includes('api_key') || key.includes('secret') || key.includes('pass')) {
                level = 3 // 默认为强机密级别
            }
        }

        result.push({
            key,
            value: options?.shouldMask ? maskValue(value, maskType) : value,
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
export const setSettings = async (settings: Record<string, string | any>) => {
    const settingRepo = dataSource.getRepository(Setting)
    const entries = Object.entries(settings)

    for (const [key, val] of entries) {
        // 检查是否受环境变量锁定
        const envKey = SETTING_ENV_MAP[key]
        if (envKey && process.env[envKey] !== undefined) {
            continue // 跳过锁定的配置项
        }

        let setting = await settingRepo.findOne({ where: { key } })

        const value = typeof val === 'object' && val !== null ? val.value : val
        const extra = typeof val === 'object' && val !== null ? val : {}

        if (setting) {
            // 如果是脱敏过的值且没有变化（即用户提交的是脱敏后的占位符），则跳过值更新
            const isMaskedPlaceholder = (inputValue: string, maskType: string) => {
                if (maskType === 'password' && inputValue === '********') {
                    return true
                }
                if (maskType === 'key' && inputValue.includes('****') && inputValue.length > 8) {
                    return true
                }
                if (maskType === 'email' && inputValue.includes('***@')) {
                    return true
                }
                return false
            }

            if (!isMaskedPlaceholder(value, setting.maskType)) {
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
