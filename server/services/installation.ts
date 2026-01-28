import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { dataSource } from '../database'
import { User } from '../entities/user'
import { Setting } from '../entities/setting'
import logger from '../utils/logger'

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
        { key: 'site_title', value: config.siteTitle, description: '站点标题' },
        { key: 'site_description', value: config.siteDescription, description: '站点描述' },
        { key: 'site_keywords', value: config.siteKeywords, description: '站点关键词' },
        { key: 'site_copyright', value: config.siteCopyright || '', description: '底部版权信息' },
        { key: 'default_language', value: config.defaultLanguage, description: '默认语言' },
    ]

    for (const setting of settings) {
        await settingRepo.save(setting)
    }

    logger.info('Site configuration saved successfully')
}

/**
 * 标记系统已安装
 */
export async function markSystemInstalled(): Promise<void> {
    const settingRepo = dataSource.getRepository(Setting)

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
