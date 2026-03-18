import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { aiLocalizedSettingDraftSchema } from '@/utils/schemas/ai'
import { generateLocalizedSettingDraft } from '@/server/services/ai/admin-drafts'
import { assertDemoSettingsWriteAllowed } from '@/server/api/admin/settings/index.put'

export default defineEventHandler(async (event) => {
    assertDemoSettingsWriteAllowed(event.method || 'POST')
    const session = await requireAdmin(event)
    const body = await readValidatedBody(event, (payload) => aiLocalizedSettingDraftSchema.parse(payload))

    const result = await generateLocalizedSettingDraft({
        key: body.key,
        targetLocale: body.targetLocale,
        sourceLocale: body.sourceLocale,
        value: body.value,
        userId: session.user.id,
    })

    return success(result)
})
