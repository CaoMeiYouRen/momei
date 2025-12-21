import path from 'path'
import dayjs from 'dayjs'
import { auth } from '@/lib/auth'
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
} from '@/utils/shared/env'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const globalCount = await limiterStorage.increment(
        'upload_global_limit',
        UPLOAD_LIMIT_WINDOW,
    )

    if (globalCount > UPLOAD_DAILY_LIMIT) {
        throw createError({ statusCode: 429, statusMessage: '今日上传次数超出限制' })
    }

    const userCount = await limiterStorage.increment(
        `user_upload_limit:${session.user.id}`,
        UPLOAD_LIMIT_WINDOW,
    )

    if (userCount > UPLOAD_SINGLE_USER_DAILY_LIMIT) {
        throw createError({ statusCode: 429, statusMessage: '您今日上传次数超出限制' })
    }

    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const uploadedFiles: { filename: string, url: string, mimetype: string | undefined }[] = []
    const storage = getFileStorage(STORAGE_TYPE, process.env as unknown as FileStorageEnv)

    for (const file of files) {
        if (!file.filename) {
            continue
        }

        if (file.data.length > MAX_UPLOAD_SIZE) {
            throw createError({ statusCode: 400, statusMessage: `文件大小超出 ${MAX_UPLOAD_SIZE_TEXT} 限制` })
        }

        const timestamp = dayjs().format('YYYYMMDDHHmmssSSS') // 时间戳
        const random = Math.random().toString(36).slice(2, 9) // 随机字符串，避免文件名冲突
        const ext = path.extname(file.filename) // 文件扩展名
        const newFilename = `${BUCKET_PREFIX}${timestamp}-${random}${ext}`

        const { url } = await storage.upload(file.data, newFilename, file.type)

        uploadedFiles.push({
            filename: file.filename,
            url,
            mimetype: file.type,
        })
    }

    return {
        code: 200,
        data: uploadedFiles,
    }
})
