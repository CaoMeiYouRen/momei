import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { success } from '@/server/utils/response'
import type { CalendarDayGroup, CalendarPostItem } from '@/types/calendar'

const querySchema = z.object({
    startDate: z.string().min(10).max(10),
    endDate: z.string().min(10).max(10),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const { user } = session
    const query = await getValidatedQuery(event, (q) => querySchema.parse(q))

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .select(['post.id', 'post.title', 'post.status', 'post.publishedAt', 'post.language', 'post.slug'])
        .where('post.publishedAt IS NOT NULL')
        .andWhere('post.publishedAt >= :startDate', { startDate: query.startDate })
        .andWhere('post.publishedAt <= :endDate', { endDate: query.endDate })

    if (!isAdmin(user.role)) {
        qb.andWhere('post.authorId = :authorId', { authorId: user.id })
    }

    const posts = await qb.getMany()

    const map = new Map<string, CalendarPostItem[]>()
    for (const post of posts) {
        const dateKey = (post.publishedAt as Date).toISOString().slice(0, 10)
        if (!map.has(dateKey)) {
            map.set(dateKey, [])
        }
        map.get(dateKey)!.push({
            id: post.id,
            title: post.title,
            status: post.status,
            publishedAt: (post.publishedAt as Date).toISOString(),
            language: post.language,
            slug: post.slug,
        })
    }

    const groups: CalendarDayGroup[] = Array.from(map.entries())
        .map(([date, dayPosts]) => ({ date, posts: dayPosts }))
        .sort((a, b) => a.date.localeCompare(b.date))

    return success({ groups })
})
