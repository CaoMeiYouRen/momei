import { friendLinkService } from '@/server/services/friend-link'
import { success } from '@/server/utils/response'
import { detectRequestAuthLocale, mapAuthLocaleToAppLocale } from '@/server/utils/locale'

export default defineEventHandler(async (event) => {
    // 公开页在客户端切换语言后会显式把 locale 透传给本接口，
    // 这里必须保留 query 覆盖入口，避免继续回退到旧 cookie 或 header 的语言状态。
    const requestedLocale = mapAuthLocaleToAppLocale(detectRequestAuthLocale(event, { includeQuery: true }))

    const [meta, categories] = await Promise.all([
        friendLinkService.getMeta(requestedLocale),
        friendLinkService.getCategories({ enabledOnly: true }),
    ])

    return success({
        ...meta,
        categories,
    })
})
