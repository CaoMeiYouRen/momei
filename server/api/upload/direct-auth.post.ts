import { z } from 'zod'
import { authorizeDirectUpload } from '@/server/services/direct-upload'
import { UploadType } from '@/server/services/upload'
import { requireAuth } from '@/server/utils/permission'
import { success } from '@/server/utils/response'

const DirectUploadRequestSchema = z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(255),
    size: z.number().int().positive(),
    type: z.enum(UploadType).optional(),
    prefix: z.string().max(255).optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const body = await readValidatedBody(event, DirectUploadRequestSchema.parse)

    const authorization = await authorizeDirectUpload({
        userId: session.user.id,
        ...body,
    })

    return success(authorization)
})
