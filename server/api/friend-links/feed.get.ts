import { getFriendLinkFeeds } from '@/server/services/friend-link-feed'
import { success } from '@/server/utils/response'

export default defineEventHandler(async () => {
    const items = await getFriendLinkFeeds()
    return success(items)
})
