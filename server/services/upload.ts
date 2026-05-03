import path from 'node:path'
import dayjs from 'dayjs'
import { type H3Event, readMultipartFormData } from 'h3'
import { getFileStorage, type FileStorageEnv } from '@/server/utils/storage/factory'
import { splitAndNormalizeStringList } from '@/utils/shared/string-list'
import { normalizeDurationSeconds } from '@/utils/shared/duration'
import { joinBaseUrlAndPath } from '@/utils/shared/url'
import { resolveUploadSizeSetting } from '@/utils/shared/upload-size'
import { limiterStorage } from '@/server/database/storage'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'

/**
 * 上传类型枚举
 */
export enum UploadType {
    IMAGE = 'image',
    AUDIO = 'audio',
    FILE = 'file',
}

const UPLOAD_TYPE_DIRECTORIES: Record<UploadType, string> = {
    [UploadType.IMAGE]: 'image',
    [UploadType.AUDIO]: 'audio',
    [UploadType.FILE]: 'file',
}

export interface UploadOptions {
    /** 文件路径前缀，例如 'image/' 或 'posts/post-1/image/' */
    prefix: string
    /** 最大文件数量限制 */
    maxFiles?: number
    /** 上传类型，默认为 IMAGE */
    type?: UploadType
    /** 是否必须是图片，默认为 true (兼容旧代码，建议使用 type) */
    mustBeImage?: boolean
}

export interface UploadedFile {
    /** 原始文件名 */
    filename: string
    /** 存储后的公开访问 URL */
    url: string
    /** MIME 类型 */
    mimetype: string | undefined
}

export type UploadSettings = Partial<Record<SettingKey, string | null | undefined>>

/**
 * 上传存储运行时上下文
 *
 * 在设计上同时保留 rawStorageType（原始设置字符串，用于分支判断）
 * 和 normalizedStorageType（归一化后的驱动键，用于 getFileStorage 查找），
 * 避免调用方需要重复做归一化与分支判断。
 */
export interface UploadStorageContext {
    rawStorageType: string
    normalizedStorageType: string
    bucketPrefix: string
    assetPublicBaseUrl: string
    driverBaseUrl: string
    env: FileStorageEnv
    settings: UploadSettings
}

/**
 * 批量加载上传相关的全部设置键。
 *
 * 这里的键集合覆盖 local / s3 / r2 / vercel_blob 四种存储驱动，以及
 * 全局资产域名、对象前缀、上传尺寸与文件类型限制等跨驱动通用配置。
 * 一次性批量 getSettings 可减少数据库往返次数。
 */
const COMMON_UPLOAD_SETTING_KEYS = [
    SettingKey.STORAGE_TYPE,
    SettingKey.LOCAL_STORAGE_DIR,
    SettingKey.LOCAL_STORAGE_BASE_URL,
    SettingKey.LOCAL_STORAGE_MIN_FREE_SPACE,
    SettingKey.S3_ENDPOINT,
    SettingKey.S3_BUCKET,
    SettingKey.S3_REGION,
    SettingKey.S3_ACCESS_KEY,
    SettingKey.S3_SECRET_KEY,
    SettingKey.S3_BASE_URL,
    SettingKey.S3_BUCKET_PREFIX,
    SettingKey.ASSET_PUBLIC_BASE_URL,
    SettingKey.ASSET_OBJECT_PREFIX,
    SettingKey.VERCEL_BLOB_TOKEN,
    SettingKey.CLOUDFLARE_R2_ACCOUNT_ID,
    SettingKey.CLOUDFLARE_R2_ACCESS_KEY,
    SettingKey.CLOUDFLARE_R2_SECRET_KEY,
    SettingKey.CLOUDFLARE_R2_BUCKET,
    SettingKey.CLOUDFLARE_R2_BASE_URL,
    SettingKey.MAX_UPLOAD_SIZE,
    SettingKey.MAX_AUDIO_UPLOAD_SIZE,
    SettingKey.ALLOWED_FILE_TYPES,
] as const

