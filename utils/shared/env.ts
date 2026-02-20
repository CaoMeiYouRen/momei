import { ms } from 'ms'
import { parse } from 'better-bytes'
import { generateRandomString } from './random'

/**
 * 基础配置
 * 包含服务器基本设置、备案信息等
 */
// 雪花算法机器 ID。默认为进程 ID 对 1024 取余数，也可以手动指定
export const MACHINE_ID = Number(
    process.env.MACHINE_ID || (import.meta.server ? process.pid % 1024 : 0),
)
// Better Auth 的基础 URL
export const AUTH_BASE_URL =
    process.env.NUXT_PUBLIC_AUTH_BASE_URL
    || (import.meta.env.NUXT_PUBLIC_AUTH_BASE_URL as string)
    || ''
// 站点基础 URL
export const SITE_URL =
    process.env.NUXT_PUBLIC_SITE_URL
    || (import.meta.env.NUXT_PUBLIC_SITE_URL as string)
    || 'http://localhost:3000'
// 联系邮箱
export const CONTACT_EMAIL = import.meta.env
    .NUXT_PUBLIC_CONTACT_EMAIL as string

// 用于加密、签名和哈希的密钥。生产环境必须设置
// 在开发环境下如果没有设置，则自动生成一个随机密钥以保证系统能跑起来
export const AUTH_SECRET =
    process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || (
        (process.env.NODE_ENV === 'development' && import.meta.server)
            ? `dev_secret_${generateRandomString(32)}`
            : ''
    )

// 应用名称
export const APP_NAME =
    process.env.NUXT_PUBLIC_APP_NAME
    || (import.meta.env.NUXT_PUBLIC_APP_NAME as string)
    || '墨梅博客'

// 是否写入日志到文件
export const LOGFILES = process.env.LOGFILES === 'true'
// 日志等级
export const LOG_LEVEL =
    process.env.LOG_LEVEL
    || (process.env.NODE_ENV === 'development' ? 'silly' : 'http')
// 日志文件目录
export const LOG_DIR = process.env.LOG_DIR || 'logs'

// Axiom 日志配置
export const AXIOM_DATASET_NAME = process.env.AXIOM_DATASET_NAME
export const AXIOM_API_TOKEN = process.env.AXIOM_API_TOKEN

/**
 * 管理员配置
 */
// 管理员用户ID列表
export const ADMIN_USER_IDS =
    process.env.ADMIN_USER_IDS?.split(',')
        .map((e) => e.trim())
        .filter(Boolean) || []

/**
 * Demo 模式配置
 */
// 是否启用Demo模式
export const DEMO_MODE =
    process.env.NUXT_PUBLIC_DEMO_MODE === 'true'
    || process.env.DEMO_MODE === 'true'
    || import.meta.env.NUXT_PUBLIC_DEMO_MODE === 'true'

// 是否启用测试模式
export const TEST_MODE =
    process.env.NUXT_PUBLIC_TEST_MODE === 'true'
    || process.env.TEST_MODE === 'true'
    || process.env.NODE_ENV === 'test'
    || !!process.env.VITEST

// Demo账号邮箱
export const DEMO_USER_EMAIL =
    process.env.NUXT_PUBLIC_DEMO_USER_EMAIL
    || process.env.DEMO_USER_EMAIL
    || 'admin@example.com'
// Demo账号密码
export const DEMO_PASSWORD =
    process.env.NUXT_PUBLIC_DEMO_PASSWORD
    || process.env.DEMO_PASSWORD
    || 'momei123456'

/**
 * 数据库配置
 * 支持 SQLite、MySQL、PostgreSQL
 */
// 数据库连接 URL (MySQL和PostgreSQL使用)
export const DATABASE_URL = process.env.DATABASE_URL || ''

