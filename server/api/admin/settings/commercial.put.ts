import { setSetting } from '@/server/services/setting'
import { requireAdmin } from '@/server/utils/permission'
import { SettingKey } from '@/types/setting'
import { CommercialConfigSchema } from '~/utils/shared/commercial-schema'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => CommercialConfigSchema.parse(b))

    await setSetting(
        SettingKey.COMMERCIAL_SPONSORSHIP,
        JSON.stringify(body),
        {
            description: 'Global commercial and sponsorship configuration',
            level: 1,
        },
        {
            operatorId: session.user.id,
            ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
            userAgent: getRequestHeader(event, 'user-agent') || null,
            reason: 'commercial_settings_update',
            source: 'commercial_settings',
        },
    )

    return {
        code: 200,
        message: 'Commercial settings updated',
    }
})
