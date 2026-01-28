import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { setSettings } from '@/server/services/setting'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readBody(event)

    if (!body || typeof body !== 'object') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid body',
        })
    }

    await setSettings(body)

    return success(null)
})
