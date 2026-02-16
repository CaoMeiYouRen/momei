import { TTSService } from '@/server/services/tts'
import { success } from '@/server/utils/response'
import { requireAdmin } from '@/server/utils/permission'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const { provider: providerName, voice, post_id: postId } = query

    if (!voice || !postId) {
        throw createError({ statusCode: 400, message: 'Voice and post_id are required' })
    }

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOneBy({ id: postId as string })

    if (!post) {
        throw createError({ statusCode: 404, message: 'Post not found' })
    }

    const provider = await TTSService.getProvider(providerName as string)
    const cost = await provider.estimateCost(post.content, voice as string)

    return success({ cost })
})
