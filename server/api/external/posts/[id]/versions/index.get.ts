import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { getPostVersionsService, type PostVersionActor } from '@/server/services/post-version'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const postId = getRequiredRouterParam(event, 'id')

    const actor: PostVersionActor = {
        currentUserId: user.id,
        isAdmin: isAdmin(user.role),
    }

    const versions = await getPostVersionsService(postId, actor)

    return {
        code: 200,
        data: {
            items: versions,
            total: versions.length,
        },
    }
})
