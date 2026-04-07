import { getRequiredRouterParam } from '@/server/utils/router'
import { readPostDetail } from '@/server/utils/post-detail-read'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')
    return readPostDetail(event, { id })
})
