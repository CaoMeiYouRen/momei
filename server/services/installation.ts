import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { dataSource } from '../database'
import { User } from '../entities/user'
import { Setting } from '../entities/setting'
import logger from '../utils/logger'
import { SETTING_ENV_MAP } from './setting'

/**
 * 安装状态检测服务
 * 负责检查系统是否已完成初始化
 */

/**
 * 安装状态接口
 */
export interface InstallationStatus {
    /**
     * 是否已安装
     */
    installed: boolean
    /**
     * 数据库是否可连接
     */
    databaseConnected: boolean
    /**
     * 是否存在用户
     */
    hasUsers: boolean
    /**
     * 是否存在安装标记
     */
    hasInstallationFlag: boolean
    /**
     * 环境变量是否设置安装标记
     */
    envInstallationFlag: boolean
    /**
     * Node.js 版本
     */
    nodeVersion: string
    /**
     * 操作系统信息
     */
    os: string
    /**
     * 数据库类型
     */
    databaseType: string
    /**
     * 数据库版本
     */
    databaseVersion: string
    /**
     * 是否为 Severless 环境
     */
    isServerless: boolean
    /**
     * Node.js 版本是否符合建议 (>=20)
     */
    isNodeVersionSafe: boolean
}

/**
 * 站点配置接口
 */
export interface SiteConfig {
    /**
     * 站点标题
     */
    siteTitle: string
    /**
     * 站点描述
     */
    siteDescription: string
    /**
     * 站点关键词
     */
    siteKeywords: string
    /**
     * 底部版权信息
     */
    siteCopyright?: string
    /**
     * 默认语言
     */
    defaultLanguage: string
    /**
     * 运营方名称
     */
    siteOperator?: string
    /**
     * 联系邮箱
     */
    contactEmail?: string
    /**
     * 是否显示备案信息
     */
    showComplianceInfo?: boolean
    /**
     * ICP 备案号
     */
    icpLicenseNumber?: string
    /**
     * 公安备案号
     */
    publicSecurityNumber?: string
}

/**
 * 管理员创建接口
 */
export interface AdminCreation {
    /**
     * 管理员邮箱
     */
    email: string
    /**
     * 管理员密码
     */
    password: string
    /**
     * 管理员昵称
     */
    name: string
}

/**
 * 可选功能配置接口
 */
export interface ExtraConfig {
    // AI
    aiProvider?: string
    aiApiKey?: string
    aiModel?: string
    aiEndpoint?: string
    // Email
    emailHost?: string
    emailPort?: number
    emailUser?: string
    emailPass?: string
    emailFrom?: string
    emailRequireVerification?: boolean
    // Storage
    storageType?: string
    localStorageDir?: string
    localStorageBaseUrl?: string
    s3Endpoint?: string
    s3Bucket?: string
    s3Region?: string
    s3AccessKey?: string
    s3SecretKey?: string
    s3BaseUrl?: string
    s3BucketPrefix?: string
    // Analytics
    baiduAnalytics?: string
    googleAnalytics?: string
    clarityAnalytics?: string
    // Social Auth
    githubClientId?: string
    githubClientSecret?: string
    googleClientId?: string
    googleClientSecret?: string
    anonymousLoginEnabled?: boolean
    // Security & Captcha
    captchaProvider?: string
    captchaSiteKey?: string
    captchaSecretKey?: string
    // Limits
    maxUploadSize?: string
    maxAudioUploadSize?: string
}

/**
 * 检查环境变量中的安装标记
 */
function checkEnvInstallationFlag(): boolean {
    return process.env.MOMEI_INSTALLED === 'true'
}

/**
 * 检查数据库连接状态
 */
async function checkDatabaseConnection(): Promise<boolean> {
    try {
        if (!dataSource || !dataSource.isInitialized) {
            return false
        }
        // 尝试执行一个简单的查询来验证连接
        await dataSource.query('SELECT 1')
        return true
    } catch (error) {
        logger.error('Database connection check failed:', error)
        return false
    }
}

/**
 * 检查是否存在用户
 */
async function checkHasUsers(): Promise<boolean> {
    try {
        const userRepo = dataSource.getRepository(User)
        const count = await userRepo.count()
        return count > 0
    } catch (error) {
        logger.error('User count check failed:', error)
        return false
    }
}

/**
 * 检查数据库中的安装标记
 */
