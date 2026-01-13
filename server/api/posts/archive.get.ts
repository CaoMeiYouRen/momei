import { Brackets, type SelectQueryBuilder, type WhereExpressionBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { archiveQuerySchema } from '@/utils/schemas/post'
import { success, paginate } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => archiveQuerySchema.parse(q))

    const session = await auth.api.getSession({ headers: event.headers })

    const postRepo = dataSource.getRepository(Post)

    // Helper to apply common filters including multi-language aggregation
    const applyCommonFilters = (qb: any) => {
        if (query.scope === 'public') {
            qb.andWhere('post.status = :status', { status: 'published' })
        }

        if (query.language) {
            if (query.scope === 'manage') {
                qb.andWhere('post.language = :language', { language: query.language })
            } else {
                // Public Multi-language aggregation logic
                qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
                    sub.where('post.language = :language', { language: query.language })
                        .orWhere(new Brackets((ss: WhereExpressionBuilder) => {
                            ss.where('post.translationId IS NOT NULL')
                                .andWhere('post.language != :language', { language: query.language })
                                .andWhere((subQb: SelectQueryBuilder<Post>) => {
                                    const existsQuery = subQb.subQuery()
                                        .select('1')
                                        .from(Post, 'p2')
                                        .where('p2.translationId = post.translationId')
                                        .andWhere('p2.language = :language', { language: query.language })
                                        .andWhere('p2.status = :status', { status: 'published' })
                                        .getQuery()
                                    return `NOT EXISTS ${existsQuery}`
                                })
                        }))
                        .orWhere('post.translationId IS NULL')
                }))
            }
        }

        qb.andWhere('post.published_at IS NOT NULL')
    }

    // Permission checks for manage scope
    if (query.scope === 'manage') {
        if (!session || !session.user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
        }
        const role = session.user.role
        if (role !== 'admin' && role !== 'author') {
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

        applyCommonFilters(rawQb)

        rawQb.groupBy('year')
            .addGroupBy('month')
            .orderBy('year', 'DESC')
            .addOrderBy('month', 'DESC')

        const raw = await rawQb.getRawMany()
        // ... rest of logic remains same
        // Normalize raw rows to numbers and group by year
        const yearsMap = new Map<number, Array<{ month: number, count: number }>>()

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
        event.node.res.setHeader('Cache-Control', 'public, max-age=60')

        return success(items)
    }

    // includePosts = true -> require year and month to be meaningful
    if (!query.year || !query.month) {
        throw createError({ statusCode: 400, statusMessage: 'year and month required when includePosts=true' })
    }

    // Fetch posts for specific year/month with pagination
    const postsQb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    applyCommonFilters(postsQb)

    // Add year/month filter depending on DB
    if (dbType.includes('sqlite')) {
        postsQb.andWhere('strftime(\'%Y\', post.published_at) = :y AND strftime(\'%m\', post.published_at) = :m', { y: `${query.year}`, m: query.month.toString().padStart(2, '0') })
    } else if (dbType.includes('postgres')) {
        postsQb.andWhere('EXTRACT(YEAR FROM post.published_at) = :y AND EXTRACT(MONTH FROM post.published_at) = :m', { y: query.year, m: query.month })
    } else {
        postsQb.andWhere('YEAR(post.published_at) = :y AND MONTH(post.published_at) = :m', { y: query.year, m: query.month })
    }

    postsQb.orderBy('post.published_at', 'DESC')
    postsQb.skip((query.page - 1) * query.limit)
    postsQb.take(query.limit)

    const [items, total] = await postsQb.getManyAndCount()


    event.node.res.setHeader('Cache-Control', 'public, max-age=60')

    return success(paginate(items, total, query.page, query.limit))
})
