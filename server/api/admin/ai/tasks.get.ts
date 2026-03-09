import { Brackets } from 'typeorm'
import { dataSource } from '~/server/database'
import { AITask } from '~/server/entities/ai-task'
import { User } from '~/server/entities/user'
import { getAICostDisplayConfig } from '@/server/services/ai/cost-display'
import { toNumber } from '@/utils/shared/coerce'

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

    const repo = dataSource.getRepository(AITask)
    const qb = repo.createQueryBuilder('task')
        .leftJoin(User, 'user', 'task.userId = user.id')
        .select('task.id', 'id')
        .addSelect('task.category', 'category')
        .addSelect('task.type', 'type')
        .addSelect('task.status', 'status')
        .addSelect('task.provider', 'provider')
        .addSelect('task.model', 'model')
        .addSelect('task.estimatedCost', 'estimatedCost')
        .addSelect('task.actualCost', 'actualCost')
        .addSelect('task.estimatedQuotaUnits', 'estimatedQuotaUnits')
        .addSelect('task.quotaUnits', 'quotaUnits')
        .addSelect('task.chargeStatus', 'chargeStatus')
        .addSelect('task.failureStage', 'failureStage')
        .addSelect('task.durationMs', 'durationMs')
        .addSelect('task.usageSnapshot', 'usageSnapshot')
        .addSelect('task.createdAt', 'createdAt')
        .addSelect('task.startedAt', 'startedAt')
        .addSelect('task.completedAt', 'completedAt')
        .addSelect('task.userId', 'userId')
        .addSelect('task.payload', 'payload')
        .addSelect('task.result', 'result')
        .addSelect('task.error', 'error')
        .addSelect('task.audioDuration', 'audioDuration')
        .addSelect('task.audioSize', 'audioSize')
        .addSelect('task.textLength', 'textLength')
        .addSelect('task.language', 'language')
        .addSelect('user.name', 'user_name')
        .addSelect('user.email', 'user_email')
        .addSelect('user.image', 'user_image')
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
        items: rawData.map((item) => ({
            ...item,
            estimatedCost: toNumber(item.estimatedCost),
            actualCost: toNumber(item.actualCost),
            estimatedQuotaUnits: toNumber(item.estimatedQuotaUnits),
            quotaUnits: toNumber(item.quotaUnits),
            durationMs: toNumber(item.durationMs),
            audioDuration: toNumber(item.audioDuration),
            audioSize: toNumber(item.audioSize),
            textLength: toNumber(item.textLength),
        })),
        total,
        costDisplay,
    }
})