// 智能推断数据库类型
const getAutoDatabaseType = () => {
    if (DEMO_MODE || TEST_MODE) {
        return 'sqlite'
    }
    if (process.env.DATABASE_TYPE) {
        return process.env.DATABASE_TYPE
    }
    const url = DATABASE_URL.toLowerCase()
    if (url.startsWith('mysql')) {
        return 'mysql'
    }
    if (url.startsWith('postgres') || url.startsWith('postgresql')) {
        return 'postgres'
    }
    if (url.startsWith('sqlite') || url.startsWith('file')) {
        return 'sqlite'
    }
    return 'sqlite'
}

// 数据库类型：sqlite, mysql, postgres
export const DATABASE_TYPE = getAutoDatabaseType()

// SQLite 数据库路径 (仅SQLite使用)
// 为了兼容性保留此环境变量，但文档中将不再推荐手动设置
export const DATABASE_PATH = (() => {
    if (DEMO_MODE || TEST_MODE) {
        return ':memory:'
    }
    const url = DATABASE_URL.toLowerCase()
    // 如果 DATABASE_URL 以 sqlite: 或 file: 开头，提取路径
    if (url.startsWith('sqlite:') || url.startsWith('file:')) {
        // 去掉协议前缀，如果后面跟着 // 也去掉 (例如 sqlite:path/to/db 或 sqlite://path/to/db)
        return DATABASE_URL.replace(/^(sqlite|file):(?:\/\/)?/i, '')
    }
    return process.env.DATABASE_PATH || 'database/momei.sqlite'
})()
// 是否启用 SSL 连接 (true/false)
export const DATABASE_SSL = process.env.DATABASE_SSL === 'true'
// 数据库字符集 (仅MySQL使用)
export const DATABASE_CHARSET =
    process.env.DATABASE_CHARSET || 'utf8_general_ci'
// 数据库时区 (仅MySQL使用)
export const DATABASE_TIMEZONE = process.env.DATABASE_TIMEZONE || 'local'
// 数据库表前缀
export const DATABASE_ENTITY_PREFIX =
    process.env.DATABASE_ENTITY_PREFIX || 'momei_'
// 是否同步数据库表结构 (自动创建表结构)。生产环境不建议开启，可能会导致数据丢失
export const DATABASE_SYNCHRONIZE = process.env.DATABASE_SYNCHRONIZE === 'true'

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
export const EMAIL_SINGLE_USER_DAILY_LIMIT = Number(
    process.env.EMAIL_SINGLE_USER_DAILY_LIMIT || 5,
)
// 限流时间窗口
export const EMAIL_LIMIT_WINDOW = Number(
    process.env.EMAIL_LIMIT_WINDOW || ms('1d') / 1000,
)
// 邮件验证码有效时间（秒）
export const EMAIL_EXPIRES_IN = Number(process.env.EMAIL_EXPIRES_IN || 300)

// 匿名和临时邮箱配置
export const ANONYMOUS_EMAIL_DOMAIN_NAME =
    process.env.ANONYMOUS_EMAIL_DOMAIN_NAME || 'anonymous.com'
export const TEMP_EMAIL_DOMAIN_NAME =
    process.env.TEMP_EMAIL_DOMAIN_NAME || 'example.com'

// 是否要求邮箱验证。若启用，则用户必须在登录前验证他们的邮箱。仅在使用邮箱密码登录时生效。
export const EMAIL_REQUIRE_VERIFICATION =
    process.env.EMAIL_REQUIRE_VERIFICATION === 'true'

// 短信验证码有效时间（秒）
export const PHONE_EXPIRES_IN = Number(process.env.PHONE_EXPIRES_IN || 300)

/**
 * 社交登录配置
 */
// 匿名登录配置。如果启用，则允许用户不填写用户名、密码、邮箱的情况下即可直接登录
export const ANONYMOUS_LOGIN_ENABLED =
    process.env.ANONYMOUS_LOGIN_ENABLED === 'true'
// GitHub 配置
export const GITHUB_CLIENT_ID =
    process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
// Google 配置
export const GOOGLE_CLIENT_ID =
    process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

/**
 * 验证码配置
 */
// 验证码提供者：cloudflare-turnstile, google-recaptcha, hcaptcha, captchafox
export const AUTH_CAPTCHA_PROVIDER =
    process.env.NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER
    || (import.meta.env.NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER as string)
