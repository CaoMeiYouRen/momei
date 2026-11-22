import { defineEventHandler, setHeader, getHeader } from 'h3'
import { userToActor } from '@/server/utils/fed/mapper'
import { resolveFedActorContext } from '@/server/utils/fed/actor-context'

/**
 * ActivityPub Actor 端点
 * 返回用户的 Actor 对象
 *
 * @route GET /fed/actor/:username
 * @header Accept: application/activity+json
 */
export default defineEventHandler(async (event) => {
    const { user, siteUrl } = await resolveFedActorContext(event)

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
