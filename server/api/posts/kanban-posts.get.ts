import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { success } from '@/server/utils/response'
import type { KanbanCard, KanbanResponse, PipelineStage } from '@/types/calendar'
import { PostStatus } from '@/types/post'

function toCard(post: Post): KanbanCard {
    return {
        id: post.id,
        title: post.title,
        summary: post.summary || null,
        status: post.status,
        updatedAt: post.updatedAt ? (post.updatedAt).toISOString() : null,
        language: post.language,
        categoryName: post.category?.name || null,
        pipelineStage: (post.metadata?.pipelineStage as PipelineStage) || 'ideation',
    }
}

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const { user } = session

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.category', 'category')
        .addSelect(['category.name'])
        .where('post.status = :status', { status: PostStatus.DRAFT })
        .addOrderBy('post.updatedAt', 'DESC')

    if (!isAdmin(user.role)) {
        qb.andWhere('post.authorId = :authorId', { authorId: user.id })
    }

    const posts = await qb.getMany()
    const cards = posts.map(toCard)

    const response: KanbanResponse = {
        ideation: cards.filter((c) => c.pipelineStage === 'ideation'),
        writing: cards.filter((c) => c.pipelineStage === 'writing'),
        ready: cards.filter((c) => c.pipelineStage === 'ready'),
    }

    return success(response)
})
