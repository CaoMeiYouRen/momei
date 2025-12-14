import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/shared/public-paths'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    // 白名单路径
    if (publicPaths.some((path) => event.path.startsWith(path))) {
        // TODO: Implement whitelist logic
    }

})
