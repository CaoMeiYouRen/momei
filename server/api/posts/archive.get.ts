import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { archiveQuerySchema } from '@/utils/schemas/post'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => archiveQuerySchema.parse(q))

    const session = await auth.api.getSession({ headers: event.headers })

    const postRepo = dataSource.getRepository(Post)

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

    // Base conditions: only published posts in public scope
    const baseWhere: string[] = []
    const params: Record<string, any> = {}

    if (query.scope === 'public') {
        baseWhere.push('post.status = :status')
        params.status = 'published'
    }

    if (query.language) {
        baseWhere.push('post.language = :language')
        params.language = query.language
    }

    // Only aggregate posts with publishedAt
    baseWhere.push('post.publishedAt IS NOT NULL')

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
            .where(baseWhere.join(' AND '), params)
            .groupBy('year')
            .addGroupBy('month')
            .orderBy('year', 'DESC')
            .addOrderBy('month', 'DESC')

        if (process.env.NODE_ENV === 'test') {
            console.error('SQL:', rawQb.getSql())
            console.error('Params:', rawQb.getParameters())
        }

        const raw = await rawQb.getRawMany()

        if (process.env.NODE_ENV === 'test') {
            console.error('Raw results:', raw)
        }

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

        const list = Array.from(yearsMap.entries()).map(([year, months]) => ({ year, months }))

        // Cache for short period
        event.node.res.setHeader('Cache-Control', 'public, max-age=60')

        return {
            code: 200,
            data: { list },
        }
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
        .where(baseWhere.join(' AND '), params)

    // Add year/month filter depending on DB
    if (dbType.includes('sqlite')) {
        postsQb.andWhere('strftime(\'%Y\', post.published_at) = :y AND strftime(\'%m\', post.published_at) = :m', { y: `${query.year}`, m: query.month.toString().padStart(2, '0') })
    } else if (dbType.includes('postgres')) {
        postsQb.andWhere('EXTRACT(YEAR FROM post.published_at) = :y AND EXTRACT(MONTH FROM post.published_at) = :m', { y: query.year, m: query.month })
    } else {
        postsQb.andWhere('YEAR(post.publishedAt) = :y AND MONTH(post.publishedAt) = :m', { y: query.year, m: query.month })
    }

    postsQb.orderBy('post.publishedAt', 'DESC')
    postsQb.skip((query.page - 1) * query.limit)
    postsQb.take(query.limit)

    const [items, total] = await postsQb.getManyAndCount()


    event.node.res.setHeader('Cache-Control', 'public, max-age=60')

    return {
        code: 200,
        data: {
            list: items,
            total,
            page: query.page,
            limit: query.limit,
        },
    }
})
