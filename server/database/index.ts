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
import { PostViewHourly } from '../entities/post-view-hourly'
import { AgreementContent } from '../entities/agreement-content'
import { NotificationSettings } from '../entities/notification-settings'
import { MarketingCampaign } from '../entities/marketing-campaign'
import { AdminNotificationSettings } from '../entities/admin-notification-settings'
import { AITask } from '../entities/ai-task'
import { PostVersion } from '../entities/post-version'
import { InAppNotification } from '../entities/in-app-notification'
import { AdPlacement } from '../entities/ad-placement'
import { AdCampaign } from '../entities/ad-campaign'
import { ExternalLink } from '../entities/external-link'
import { FriendLinkCategory } from '../entities/friend-link-category'
import { FriendLink } from '../entities/friend-link'
import { FriendLinkApplication } from '../entities/friend-link-application'
import { LinkGovernanceReport } from '../entities/link-governance-report'
import { SettingAuditLog } from '../entities/setting-audit-log'
import { NotificationDeliveryLog } from '../entities/notification-delivery-log'
import { WebPushSubscription } from '../entities/web-push-subscription'
import { BenefitWaitlist } from '../entities/benefit-waitlist'
import logger from '../utils/logger'
import { isServerlessEnvironment } from '../utils/env'
import { repairLegacyPostVersionRecords } from './post-version-repair'
import { CustomLogger } from './logger'
import { SnakeCaseNamingStrategy } from './naming-strategy'
import { isAdmin } from '@/utils/shared/roles'
import { splitAndNormalizeStringList } from '@/utils/shared/string-list'
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
let initializationPromise: Promise<DataSource> | null = null
let dataSourceContext: {
    dataSource: DataSource
    actualDbType: string
    isMemoryDB: boolean
    isTestEnv: boolean
} | null = null

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
    PostViewHourly,
    AgreementContent,
    NotificationSettings,
    MarketingCampaign,
    AdminNotificationSettings,
    AITask,
    PostVersion,
    InAppNotification,
    AdPlacement,
    AdCampaign,
    ExternalLink,
    FriendLinkCategory,
    FriendLink,
    FriendLinkApplication,
    LinkGovernanceReport,
    SettingAuditLog,
    NotificationDeliveryLog,
    WebPushSubscription,
    BenefitWaitlist,
]

function getDataSourceContext() {
    if (dataSourceContext) {
        return dataSourceContext
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
                database: DATABASE_PATH,
            }
            break
        case 'mysql':
            options = {
                type: actualDbType,
                url: DATABASE_URL,
                supportBigNumbers: true,
                bigNumberStrings: false,
                ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false,
                connectTimeout: ms('60 s'),
                charset: DATABASE_CHARSET,
                timezone: DATABASE_TIMEZONE,
            }
            break
        case 'postgres':
            options = {
                type: actualDbType,
                url: DATABASE_URL,
                parseInt8: true,
                ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false,
                extra: {
                    max: 20,
                    connectionTimeoutMillis: ms('60s'),
                },
            }
            break
        default:
            throw new Error(`Unsupported database type: ${actualDbType}. Please use one of: ${SUPPORTED_DATABASE_TYPES.join(', ')}`)
    }

    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
    const isDevEnv = process.env.NODE_ENV === 'development'

    const dataSource = new DataSource({
        ...options,
        entities,
        synchronize: DATABASE_SYNCHRONIZE || DEMO_MODE || isTestEnv || isDevEnv,
        logging: isTestEnv ? false : process.env.NODE_ENV === 'development',
        logger: isTestEnv ? undefined : new CustomLogger(),
        entityPrefix: DATABASE_ENTITY_PREFIX,
        namingStrategy: new SnakeCaseNamingStrategy(),
        cache: false,
        maxQueryExecutionTime: isTestEnv ? 10000 : 3000,
    })

    dataSourceContext = {
        dataSource,
        actualDbType,
        isMemoryDB,
        isTestEnv,
    }
    AppDataSource = dataSource

    return dataSourceContext
}

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
                const roles = splitAndNormalizeStringList(user.role, {
                    delimiters: ',',
                })
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
    if (isInitialized && AppDataSource?.isInitialized) {
        return AppDataSource
    }

    if (initializationPromise) {
        return initializationPromise
    }

    initializationPromise = (async () => {
        const { dataSource, actualDbType, isMemoryDB, isTestEnv } = getDataSourceContext()
        AppDataSource = dataSource

        try {
            if (!AppDataSource.isInitialized) {
                await AppDataSource.initialize()
            }
            isInitialized = true

            await syncAdminRoles(AppDataSource)
            await repairLegacyPostVersionRecords(AppDataSource)

            if (!isTestEnv) {
                logger.system.startup({
                    dbType: actualDbType,
                    env: process.env.NODE_ENV,
                    port: Number(process.env.PORT || process.env.NITRO_PORT || 3000),
                })
                logger.info(`Database initialized successfully with type: ${actualDbType}${isMemoryDB ? ' (memory)' : ''}${DEMO_MODE ? ' [DEMO MODE]' : ''}`)
            }

            return AppDataSource
        } catch (error: any) {
            if (isTestEnv) {
                logger.error(`Database initialization failed: ${error.message}`)
            } else {
                logger.database.error({
                    error: error.message,
                    stack: error.stack,
                    query: `database_initialization (${actualDbType})`,
                })
                logger.error('Database connection failed during startup. The application will continue but features requiring a database will be disabled until corrected.')
            }

            return AppDataSource
        } finally {
            initializationPromise = null
        }
    })()

    return initializationPromise
}

export const ensureDatabaseReady = async () => {
    if (dataSource.isInitialized) {
        return true
    }

    await initializeDB()
    return dataSource.isInitialized
}

export const dataSource: DataSource = getDataSourceContext().dataSource
