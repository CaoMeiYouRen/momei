import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { setSettings } from '@/server/services/setting'

const settingsUpdateSchema = z.object({
    settings: z.record(z.string(), z.any()).optional(),
    reason: z.string().trim().max(255).optional(),
    source: z.string().trim().max(64).optional(),
}).passthrough()

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)

    const body = await readValidatedBody(event, (payload) => settingsUpdateSchema.parse(payload))
    const reservedKeys = new Set(['settings', 'reason', 'source'])
    const settingsPayload = body.settings && typeof body.settings === 'object'
        ? body.settings
        : Object.fromEntries(Object.entries(body).filter(([key]) => !reservedKeys.has(key)))

    await setSettings(settingsPayload, {
        operatorId: session.user.id,
        ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
        userAgent: getRequestHeader(event, 'user-agent') || null,
        reason: body.reason || 'system_settings_update',
        source: body.source || 'admin_ui',
    })

    return success(null)
})