/**
 * 统一化路径前缀：去除反斜杠、首部斜杠，确保以 '/' 结尾。
 * 输入为空时返回空字符串，便于上层拼接时不产生多余斜杠。
 */
function normalizePrefix(prefix?: string) {
    if (!prefix) {
        return ''
    }

    const normalized = prefix.replace(/\\/g, '/').trim().replace(/^\/+/, '')
    if (!normalized) {
        return ''
    }

    return normalized.endsWith('/') ? normalized : `${normalized}/`
}

/**
 * 从 UploadSettings 中安全提取字符串值。
 */
function getSettingValue(settings: UploadSettings, key: SettingKey, fallback = '') {
    return String(settings[key] || fallback)
}

/**
 * 从 UploadSettings 中提取数值限制，非有限值时退回 fallback。
 */
function getNumericLimit(settings: UploadSettings, key: SettingKey, fallback: number) {
    const value = Number(settings[key])
    return Number.isFinite(value) ? value : fallback
}

/**
 * 获取存储桶对象前缀。
 * 优先级：ASSET_OBJECT_PREFIX > S3_BUCKET_PREFIX（后者为历史兼容）。
 */
function getAssetObjectPrefix(settings: UploadSettings) {
    return normalizePrefix(
        getSettingValue(settings, SettingKey.ASSET_OBJECT_PREFIX)
        || getSettingValue(settings, SettingKey.S3_BUCKET_PREFIX),
    )
}

/**
 * 解析上传资产公开访问域名。
 *
 * 优先级链：
 *   1. ASSET_PUBLIC_BASE_URL（全局资产域名，最高优先级，允许统一切换 CDN）
 *   2. 驱动专属域名（R2_BASE_URL / S3_BASE_URL / LOCAL_STORAGE_BASE_URL）
 *   3. Vercel Blob：复用 ASSET_PUBLIC_BASE_URL
 *   4. 兜底：env.S3_BASE_URL
 */
export function resolveUploadPublicBaseUrl(settings: UploadSettings, rawStorageType: string, env: FileStorageEnv) {
    const globalBaseUrl = getSettingValue(settings, SettingKey.ASSET_PUBLIC_BASE_URL)
    if (globalBaseUrl) {
        return globalBaseUrl
    }

    if (rawStorageType === 'r2') {
        return getSettingValue(settings, SettingKey.CLOUDFLARE_R2_BASE_URL)
    }

    if (rawStorageType === 's3') {
        return getSettingValue(settings, SettingKey.S3_BASE_URL)
    }

    if (rawStorageType === 'local') {
        return getSettingValue(settings, SettingKey.LOCAL_STORAGE_BASE_URL)
    }

    if (rawStorageType === 'vercel_blob' || rawStorageType === 'vercel-blob') {
        return getSettingValue(settings, SettingKey.ASSET_PUBLIC_BASE_URL)
    }

    return env.S3_BASE_URL || ''
}

export function resolveUploadedFileUrl(objectKey: string, storageContext: Pick<UploadStorageContext, 'assetPublicBaseUrl' | 'driverBaseUrl'>) {
    // 先使用资产公共域名，其次回退到驱动域名；两者都缺失时返回 objectKey，
    // 便于上层在私有部署场景自行拼接访问地址。
    const candidateBaseUrl = storageContext.assetPublicBaseUrl || storageContext.driverBaseUrl
    if (!candidateBaseUrl) {
        return objectKey
    }

    return joinBaseUrlAndPath(candidateBaseUrl, objectKey)
}

