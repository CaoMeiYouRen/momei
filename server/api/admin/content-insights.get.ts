import dayjs from 'dayjs'
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { Post } from '@/server/entities/post'
import { PostViewHourly } from '@/server/entities/post-view-hourly'
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

function applyPostFilters<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    session: Awaited<ReturnType<typeof requireAdminOrAuthor>>,
    query: z.infer<typeof querySchema>,
    scope: AdminContentInsightsScope,
    alias = 'post',
) {
    if (!isAdmin(session.user.role)) {
        queryBuilder.andWhere(`${alias}.authorId = :authorId`, { authorId: session.user.id })
    }

    if (query.contentLanguage) {
        queryBuilder.andWhere(`${alias}.language = :contentLanguage`, {
            contentLanguage: query.contentLanguage,
        })
    }

    if (scope === 'public') {
        queryBuilder
            .andWhere(`${alias}.status = :publishedStatus`, { publishedStatus: PostStatus.PUBLISHED })
            .andWhere(`${alias}.visibility = :publicVisibility`, { publicVisibility: PostVisibility.PUBLIC })
    }

    return queryBuilder
}

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
    const viewHourlyRepo = dataSource.getRepository(PostViewHourly)

    const selectedRange = Number(query.range) as AdminContentInsightsRange
    const scope = query.scope as AdminContentInsightsScope
    const maxWindowDays = Math.max(...ADMIN_CONTENT_INSIGHT_RANGES)
    const resolvedTimeZone = resolveAdminContentInsightsTimeZone(query.timezone)
    const currentEnd = dayjs().tz(resolvedTimeZone).endOf('day')
    const minWindowStart = currentEnd.startOf('day').subtract((maxWindowDays * 2) - 1, 'day').toDate()
    const maxWindowEnd = currentEnd.toDate()

    const publishedPostRows = await applyPostFilters(
        postRepo
            .createQueryBuilder('post')
            .select('post.id', 'id')
            .where(scope === 'public'
                ? 'post.publishedAt BETWEEN :minWindowStart AND :maxWindowEnd'
                : 'COALESCE(post.publishedAt, post.createdAt) BETWEEN :minWindowStart AND :maxWindowEnd',
            {
                minWindowStart,
                maxWindowEnd,
            }),
        session,
        query,
        scope,
    ).getRawMany<{ id: string }>()

    const commentRows = await applyPostFilters(
        commentRepo
            .createQueryBuilder('comment')
            .innerJoin('comment.post', 'post')
            .select('comment.postId', 'postId')
            .addSelect('comment.createdAt', 'createdAt')
            .where('comment.createdAt BETWEEN :minWindowStart AND :maxWindowEnd', {
                minWindowStart,
                maxWindowEnd,
            })
            .andWhere('comment.status != :spamStatus', { spamStatus: CommentStatus.SPAM }),
        session,
        query,
        scope,
    ).getRawMany<{ postId: string, createdAt: string }>()

    const viewRows = await applyPostFilters(
        viewHourlyRepo
            .createQueryBuilder('hourly')
            .innerJoin('hourly.post', 'post')
            .select('hourly.postId', 'postId')
            .addSelect('hourly.bucketHourUtc', 'bucketHourUtc')
            .addSelect('hourly.views', 'views')
            .where('hourly.bucketHourUtc BETWEEN :minWindowStart AND :maxWindowEnd', {
                minWindowStart,
                maxWindowEnd,
            }),
        session,
        query,
        scope,
    ).getRawMany<{ postId: string, bucketHourUtc: string, views: string }>()

    const postIds = Array.from(new Set([
        ...publishedPostRows.map((row) => row.id),
        ...commentRows.map((row) => row.postId),
        ...viewRows.map((row) => row.postId),
    ]))

    let posts: Post[] = []

    if (postIds.length > 0) {
        posts = await postRepo
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
            .where('post.id IN (:...postIds)', { postIds })
            .getMany()
    }

    return buildAdminContentInsights(posts, viewRows.map((row) => ({
        postId: row.postId,
        bucketHourUtc: row.bucketHourUtc,
        views: Number(row.views),
    })), commentRows, {
        selectedRange,
        scope,
        timezone: resolvedTimeZone,
        preferredLocale: query.language,
        contentLanguage: query.contentLanguage,
    })
})
