import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { In } from 'typeorm'
import { dataSource } from '../database'
import { User } from '../entities/user'
import { Setting } from '../entities/setting'
import logger from '../utils/logger'
import { getSettingLookupKeys, isInternalOnlySettingKey, isSettingEnvLocked, resolveSettingEnvEntry, SETTING_ENV_MAP } from './setting'
import { TEST_MODE } from '@/utils/shared/env'
import type { InstallationEnvSetting } from '@/utils/shared/installation-env-setting'
import type { InstallationSiteConfigModel } from '@/utils/shared/installation-settings'
import { SettingKey } from '@/types/setting'
import { isMaskedSettingPlaceholder, maskSettingValue, resolveSettingLevel, resolveSettingMaskType } from '@/server/utils/settings'

/**
 * 安装状态检测服务
 * 负责检查系统是否已完成初始化
 */

/**
 * 环境变量配置项接口
 */
export type EnvSetting = InstallationEnvSetting

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
    /**
     * 环境变量设置 (键为 SettingKey, 值为详细配置项)
     */
    envSettings: Record<string, EnvSetting>
}

/**
 * 站点配置接口
 */
export interface SiteConfig extends InstallationSiteConfigModel {
    /**
     * 站点标题
     */
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

type SaveSiteConfigInput = Pick<SiteConfig, 'defaultLanguage' | 'postCopyright' | 'siteTitle'> & Partial<SiteConfig>

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
    assetPublicBaseUrl?: string
    assetObjectPrefix?: string
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
    if (process.env.MOMEI_INSTALLED === 'true') {
        return true
    }
    if (process.env.MOMEI_INSTALLED === 'false') {
        return false
    }
    return TEST_MODE
}

/**
 * 检查数据库连接状态
 */
