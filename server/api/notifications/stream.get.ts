import { createEventStream, eventHandler } from 'h3'
import { registerNotificationConnection, unregisterNotificationConnection } from '@/server/services/notification'
import { requireAuth } from '@/server/utils/permission'

export default eventHandler(async (event) => {
    const session = await requireAuth(event)
    const userId = session.user.id

    const eventStream = createEventStream(event)

    // 注册连接
    registerNotificationConnection(userId, eventStream)

    // 发送初始心跳消息
    eventStream.push(JSON.stringify({ type: 'HEARTBEAT', time: new Date().toISOString() }))

    // 间歇发送心跳，防止连接断开
    const interval = setInterval(() => {
        eventStream.push(JSON.stringify({ type: 'HEARTBEAT', time: new Date().toISOString() }))
    }, 30000)

    // 当连接关闭时清理
    eventStream.onClosed(async () => {
        clearInterval(interval)
        unregisterNotificationConnection(userId, eventStream)
    })

    return eventStream.send()
})
