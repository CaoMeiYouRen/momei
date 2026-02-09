import { dataSource } from '~/server/database'
import { AITask } from '~/server/entities/ai-task'
import { User } from '~/server/entities/user'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 10
    const type = query.type as string
    const status = query.status as string

    const repo = dataSource.getRepository(AITask)
    const qb = repo.createQueryBuilder('task')
        .leftJoin(User, 'user', 'task.userId = user.id')
        .select('task.id', 'id')
        .addSelect('task.type', 'type')
        .addSelect('task.status', 'status')
        .addSelect('task.provider', 'provider')
        .addSelect('task.model', 'model')
        .addSelect('task.createdAt', 'createdAt')
        .addSelect('task.userId', 'userId')
        .addSelect('task.payload', 'payload')
        .addSelect('task.result', 'result')
        .addSelect('task.error', 'error')
        .addSelect('user.name', 'user_name')
        .addSelect('user.email', 'user_email')
        .addSelect('user.image', 'user_image')
        .orderBy('task.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)

    if (type) {
        qb.andWhere('task.type = :type', { type })
    }

    if (status) {
        qb.andWhere('task.status = :status', { status })
    }

    const total = await qb.getCount()
    const rawData = await qb.getRawMany()

    return {
        items: rawData,
        total,
    }
})
