import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { aiAgreementDraftSchema } from '@/utils/schemas/ai'
import { generateAgreementTranslationDraft } from '@/server/services/ai/admin-drafts'
import { assertDemoSettingsWriteAllowed } from '@/server/api/admin/settings/index.put'

export default defineEventHandler(async (event) => {
    assertDemoSettingsWriteAllowed(event.method || 'POST')
    const session = await requireAdmin(event)
    const body = await readValidatedBody(event, (payload) => aiAgreementDraftSchema.parse(payload))

    const agreement = await generateAgreementTranslationDraft({
        type: body.type,
        sourceAgreementId: body.sourceAgreementId,
        targetLanguage: body.targetLanguage,
        version: body.version ?? null,
        versionDescription: body.versionDescription ?? null,
        userId: session.user.id,
    })

    return success(agreement)
})