function buildS3CompatibleEnv(settings: UploadSettings, rawStorageType: string): FileStorageEnv {
    if (rawStorageType === 'r2') {
        const accountId = getSettingValue(settings, SettingKey.CLOUDFLARE_R2_ACCOUNT_ID)
        const bucket = getSettingValue(settings, SettingKey.CLOUDFLARE_R2_BUCKET)
        const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : ''
        const baseUrl = getSettingValue(settings, SettingKey.CLOUDFLARE_R2_BASE_URL) || (endpoint && bucket ? `${endpoint}/${bucket}` : endpoint)

        return {
            ...(process.env as any),
            S3_ENDPOINT: endpoint,
            S3_BUCKET_NAME: bucket,
            S3_BUCKET: bucket,
            S3_REGION: 'auto',
            S3_ACCESS_KEY_ID: getSettingValue(settings, SettingKey.CLOUDFLARE_R2_ACCESS_KEY),
            S3_ACCESS_KEY: getSettingValue(settings, SettingKey.CLOUDFLARE_R2_ACCESS_KEY),
            S3_SECRET_ACCESS_KEY: getSettingValue(settings, SettingKey.CLOUDFLARE_R2_SECRET_KEY),
            S3_SECRET_KEY: getSettingValue(settings, SettingKey.CLOUDFLARE_R2_SECRET_KEY),
            S3_BASE_URL: baseUrl,
        }
    }

    const bucket = getSettingValue(settings, SettingKey.S3_BUCKET)

    return {
        ...(process.env as any),
        S3_ENDPOINT: getSettingValue(settings, SettingKey.S3_ENDPOINT),
        S3_BUCKET_NAME: bucket,
        S3_BUCKET: bucket,
        S3_REGION: getSettingValue(settings, SettingKey.S3_REGION, 'auto'),
        S3_ACCESS_KEY_ID: getSettingValue(settings, SettingKey.S3_ACCESS_KEY),
        S3_ACCESS_KEY: getSettingValue(settings, SettingKey.S3_ACCESS_KEY),
        S3_SECRET_ACCESS_KEY: getSettingValue(settings, SettingKey.S3_SECRET_KEY),
        S3_SECRET_KEY: getSettingValue(settings, SettingKey.S3_SECRET_KEY),
        S3_BASE_URL: getSettingValue(settings, SettingKey.S3_BASE_URL),
    }
}

/**
 * 将原始 storageType 归一化为驱动键。
 *
 * 特殊处理：vercel-blob → vercel_blob（Vercel 配置习惯用连字符，
 * 但内部驱动键统一用下划线，避免 URL 元字符问题）。
 */
export function normalizeStorageType(storageType?: string | null) {
    const rawStorageType = (storageType || 'local').trim()

    switch (rawStorageType) {
        case 'vercel-blob':
            return 'vercel_blob'
        case 'r2':
        case 'vercel_blob':
        case 's3':
        case 'local':
            return rawStorageType
        default:
            return rawStorageType
    }
}

export function resolveUploadPrefix(type: UploadType, prefix?: string) {
    const normalized = normalizePrefix(prefix)
    if (normalized) {
        return normalized
    }

    return `${UPLOAD_TYPE_DIRECTORIES[type] || UPLOAD_TYPE_DIRECTORIES[UploadType.FILE]}/`
}

export function buildAvatarUploadPrefix(userId: string) {
    return normalizePrefix(`avatars/${userId}`)
}

export function buildPostUploadPrefix(options: {
    postId?: string | null
    type: UploadType
    usage?: string
}) {
    const typeDirectory = UPLOAD_TYPE_DIRECTORIES[options.type] || UPLOAD_TYPE_DIRECTORIES[UploadType.FILE]
    const usage = normalizePrefix(options.usage)

    if (!options.postId) {
        return usage ? `${typeDirectory}/${usage}` : `${typeDirectory}/`
    }

    return usage
        ? `posts/${options.postId}/${typeDirectory}/${usage}`
        : `posts/${options.postId}/${typeDirectory}/`
}

/**
 * 安全清洗上传文件名。
 *
 * 处理路径分隔符（防目录穿越）、多余空格和非法字符，
 * 最终只保留 Unicode 字母数字、下划线和连字符。
 * 空结果或不可清洗输入返回空字符串，由调用方决定是否回退到时间戳命名。
 */
function sanitizeUploadBasename(basename?: string) {
    if (!basename) {
        return ''
    }

    const normalized = basename.replace(/\\/g, '/').trim().split('/').pop() || ''
    const stem = path.parse(normalized).name.trim()

    if (!stem) {
        return ''
    }

    return stem
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}_-]+/gu, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * 构建存储文件名（格式：{basename-}timestamp-random.extension）。
 * basename 经过安全清洗，extension 自动补 '.' 前缀。
 */