async function checkInstallationFlag(): Promise<boolean> {
    try {
        const settingRepo = dataSource.getRepository(Setting)
        const setting = await settingRepo.findOne({
            where: { key: 'system_installed' },
        })
        return setting?.value === 'true'
    } catch (error) {
        logger.error('Installation flag check failed:', error)
        return false
    }
}

/**
 * 获取安装状态
 */
export async function getInstallationStatus(): Promise<InstallationStatus> {
    const envInstallationFlag = checkEnvInstallationFlag()
    const databaseConnected = await checkDatabaseConnection()

    // 环境信息获取
    const nodeVersion = process.version
    const nodeMajorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0] || '0')

    // 从 package.json 获取最低版本要求
    let minNodeVersion = 20
    try {
        const pkgPath = path.resolve(process.cwd(), 'package.json')
        if (fs.existsSync(pkgPath)) {
            const pkg = fs.readJsonSync(pkgPath)
            const enginesNode = pkg.engines?.node
            if (enginesNode && typeof enginesNode === 'string') {
                // 简单的正则匹配，提取数字，例如从 ">=20" 提取 20
                const match = enginesNode.match(/(\d+)/)
                if (match && match[1]) {
                    minNodeVersion = parseInt(match[1])
                }
            }
        }
    } catch (error) {
        logger.warn('Failed to read package.json for node version check:', error)
    }

    const isNodeVersionSafe = nodeMajorVersion >= minNodeVersion
    const osInfo = `${os.type()} ${os.release()} (${os.arch()})`
    const databaseType = String(dataSource?.options.type || 'unknown')
    let databaseVersion = 'Unknown'

    if (databaseConnected) {
        try {
            if (databaseType === 'mysql' || databaseType === 'mariadb') {
                const result = await dataSource.query('SELECT VERSION() as version')
                databaseVersion = result[0]?.version || 'Unknown'
            } else if (databaseType === 'postgres') {
                const result = await dataSource.query('SHOW server_version')
                databaseVersion = result[0]?.server_version || 'Unknown'
            } else if (databaseType === 'sqlite') {
                const result = await dataSource.query('SELECT sqlite_version() as version')
                databaseVersion = result[0]?.version || 'Unknown'
            }
        } catch (error) {
            logger.warn('Failed to fetch database version:', error)
        }
    }

    // Serverless 环境检测
    const isServerless = !!(
        process.env.VERCEL
        || process.env.NETLIFY
        || process.env.CLOUDFLARE_FREE_USAGE
        || process.env.AWS_LAMBDA_FUNCTION_NAME
        || process.env.FUNCTIONS_WORKER_RUNTIME
    )

    // 如果环境变量已标记安装，直接返回已安装状态
    if (envInstallationFlag) {
        return {
            installed: true,
            databaseConnected,
            hasUsers: true,
            hasInstallationFlag: true,
            envInstallationFlag: true,
            nodeVersion,
            os: osInfo,
            databaseType,
            databaseVersion,
            isServerless,
            isNodeVersionSafe,
        }
    }

    // 如果数据库未连接，返回未安装状态
    if (!databaseConnected) {
        return {
            installed: false,
            databaseConnected: false,
            hasUsers: false,
            hasInstallationFlag: false,
            envInstallationFlag: false,
            nodeVersion,
            os: osInfo,
            databaseType,
            databaseVersion,
            isServerless,
            isNodeVersionSafe,
        }
    }

    // 检查数据库状态
    const hasUsers = await checkHasUsers()
    const hasInstallationFlag = await checkInstallationFlag()

    // 只有当数据库中存在用户且存在安装标记时，才认为已安装
    const installed = hasUsers && hasInstallationFlag

    return {
        installed,
        databaseConnected,
        hasUsers,
        hasInstallationFlag,
        envInstallationFlag,
        nodeVersion,
        os: osInfo,
        databaseType,
        databaseVersion,
        isServerless,
        isNodeVersionSafe,
    }
}

/**
 * 检查系统是否已安装
 * 简化版本，仅返回布尔值
 */
export async function isSystemInstalled(): Promise<boolean> {
    const status = await getInstallationStatus()
    return status.installed
}

/**
 * 保存站点配置
 */
