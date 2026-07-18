import { authorizeDirectUpload } from '@/server/services/direct-upload'
import { UploadType } from '@/server/services/upload'
import { success } from '@/server/utils/response'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { directUploadRequestSchema } from '@/utils/schemas/upload'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const body = await readValidatedBody(event, (payload) => directUploadRequestSchema.parse(payload))

    const authorization = await authorizeDirectUpload({
        userId: user.id,
        ...body,
        type: body.type as UploadType | undefined,
    })

    return success(authorization)
})
