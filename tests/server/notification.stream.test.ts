import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    registerNotificationConnection,
    sendInAppNotification,
    unregisterNotificationConnection,
} from '@/server/services/notification'
import { dataSource } from '@/server/database'
import { NotificationDeliveryChannel, NotificationDeliveryStatus, NotificationType } from '@/utils/shared/notification'
import logger from '@/server/utils/logger'
import { sendWebPushToUser } from '@/server/services/web-push'
import { recordNotificationDeliveryLog } from '@/server/services/notification-delivery'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/email', () => ({
    sendEmail: vi.fn(),
}))

vi.mock('@/server/utils/email/service', () => ({
    emailService: {
        sendMarketingEmail: vi.fn(),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}))

vi.mock('@/server/services/web-push', () => ({
    sendWebPushToUser: vi.fn().mockResolvedValue({
        attempted: 1,
        sent: 1,
        removed: 0,
    }),
}))

vi.mock('@/server/services/notification-delivery', () => ({
    recordNotificationDeliveryLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/services/listmonk', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/services/listmonk')>()
    return {
        ...actual,
        getListmonkDispatchConfig: vi.fn().mockResolvedValue({
            enabled: false,
            baseUrl: '',
            username: '',
            accessToken: '',
            defaultListIds: [],
            categoryListMap: {},
            tagListMap: {},
            templateId: null,
            missingFields: [],
        }),
        dispatchListmonkCampaign: vi.fn(),
    }
})

interface StreamStub {
    push: (payload: string) => void | Promise<void>
}

const activeConnections: { userId: string, stream: StreamStub }[] = []

function connect(userId: string, stream: StreamStub) {
    registerNotificationConnection(userId, stream)
    activeConnections.push({ userId, stream })
}

afterEach(() => {
    for (const { userId, stream } of activeConnections.splice(0)) {
        unregisterNotificationConnection(userId, stream)
    }
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

function deliveryLogs(channel: NotificationDeliveryChannel) {
    return vi.mocked(recordNotificationDeliveryLog).mock.calls
        .map(([entry]) => entry)
        .filter((entry) => entry.channel === channel)
}

function installRepos(options: {
    webPushEnabled?: boolean
    settingsMissing?: boolean
} = {}) {
    const notificationRepo = {
        create: vi.fn((payload) => ({ id: 'notification-1', ...payload })),
        save: vi.fn((payload) => Promise.resolve({ id: 'notification-1', ...payload })),
    }
    const settingsRepo = {
        findOne: vi.fn().mockResolvedValue(options.settingsMissing
            ? null
            : { isEnabled: options.webPushEnabled ?? true }),
    }

    vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
        if (entity.name === 'InAppNotification') {
            return notificationRepo as any
        }
        if (entity.name === 'NotificationSettings') {
            return settingsRepo as any
        }
        return {} as any
    })

    return { notificationRepo, settingsRepo }
}

describe('In-App 通知投递分支', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('在线用户 SSE 推送成功后 Web Push 记为跳过并写入投递日志', async () => {
        installRepos()
        const stream = { push: vi.fn().mockResolvedValue(undefined) }
        connect('stream-online-user', stream)

        await sendInAppNotification({
            userId: 'stream-online-user',
            type: NotificationType.SYSTEM,
            title: '在线提醒',
            content: 'SSE 推送',
        })

        expect(stream.push).toHaveBeenCalledOnce()
        expect(sendWebPushToUser).not.toHaveBeenCalled()
        expect(deliveryLogs(NotificationDeliveryChannel.IN_APP)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SUCCESS,
            targetUrl: null,
        })
        expect(deliveryLogs(NotificationDeliveryChannel.SSE)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SUCCESS,
            errorMessage: null,
            metadata: { connectionCount: 1 },
        })
        expect(deliveryLogs(NotificationDeliveryChannel.WEB_PUSH)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SKIPPED,
            errorMessage: 'online_sse_delivery',
        })

    })

    it('SSE 推送全部失败时记录失败状态', async () => {
        installRepos()
        const stream = { push: vi.fn().mockRejectedValue(new Error('sse closed')) }
        connect('stream-broken-user', stream)

        await sendInAppNotification({
            userId: 'stream-broken-user',
            type: NotificationType.SYSTEM,
            title: '断线提醒',
            content: 'SSE 失败',
        })

        expect(logger.error).toHaveBeenCalled()
        expect(deliveryLogs(NotificationDeliveryChannel.SSE)[0]).toMatchObject({
            status: NotificationDeliveryStatus.FAILED,
            errorMessage: 'sse_delivery_failed',
            metadata: { connectionCount: 1 },
        })

    })

    it('用户关闭 Web Push 时不发送浏览器推送', async () => {
        const { settingsRepo } = installRepos({ webPushEnabled: false })

        await sendInAppNotification({
            userId: 'disabled-push-user',
            type: NotificationType.SYSTEM,
            title: '关闭推送',
            content: '不发送',
        })

        expect(settingsRepo.findOne).toHaveBeenCalledOnce()
        expect(sendWebPushToUser).not.toHaveBeenCalled()
        expect(deliveryLogs(NotificationDeliveryChannel.WEB_PUSH)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SKIPPED,
            errorMessage: 'user_disabled',
        })
    })

    it('未配置 Web Push 偏好时默认发送并记录成功', async () => {
        installRepos({ settingsMissing: true })
        vi.mocked(sendWebPushToUser).mockResolvedValue({
            attempted: 1,
            sent: 1,
            removed: 0,
        } as never)

        await sendInAppNotification({
            userId: 'default-push-user',
            type: NotificationType.SYSTEM,
            title: '默认推送',
            content: '发送成功',
        })

        expect(sendWebPushToUser).toHaveBeenCalledOnce()
        expect(deliveryLogs(NotificationDeliveryChannel.WEB_PUSH)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SUCCESS,
            errorMessage: null,
        })
    })

    it('Web Push 无可用订阅时记录跳过', async () => {
        installRepos()
        vi.mocked(sendWebPushToUser).mockResolvedValue({
            attempted: 0,
            sent: 0,
            removed: 0,
            skipped: true,
        } as never)

        await sendInAppNotification({
            userId: 'skipped-push-user',
            type: NotificationType.SYSTEM,
            title: '跳过推送',
            content: '无订阅',
        })

        expect(deliveryLogs(NotificationDeliveryChannel.WEB_PUSH)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SKIPPED,
            errorMessage: 'web_push_unavailable',
            metadata: { attempted: 0, sent: 0, skipped: true },
        })
    })

    it('Web Push 发送 0 条且未被跳过时记录失败', async () => {
        installRepos()
        vi.mocked(sendWebPushToUser).mockResolvedValue({
            attempted: 1,
            sent: 0,
            removed: 1,
        } as never)

        await sendInAppNotification({
            userId: 'failed-push-user',
            type: NotificationType.SYSTEM,
            title: '推送失败',
            content: '订阅已失效',
        })

        expect(deliveryLogs(NotificationDeliveryChannel.WEB_PUSH)[0]).toMatchObject({
            status: NotificationDeliveryStatus.FAILED,
            errorMessage: 'web_push_unavailable',
        })
    })

    it('Web Push 抛错时记录错误消息', async () => {
        installRepos()
        vi.mocked(sendWebPushToUser).mockRejectedValue(new Error('push boom'))

        await sendInAppNotification({
            userId: 'throwing-push-user',
            type: NotificationType.SYSTEM,
            title: '推送异常',
            content: '异常内容',
        })

        expect(logger.error).toHaveBeenCalled()
        expect(deliveryLogs(NotificationDeliveryChannel.WEB_PUSH)[0]).toMatchObject({
            status: NotificationDeliveryStatus.FAILED,
            errorMessage: 'push boom',
        })

        vi.mocked(sendWebPushToUser).mockResolvedValue({
            attempted: 1,
            sent: 1,
            removed: 0,
        } as never)
    })

    it('全局广播无连接时记录跳过', async () => {
        installRepos()

        await sendInAppNotification({
            userId: null,
            type: NotificationType.SYSTEM,
            title: '全局广播',
            content: '无在线连接',
        })

        expect(deliveryLogs(NotificationDeliveryChannel.SSE)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SKIPPED,
            errorMessage: 'no_active_connections',
            metadata: { connectionCount: 0 },
        })
        expect(sendWebPushToUser).not.toHaveBeenCalled()
    })

    it('全局广播向所有连接推送并统计成功连接数', async () => {
        installRepos()
        const first = { push: vi.fn().mockResolvedValue(undefined) }
        const second = { push: vi.fn().mockResolvedValue(undefined) }
        connect('broadcast-user-a', first)
        connect('broadcast-user-b', second)

        await sendInAppNotification({
            userId: null,
            type: NotificationType.SYSTEM,
            title: '全局广播',
            content: '广播内容',
        })

        expect(first.push).toHaveBeenCalledOnce()
        expect(second.push).toHaveBeenCalledOnce()
        expect(deliveryLogs(NotificationDeliveryChannel.SSE)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SUCCESS,
            errorMessage: null,
            metadata: { connectionCount: 2 },
        })

    })

    it('广播中单个连接失败不影响其他连接统计', async () => {
        installRepos()
        const broken = { push: vi.fn().mockRejectedValue(new Error('broken pipe')) }
        const healthy = { push: vi.fn().mockResolvedValue(undefined) }
        connect('broadcast-broken-user', broken)
        connect('broadcast-healthy-user', healthy)

        await sendInAppNotification({
            userId: null,
            type: NotificationType.SYSTEM,
            title: '全局广播',
            content: '部分连接失败',
        })

        expect(healthy.push).toHaveBeenCalledOnce()
        expect(logger.error).toHaveBeenCalled()
        expect(deliveryLogs(NotificationDeliveryChannel.SSE)[0]).toMatchObject({
            status: NotificationDeliveryStatus.SUCCESS,
            metadata: { connectionCount: 1 },
        })

    })
})
