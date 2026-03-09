import { friendLinkService } from '@/server/services/friend-link'
import { success } from '@/server/utils/response'

export default defineEventHandler(async () => {
    const [meta, categories] = await Promise.all([
        friendLinkService.getMeta(),
        friendLinkService.getCategories({ enabledOnly: true }),
    ])

    return success({
        ...meta,
        categories,
    })
})
