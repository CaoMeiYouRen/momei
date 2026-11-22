import { createError, getRouterParam, type H3Event } from 'h3'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'

export interface FedActorContext {
    username: string
    user: User
    siteUrl: string
}

/**
 * ActivityPub 端点共用的 actor 上下文解析。
 *
 * 依次完成「username 必填校验 → 用户查询 → 站点 URL 读取」，缺失时抛出与既有端点一致的
 * 400 / 404 错误，供 `/fed/actor/:username` 与 `/fed/outbox/:username` 复用。
 */
export async function resolveFedActorContext(event: H3Event): Promise<FedActorContext> {
    const username = getRouterParam(event, 'username')

    if (!username) {
        throw createError({
            statusCode: 400,
            message: 'Username is required',
        })
    }

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

    const config = useRuntimeConfig()

    return { username, user, siteUrl: config.public.siteUrl }
}
