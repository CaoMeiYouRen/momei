import { LessThan, In } from 'typeorm'
import { z } from 'zod'
import { dataSource } from '~/server/database'
import { AITask } from '~/server/entities/ai-task'
import { requireAdmin } from '@/server/utils/permission'

const bulkDeleteSchema = z.object({
    // 删除 N 天前的任务
    olderThanDays: z.coerce.number().int().positive().optional(),
    // 按状态筛选
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    // 按分类筛选
    category: z.enum(['image', 'text', 'audio', 'translate', 'social', 'audit']).optional(),
})

const BATCH_SIZE = 500

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const filters = await getValidatedQuery(event, (query) => bulkDeleteSchema.parse(query))

    const repo = dataSource.getRepository(AITask)

    // 构建 WHERE 条件
    const where: Record<string, unknown> = {}

    if (filters.status) {
        where.status = filters.status
    }

    if (filters.category) {
        where.category = filters.category
    }

    if (filters.olderThanDays) {
        const cutoff = new Date(Date.now() - filters.olderThanDays * 24 * 60 * 60 * 1000)
        // status 为 final 态时才按 completedAt 过滤，否则按 createdAt
        if (filters.status === 'completed' || filters.status === 'failed') {
            where.completedAt = LessThan(cutoff)
        } else {
            where.createdAt = LessThan(cutoff)
        }
    }

    // 分批删除，避免长事务
    let totalDeleted = 0

    while (true) {
        const batch = await repo.find({
            select: { id: true },
            where,
            take: BATCH_SIZE,
        })

        if (batch.length === 0) {
            break
        }

        const batchIds = batch.map((t) => t.id)
        const result = await repo.delete({ id: In(batchIds) })
        totalDeleted += result.affected ?? 0
    }

    return {
        success: true,
        deleted: totalDeleted,
        filters,
    }
})
