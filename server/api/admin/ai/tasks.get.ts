import { Brackets } from 'typeorm'
import { getAICostDisplayConfig } from '@/server/services/ai/cost-display'
import { createAIAdminTaskReadModelQuery, normalizeAIAdminTaskListItem } from '@/server/services/ai/task-detail'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 10
    const type = query.type as string
    const category = query.category as string
    const status = query.status as string
    const chargeStatus = query.chargeStatus as string
    const failureStage = query.failureStage as string
    const search = (query.search as string)?.trim()

    const qb = createAIAdminTaskReadModelQuery()
        .orderBy('task.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)

    if (type) {
        qb.andWhere('task.type = :type', { type })
    }

    if (category) {
        qb.andWhere('task.category = :category', { category })
    }

    if (status) {
        qb.andWhere('task.status = :status', { status })
    }

    if (chargeStatus) {
        qb.andWhere('task.chargeStatus = :chargeStatus', { chargeStatus })
    }

    if (failureStage) {
        qb.andWhere('task.failureStage = :failureStage', { failureStage })
    }

    if (search) {
        qb.andWhere(new Brackets((subQb) => {
            subQb.where('LOWER(task.type) LIKE LOWER(:search)', { search: `%${search}%` })
                .orWhere('LOWER(task.provider) LIKE LOWER(:search)', { search: `%${search}%` })
                .orWhere('LOWER(task.model) LIKE LOWER(:search)', { search: `%${search}%` })
                .orWhere('LOWER(user.name) LIKE LOWER(:search)', { search: `%${search}%` })
                .orWhere('LOWER(user.email) LIKE LOWER(:search)', { search: `%${search}%` })
        }))
    }

    const total = await qb.getCount()
    const rawData = await qb.getRawMany()
    const costDisplay = await getAICostDisplayConfig()

    return {
        items: rawData.map((item) => normalizeAIAdminTaskListItem(item)),
        total,
        costDisplay,
    }
})