export async function saveSiteConfig(config: SiteConfig): Promise<void> {
    const settingRepo = dataSource.getRepository(Setting)

    const settings = [
        { key: 'site_title', value: config.siteTitle, description: '站点标题', level: 0 },
        { key: 'site_description', value: config.siteDescription, description: '站点描述', level: 0 },
        { key: 'site_keywords', value: config.siteKeywords, description: '站点关键词', level: 0 },
        { key: 'site_copyright', value: config.siteCopyright || '', description: '底部版权信息', level: 0 },
        { key: 'default_language', value: config.defaultLanguage, description: '默认语言', level: 0 },
        { key: 'site_operator', value: config.siteOperator || '', description: '运营方名称', level: 0 },
        { key: 'contact_email', value: config.contactEmail || '', description: '联系邮箱', level: 0 },
        { key: 'site_logo', value: '', description: '站点 Logo', level: 0 },
        { key: 'site_favicon', value: '', description: '站点图标', level: 0 },
        { key: 'footer_code', value: '', description: '页脚附加代码', level: 0 },
        { key: 'show_compliance_info', value: config.showComplianceInfo ? 'true' : 'false', description: '是否显示备案信息', level: 0 },
        { key: 'icp_license_number', value: config.icpLicenseNumber || '', description: 'ICP 备案号', level: 0 },
        { key: 'public_security_number', value: config.publicSecurityNumber || '', description: '公安备案号', level: 0 },
    ]

    for (const setting of settings) {
        const existing = await settingRepo.findOne({ where: { key: setting.key } })
        if (existing) {
            existing.value = setting.value
            existing.description = setting.description
            existing.level = setting.level
            await settingRepo.save(existing)
        } else {
            await settingRepo.save(settingRepo.create(setting))
        }
    }

    logger.info('Site configuration saved successfully')
}

/**
 * 保存可选功能配置
 */
export async function saveExtraConfig(config: ExtraConfig): Promise<void> {
    const settingRepo = dataSource.getRepository(Setting)

    const settings = [
        // AI
        { key: 'ai_enabled', value: config.aiApiKey ? 'true' : 'false', description: '是否启用 AI 功能', level: 0 },
        { key: 'ai_provider', value: config.aiProvider || '', description: 'AI 服务商', level: 2 },
        { key: 'ai_api_key', value: config.aiApiKey || '', description: 'AI API Key', level: 2, maskType: 'key' },
        { key: 'ai_model', value: config.aiModel || '', description: 'AI 模型', level: 2 },
        { key: 'ai_endpoint', value: config.aiEndpoint || '', description: 'AI 代理地址', level: 2 },
        // Email
        { key: 'email_host', value: config.emailHost || '', description: 'SMTP 服务器', level: 2 },
        { key: 'email_port', value: String(config.emailPort || 587), description: 'SMTP 端口', level: 2 },
        { key: 'email_user', value: config.emailUser || '', description: 'SMTP 用户名', level: 2, maskType: 'email' },
        { key: 'email_pass', value: config.emailPass || '', description: 'SMTP 密码', level: 2, maskType: 'password' },
        { key: 'email_from', value: config.emailFrom || '', description: '发件人邮箱', level: 2 },
        // Storage
        { key: 'storage_type', value: config.storageType || 'local', description: '存储类型', level: 2 },
        { key: 'local_storage_dir', value: config.localStorageDir || 'public/uploads', description: '本地存储目录', level: 2 },
        { key: 'local_storage_base_url', value: config.localStorageBaseUrl || '/uploads', description: '本地存储基础 URL', level: 2 },
        { key: 's3_endpoint', value: config.s3Endpoint || '', description: 'S3 终端地址', level: 2 },
        { key: 's3_bucket', value: config.s3Bucket || '', description: 'S3 桶名称', level: 2 },
        { key: 's3_region', value: config.s3Region || 'auto', description: 'S3 区域', level: 2 },
        { key: 's3_access_key', value: config.s3AccessKey || '', description: 'S3 Access Key', level: 2, maskType: 'key' },
        { key: 's3_secret_key', value: config.s3SecretKey || '', description: 'S3 Secret Key', level: 2, maskType: 'password' },
        { key: 's3_base_url', value: config.s3BaseUrl || '', description: 'S3 基础 URL', level: 2 },
        { key: 's3_bucket_prefix', value: config.s3BucketPrefix || '', description: 'S3 目录前缀', level: 2 },
        // Analytics
        { key: 'baidu_analytics', value: config.baiduAnalytics || '', description: '百度统计 ID', level: 0 },
        { key: 'google_analytics', value: config.googleAnalytics || '', description: 'Google Analytics ID', level: 0 },
        { key: 'clarity_analytics', value: config.clarityAnalytics || '', description: 'Microsoft Clarity ID', level: 0 },
        // Social Auth
        { key: 'github_client_id', value: config.githubClientId || '', description: 'GitHub Client ID', level: 2 },
        { key: 'github_client_secret', value: config.githubClientSecret || '', description: 'GitHub Client Secret', level: 2, maskType: 'password' },
        { key: 'google_client_id', value: config.googleClientId || '', description: 'Google Client ID', level: 2 },
        { key: 'google_client_secret', value: config.googleClientSecret || '', description: 'Google Client Secret', level: 2, maskType: 'password' },
        { key: 'anonymous_login_enabled', value: config.anonymousLoginEnabled ? 'true' : 'false', description: '是否启用匿名登录', level: 2 },
        { key: 'allow_registration', value: 'true', description: '是否允许新用户注册', level: 2 },
        // Security & Captcha
        { key: 'captcha_provider', value: config.captchaProvider || '', description: '验证码提供商', level: 2 },
        { key: 'captcha_site_key', value: config.captchaSiteKey || '', description: '验证码 Site Key', level: 2 },
        { key: 'captcha_secret_key', value: config.captchaSecretKey || '', description: '验证码 Secret Key', level: 2, maskType: 'password' },
        // Limits
        { key: 'max_upload_size', value: config.maxUploadSize || '4.5MiB', description: '最大上传限制', level: 1 },
        { key: 'max_audio_upload_size', value: config.maxAudioUploadSize || '100MiB', description: '最大音频上传限制', level: 1 },
        { key: 'email_require_verification', value: config.emailRequireVerification ? 'true' : 'false', description: '是否强制邮箱验证', level: 1 },
        { key: 'posts_per_page', value: '10', description: '每页文章显示数量', level: 1 },
    ]

    for (const setting of settings) {
        const existing = await settingRepo.findOne({ where: { key: setting.key } })
        if (existing) {
            existing.value = setting.value
            existing.description = setting.description
            existing.level = setting.level
            if (setting.maskType) {
                existing.maskType = setting.maskType
            }
            await settingRepo.save(existing)
        } else {
            await settingRepo.save(settingRepo.create(setting))
        }
    }

    logger.info('Extra configuration saved successfully')
}