// 验证码密钥
export const AUTH_CAPTCHA_SECRET_KEY = process.env.AUTH_CAPTCHA_SECRET_KEY
// 验证码站点密钥 (公开)
export const AUTH_CAPTCHA_SITE_KEY =
    process.env.NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY
    || (import.meta.env.NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY as string)

// 文件名前缀
export const BUCKET_PREFIX = process.env.BUCKET_PREFIX || ''

// 最大允许上传的文件大小，默认 4.5 MiB
export const MAX_UPLOAD_SIZE = process.env.NUXT_PUBLIC_MAX_UPLOAD_SIZE
    ? Number(parse(process.env.NUXT_PUBLIC_MAX_UPLOAD_SIZE))
    : 4.5 * 1024 * 1024
export const MAX_UPLOAD_SIZE_TEXT =
    process.env.NUXT_PUBLIC_MAX_UPLOAD_SIZE || '4.5MiB'

// 最大允许上传的音频大小，默认 100 MiB
export const MAX_AUDIO_UPLOAD_SIZE = process.env.NUXT_PUBLIC_MAX_AUDIO_UPLOAD_SIZE
    ? Number(parse(process.env.NUXT_PUBLIC_MAX_AUDIO_UPLOAD_SIZE))
    : 100 * 1024 * 1024
export const MAX_AUDIO_UPLOAD_SIZE_TEXT =
    process.env.NUXT_PUBLIC_MAX_AUDIO_UPLOAD_SIZE || '100MiB'

// 上传文件限流时间窗口
export const UPLOAD_LIMIT_WINDOW = Number(
    process.env.UPLOAD_LIMIT_WINDOW || ms('1d') / 1000,
)
// 文件上传每日限制
export const UPLOAD_DAILY_LIMIT = Number(process.env.UPLOAD_DAILY_LIMIT || 100)
// 单个用户每日上传文件限制
export const UPLOAD_SINGLE_USER_DAILY_LIMIT = Number(
    process.env.UPLOAD_SINGLE_USER_DAILY_LIMIT || 5,
)
// 存储类型
export const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'
// 本地存储目录
export const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || 'public/uploads'
// 本地存储基础 URL
const rawLocalStorageBaseUrl =
    process.env.NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL
    || (import.meta.env.NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL as string)
    || '/uploads'
// 如果是完整的 URL 则直接使用 (支持动静分离)，否则拼接到 SITE_URL 之后
export const LOCAL_STORAGE_BASE_URL = rawLocalStorageBaseUrl.startsWith('http')
    ? rawLocalStorageBaseUrl
    : `${SITE_URL.replace(/\/+$/, '')}/${rawLocalStorageBaseUrl.replace(/^\/+/, '')}`
// 本地存储最小剩余空间 (字节)，默认 100MiB
export const LOCAL_STORAGE_MIN_FREE_SPACE = process.env.LOCAL_STORAGE_MIN_FREE_SPACE
    ? Number(parse(process.env.LOCAL_STORAGE_MIN_FREE_SPACE))
    : 100 * 1024 * 1024

/**
 * AI 服务配置
 */
// AI 提供商 (openai, anthropic)
export const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai') as
    | 'openai'
    | 'anthropic'
// API 密钥
export const AI_API_KEY = process.env.AI_API_KEY
// 是否启用 AI 服务：显式设置为 true，或者配置了 API Key 且未显式设置为 false
export const AI_ENABLED =
    process.env.AI_ENABLED === 'true'
    || (!!AI_API_KEY && process.env.AI_ENABLED !== 'false')
// 模型名称
export const AI_MODEL = process.env.AI_MODEL || 'gpt-4o'
// API 代理地址 (可选)
export const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT
// 最大 Token 数
export const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 2048)
// 温度因子
export const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.7)
// 单次长内容处理的最大字符长度（防滥用）
export const AI_MAX_CONTENT_LENGTH = Number(
    process.env.AI_MAX_CONTENT_LENGTH || 50000,
)
// 分段处理的目标块大小
export const AI_CHUNK_SIZE = Number(process.env.AI_CHUNK_SIZE || 4000)

