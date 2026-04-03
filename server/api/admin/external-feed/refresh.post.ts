import { refreshExternalFeedCaches } from '@/server/services/external-feed/aggregator'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const data = await refreshExternalFeedCaches()

    return success(data)
})
