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

    const file = files[0]
    if (!file) {
        throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }
    if (!file.filename) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid file' })
    }

    // Validate file type (allow only images)
    if (!file.type || !file.type.startsWith('image/')) {
        throw createError({ statusCode: 400, statusMessage: 'Only image files are allowed' })
    }

    if (file.data.length > MAX_UPLOAD_SIZE) {
        throw createError({ statusCode: 400, statusMessage: `文件大小超出 ${MAX_UPLOAD_SIZE_TEXT} 限制` })
    }

    const storage = getFileStorage(STORAGE_TYPE, process.env as unknown as FileStorageEnv)

    const timestamp = dayjs().format('YYYYMMDDHHmmssSSS')
    const random = Math.random().toString(36).slice(2, 9)
    const ext = path.extname(file.filename)
    const newFilename = `${BUCKET_PREFIX}avatars/${session.user.id}/${timestamp}-${random}${ext}`

    const { url } = await storage.upload(file.data, newFilename, file.type)

    // Update user avatar
    await auth.api.updateUser({
        headers: event.headers,
        body: {
            image: url,
        },
    })

    return {
        code: 200,
        data: {
            url,
        },
    }
})
