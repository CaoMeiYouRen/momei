import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { User } from '@/server/entities/user'
import type { AIAdminTaskDetailItem, AIAdminTaskListItem } from '@/types/ai'
import { toNumber } from '@/utils/shared/coerce'

function readStringField(value: unknown) {
    return typeof value === 'string' ? value : ''
}

function createAIAdminTaskBaseReadModelQuery() {
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
        .addSelect('task.createdAt', 'createdAt')
        .addSelect('task.startedAt', 'startedAt')
        .addSelect('task.completedAt', 'completedAt')
        .addSelect('task.userId', 'userId')
        .addSelect('user.name', 'user_name')
        .addSelect('user.email', 'user_email')
        .addSelect('user.image', 'user_image')
}

export function createAIAdminTaskListReadModelQuery() {
    return createAIAdminTaskBaseReadModelQuery()
}

export function createAIAdminTaskDetailReadModelQuery() {
    return createAIAdminTaskBaseReadModelQuery()
        .addSelect('task.usageSnapshot', 'usageSnapshot')
        .addSelect('task.payload', 'payload')
        .addSelect('task.result', 'result')
        .addSelect('task.error', 'error')
        .addSelect('task.audioDuration', 'audioDuration')
        .addSelect('task.audioSize', 'audioSize')
        .addSelect('task.textLength', 'textLength')
        .addSelect('task.language', 'language')
}

export function normalizeAIAdminTaskListItem(item: Record<string, unknown>): AIAdminTaskListItem {
    return {
        id: readStringField(item.id),
        category: (item.category as AIAdminTaskListItem['category']) ?? null,
        type: item.type as AIAdminTaskListItem['type'],
        status: item.status as AIAdminTaskListItem['status'],
        provider: (item.provider as string | null) ?? null,
        model: (item.model as string | null) ?? null,
        estimatedCost: toNumber(item.estimatedCost),
        actualCost: toNumber(item.actualCost),
        estimatedQuotaUnits: toNumber(item.estimatedQuotaUnits),
        quotaUnits: toNumber(item.quotaUnits),
        chargeStatus: (item.chargeStatus as AIAdminTaskListItem['chargeStatus']) ?? null,
        failureStage: (item.failureStage as AIAdminTaskListItem['failureStage']) ?? null,
        durationMs: toNumber(item.durationMs),
        createdAt: item.createdAt as AIAdminTaskListItem['createdAt'],
        startedAt: (item.startedAt as AIAdminTaskListItem['startedAt']) ?? null,
        completedAt: (item.completedAt as AIAdminTaskListItem['completedAt']) ?? null,
        userId: readStringField(item.userId),
        user_name: (item.user_name as string | null) ?? null,
        user_email: (item.user_email as string | null) ?? null,
        user_image: (item.user_image as string | null) ?? null,
    }
}

export function normalizeAIAdminTaskDetailItem(item: Record<string, unknown>): AIAdminTaskDetailItem {
    const summary = normalizeAIAdminTaskListItem(item)

    return {
        ...summary,
        usageSnapshot: (item.usageSnapshot as AIAdminTaskDetailItem['usageSnapshot']) ?? null,
        payload: (item.payload as AIAdminTaskDetailItem['payload']) ?? null,
        result: (item.result as AIAdminTaskDetailItem['result']) ?? null,
        error: (item.error as string | null) ?? null,
        audioDuration: toNumber(item.audioDuration),
        audioSize: toNumber(item.audioSize),
        textLength: toNumber(item.textLength),
        language: (item.language as string | null) ?? null,
    }
}

export async function getAITaskDetail(taskId: string, userId: string, options: { isAdmin?: boolean } = {}) {
    const queryBuilder = createAIAdminTaskDetailReadModelQuery()
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

    return normalizeAIAdminTaskDetailItem(item)
}
