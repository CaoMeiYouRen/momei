import { LessThan, In } from 'typeorm'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import logger from '@/server/utils/logger'

/**
 * AI 任务保留天数，默认 30 天。
 * 可通过环境变量 AI_TASK_RETENTION_DAYS 覆盖。
 */
function getRetentionDays(): number {
    const envValue = process.env.AI_TASK_RETENTION_DAYS
    if (envValue) {
        const parsed = Number.parseInt(envValue, 10)
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed
        }
    }
    return 30
}

/**
 * 清理已完成的 AI 任务。
 * 只删除 final 状态（completed / failed）且超过保留期限的记录。
 * pending / processing 状态的任务不会受影响。
 */
export async function purgeExpiredAiTasks(): Promise<{ deleted: number }> {
    const retentionDays = getRetentionDays()
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const finalStatuses = ['completed', 'failed']

    try {
        const repo = dataSource.getRepository(AITask)

        // 分批删除避免长事务锁表
        const BATCH_SIZE = 500
        let totalDeleted = 0

        while (true) {
            const batch = await repo.find({
                select: { id: true },
                where: {
                    status: In(finalStatuses),
                    completedAt: LessThan(cutoff),
                },
                take: BATCH_SIZE,
            })

            if (batch.length === 0) {
                break
            }

            const batchIds = batch.map((t) => t.id)
            const result = await repo.delete({ id: In(batchIds) })
            totalDeleted += result.affected ?? 0

            logger.info(
                `[AITaskCleanup] Deleted ${result.affected} AI tasks (status=completed|failed, olderThan=${cutoff.toISOString()})`,
            )
        }

        return { deleted: totalDeleted }
    } catch (error) {
        logger.error('[AITaskCleanup] Failed to purge expired AI tasks:', error)
        return { deleted: 0 }
    }
}
