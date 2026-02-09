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
        .leftJoinAndSelect(User, 'user', 'task.userId = user.id')
        .select([
            'task.id',
            'task.type',
            'task.status',
            'task.provider',
            'task.model',
            'task.createdAt',
            'task.userId',
            'user.name',
            'user.email',
            'task.error',
        ])
        .orderBy('task.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)

    if (type) {
        qb.andWhere('task.type = :type', { type })
    }

    if (status) {
        qb.andWhere('task.status = :status', { status })
    }

    const [items, total] = await qb.getManyAndCount()

    return {
        items,
        total,
    }
})
