import { z } from 'zod'
import { ContentAuditService } from '@/server/services/ai/content-audit'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'
import { isAdmin } from '@/utils/shared/roles'
import { resolveAppLocaleCode } from '@/i18n/config/locale-registry'

const bodySchema = z.object({
    force: z.boolean().optional().default(false),
    locale: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const id = getRequiredRouterParam(event, 'id')
    const body = await readBody(event)
    const { force, locale } = bodySchema.parse(body || {})
    const resolvedLocale = resolveAppLocaleCode(locale)

    const result = await ContentAuditService.audit(id, session.user.id, {
        force,
        isAdmin: isAdmin(session.user.role),
        uiLocale: resolvedLocale,
    })
    return success(result)
})