export function buildUploadStoredFilename(options: {
    originalFilename?: string
    extension?: string
    basename?: string
}) {
    const timestamp = dayjs().format('YYYYMMDDHHmmssSSS')
    const random = Math.random().toString(36).slice(2, 9)
    const rawExtension = options.extension || path.extname(options.originalFilename || '')
    let extension = ''
    if (rawExtension) {
        extension = rawExtension.startsWith('.') ? rawExtension : `.${rawExtension}`
    }
    const basename = sanitizeUploadBasename(options.basename)

    return basename
        ? `${basename}-${timestamp}-${random}${extension}`
        : `${timestamp}-${random}${extension}`
}

export function resolveUploadSizeLimit(type: UploadType, settings: UploadSettings) {
    if (type === UploadType.AUDIO) {
        return resolveUploadSizeSetting(settings[SettingKey.MAX_AUDIO_UPLOAD_SIZE] ?? null, 20)
    }

    return resolveUploadSizeSetting(settings[SettingKey.MAX_UPLOAD_SIZE] ?? null, 10)
}

function parseAllowedFileTypes(settings: UploadSettings) {
    return splitAndNormalizeStringList(String(settings[SettingKey.ALLOWED_FILE_TYPES] || ''), {
        delimiters: /[\n,]/,
        lowercase: true,
    })
}

function inferUploadTypeFromContentType(contentType?: string) {
    const normalizedContentType = contentType?.split(';')[0]?.trim().toLowerCase()

    if (normalizedContentType?.startsWith('audio/')) {
        return UploadType.AUDIO
    }

    if (normalizedContentType?.startsWith('image/')) {
        return UploadType.IMAGE
    }

    return UploadType.FILE
}

/**
 * 检查文件类型是否在允许列表中。
 *
 * 匹配规则（按优先级）：
 *   1. '*' — 通配，允许所有
 *   2. 'image/*' — MIME 大类通配，需目标有 contentType
 *   3. 'image/png' — 精确 MIME 匹配
 *   4. '.jpg' / 'jpg' — 扩展名匹配（自动补 '.' 前缀）
 */
function isAllowedUploadFileType(options: {
    allowedFileTypes: string[]
    contentType?: string
    filename?: string
}) {
    if (options.allowedFileTypes.length === 0) {
        return true
    }

    const normalizedContentType = options.contentType?.split(';')[0]?.trim().toLowerCase()
    const normalizedExtension = path.extname(options.filename || '').toLowerCase()

    return options.allowedFileTypes.some((rule) => {
        if (rule === '*') {
            return true
        }

        if (rule.includes('/')) {
            if (!normalizedContentType) {
                return false
            }

            if (rule.endsWith('/*')) {
                return normalizedContentType.startsWith(rule.slice(0, -1))
            }

            return normalizedContentType === rule
        }

        if (!normalizedExtension) {
            return false
        }

        const normalizedRule = rule.startsWith('.') ? rule : `.${rule}`
        return normalizedExtension === normalizedRule
    })
}

/**
 * 校验上传载荷：文件大小、类型是否匹配、是否在允许类型白名单内。
 * 任一项不通过直接抛 HTTP 错误。
 */
export function validateUploadPayload(input: {
    type: UploadType
    size: number
    contentType?: string
    filename?: string
    settings: UploadSettings
}) {
    const { type, size, contentType, filename, settings } = input
    const { bytes, text } = resolveUploadSizeLimit(type, settings)

    if (size > bytes) {
        throw createError({ statusCode: 400, statusMessage: `文件大小超出 ${text} 限制` })
    }

    if (type === UploadType.IMAGE && !contentType?.startsWith('image/')) {
        throw createError({ statusCode: 400, statusMessage: '仅支持图片上传' })
    }

    if (type === UploadType.AUDIO && !contentType?.startsWith('audio/')) {
        throw createError({ statusCode: 400, statusMessage: '仅支持音频上传' })
    }

    const allowedFileTypes = parseAllowedFileTypes(settings)
    if (!isAllowedUploadFileType({
        allowedFileTypes,
        contentType,
        filename,
    })) {
        throw createError({ statusCode: 400, statusMessage: '文件类型不被允许' })
    }
}

