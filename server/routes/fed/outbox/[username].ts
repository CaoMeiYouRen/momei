import { defineEventHandler, getRouterParam, createError, setHeader, getQuery, getHeader } from 'h3'
import MarkdownIt from 'markdown-it'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { Post } from '@/server/entities/post'
import { applyPostVisibilityFilter } from '@/server/utils/post-access'

/**
 * 分页参数校验 Schema
 */
const pageSchema = z.coerce.number().int().min(1).max(1000).optional()

/**
 * Markdown 渲染器
 */
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
})

/**
 * ActivityPub Outbox 端点
 * 返回用户的公开文章列表
 *
 * @route GET /fed/outbox/:username
 * @header Accept: application/activity+json
 */
export default defineEventHandler(async (event) => {
    const username = getRouterParam(event, 'username')
    const query = getQuery(event)

    if (!username) {
        throw createError({
            statusCode: 400,
            message: 'Username is required',
        })
    }

    // 查找用户
    const userRepo = dataSource.getRepository(User)
    const user = await userRepo.findOne({
        where: { username },
    })

    if (!user) {
        throw createError({
            statusCode: 404,
            message: 'Actor not found',
        })
    }

    // 获取站点 URL
    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl
    const outboxUrl = `${siteUrl}/fed/outbox/${username}`

    // 分页参数 (使用 Zod 校验)
    const pageResult = pageSchema.safeParse(query.page)
    const page = pageResult.success ? pageResult.data : undefined
    const limit = 20

    // 获取总数
    const postRepo = dataSource.getRepository(Post)
    const countQb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .where('author.username = :username', { username })

    // 应用可见性过滤 (复用现有逻辑)
    await applyPostVisibilityFilter(countQb, undefined, 'feed')

    const total = await countQb.getCount()

    // 如果是分页请求，返回 CollectionPage
    if (page !== undefined) {
        const offset = (page - 1) * limit

        const postsQb = postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.tags', 'tags')
            .leftJoinAndSelect('post.category', 'category')
            .where('author.username = :username', { username })
            .orderBy('post.publishedAt', 'DESC')
            .skip(offset)
            .take(limit)

        await applyPostVisibilityFilter(postsQb, undefined, 'feed')

        const posts = await postsQb.getMany()

        // 构建 ActivityPub Create 活动
        // 使用渲染后的 HTML 内容，而非原始 Markdown
        const items = posts.map((post) => {
            const contentHtml = md.render(post.content || '')
            return {
                '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
                id: `${siteUrl}/fed/note/${post.id}#create`,
                type: 'Create',
                actor: `${siteUrl}/fed/actor/${username}`,
                object: {
                    '@context': ['https://www.w3.org/ns/activitystreams'],
                    id: `${siteUrl}/fed/note/${post.id}`,
                    type: 'Article',
                    published: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
                    attributedTo: `${siteUrl}/fed/actor/${username}`,
                    content: contentHtml,
                    summary: post.summary,
                    url: `${siteUrl}/posts/${post.slug}`,
                    to: ['https://www.w3.org/ns/activitystreams#Public'],
                    cc: [`${siteUrl}/fed/actor/${username}/followers`],
                },
            }
        })

        const response = {
            '@context': ['https://www.w3.org/ns/activitystreams'],
            id: `${outboxUrl}?page=${page}`,
            type: 'OrderedCollectionPage',
            partOf: outboxUrl,
            next: offset + limit < total ? `${outboxUrl}?page=${page + 1}` : undefined,
            prev: page > 1 ? `${outboxUrl}?page=${page - 1}` : undefined,
            orderedItems: items,
        }

        setHeader(event, 'Content-Type', 'application/activity+json')
        // ActivityPub 跨域访问控制
        const origin = getHeader(event, 'origin')
        if (origin) {
            const allowedOrigins = [siteUrl]
            if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
                setHeader(event, 'Access-Control-Allow-Origin', origin)
            }
        }

        return response
    }

    // 返回 Collection 摘要 (不带 items)
    const response = {
        '@context': ['https://www.w3.org/ns/activitystreams'],
        id: outboxUrl,
        type: 'OrderedCollection',
        totalItems: total,
        first: `${outboxUrl}?page=1`,
        last: `${outboxUrl}?page=${Math.ceil(total / limit)}`,
    }

    setHeader(event, 'Content-Type', 'application/activity+json')
    // ActivityPub 跨域访问控制
    const origin = getHeader(event, 'origin')
    if (origin) {
        const allowedOrigins = [siteUrl]
        if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
            setHeader(event, 'Access-Control-Allow-Origin', origin)
        }
    }

    return response
})
