import path from 'node:path'
import dayjs from 'dayjs'
import { type H3Event, readMultipartFormData } from 'h3'
import { getFileStorage, type FileStorageEnv } from '@/server/utils/storage/factory'
import { limiterStorage } from '@/server/database/storage'
import {
    BUCKET_PREFIX,
    MAX_UPLOAD_SIZE,
    MAX_UPLOAD_SIZE_TEXT,
    UPLOAD_LIMIT_WINDOW,
    UPLOAD_DAILY_LIMIT,
    UPLOAD_SINGLE_USER_DAILY_LIMIT,
    STORAGE_TYPE,
    LOCAL_STORAGE_DIR,
    LOCAL_STORAGE_BASE_URL,
    LOCAL_STORAGE_MIN_FREE_SPACE,
    MAX_AUDIO_UPLOAD_SIZE,
    MAX_AUDIO_UPLOAD_SIZE_TEXT,
} from '@/utils/shared/env'

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
    const globalCount = await limiterStorage.increment(
        'upload_global_limit',
        UPLOAD_LIMIT_WINDOW,
    )

    if (globalCount > UPLOAD_DAILY_LIMIT) {
        throw createError({ statusCode: 429, statusMessage: '今日上传次数超出限制' })
    }

    const userCount = await limiterStorage.increment(
        `user_upload_limit:${userId}`,
        UPLOAD_LIMIT_WINDOW,
    )

    if (userCount > UPLOAD_SINGLE_USER_DAILY_LIMIT) {
        throw createError({ statusCode: 429, statusMessage: '您今日上传次数超出限制' })
    }
}

/**
 * 处理文件上传的核心逻辑
 * @param event H3 事件
 * @param options 上传配置
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

    const storage = getFileStorage(STORAGE_TYPE, {
        ...process.env,
        LOCAL_STORAGE_DIR,
        LOCAL_STORAGE_BASE_URL,
        LOCAL_STORAGE_MIN_FREE_SPACE,
    } as unknown as FileStorageEnv)
    const uploadedFiles: UploadedFile[] = []

    for (const file of files) {
        // multipart/form-data 可能会包含非文件字段，简单检查是否有文件名
        if (!file.filename) {
            continue
        }

        // 校验文件大小和类型
        let maxSize = MAX_UPLOAD_SIZE
        let maxSizeText = MAX_UPLOAD_SIZE_TEXT

        if (type === UploadType.AUDIO) {
            maxSize = MAX_AUDIO_UPLOAD_SIZE
            maxSizeText = MAX_AUDIO_UPLOAD_SIZE_TEXT
        }

        if (file.data.length > maxSize) {
            throw createError({ statusCode: 400, statusMessage: `文件大小超出 ${maxSizeText} 限制` })
        }

        // 校验文件类型
        if (type === UploadType.IMAGE && (!file.type || !file.type.startsWith('image/'))) {
            throw createError({ statusCode: 400, statusMessage: '仅支持图片上传' })
        }

        if (type === UploadType.AUDIO && (!file.type || !file.type.startsWith('audio/'))) {
            throw createError({ statusCode: 400, statusMessage: '仅支持音频上传' })
        }

        // 生成新文件名
        const timestamp = dayjs().format('YYYYMMDDHHmmssSSS')
        const random = Math.random().toString(36).slice(2, 9)
        const ext = path.extname(file.filename)
        const newFilename = `${BUCKET_PREFIX}${prefix}${timestamp}-${random}${ext}`

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
