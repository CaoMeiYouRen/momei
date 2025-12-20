import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import { auth } from '@/lib/auth'

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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.ensureDir(uploadDir)

    for (const file of files) {
        if (!file.filename) { continue }

        const ext = path.extname(file.filename)
        const newFilename = `${randomUUID()}${ext}`
        const filePath = path.join(uploadDir, newFilename)

        await fs.writeFile(filePath, file.data)

        uploadedFiles.push({
            filename: file.filename,
            url: `/uploads/${newFilename}`,
            mimetype: file.type,
        })
    }

    return {
        code: 200,
        data: uploadedFiles,
    }
})
