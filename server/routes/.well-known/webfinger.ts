import { defineEventHandler, getQuery, createError, setHeader } from 'h3'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import type { WebFingerResponse } from '@/types/federation'

/**
 * WebFinger 协议端点
 * 用于发现用户的 ActivityPub Actor
 *
 * @see https://www.rfc-editor.org/rfc/rfc7033
 * @route GET /.well-known/webfinger?resource=acct:username@domain
 */
export default defineEventHandler(async (event): Promise<WebFingerResponse> => {
    const query = getQuery(event)
    const resource = query.resource as string

    // 验证资源格式
    if (!resource?.startsWith('acct:')) {
        throw createError({
            statusCode: 400,
            message: 'Invalid resource format. Expected: acct:username@domain',
        })
    }

    // 解析用户名: acct:username@domain
    const match = /^acct:([^@]+)@(.+)$/.exec(resource)
    if (!match) {
        throw createError({
            statusCode: 400,
            message: 'Invalid resource format. Expected: acct:username@domain',
        })
    }

    const [, username] = match

    // 获取配置
    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl

    // 查找用户
    const userRepo = dataSource.getRepository(User)
    const user = await userRepo.findOne({
        where: { username },
    })

    if (!user) {
        throw createError({
            statusCode: 404,
            message: 'User not found',
        })
    }

    // 构建 Actor URL
    const actorUrl = `${siteUrl}/fed/actor/${user.username}`

    // 构建 WebFinger 响应
    const response: WebFingerResponse = {
        subject: resource,
        aliases: [
            actorUrl,
            `${siteUrl}/@${user.username}`,
            `${siteUrl}/authors/${user.username}`,
        ],
        links: [
            // ActivityPub Actor (self)
            {
                rel: 'self',
                type: 'application/activity+json',
                href: actorUrl,
            },
            // Profile page (HTML)
            {
                rel: 'http://webfinger.net/rel/profile-page',
                type: 'text/html',
                href: `${siteUrl}/authors/${user.username}`,
            },
            // Avatar
            ...(user.image
                ? [{
                    rel: 'http://webfinger.net/rel/avatar',
                    type: 'image/webp',
                    href: user.image,
                }]
                : []),
            // OStatus subscribe template (用于跨实例关注)
            {
                rel: 'http://ostatus.org/schema/1.0/subscribe',
                template: `${siteUrl}/authorize-follow?uri={uri}`,
            },
        ],
    }

    // 设置正确的 Content-Type
    setHeader(event, 'Content-Type', 'application/jrd+json')
    // 允许跨域访问
    setHeader(event, 'Access-Control-Allow-Origin', '*')

    return response
})
