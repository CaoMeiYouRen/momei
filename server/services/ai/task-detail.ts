import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { User } from '@/server/entities/user'
import type { AIAdminTaskListItem } from '@/types/ai'
import { toNumber } from '@/utils/shared/coerce'

export function createAIAdminTaskReadModelQuery() {
    return dataSource.getRepository(AITask)
        .createQueryBuilder('task')
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
}

export function normalizeAIAdminTaskListItem(item: Record<string, unknown>): AIAdminTaskListItem {
    return {
        ...item,
        estimatedCost: toNumber(item.estimatedCost),
        actualCost: toNumber(item.actualCost),
        estimatedQuotaUnits: toNumber(item.estimatedQuotaUnits),
        quotaUnits: toNumber(item.quotaUnits),
        durationMs: toNumber(item.durationMs),
        audioDuration: toNumber(item.audioDuration),
        audioSize: toNumber(item.audioSize),
        textLength: toNumber(item.textLength),
    } as AIAdminTaskListItem
}

export async function getAITaskDetail(taskId: string, userId: string, options: { isAdmin?: boolean } = {}) {
    const queryBuilder = createAIAdminTaskReadModelQuery()
        .where('task.id = :taskId', { taskId })

    if (!options.isAdmin) {
        queryBuilder.andWhere('task.userId = :userId', { userId })
    }

    const item = await queryBuilder.getRawOne<Record<string, unknown> | null>()

    if (!item) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Task not found',
        })
    }

    return normalizeAIAdminTaskListItem(item)
}
