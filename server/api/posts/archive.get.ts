import type { H3Event } from 'h3'
import { Brackets, type SelectQueryBuilder, type WhereExpressionBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { getSetting } from '@/server/services/setting'
import { archiveQuerySchema } from '@/utils/schemas/post'
import { success, paginate } from '@/server/utils/response'
import { applyDefaultPaginationLimit } from '@/server/utils/pagination'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { isAdmin, isAdminOrAuthor } from '@/utils/shared/roles'
import { applyPostVisibilityFilter, rethrowPostAccessError } from '@/server/utils/post-access'
import { applyPostsReadModelFromMetadata } from '@/server/utils/post-metadata'
import { applyPostOrdering } from '@/server/utils/post-ordering'
import { applyPostListSelect } from '@/server/utils/post-list-query'
import { SettingKey } from '@/types/setting'

function applyArchiveCacheHeader(event: H3Event, isSharedPublicResponse: boolean) {
    event.node.res.setHeader('Cache-Control', isSharedPublicResponse ? 'public, max-age=60' : 'private, no-store')
}

export default defineEventHandler(async (event) => {
    const postsPerPage = await getSetting(SettingKey.POSTS_PER_PAGE, '10')
    const query = await getValidatedQuery(event, (q) => archiveQuerySchema.parse(applyDefaultPaginationLimit(q as Record<string, unknown>, postsPerPage)))

    const session = event.context?.auth
    const user = event.context?.user
    const isSharedPublicResponse = query.scope === 'public' && !session?.user && !user

    const postRepo = dataSource.getRepository(Post)

    // Helper to apply common filters including multi-language aggregation
    const applyCommonFilters = async (qb: any) => {
        if (query.scope === 'public') {
            try {
                await applyPostVisibilityFilter(qb, user, 'public')
            } catch (error) {
                rethrowPostAccessError(error)
            }
        }

        const targetLang = query.language || 'zh-CN'

        if (query.scope === 'manage') {
            if (query.language) {
                qb.andWhere('post.language = :language', { language: query.language })
            }
        } else {
            // Public Multi-language aggregation logic:
            // 1. Show posts in the target language.
            // 2. Show posts in other languages ONLY IF there is no version in the target language for that cluster.
            // 3. Unique posts (translationId is null) are always shown.
            qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
                sub.where('post.language = :language', { language: targetLang })
                    .orWhere(new Brackets((ss: WhereExpressionBuilder) => {
                        ss.where('post.translationId IS NOT NULL')
                            .andWhere('post.language != :language', { language: targetLang })
                            .andWhere((subQb: SelectQueryBuilder<Post>) => {
                                const existsQuery = subQb.subQuery()
                                    .select('1')
                                    .from(Post, 'p2')
                                    .where('p2.translationId = post.translationId')
                                    .andWhere('p2.language = :language', { language: targetLang })
                                    .andWhere('p2.status = :status', { status: 'published' })
                                    .getQuery()
                                return `NOT EXISTS ${existsQuery}`
                            })
                    }))
                    .orWhere('post.translationId IS NULL')
            }))
        }

        qb.andWhere('post.publishedAt IS NOT NULL')
    }

    // Permission checks for manage scope
    if (query.scope === 'manage') {
        if (!session?.user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
        }
        const sessionUser = session.user
        const role = sessionUser.role
        if (!isAdminOrAuthor(role)) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }
    }

    // Detect DB type for date functions
    const dbType = (dataSource.options.type as string) || ''


    let yearExpr = ''
    let monthExpr = ''

    if (dbType.includes('sqlite')) {
        yearExpr = `strftime('%Y', post.published_at)`
        monthExpr = `strftime('%m', post.published_at)`
    } else if (dbType.includes('postgres')) {
        yearExpr = `EXTRACT(YEAR FROM post.published_at)`
        monthExpr = `EXTRACT(MONTH FROM post.published_at)`
    } else {
        // mysql / others
        yearExpr = `YEAR(post.published_at)`
        monthExpr = `MONTH(post.published_at)`
    }

    // If includePosts = false, return aggregated tree
    if (!query.includePosts) {
        const rawQb = postRepo.createQueryBuilder('post')
            .select([`${yearExpr} as year`, `${monthExpr} as month`, 'COUNT(*) as count'])

        await applyCommonFilters(rawQb)

        rawQb.groupBy('year')
            .addGroupBy('month')
            .orderBy('year', 'DESC')
            .addOrderBy('month', 'DESC')

        const raw = await rawQb.getRawMany()
        // ... rest of logic remains same
        // Normalize raw rows to numbers and group by year
        const yearsMap = new Map<number, { month: number, count: number }[]>()

        for (const r of raw) {
            const year = Number(r.year)
            const month = Number(r.month)
            const count = Number(r.count)

            if (!yearsMap.has(year)) {
                yearsMap.set(year, [])
            }
            yearsMap.get(year)!.push({ month, count })
        }

        const items = Array.from(yearsMap.entries()).map(([year, months]) => ({ year, months }))

        // Cache for short period
        applyArchiveCacheHeader(event, isSharedPublicResponse)

        return success(items)
    }

    // includePosts = true -> require year and month to be meaningful
    if (!query.year || !query.month) {
        throw createError({ statusCode: 400, statusMessage: 'year and month required when includePosts=true' })
    }

    // Fetch posts for specific year/month with pagination
    const postsQb = applyPostListSelect(postRepo.createQueryBuilder('post'))

    await applyCommonFilters(postsQb)

    // Add year/month filter depending on DB
    if (dbType.includes('sqlite')) {
        postsQb.andWhere('strftime(\'%Y\', post.published_at) = :y AND strftime(\'%m\', post.published_at) = :m', { y: `${query.year}`, m: query.month.toString().padStart(2, '0') })
    } else if (dbType.includes('postgres')) {
        postsQb.andWhere('EXTRACT(YEAR FROM post.published_at) = :y AND EXTRACT(MONTH FROM post.published_at) = :m', { y: query.year, m: query.month })
    } else {
        postsQb.andWhere('YEAR(post.published_at) = :y AND MONTH(post.published_at) = :m', { y: query.year, m: query.month })
    }

    applyPostOrdering(postsQb, {
        alias: 'post',
        orderBy: 'publishedAt',
        order: 'DESC',
        prioritizePinned: true,
    })
    postsQb.skip((query.page - 1) * query.limit)
    postsQb.take(query.limit)

    const [items, total] = await postsQb.getManyAndCount()
    applyPostsReadModelFromMetadata(items)

    // 处理作者哈希并保护隐私
    const isUserAdmin = session?.user && isAdmin(session.user.role)
    await processAuthorsPrivacy(items, !!isUserAdmin)

    applyArchiveCacheHeader(event, isSharedPublicResponse)

    return success(paginate(items, total, query.page, query.limit))
})