/**
 * 构建对象存储路径：{bucketPrefix}{prefix}{secureFilename}
 *
 * 路径组件均经过 normalizePrefix 清洗，最终结果不含反斜杠或多余斜杠。
 */
export function buildUploadObjectKey(options: {
    prefix: string
    originalFilename: string
    bucketPrefix?: string
}) {
    const bucketPrefix = normalizePrefix(options.bucketPrefix)
    const prefix = normalizePrefix(options.prefix)
    const filename = buildUploadStoredFilename({
        originalFilename: options.originalFilename,
    })

    return `${bucketPrefix}${prefix}${filename}`
}

/**
 * 获取上传存储运行时上下文。
 *
 * 一次性解析所有存储相关设置，构造驱动环境对象。
 * baseEnv 承载跨存储通用配置（本地路径、Vercel Blob token），
 * 再覆盖补齐 S3/R2 兼容配置，确保不管哪种驱动都能从 env 拿到所需字段。
 */
export async function getUploadStorageContext(): Promise<UploadStorageContext> {
    const settings = await getSettings([...COMMON_UPLOAD_SETTING_KEYS]) as UploadSettings
    const rawStorageType = getSettingValue(settings, SettingKey.STORAGE_TYPE, 'local')
    const normalizedStorageType = normalizeStorageType(rawStorageType)
    const baseEnv: FileStorageEnv = {
        ...(process.env as any),
        STORAGE_TYPE: normalizedStorageType,
        LOCAL_STORAGE_DIR: getSettingValue(settings, SettingKey.LOCAL_STORAGE_DIR, 'public/uploads'),
        LOCAL_STORAGE_BASE_URL: getSettingValue(settings, SettingKey.LOCAL_STORAGE_BASE_URL, '/uploads'),
        LOCAL_STORAGE_MIN_FREE_SPACE: getNumericLimit(settings, SettingKey.LOCAL_STORAGE_MIN_FREE_SPACE, 100 * 1024 * 1024),
        VERCEL_BLOB_TOKEN: getSettingValue(settings, SettingKey.VERCEL_BLOB_TOKEN),
        BLOB_READ_WRITE_TOKEN: getSettingValue(settings, SettingKey.VERCEL_BLOB_TOKEN),
    }

    // baseEnv 承载跨存储通用配置，S3/R2 兼容配置再覆盖补齐。
    const env: FileStorageEnv = {
        ...baseEnv,
        ...buildS3CompatibleEnv(settings, rawStorageType),
    }

    return {
        rawStorageType,
        normalizedStorageType,
        bucketPrefix: getAssetObjectPrefix(settings),
        assetPublicBaseUrl: getSettingValue(settings, SettingKey.ASSET_PUBLIC_BASE_URL),
        driverBaseUrl: resolveUploadPublicBaseUrl(settings, rawStorageType, env),
        env,
        settings,
    }
}

/**
 * 检查并增加上传次数限制
 * @param userId 用户 ID
 */
export async function checkUploadLimits(userId: string) {
    const dbSettings = await getSettings([
        SettingKey.UPLOAD_LIMIT_WINDOW,
        SettingKey.UPLOAD_DAILY_LIMIT,
        SettingKey.UPLOAD_SINGLE_USER_DAILY_LIMIT,
    ])

    const limitWindow = normalizeDurationSeconds(
        dbSettings[SettingKey.UPLOAD_LIMIT_WINDOW],
        86400,
        { min: 1 },
    )
    const dailyLimit = Number(dbSettings[SettingKey.UPLOAD_DAILY_LIMIT] || 100)
    const userDailyLimit = Number(dbSettings[SettingKey.UPLOAD_SINGLE_USER_DAILY_LIMIT] || 5)

    // 采用同一窗口做全局+用户双闸门，优先拦截全站突发流量，再限制单用户滥用。
    const globalCount = await limiterStorage.increment(
        'upload_global_limit',
        limitWindow,
    )

    if (globalCount > dailyLimit) {
        throw createError({ statusCode: 429, statusMessage: '今日上传次数超出限制' })
    }

    const userCount = await limiterStorage.increment(
        `user_upload_limit:${userId}`,
        limitWindow,
    )

    if (userCount > userDailyLimit) {
        throw createError({ statusCode: 429, statusMessage: '您今日上传次数超出限制' })
    }
}

