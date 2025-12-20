import { randomUUID } from 'crypto'
import path from 'path'
import { auth } from '@/lib/auth'
import { getFileStorage, type FileStorageEnv } from '@/server/utils/storage/factory'

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

    const uploadedFiles = []
    const storageType = process.env.STORAGE_TYPE || 's3' // Default to s3 if not set, or could be 'vercel-blob'
    const storage = getFileStorage(storageType, process.env as unknown as FileStorageEnv)

    for (const file of files) {
        if (!file.filename) {
            continue
        }

        const ext = path.extname(file.filename)
        const newFilename = `${randomUUID()}${ext}`

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