async function checkDatabaseConnection(): Promise<boolean> {
    try {
        if (!dataSource?.isInitialized) {
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
                const match = /(\d+)/.exec(enginesNode)
                if (match?.[1]) {
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

    // 获取当前环境变量中已设置的项
    const envSettings = getEnvSettingsDetails()

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
            envSettings,
        }
    }

    // 如果数据库未连接，返回未安装状态
    if (!databaseConnected) {
        return {
            installed: false,
            databaseConnected,
            hasUsers: false,
            hasInstallationFlag: false,
            envInstallationFlag,
            nodeVersion,
            os: osInfo,
            databaseType,
            databaseVersion: 'N/A',
            isServerless,
            isNodeVersionSafe,
            envSettings,
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
        envSettings,
    }
}

/**
 * 获取环境变量配置详情 (含脱敏逻辑)
 */
function getEnvSettingsDetails(): Record<string, EnvSetting> {
    const envSettings: Record<string, EnvSetting> = {}
    Object.keys(SETTING_ENV_MAP).forEach((key) => {
        if (isInternalOnlySettingKey(key)) {
            return
        }

        const { envKey, value: envValue } = resolveSettingEnvEntry(key)
        if (envKey && envValue !== undefined && envValue !== '') {
            // 推断脱敏类型
            const maskType = resolveSettingMaskType(key, envValue)

            envSettings[key] = {
                value: maskSettingValue(envValue, maskType) || '',
                isLocked: true,
                maskType,
                envKey,
                lockReason: 'env_override',
            }
        }
    })
    return envSettings
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
export async function saveSiteConfig(config: SaveSiteConfigInput): Promise<void> {
    const settingRepo = dataSource.getRepository(Setting)
    const normalizedConfig: SiteConfig = {
        siteTitle: config.siteTitle,
        siteDescription: config.siteDescription || '',
        siteKeywords: config.siteKeywords || '',
        siteUrl: config.siteUrl || '',
        postCopyright: config.postCopyright,
        siteCopyrightOwner: config.siteCopyrightOwner || '',
        siteCopyrightStartYear: config.siteCopyrightStartYear || '',
        defaultLanguage: config.defaultLanguage,
        siteOperator: config.siteOperator,
        contactEmail: config.contactEmail,
        showComplianceInfo: config.showComplianceInfo,
        icpLicenseNumber: config.icpLicenseNumber,
        publicSecurityNumber: config.publicSecurityNumber,
    }

    const settings = [
        { key: SettingKey.SITE_TITLE, value: normalizedConfig.siteTitle, description: '站点标题', level: 0 },
        { key: SettingKey.SITE_NAME, value: normalizedConfig.siteTitle, description: '站点名称', level: 0 },
        { key: SettingKey.SITE_URL, value: normalizedConfig.siteUrl, description: '站点地址', level: 0 },
        { key: SettingKey.SITE_DESCRIPTION, value: normalizedConfig.siteDescription, description: '站点描述', level: 0 },
        { key: SettingKey.SITE_KEYWORDS, value: normalizedConfig.siteKeywords, description: '站点关键词', level: 0 },
        { key: SettingKey.POST_COPYRIGHT, value: normalizedConfig.postCopyright || '', description: '默认文章版权协议', level: 0 },
        { key: SettingKey.SITE_COPYRIGHT_OWNER, value: normalizedConfig.siteCopyrightOwner || '', description: '站点版权所有者', level: 0 },
        { key: SettingKey.SITE_COPYRIGHT_START_YEAR, value: normalizedConfig.siteCopyrightStartYear || '', description: '站点版权起始年份', level: 0 },
        { key: SettingKey.DEFAULT_LANGUAGE, value: normalizedConfig.defaultLanguage, description: '默认语言', level: 0 },
        { key: SettingKey.SITE_OPERATOR, value: normalizedConfig.siteOperator || '', description: '运营方名称', level: 0 },
        { key: SettingKey.CONTACT_EMAIL, value: normalizedConfig.contactEmail || '', description: '联系邮箱', level: 0 },
        { key: SettingKey.SITE_LOGO, value: '', description: '站点 Logo', level: 0 },
        { key: SettingKey.SITE_FAVICON, value: '', description: '站点图标', level: 0 },
        { key: SettingKey.FOOTER_CODE, value: '', description: '页脚附加代码', level: 0 },
        { key: SettingKey.SHOW_COMPLIANCE_INFO, value: normalizedConfig.showComplianceInfo ? 'true' : 'false', description: '是否显示备案信息', level: 0 },
        { key: SettingKey.ICP_LICENSE_NUMBER, value: normalizedConfig.icpLicenseNumber || '', description: 'ICP 备案号', level: 0 },
        { key: SettingKey.PUBLIC_SECURITY_NUMBER, value: normalizedConfig.publicSecurityNumber || '', description: '公安备案号', level: 0 },
    ]

    for (const setting of settings) {
        const lookupKeys = getSettingLookupKeys(setting.key)
        const existingCandidates = await settingRepo.find({ where: { key: In(lookupKeys) } })
        const existing = existingCandidates.find((item) => String(item.key) === String(setting.key)) ?? existingCandidates[0] ?? null

        // 检查是否受环境变量锁定
        const isLocked = isSettingEnvLocked(setting.key)

        // 如果提交的值是脱敏占位符，且当前受环境变量锁定或数据库已有值，则跳过更新该字段
        if (isMaskedSettingPlaceholder(setting.value, 'none')) {
            continue
        }

        // 如果已由环境变量提供，且前端传值为空，则跳过以防止覆盖
        if (isLocked && !setting.value) {
            continue
        }

        if (existing && String(existing.key) === String(setting.key)) {
            existing.value = setting.value
            existing.description = setting.description
            existing.level = setting.level
            await settingRepo.save(existing)
        } else {
            await settingRepo.save(settingRepo.create(setting))
            const legacyKeys = lookupKeys.filter((key) => String(key) !== String(setting.key))
            if (legacyKeys.length > 0) {
                await settingRepo.delete({ key: In(legacyKeys) })
            }
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
        { key: SettingKey.AI_ENABLED, value: config.aiApiKey ? 'true' : 'false', description: '是否启用 AI 功能', level: 0 },
        { key: SettingKey.AI_PROVIDER, value: config.aiProvider || '', description: 'AI 服务商', level: 2 },
        { key: SettingKey.AI_API_KEY, value: config.aiApiKey || '', description: 'AI API Key', level: 2, maskType: 'key' },
        { key: SettingKey.AI_MODEL, value: config.aiModel || '', description: 'AI 模型', level: 2 },
        { key: SettingKey.AI_ENDPOINT, value: config.aiEndpoint || '', description: 'AI 代理地址', level: 2 },
        // Email
        { key: SettingKey.EMAIL_HOST, value: config.emailHost || '', description: 'SMTP 服务器', level: 2 },
        { key: SettingKey.EMAIL_PORT, value: String(config.emailPort || 587), description: 'SMTP 端口', level: 2 },
        { key: SettingKey.EMAIL_USER, value: config.emailUser || '', description: 'SMTP 用户名', level: 2, maskType: 'email' },
        { key: SettingKey.EMAIL_PASS, value: config.emailPass || '', description: 'SMTP 密码', level: 2, maskType: 'password' },
        { key: SettingKey.EMAIL_FROM, value: config.emailFrom || '', description: '发件人邮箱', level: 2 },
        // Storage
        { key: SettingKey.STORAGE_TYPE, value: config.storageType || 'local', description: '存储类型', level: 2 },
        { key: SettingKey.LOCAL_STORAGE_DIR, value: config.localStorageDir || 'public/uploads', description: '本地存储目录', level: 2 },
        { key: SettingKey.LOCAL_STORAGE_BASE_URL, value: config.localStorageBaseUrl || '/uploads', description: '本地存储基础 URL', level: 2 },
        { key: SettingKey.S3_ENDPOINT, value: config.s3Endpoint || '', description: 'S3 终端地址', level: 2 },
        { key: SettingKey.S3_BUCKET, value: config.s3Bucket || '', description: 'S3 桶名称', level: 2 },
        { key: SettingKey.S3_REGION, value: config.s3Region || 'auto', description: 'S3 区域', level: 2 },
        { key: SettingKey.S3_ACCESS_KEY, value: config.s3AccessKey || '', description: 'S3 Access Key', level: 2, maskType: 'key' },
        { key: SettingKey.S3_SECRET_KEY, value: config.s3SecretKey || '', description: 'S3 Secret Key', level: 2, maskType: 'password' },
        { key: SettingKey.S3_BASE_URL, value: config.s3BaseUrl || '', description: 'S3 基础 URL', level: 2 },
        { key: SettingKey.S3_BUCKET_PREFIX, value: config.s3BucketPrefix || '', description: 'S3 目录前缀', level: 2 },
        { key: SettingKey.ASSET_PUBLIC_BASE_URL, value: config.assetPublicBaseUrl || '', description: '静态资源公共访问前缀', level: 2 },
        { key: SettingKey.ASSET_OBJECT_PREFIX, value: config.assetObjectPrefix || '', description: '静态资源对象前缀', level: 2 },
        // Analytics
        { key: SettingKey.BAIDU_ANALYTICS, value: config.baiduAnalytics || '', description: '百度统计 ID', level: 0 },
        { key: SettingKey.GOOGLE_ANALYTICS, value: config.googleAnalytics || '', description: 'Google Analytics ID', level: 0 },
        { key: SettingKey.CLARITY_ANALYTICS, value: config.clarityAnalytics || '', description: 'Microsoft Clarity ID', level: 0 },
        // Social Auth
        { key: SettingKey.GITHUB_CLIENT_ID, value: config.githubClientId || '', description: 'GitHub Client ID', level: 2 },
        { key: SettingKey.GITHUB_CLIENT_SECRET, value: config.githubClientSecret || '', description: 'GitHub Client Secret', level: 2, maskType: 'password' },
        { key: SettingKey.GOOGLE_CLIENT_ID, value: config.googleClientId || '', description: 'Google Client ID', level: 2 },
        { key: SettingKey.GOOGLE_CLIENT_SECRET, value: config.googleClientSecret || '', description: 'Google Client Secret', level: 2, maskType: 'password' },
        { key: SettingKey.ANONYMOUS_LOGIN_ENABLED, value: config.anonymousLoginEnabled ? 'true' : 'false', description: '是否启用匿名登录', level: 2 },
        { key: SettingKey.ALLOW_REGISTRATION, value: 'true', description: '是否允许新用户注册', level: 2 },
        // Security & Captcha
        { key: SettingKey.CAPTCHA_PROVIDER, value: config.captchaProvider || '', description: '验证码提供商', level: 2 },
        { key: SettingKey.CAPTCHA_SITE_KEY, value: config.captchaSiteKey || '', description: '验证码 Site Key', level: 2 },
        { key: SettingKey.CAPTCHA_SECRET_KEY, value: config.captchaSecretKey || '', description: '验证码 Secret Key', level: 2, maskType: 'password' },
        // Limits
        { key: SettingKey.MAX_UPLOAD_SIZE, value: config.maxUploadSize || '4.5MiB', description: '最大上传限制', level: 1 },
        { key: SettingKey.MAX_AUDIO_UPLOAD_SIZE, value: config.maxAudioUploadSize || '100MiB', description: '最大音频上传限制', level: 1 },
        { key: SettingKey.EMAIL_REQUIRE_VERIFICATION, value: config.emailRequireVerification ? 'true' : 'false', description: '是否强制邮箱验证', level: 1 },
        { key: SettingKey.POSTS_PER_PAGE, value: '10', description: '每页文章显示数量', level: 1 },
    ]

    for (const setting of settings) {
        const existing = await settingRepo.findOne({ where: { key: setting.key } })

        // 检查是否受环境变量锁定
        const isLocked = isSettingEnvLocked(setting.key)

        // 如果提交的值是脱敏占位符，且当前受环境变量锁定或数据库已有值，则跳过更新该字段
        if (isMaskedSettingPlaceholder(setting.value, setting.maskType || 'none')) {
            continue
        }

        // 如果已由环境变量提供，且前端传值为空，则跳过以防止覆盖
        if (isLocked && !setting.value) {
            continue
        }

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
    const keys = Object.keys(SETTING_ENV_MAP)

    logger.info('Starting to sync settings from environment variables...')

    for (const key of keys) {
        if (isInternalOnlySettingKey(key)) {
            continue
        }

        const { envKey, value: envValue } = resolveSettingEnvEntry(key)
        if (envKey && envValue !== undefined && envValue !== '') {
            let setting = await settingRepo.findOne({ where: { key } })
            if (setting) {
                // 如果已存在，且当前值为空，则从 ENV 载入
                if (!setting.value) {
                    setting.value = envValue
                    await settingRepo.save(setting)
                }
            } else {
                // 如果不存在，创建带默认元数据的记录
                const maskType = resolveSettingMaskType(key, envValue)
                setting = settingRepo.create({
                    key,
                    value: envValue,
                    description: `Initial sync from ${envKey}`,
                    level: resolveSettingLevel(key),
                    maskType,
                })

                await settingRepo.save(setting)
            }
        }
    }

    logger.info('Settings sync from environment variables completed.')
}