/**
 * 从 URL 上传文件
 */
export async function uploadFromUrl(url: string, prefix: string, userId: string, customFilename?: string): Promise<UploadedFile> {
    await checkUploadLimits(userId)
    const storageContext = await getUploadStorageContext()
    const { normalizedStorageType, env, bucketPrefix } = storageContext
    const storage = getFileStorage(normalizedStorageType, env)
    const response = await $fetch.raw(url, { responseType: 'arrayBuffer' })
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const extension = contentType.split('/')[1]?.split(';')[0] || 'bin'
    const buffer = Buffer.from(response._data as ArrayBuffer)

    const filename = buildUploadStoredFilename({
        basename: customFilename,
        extension,
    })
    validateUploadPayload({
        type: inferUploadTypeFromContentType(contentType),
        size: buffer.length,
        contentType,
        filename,
        settings: storageContext.settings,
    })
    const fullPath = `${bucketPrefix}${prefix}${filename}`.replace(/\\/g, '/')

    await storage.upload(buffer, fullPath, contentType)

    return {
        filename,
        url: resolveUploadedFileUrl(fullPath, storageContext),
        mimetype: contentType,
    }
}

/**
 * 从 Buffer 上传文件
 */
export async function uploadFromBuffer(buffer: Buffer, prefix: string, filename: string, mimetype: string, userId?: string): Promise<UploadedFile> {
    if (userId) {
        await checkUploadLimits(userId)
    }
    const storageContext = await getUploadStorageContext()
    const { normalizedStorageType, env, bucketPrefix } = storageContext
    const storage = getFileStorage(normalizedStorageType, env)
    const fullPath = `${bucketPrefix}${prefix}${filename}`.replace(/\\/g, '/')

    validateUploadPayload({
        type: inferUploadTypeFromContentType(mimetype),
        size: buffer.length,
        contentType: mimetype,
        filename,
        settings: storageContext.settings,
    })

    await storage.upload(buffer, fullPath, mimetype)

    return {
        filename,
        url: resolveUploadedFileUrl(fullPath, storageContext),
        mimetype,
    }
}

/**
 * 处理文件上传的核心逻辑
 */
export async function handleFileUploads(event: H3Event, options: UploadOptions): Promise<UploadedFile[]> {
    const { prefix, maxFiles = 10 } = options
    const type = options.type || (options.mustBeImage === false ? UploadType.FILE : UploadType.IMAGE)

    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    if (files.length > maxFiles) {
        throw createError({ statusCode: 400, statusMessage: `最多允许同时上传 ${maxFiles} 个文件` })
    }

    const storageContext = await getUploadStorageContext()
    const { normalizedStorageType, env, bucketPrefix, settings } = storageContext
    const storage = getFileStorage(normalizedStorageType, env)
    const uploadedFiles: UploadedFile[] = []

    for (const file of files) {
        // multipart/form-data 可能会包含非文件字段，简单检查是否有文件名
        if (!file.filename) {
            continue
        }

        validateUploadPayload({
            type,
            size: file.data.length,
            contentType: file.type,
            filename: file.filename,
            settings,
        })

        const newFilename = buildUploadObjectKey({
            bucketPrefix,
            prefix,
            originalFilename: file.filename,
        })

        // 执行上传
        await storage.upload(file.data, newFilename, file.type)

        uploadedFiles.push({
            filename: file.filename,
            url: resolveUploadedFileUrl(newFilename, storageContext),
            mimetype: file.type,
        })
    }

    if (uploadedFiles.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No valid files uploaded' })
    }

    return uploadedFiles
}
