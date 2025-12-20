import path from 'path'
import dayjs from 'dayjs'
import { auth } from '@/lib/auth'
import { getFileStorage, type FileStorageEnv } from '@/server/utils/storage/factory'
import { BUCKET_PREFIX } from '@/utils/shared/env'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const file = files[0]
    if (!file.filename) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid file' })
    }

    // Validate file type (allow only images)
    if (!file.type || !file.type.startsWith('image/')) {
        throw createError({ statusCode: 400, statusMessage: 'Only image files are allowed' })
    }

    const storageType = process.env.STORAGE_TYPE || 's3'
    const storage = getFileStorage(storageType, process.env as unknown as FileStorageEnv)

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
