import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { assertDemoSettingsWriteAllowed } from '@/server/api/admin/settings/index.put'
import { getSupportedEmailTemplateIds, isSupportedEmailTemplateId, previewEmailTemplate } from '@/server/services/email-template'

const previewSchema = z.object({
    templateId: z.enum(getSupportedEmailTemplateIds() as [string, ...string[]]),
    locale: z.string().trim().optional(),
    config: z.any().optional(),
})

export default defineEventHandler(async (event) => {
    assertDemoSettingsWriteAllowed(event.method || 'POST')
    await requireAdmin(event)

    const body = await readValidatedBody(event, (payload) => previewSchema.parse(payload))
    const templateId = body.templateId
    if (!isSupportedEmailTemplateId(templateId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Unsupported email template id',
        })
    }

    const preview = await previewEmailTemplate({
        templateId,
        locale: body.locale,
        config: body.config,
    })

    return success(preview)
})
