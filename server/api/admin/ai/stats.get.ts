import { dataSource } from '~/server/database'
import { AITask } from '~/server/entities/ai-task'
import { User } from '~/server/entities/user'

function toNumber(value: unknown) {
    const num = Number(value || 0)
    return Number.isFinite(num) ? num : 0
}

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const repo = dataSource.getRepository(AITask)

    const overviewRaw = await repo.createQueryBuilder('task')
        .select('COUNT(*)', 'totalTasks')
        .addSelect('COALESCE(SUM(task.estimatedCost), 0)', 'estimatedCost')
        .addSelect('COALESCE(SUM(task.actualCost), 0)', 'actualCost')
        .addSelect('COALESCE(SUM(task.estimatedQuotaUnits), 0)', 'estimatedQuotaUnits')
        .addSelect('COALESCE(SUM(task.quotaUnits), 0)', 'quotaUnits')
        .addSelect('COALESCE(AVG(task.durationMs), 0)', 'avgDurationMs')
        .getRawOne()

    // 1. 按状态统计
    const statusStats = await repo.createQueryBuilder('task')
        .select('task.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('task.status')
        .getRawMany()

    const normalizedStatusStats = statusStats.map((item) => ({
        status: item.status,
        count: toNumber(item.count),
    }))

    // 2. 按类型统计
    const typeStats = await repo.createQueryBuilder('task')
        .select('task.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('task.type')
        .getRawMany()

    const categoryStats = await repo.createQueryBuilder('task')
        .select('task.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(task.actualCost), 0)', 'actualCost')
        .addSelect('COALESCE(SUM(task.quotaUnits), 0)', 'quotaUnits')
        .where('task.category IS NOT NULL')
        .groupBy('task.category')
        .getRawMany()

    const chargeStatusStats = await repo.createQueryBuilder('task')
        .select('task.chargeStatus', 'chargeStatus')
        .addSelect('COUNT(*)', 'count')
        .where('task.chargeStatus IS NOT NULL')
        .groupBy('task.chargeStatus')
        .getRawMany()

    const failureStageStats = await repo.createQueryBuilder('task')
        .select('task.failureStage', 'failureStage')
        .addSelect('COUNT(*)', 'count')
        .where('task.failureStage IS NOT NULL')
        .groupBy('task.failureStage')
        .getRawMany()

    // 3. 模型与提供商分布
    const modelStats = await repo.createQueryBuilder('task')
        .select('task.provider', 'provider')
        .addSelect('task.model', 'model')
        .addSelect('COUNT(*)', 'count')
        .groupBy('task.provider')
        .addGroupBy('task.model')
        .getRawMany()

    const topUsers = await repo.createQueryBuilder('task')
        .leftJoin(User, 'user', 'task.userId = user.id')
        .select('task.userId', 'userId')
        .addSelect('user.name', 'name')
        .addSelect('COALESCE(SUM(task.actualCost), 0)', 'actualCost')
        .addSelect('COALESCE(SUM(task.quotaUnits), 0)', 'quotaUnits')
        .addSelect('COUNT(*)', 'taskCount')
        .groupBy('task.userId')
        .addGroupBy('user.name')
        .orderBy('COALESCE(SUM(task.quotaUnits), 0)', 'DESC')
        .limit(5)
        .getRawMany()

    // 4. 最近 14 天的每日趋势
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // 注意：SQLite 和 MySQL/Postgres 的日期函数不同
    // 这里使用更通用的方式或者按数据库类型处理
    const dbType = dataSource.options.type

    let trendQuery = repo.createQueryBuilder('task')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(task.actualCost), 0)', 'actualCost')
        .addSelect('COALESCE(SUM(task.quotaUnits), 0)', 'quotaUnits')
        .where('task.createdAt >= :date', { date: fourteenDaysAgo })

    if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
        trendQuery = trendQuery.addSelect('strftime(\'%Y-%m-%d\', task.createdAt)', 'date')
    } else if (dbType === 'postgres') {
        trendQuery = trendQuery.addSelect('TO_CHAR(task.createdAt, \'YYYY-MM-DD\')', 'date')
    } else {
        trendQuery = trendQuery.addSelect('DATE_FORMAT(task.createdAt, \'%Y-%m-%d\')', 'date')
    }

    const dailyTrend = await trendQuery
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany()

    const totalTasks = toNumber(overviewRaw?.totalTasks)
    const completedTasks = normalizedStatusStats.find((item) => item.status === 'completed')?.count || 0
    const failedTasks = normalizedStatusStats.find((item) => item.status === 'failed')?.count || 0

    return {
        overview: {
            totalTasks,
            estimatedCost: toNumber(overviewRaw?.estimatedCost),
            actualCost: toNumber(overviewRaw?.actualCost),
            estimatedQuotaUnits: toNumber(overviewRaw?.estimatedQuotaUnits),
            quotaUnits: toNumber(overviewRaw?.quotaUnits),
            avgDurationMs: Math.round(toNumber(overviewRaw?.avgDurationMs)),
            successRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
            failureRate: totalTasks > 0 ? failedTasks / totalTasks : 0,
        },
        statusStats: normalizedStatusStats,
        typeStats: typeStats.map((item) => ({
            type: item.type,
            count: toNumber(item.count),
        })),
        categoryStats: categoryStats.map((item) => ({
            category: item.category,
            count: toNumber(item.count),
            actualCost: toNumber(item.actualCost),
            quotaUnits: toNumber(item.quotaUnits),
        })),
        chargeStatusStats: chargeStatusStats.map((item) => ({
            chargeStatus: item.chargeStatus,
            count: toNumber(item.count),
        })),
        failureStageStats: failureStageStats.map((item) => ({
            failureStage: item.failureStage,
            count: toNumber(item.count),
        })),
        modelStats,
        topUsers: topUsers.map((item) => ({
            userId: item.userId,
            name: item.name,
            actualCost: toNumber(item.actualCost),
            quotaUnits: toNumber(item.quotaUnits),
            taskCount: toNumber(item.taskCount),
        })),
        dailyTrend: dailyTrend.map((item) => ({
            date: item.date,
            count: toNumber(item.count),
            actualCost: toNumber(item.actualCost),
            quotaUnits: toNumber(item.quotaUnits),
        })),
    }
})
