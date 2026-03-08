import path from 'node:path'
import crypto from 'node:crypto'
import dayjs from 'dayjs'
import { type H3Event, readMultipartFormData } from 'h3'
import { getFileStorage, type FileStorageEnv } from '@/server/utils/storage/factory'
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

export interface UploadOptions {
    /** 文件路径前缀，例如 'file/' 或 'avatars/1/' */
    prefix: string
    /** 最大文件数量限制 */
    maxFiles?: number
    /** 上传类型，默认为 IMAGE */
    type?: UploadType
    /** 是否必须是图片，默认为 true (兼容旧代码，建议使用 type) */
    mustBeImage?: boolean
}

export interface UploadedFile {
    filename: string
    url: string
    mimetype: string | undefined
}

export type UploadSettings = Partial<Record<SettingKey, string | null | undefined>>

export interface UploadStorageContext {
    rawStorageType: string
    normalizedStorageType: string
    bucketPrefix: string
    assetPublicBaseUrl: string
    driverBaseUrl: string
    env: FileStorageEnv
    settings: UploadSettings
}

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
] as const

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

function getSettingValue(settings: UploadSettings, key: SettingKey, fallback = '') {
    return String(settings[key] || fallback)
}

function getNumericLimit(settings: UploadSettings, key: SettingKey, fallback: number) {
    const value = Number(settings[key])
    return Number.isFinite(value) ? value : fallback
}

function getAssetObjectPrefix(settings: UploadSettings) {
    return normalizePrefix(
        getSettingValue(settings, SettingKey.ASSET_OBJECT_PREFIX)
        || getSettingValue(settings, SettingKey.S3_BUCKET_PREFIX),
    )
}

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

    if (rawStorageType === 'vercel_blob') {
        return getSettingValue(settings, SettingKey.ASSET_PUBLIC_BASE_URL)
    }

    return env.S3_BASE_URL || ''
}

export function resolveUploadedFileUrl(objectKey: string, storageContext: Pick<UploadStorageContext, 'assetPublicBaseUrl' | 'driverBaseUrl'>) {
    const candidateBaseUrl = storageContext.assetPublicBaseUrl || storageContext.driverBaseUrl
    if (!candidateBaseUrl) {
        return objectKey
    }

    if (candidateBaseUrl.startsWith('http')) {
        const normalizedBaseUrl = candidateBaseUrl.endsWith('/') ? candidateBaseUrl : `${candidateBaseUrl}/`
        return new URL(objectKey, normalizedBaseUrl).toString()
    }

    const normalizedBaseUrl = candidateBaseUrl.endsWith('/') ? candidateBaseUrl : `${candidateBaseUrl}/`
    return `${normalizedBaseUrl}${objectKey}`.replace(/\/+/g, '/').replace(':/', '://')
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

export function normalizeStorageType(storageType?: string | null) {
    const rawStorageType = (storageType || 'local').trim()

    switch (rawStorageType) {
        case 'r2':
            return 's3'
        case 'vercel_blob':
            return 'vercel-blob'
        case 's3':
        case 'vercel-blob':
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

    return type === UploadType.AUDIO ? 'audios/' : 'file/'
}

export function resolveUploadSizeLimit(type: UploadType, settings: UploadSettings) {
    if (type === UploadType.AUDIO) {
        const configuredLimit = getNumericLimit(settings, SettingKey.MAX_AUDIO_UPLOAD_SIZE, 20)
        return {
            bytes: configuredLimit * 1024 * 1024,
            text: `${configuredLimit}MB`,
        }
    }

    const configuredLimit = getNumericLimit(settings, SettingKey.MAX_UPLOAD_SIZE, 10)
    return {
        bytes: configuredLimit * 1024 * 1024,
        text: `${configuredLimit}MB`,
    }
}

export function validateUploadPayload(input: {
    type: UploadType
    size: number
    contentType?: string
    settings: UploadSettings
}) {
    const { type, size, contentType, settings } = input
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
}

export function buildUploadObjectKey(options: {
    prefix: string
    originalFilename: string
    bucketPrefix?: string
}) {
    const timestamp = dayjs().format('YYYYMMDDHHmmssSSS')
    const random = Math.random().toString(36).slice(2, 9)
    const ext = path.extname(options.originalFilename)
    const bucketPrefix = normalizePrefix(options.bucketPrefix)
    const prefix = normalizePrefix(options.prefix)

    return `${bucketPrefix}${prefix}${timestamp}-${random}${ext}`
}

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

    const limitWindow = Number(dbSettings[SettingKey.UPLOAD_LIMIT_WINDOW] || 86400)
    const dailyLimit = Number(dbSettings[SettingKey.UPLOAD_DAILY_LIMIT] || 100)
    const userDailyLimit = Number(dbSettings[SettingKey.UPLOAD_SINGLE_USER_DAILY_LIMIT] || 5)

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

    const nameWithoutExt = customFilename || crypto.randomUUID()
    const filename = nameWithoutExt.includes('.') ? nameWithoutExt : `${nameWithoutExt}.${extension}`
    const fullPath = `${bucketPrefix}${prefix}${filename}`.replace(/\\/g, '/')

    const buffer = Buffer.from(response._data as ArrayBuffer)
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
