import { parse } from 'better-bytes'
import { ms } from 'ms'
/**
 * 基础配置
 * 包含服务器基本设置、备案信息等
 */
// 雪花算法机器 ID。默认为进程 ID 对 1024 取余数，也可以手动指定
export const MACHINE_ID = Number(process.env.MACHINE_ID || import.meta.server ? process.pid % 1024 : 0)
// Better Auth 的基础 URL
export const AUTH_BASE_URL = process.env.NUXT_PUBLIC_AUTH_BASE_URL || import.meta.env.NUXT_PUBLIC_AUTH_BASE_URL as string || ''
// 联系邮箱
export const CONTACT_EMAIL = import.meta.env.NUXT_PUBLIC_CONTACT_EMAIL as string
// 用于加密、签名和哈希的密钥。生产环境必须设置
export const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || ''
// 应用名称
export const APP_NAME = process.env.NUXT_PUBLIC_APP_NAME || import.meta.env.NUXT_PUBLIC_APP_NAME as string || '墨梅博客'

// 是否写入日志到文件
export const LOGFILES = process.env.LOGFILES === 'true'
// 日志等级
export const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'silly' : 'http')
// 日志文件目录
export const LOG_DIR = process.env.LOG_DIR || 'logs'

// Axiom 日志配置
export const AXIOM_DATASET_NAME = process.env.AXIOM_DATASET_NAME
export const AXIOM_API_TOKEN = process.env.AXIOM_API_TOKEN

/**
 * 管理员配置
 */
// 管理员用户ID列表
export const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',').map((e) => e.trim()).filter(Boolean) || []


/**
 * Demo 模式配置
 */
// 是否启用Demo模式
export const DEMO_MODE = process.env.NUXT_PUBLIC_DEMO_MODE === 'true' || import.meta.env.NUXT_PUBLIC_DEMO_MODE === 'true'
// Demo账号密码
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@123456'


/**
 * 数据库配置
 * 支持 SQLite、MySQL、PostgreSQL
 */
// 数据库类型：sqlite, mysql, postgres
export const DATABASE_TYPE = DEMO_MODE ? 'sqlite' : (process.env.DATABASE_TYPE || 'sqlite')
// 数据库连接 URL (MySQL和PostgreSQL使用)
export const DATABASE_URL = process.env.DATABASE_URL
// SQLite 数据库路径 (仅SQLite使用)
export const DATABASE_PATH = DEMO_MODE ? ':memory:' : (process.env.DATABASE_PATH || 'database/momei.sqlite')
// 是否启用 SSL 连接 (true/false)
export const DATABASE_SSL = process.env.DATABASE_SSL === 'true'
// 数据库字符集 (仅MySQL使用)
export const DATABASE_CHARSET = process.env.DATABASE_CHARSET || 'utf8_general_ci'
// 数据库时区 (仅MySQL使用)
export const DATABASE_TIMEZONE = process.env.DATABASE_TIMEZONE || 'local'
// 数据库表前缀
export const DATABASE_ENTITY_PREFIX = process.env.DATABASE_ENTITY_PREFIX || 'momei_'

/**
 * Redis配置（可选）
 */
// Redis 连接地址
export const REDIS_URL = process.env.REDIS_URL


/**
 * 邮件服务配置
 * SMTP 服务器配置和邮件发送限制
 */
// SMTP 服务器地址
export const EMAIL_HOST = process.env.EMAIL_HOST
// SMTP 服务器端口
export const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587
// 是否使用SSL连接邮件服务器
export const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'
// 邮件发送者地址
export const EMAIL_USER = process.env.EMAIL_USER
// 邮件发送者密码
export const EMAIL_PASS = process.env.EMAIL_PASS
// 默认邮件发送者名称和地址
export const EMAIL_FROM = process.env.EMAIL_FROM
// 邮箱验证码每日发送上限（全局限制）
export const EMAIL_DAILY_LIMIT = Number(process.env.EMAIL_DAILY_LIMIT || 100)
// 单个邮箱每日验证码发送上限
export const EMAIL_SINGLE_USER_DAILY_LIMIT = Number(process.env.EMAIL_SINGLE_USER_DAILY_LIMIT || 5)
// 限流时间窗口
export const EMAIL_LIMIT_WINDOW = Number(process.env.EMAIL_LIMIT_WINDOW || ms('1d') / 1000)
// 邮件验证码有效时间（秒）
export const EMAIL_EXPIRES_IN = Number(process.env.EMAIL_EXPIRES_IN || 300)

// 匿名和临时邮箱配置
export const ANONYMOUS_EMAIL_DOMAIN_NAME = process.env.ANONYMOUS_EMAIL_DOMAIN_NAME || 'anonymous.com'
export const TEMP_EMAIL_DOMAIN_NAME = process.env.TEMP_EMAIL_DOMAIN_NAME || 'example.com'


// 是否要求邮箱验证。若启用，则用户必须在登录前验证他们的邮箱。仅在使用邮箱密码登录时生效。
export const EMAIL_REQUIRE_VERIFICATION = process.env.EMAIL_REQUIRE_VERIFICATION === 'true'


// 短信验证码有效时间（秒）
export const PHONE_EXPIRES_IN = Number(process.env.PHONE_EXPIRES_IN || 300)

/**
 * 社交登录配置
 */
// 匿名登录配置。如果启用，则允许用户不填写用户名、密码、邮箱的情况下即可直接登录
export const ANONYMOUS_LOGIN_ENABLED = process.env.ANONYMOUS_LOGIN_ENABLED === 'true'
// GitHub 配置
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
