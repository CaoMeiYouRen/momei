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
export async function uploadFromUrl(url: string, prefix: string, userId: string): Promise<UploadedFile> {
    await checkUploadLimits(userId)

    const dbSettings = await getSettings([
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
        SettingKey.MAX_UPLOAD_SIZE,
        SettingKey.VERCEL_BLOB_TOKEN,
        SettingKey.CLOUDFLARE_R2_ACCOUNT_ID,
        SettingKey.CLOUDFLARE_R2_ACCESS_KEY,
        SettingKey.CLOUDFLARE_R2_SECRET_KEY,
        SettingKey.CLOUDFLARE_R2_BUCKET,
        SettingKey.CLOUDFLARE_R2_BASE_URL,
    ])

    const storageType = (dbSettings[SettingKey.STORAGE_TYPE] as string) || 'local'

    const env: FileStorageEnv = {
        ...(process.env as any),
        LOCAL_STORAGE_DIR: String(dbSettings[SettingKey.LOCAL_STORAGE_DIR] || 'public/uploads'),
        LOCAL_STORAGE_BASE_URL: String(dbSettings[SettingKey.LOCAL_STORAGE_BASE_URL] || '/uploads'),
        LOCAL_STORAGE_MIN_FREE_SPACE: Number(dbSettings[SettingKey.LOCAL_STORAGE_MIN_FREE_SPACE] || 100 * 1024 * 1024),
        S3_ENDPOINT: String(dbSettings[SettingKey.S3_ENDPOINT] || ''),
        S3_BUCKET_NAME: String(dbSettings[SettingKey.S3_BUCKET] || ''),
        S3_REGION: String(dbSettings[SettingKey.S3_REGION] || ''),
        S3_ACCESS_KEY_ID: String(dbSettings[SettingKey.S3_ACCESS_KEY] || ''),
        S3_SECRET_ACCESS_KEY: String(dbSettings[SettingKey.S3_SECRET_KEY] || ''),
        S3_BASE_URL: String(dbSettings[SettingKey.S3_BASE_URL] || ''),
        VERCEL_BLOB_TOKEN: String(dbSettings[SettingKey.VERCEL_BLOB_TOKEN] || ''),
        BLOB_READ_WRITE_TOKEN: String(dbSettings[SettingKey.VERCEL_BLOB_TOKEN] || ''),
    }

    const storage = getFileStorage(storageType, env)
    const response = await $fetch.raw(url, { responseType: 'arrayBuffer' })
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const extension = contentType.split('/')[1]?.split(';')[0] || 'bin'
    const filename = `${crypto.randomUUID()}.${extension}`
    const fullPath = path.join(prefix, filename).replace(/\\/g, '/')

    const buffer = Buffer.from(response._data as ArrayBuffer)
    const uploadResult = await storage.upload(buffer, fullPath, contentType)

    return {
        filename,
        url: uploadResult.url,
        mimetype: contentType,
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

    // 加载存储配置
    const dbSettings = await getSettings([
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
        SettingKey.MAX_UPLOAD_SIZE,
        SettingKey.MAX_AUDIO_UPLOAD_SIZE,
    ])

    const storageType = (dbSettings[SettingKey.STORAGE_TYPE] as any) || 'local'
    const storageConfig: FileStorageEnv = {
        ...(process.env as any),
        STORAGE_TYPE: storageType,
        LOCAL_STORAGE_DIR: String(dbSettings[SettingKey.LOCAL_STORAGE_DIR] || ''),
        LOCAL_STORAGE_BASE_URL: String(dbSettings[SettingKey.LOCAL_STORAGE_BASE_URL] || ''),
        LOCAL_STORAGE_MIN_FREE_SPACE: Number(dbSettings[SettingKey.LOCAL_STORAGE_MIN_FREE_SPACE] || 100 * 1024 * 1024),
        S3_ENDPOINT: String(dbSettings[SettingKey.S3_ENDPOINT] || ''),
        S3_BUCKET: String(dbSettings[SettingKey.S3_BUCKET] || ''),
        S3_REGION: String(dbSettings[SettingKey.S3_REGION] || ''),
        S3_ACCESS_KEY: String(dbSettings[SettingKey.S3_ACCESS_KEY] || ''),
        S3_SECRET_KEY: String(dbSettings[SettingKey.S3_SECRET_KEY] || ''),
        S3_BASE_URL: String(dbSettings[SettingKey.S3_BASE_URL] || ''),
    }

    const bucketPrefix = String(dbSettings[SettingKey.S3_BUCKET_PREFIX] || '')

    const storage = getFileStorage(storageType, storageConfig)
    const uploadedFiles: UploadedFile[] = []

    const maxFileSize = Number(dbSettings[SettingKey.MAX_UPLOAD_SIZE] || 10) * 1024 * 1024
    const maxAudioSize = Number(dbSettings[SettingKey.MAX_AUDIO_UPLOAD_SIZE] || 20) * 1024 * 1024

    for (const file of files) {
        // multipart/form-data 可能会包含非文件字段，简单检查是否有文件名
        if (!file.filename) {
            continue
        }

        // 校验文件大小和类型
        let maxSize = maxFileSize
        let maxSizeText = `${dbSettings[SettingKey.MAX_UPLOAD_SIZE] || 10}MB`

        if (type === UploadType.AUDIO) {
            maxSize = maxAudioSize
            maxSizeText = `${dbSettings[SettingKey.MAX_AUDIO_UPLOAD_SIZE] || 20}MB`
        }

        if (file.data.length > maxSize) {
            throw createError({ statusCode: 400, statusMessage: `文件大小超出 ${maxSizeText} 限制` })
        }

        // 校验文件类型
        if (type === UploadType.IMAGE && (!file.type?.startsWith('image/'))) {
            throw createError({ statusCode: 400, statusMessage: '仅支持图片上传' })
        }

        if (type === UploadType.AUDIO && (!file.type?.startsWith('audio/'))) {
            throw createError({ statusCode: 400, statusMessage: '仅支持音频上传' })
        }

        // 生成新文件名
        const timestamp = dayjs().format('YYYYMMDDHHmmssSSS')
        const random = Math.random().toString(36).slice(2, 9)
        const ext = path.extname(file.filename)
        const newFilename = `${bucketPrefix}${prefix}${timestamp}-${random}${ext}`

        // 执行上传
        const { url } = await storage.upload(file.data, newFilename, file.type)

        uploadedFiles.push({
            filename: file.filename,
            url,
            mimetype: file.type,
        })
    }

    if (uploadedFiles.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No valid files uploaded' })
    }

    return uploadedFiles
}
