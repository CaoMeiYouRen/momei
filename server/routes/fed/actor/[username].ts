import { defineEventHandler, getRouterParam, createError, setHeader, getHeader } from 'h3'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { userToActor } from '@/server/utils/fed/mapper'

/**
 * ActivityPub Actor 端点
 * 返回用户的 Actor 对象
 *
 * @route GET /fed/actor/:username
 * @header Accept: application/activity+json
 */
export default defineEventHandler(async (event) => {
    const username = getRouterParam(event, 'username')

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

    // 转换为 Actor
    const actor = await userToActor(user, siteUrl)

    // 设置正确的 Content-Type
    setHeader(event, 'Content-Type', 'application/activity+json')
    // ActivityPub 跨域访问控制
    const origin = getHeader(event, 'origin')
    if (origin) {
        try {
            const requestOrigin = new URL(origin).origin
            const siteOrigin = new URL(siteUrl).origin
            if (requestOrigin === siteOrigin) {
                setHeader(event, 'Access-Control-Allow-Origin', requestOrigin)
            }
        } catch {
            // ignore invalid origin
        }
    }

    return actor
})