/**
 * AI 图像生成配置
 */
export const AI_IMAGE_API_KEY = process.env.AI_IMAGE_API_KEY
export const AI_IMAGE_ENABLED =
    process.env.AI_IMAGE_ENABLED === 'true'
    || (!!AI_IMAGE_API_KEY && process.env.AI_IMAGE_ENABLED !== 'false')
export const AI_IMAGE_PROVIDER = (process.env.AI_IMAGE_PROVIDER || 'openai') as
    | 'openai'
    | 'stable-diffusion'
    | 'doubao'
    | 'gemini'
    | 'siliconflow'
export const AI_IMAGE_MODEL = process.env.AI_IMAGE_MODEL || 'dall-e-3'
export const AI_IMAGE_ENDPOINT = process.env.AI_IMAGE_ENDPOINT

/**
 * TTS 配置
 */
// TTS 提供商 (openai, siliconflow)
export const TTS_PROVIDER = (process.env.TTS_PROVIDER || 'openai') as
    | 'openai'
    | 'siliconflow'
export const TTS_ENABLED =
    process.env.TTS_ENABLED === 'true'
    || (!!process.env.TTS_API_KEY && process.env.TTS_ENABLED !== 'false')
    || (!!AI_API_KEY && process.env.TTS_ENABLED !== 'false')
export const TTS_API_KEY = process.env.TTS_API_KEY || AI_API_KEY
export const TTS_ENDPOINT = process.env.TTS_ENDPOINT || AI_API_ENDPOINT
export const TTS_DEFAULT_MODEL = process.env.TTS_DEFAULT_MODEL || 'tts-1'
export const TTS_DEFAULT_VOICE = process.env.TTS_DEFAULT_VOICE || 'alloy'

/**
 * ASR 配置
 */
// ASR 提供商 (siliconflow, volcengine)
export const ASR_PROVIDER = (process.env.ASR_PROVIDER || 'siliconflow') as
    | 'siliconflow'
    | 'volcengine'

/**
 * 火山引擎 (豆包语音) 配置
 */
export const VOLCENGINE_ACCESS_KEY = process.env.VOLCENGINE_ACCESS_KEY
export const VOLCENGINE_SECRET_KEY = process.env.VOLCENGINE_SECRET_KEY
export const VOLCENGINE_APP_ID = process.env.VOLCENGINE_APP_ID

/**
 * 安全配置
 */
// 外部资源 URL 域名白名单默认值
export const SECURITY_URL_WHITELIST_DEFAULT =
    'images.unsplash.com,cdn.pixabay.com,img.shields.io,i.imgur.com,github.com,avatars.githubusercontent.com,lh3.googleusercontent.com'

/**
 * 获取外部资源 URL 域名白名单
 * 在 Nuxt 环境中会优先从 Runtime Config 读取以确保前后端一致
 */
export function getSecurityUrlWhitelist(): string[] {
    let raw: string | undefined

    // 尝试从 Nuxt Runtime Config 获取（推荐方式）
    if (import.meta.client || import.meta.server) {
        try {
            const config = useRuntimeConfig()
            raw = config.public.securityUrlWhitelist
        } catch {
            // Nuxt 实例尚未就绪或不在 Nuxt 上下文中
        }
    }

    // 回退到环境变量或默认值
    if (!raw) {
        raw = process.env.NUXT_PUBLIC_SECURITY_URL_WHITELIST
            || (import.meta.env.NUXT_PUBLIC_SECURITY_URL_WHITELIST as string)
            || SECURITY_URL_WHITELIST_DEFAULT
    }

    return raw
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
}

// 导出常量以保持向后兼容（注意：在浏览器中此常量的初始化可能早于 Nuxt 运行时，建议使用 getSecurityUrlWhitelist()）
export const SECURITY_URL_WHITELIST = getSecurityUrlWhitelist()

