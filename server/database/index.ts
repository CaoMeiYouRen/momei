import { ms } from 'ms'
import { DataSource, In, type DataSourceOptions } from 'typeorm'
import { Account } from '../entities/account'
import { Session } from '../entities/session'
import { User } from '../entities/user'
import { Verification } from '../entities/verification'
import { TwoFactor } from '../entities/two-factor'
import { Jwks } from '../entities/jwks'
import { Post } from '../entities/post'
import { Category } from '../entities/category'
import { Tag } from '../entities/tag'
import { ApiKey } from '../entities/api-key'
import { Subscriber } from '../entities/subscriber'
import { Setting } from '../entities/setting'
import { Comment } from '../entities/comment'
import { Snippet } from '../entities/snippet'
import { Submission } from '../entities/submission'
import { ThemeConfig } from '../entities/theme-config'
import { AgreementContent } from '../entities/agreement-content'
import { NotificationSettings } from '../entities/notification-settings'
import { MarketingCampaign } from '../entities/marketing-campaign'
import { AdminNotificationSettings } from '../entities/admin-notification-settings'
import { AITask } from '../entities/ai-task'
import { ASRQuota } from '../entities/asr-quota'
import { PostVersion } from '../entities/post-version'
import { InAppNotification } from '../entities/in-app-notification'
import logger from '../utils/logger'
import { isServerlessEnvironment } from '../utils/env'
import { CustomLogger } from './logger'
import { SnakeCaseNamingStrategy } from './naming-strategy'
import { isAdmin } from '@/utils/shared/roles'
import {
    DATABASE_TYPE,
    DATABASE_PATH,
    DATABASE_URL,
    DATABASE_SSL,
    DATABASE_CHARSET,
    DATABASE_TIMEZONE,
    DATABASE_ENTITY_PREFIX,
    DATABASE_SYNCHRONIZE,
    DEMO_MODE,
    ADMIN_USER_IDS,
} from '@/utils/shared/env'


// 支持的数据库类型
const SUPPORTED_DATABASE_TYPES = ['sqlite', 'mysql', 'postgres']

// 连接状态
let isInitialized = false
let AppDataSource: DataSource | null = null

const entities = [
    Account,
    Session,
    User,
    Verification,
    TwoFactor,
    Jwks,
    Post,
    Category,
    Tag,
    ApiKey,
    Subscriber,
    Setting,
    Comment,
    Snippet,
    Submission,
    ThemeConfig,
    AgreementContent,
    NotificationSettings,
    MarketingCampaign,
    AdminNotificationSettings,
    AITask,
    ASRQuota,
    PostVersion,
    InAppNotification,
]

/**
 * 同步环境变量中的管理员角色到数据库
 */
async function syncAdminRoles(ds: DataSource) {
    if (ADMIN_USER_IDS.length === 0) {
        return
    }

    try {
        const userRepo = ds.getRepository(User)
        const admins = await userRepo.findBy({ id: In(ADMIN_USER_IDS) })

        for (const user of admins) {
            if (!isAdmin(user.role)) {
                const roles = user.role ? user.role.split(',').map((r) => r.trim()).filter(Boolean) : []
                if (!roles.includes('admin')) {
                    roles.push('admin')
                    user.role = roles.join(',')
                    await userRepo.save(user)
                    logger.info(`Synchronized admin role for user: ${user.email} (id: ${user.id})`)
                }
            }
        }
    } catch (error) {
        logger.error('Failed to synchronize admin roles:', error)
    }
}

