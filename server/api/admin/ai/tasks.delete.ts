import { In } from 'typeorm'
import { dataSource } from '~/server/database'
import { AITask } from '~/server/entities/ai-task'
import { requireAdmin } from '@/server/utils/permission'
import { aiAdminTaskDeleteQuerySchema } from '@/utils/schemas/ai'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const { ids } = await getValidatedQuery(event, (query) => aiAdminTaskDeleteQuerySchema.parse(query))

    const repo = dataSource.getRepository(AITask)
    await repo.delete({ id: In(ids) })

    return { success: true }
})
