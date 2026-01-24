import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { CommentStatus } from '@/types/comment'
import { parsePagination } from '@/server/utils/pagination'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const { page, limit } = parsePagination(query)
    const status = query.status as CommentStatus
    const keyword = query.keyword as string
    const postId = query.postId as string

    const commentRepo = dataSource.getRepository(Comment)
    const qb = commentRepo.createQueryBuilder('comment')
        .leftJoinAndSelect('comment.author', 'author')
        .leftJoinAndSelect('comment.post', 'post')
        .orderBy('comment.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)

    if (status) {
        qb.andWhere('comment.status = :status', { status })
    }

    if (postId) {
        qb.andWhere('comment.postId = :postId', { postId })
    }

    if (keyword) {
        qb.andWhere('(comment.content LIKE :keyword OR comment.authorName LIKE :keyword OR comment.authorEmail LIKE :keyword)', {
            keyword: `%${keyword}%`,
        })
    }

    const [items, total] = await qb.getManyAndCount()

    return {
        code: 200,
        data: {
            items,
            total,
            page,
            limit,
        },
    }
})
