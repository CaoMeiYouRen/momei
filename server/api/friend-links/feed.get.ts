import { getFriendLinkFeeds } from '@/server/services/friend-link-feed'
import { rateLimit } from '@/server/utils/rate-limit'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 30 })
    const items = await getFriendLinkFeeds()
    return success(items)
})
