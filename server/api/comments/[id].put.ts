import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { requireAdmin } from '@/server/utils/permission'
import { assignDefined } from '@/server/utils/object'

const commentPatchSchema = z.object({
    status: z.enum(['pending', 'published', 'spam']).optional(),
    isSticked: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readValidatedBody(event, (payload) => commentPatchSchema.parse(payload))

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID required' })
    }

    await requireAdmin(event)

    const commentRepo = dataSource.getRepository(Comment)
    const comment = await commentRepo.findOne({ where: { id } })

    if (!comment) {
        throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
    }

    assignDefined(comment, body, ['status', 'isSticked'])

    await commentRepo.save(comment)

    return {
        code: 200,
        data: comment,
    }
})
