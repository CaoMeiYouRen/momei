import { dataSource } from '~/server/database'
import { AITask } from '~/server/entities/ai-task'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const repo = dataSource.getRepository(AITask)

    // 1. 按状态统计
    const statusStats = await repo.createQueryBuilder('task')
        .select('task.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('task.status')
        .getRawMany()

    // 2. 按类型统计
    const typeStats = await repo.createQueryBuilder('task')
        .select('task.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('task.type')
        .getRawMany()

    // 3. 模型与提供商分布
    const modelStats = await repo.createQueryBuilder('task')
        .select('task.provider', 'provider')
        .addSelect('task.model', 'model')
        .addSelect('COUNT(*)', 'count')
        .groupBy('task.provider')
        .addGroupBy('task.model')
        .getRawMany()

    // 4. 最近 14 天的每日趋势
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // 注意：SQLite 和 MySQL/Postgres 的日期函数不同
    // 这里使用更通用的方式或者按数据库类型处理
    const dbType = dataSource.options.type

    let trendQuery = repo.createQueryBuilder('task')
        .select('COUNT(*)', 'count')
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

    return {
        statusStats,
        typeStats,
        modelStats,
        dailyTrend,
    }
})
