import { In } from 'typeorm'
import { dataSource } from '~/server/database'
import { AITask } from '~/server/entities/ai-task'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const ids = (query.ids as string)?.split(',')

    if (!ids || ids.length === 0) {
        throw createError({
            statusCode: 400,
            message: 'No task IDs provided',
        })
    }

    const repo = dataSource.getRepository(AITask)
    await repo.delete({ id: In(ids) })

    return { success: true }
})
