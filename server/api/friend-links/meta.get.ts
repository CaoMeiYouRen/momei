import { friendLinkService } from '@/server/services/friend-link'
import { success } from '@/server/utils/response'
import { detectRequestAuthLocale, mapAuthLocaleToAppLocale } from '@/server/utils/locale'

export default defineEventHandler(async (event) => {
    const requestedLocale = mapAuthLocaleToAppLocale(detectRequestAuthLocale(event))

    const [meta, categories] = await Promise.all([
        friendLinkService.getMeta(requestedLocale),
        friendLinkService.getCategories({ enabledOnly: true }),
    ])

    return success({
        ...meta,
        categories,
    })
})