export const initializeDB = async () => {
    if (isInitialized && AppDataSource) {
        return AppDataSource
    }

    // 从环境变量获取数据库类型
    const dbType = DATABASE_TYPE

    // Demo 模式强制使用内存 SQLite 数据库
    const actualDbType = dbType
    const isMemoryDB = DEMO_MODE

    // 检查数据库类型是否支持
    if (!SUPPORTED_DATABASE_TYPES.includes(actualDbType)) {
        throw new Error(`Unsupported database type: ${actualDbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
    }

    // 数据库配置
    let options: DataSourceOptions

    // 环境检查：如果在 Serverless 环境或生产环境中使用 SQLite，给出警告
    if (actualDbType === 'sqlite' && !DEMO_MODE && (isServerlessEnvironment() || process.env.NODE_ENV === 'production')) {
        logger.warn('⚠️ Detection: Using SQLite in production or Serverless environment. Data will not persist across deployments or restarts!')
    }

    // 配置数据库连接
    switch (actualDbType) {
        case 'sqlite':
            options = {
                type: 'better-sqlite3',
                database: DATABASE_PATH, // Demo 模式使用内存数据库
            }
            break
        case 'mysql':
            options = {
                type: actualDbType,
                url: DATABASE_URL,
                supportBigNumbers: true, // 处理数据库中的大数字
                bigNumberStrings: false, // 仅当它们无法用 JavaScript Number 对象准确表示时才会返回大数字作为 String 对象
                ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false, // 是否启用 SSL
                connectTimeout: ms('60 s'), // 连接超时设置为 60 秒
                charset: DATABASE_CHARSET, // 连接的字符集
                timezone: DATABASE_TIMEZONE, // 连接的时区
            }
            break
        case 'postgres':
            options = {
                type: actualDbType,
                url: DATABASE_URL,
                parseInt8: true, // 解析 bigint 为 number。将 64 位整数（int8）解析为 JavaScript 整数
                ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false, // 是否启用 SSL
                extra: {
                    max: 20,
                    connectionTimeoutMillis: ms('60s'), // 连接超时设置为 60 秒
                },
            }
            break
        default:
            throw new Error(`Unsupported database type: ${actualDbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
    }

    // 检查环境状态
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
    const isDevEnv = process.env.NODE_ENV === 'development'

    // 创建数据源
    AppDataSource = new DataSource({
        ...options,
        entities,
        // 开发模式、测试模式或 Demo 模式默认开启同步，生产环境只能通过 DATABASE_SYNCHRONIZE 显式开启
        synchronize: DATABASE_SYNCHRONIZE || DEMO_MODE || isTestEnv || isDevEnv,
        logging: isTestEnv ? false : process.env.NODE_ENV === 'development', // 测试时禁用日志
        logger: isTestEnv ? undefined : new CustomLogger(), // 测试时不使用自定义日志器
        entityPrefix: DATABASE_ENTITY_PREFIX, // 所有表（或集合）加的前缀
        namingStrategy: new SnakeCaseNamingStrategy(), // 表、字段命名策略，改为 snake_case
        cache: false, // 是否启用实体结果缓存
        maxQueryExecutionTime: isTestEnv ? 10000 : 3000, // 测试时允许更长的查询时间
    })

    try {
        // 初始化连接
        await AppDataSource.initialize()
        // 更新连接状态
        isInitialized = true

        // 同步管理员角色
        await syncAdminRoles(AppDataSource)

        // 测试环境时减少日志输出
        if (!isTestEnv) {
            logger.system.startup({
                dbType: actualDbType,
                env: process.env.NODE_ENV,
                port: Number(process.env.PORT || process.env.NITRO_PORT || 3000),
            })
            logger.info(`Database initialized successfully with type: ${actualDbType}${isMemoryDB ? ' (memory)' : ''}${DEMO_MODE ? ' [DEMO MODE]' : ''}`)
        }
    } catch (error: any) {
        // 重要修复：对于安装向导，我们不希望数据库初始化失败导致整个应用崩溃
        // 记录错误但不重新抛出，让 AppDataSource 保持未初始化状态
        if (isTestEnv) {
            logger.error(`Database initialization failed: ${error.message}`)
        } else {
            // 使用专门的数据库错误日志记录详细信息
            logger.database.error({
                error: error.message,
                stack: error.stack,
                query: `database_initialization (${actualDbType})`,
            })
            logger.error('Database connection failed during startup. The application will continue but features requiring a database will be disabled until corrected.')
        }

        // 返回一个至少通过 type 校验的基础 DataSource，但不抛出错误
        return AppDataSource
    }

    return AppDataSource
}

// 修改顶级 await 为捕获错误的调用
export const dataSource = await initializeDB()
