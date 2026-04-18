import dayjs from 'dayjs'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { Post } from '@/server/entities/post'
import {
    buildAdminContentInsights,
    resolveAdminContentInsightsTimeZone,
} from '@/server/utils/admin-content-insights'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { CommentStatus } from '@/types/comment'
import {
    ADMIN_CONTENT_INSIGHT_RANGES,
    type AdminContentInsightsRange,
    type AdminContentInsightsScope,
} from '@/types/admin-content-insights'
import { PostStatus, PostVisibility } from '@/types/post'
import { isAdmin } from '@/utils/shared/roles'

const querySchema = z.object({
    range: z.enum(['7', '30', '90']).optional().default('30'),
    scope: z.enum(['all', 'public']).optional().default('all'),
    contentLanguage: z.string().trim().min(1).max(20).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    language: z.string().trim().min(1).max(20).optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const query = querySchema.parse(getQuery(event))

    const postRepo = dataSource.getRepository(Post)
    const commentRepo = dataSource.getRepository(Comment)

    const selectedRange = Number(query.range) as AdminContentInsightsRange
    const scope = query.scope as AdminContentInsightsScope
    const maxWindowDays = Math.max(...ADMIN_CONTENT_INSIGHT_RANGES)
    const resolvedTimeZone = resolveAdminContentInsightsTimeZone(query.timezone)
    const currentEnd = dayjs().tz(resolvedTimeZone).endOf('day')
    const minWindowStart = currentEnd.startOf('day').subtract((maxWindowDays * 2) - 1, 'day').toDate()
    const maxWindowEnd = currentEnd.toDate()

    const postQuery = postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tag')
        .select([
            'post.id',
            'post.title',
            'post.slug',
            'post.language',
            'post.translationId',
            'post.status',
            'post.visibility',
            'post.views',
            'post.publishedAt',
            'post.createdAt',
            'post.authorId',
            'category.id',
            'category.name',
            'category.slug',
            'category.language',
            'category.translationId',
            'tag.id',
            'tag.name',
            'tag.slug',
            'tag.language',
            'tag.translationId',
        ])

    if (!isAdmin(session.user.role)) {
        postQuery.andWhere('post.authorId = :authorId', { authorId: session.user.id })
    }

    if (query.contentLanguage) {
        postQuery.andWhere('post.language = :contentLanguage', {
            contentLanguage: query.contentLanguage,
        })
    }

    if (scope === 'public') {
        postQuery
            .andWhere('post.status = :publishedStatus', { publishedStatus: PostStatus.PUBLISHED })
            .andWhere('post.visibility = :publicVisibility', { publicVisibility: PostVisibility.PUBLIC })
            .andWhere('post.publishedAt BETWEEN :minWindowStart AND :maxWindowEnd', {
                minWindowStart,
                maxWindowEnd,
            })
    } else {
        postQuery.andWhere('COALESCE(post.publishedAt, post.createdAt) BETWEEN :minWindowStart AND :maxWindowEnd', {
            minWindowStart,
            maxWindowEnd,
        })
    }

    const posts = await postQuery.getMany()
    const postIds = posts.map((post) => post.id)

    let commentCountByPostId: Record<string, number> = {}
    if (postIds.length > 0) {
        const rows = await commentRepo
            .createQueryBuilder('comment')
            .select('comment.postId', 'postId')
            .addSelect('COUNT(comment.id)', 'count')
            .where('comment.postId IN (:...postIds)', { postIds })
            .andWhere('comment.status != :spamStatus', { spamStatus: CommentStatus.SPAM })
            .groupBy('comment.postId')
            .getRawMany<{ postId: string, count: string }>()

        commentCountByPostId = Object.fromEntries(rows.map((row) => [row.postId, Number(row.count)]))
    }

    return buildAdminContentInsights(posts, commentCountByPostId, {
        selectedRange,
        scope,
        timezone: resolvedTimeZone,
        preferredLocale: query.language,
        contentLanguage: query.contentLanguage,
    })
})