/**
 * 标记系统已安装
 */
export async function markSystemInstalled(): Promise<void> {
    const settingRepo = dataSource.getRepository(Setting)

    // 首先尝试从环境变量同步配置
    await syncSettingsFromEnv()

    await settingRepo.save({
        key: 'system_installed',
        value: 'true',
        description: '系统安装标记',
    })

    logger.info('System marked as installed')
}

/**
 * 验证管理员密码强度
 */
export function validateAdminPassword(password: string): { valid: boolean, message?: string } {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' }
    }

    // 检查是否包含数字
    if (!/\d/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' }
    }

    // 检查是否包含字母
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one letter' }
    }

    return { valid: true }
}

/**
 * 从环境变量同步配置到数据库 (用于安装初始化)
 */
export async function syncSettingsFromEnv(): Promise<void> {
    const settingRepo = dataSource.getRepository(Setting)
    const entries = Object.entries(SETTING_ENV_MAP)

    logger.info('Starting to sync settings from environment variables...')

    for (const [key, envKey] of entries) {
        const envValue = process.env[envKey]
        if (envValue !== undefined) {
            let setting = await settingRepo.findOne({ where: { key } })
            if (setting) {
                // 如果已存在，且当前值为空，则从 ENV 载入
                if (!setting.value) {
                    setting.value = envValue
                    await settingRepo.save(setting)
                }
            } else {
                // 如果不存在，创建带默认元数据的记录
                setting = settingRepo.create({
                    key,
                    value: envValue,
                    description: `Initial sync from ${envKey}`,
                    level: 2, // 默认管理员级别
                    maskType: 'none',
                })

                // 尝试匹配特定的脱敏类型
                if (key.includes('pass') || key.includes('secret')) {
                    setting.maskType = 'password'
                } else if (key.includes('key')) {
                    setting.maskType = 'key'
                } else if (key.includes('email') || key.includes('user')) {
                    if (envValue.includes('@')) {
                        setting.maskType = 'email'
                    }
                }

                await settingRepo.save(setting)
            }
        }
    }

    logger.info('Settings sync from environment variables completed.')
}
