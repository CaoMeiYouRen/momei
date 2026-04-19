import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { lifecycle, intervalState, appFetchMock } = vi.hoisted(() => ({
    lifecycle: {
        mounted: [] as (() => void)[],
        beforeUnmount: [] as (() => void)[],
    },
    intervalState: {
        callback: null as null | (() => void),
        pause: vi.fn(),
        resume: vi.fn(),
    },
    appFetchMock: vi.fn(),
}))

const sessionRef = ref<{ data: { userId: string } | null }>({ data: null })
const siteConfigRef = ref({
    webPushEnabled: false,
    webPushPublicKey: '',
})

vi.mock('vue', async () => {
    const actual = await vi.importActual<typeof import('vue')>('vue')

    return {
        ...actual,
        onMounted: (callback: () => void) => {
            lifecycle.mounted.push(callback)
        },
        onUnmounted: (callback: () => void) => {
            lifecycle.beforeUnmount.push(callback)
        },
    }
})

vi.mock('@vueuse/core', () => ({
    useIntervalFn: (callback: () => void) => {
        intervalState.callback = callback
        return {
            pause: intervalState.pause,
            resume: intervalState.resume,
        }
    },
}))

vi.mock('./use-app-fetch', () => ({
    useAppApi: () => ({
        $appFetch: appFetchMock,
    }),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: () => sessionRef,
    },
}))

mockNuxtImport('useMomeiConfig', () => () => ({
    siteConfig: siteConfigRef,
}))

class MockEventSource {
    static instances: MockEventSource[] = []

    readonly url: string
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    closed = false

    constructor(url: string) {
        this.url = url
        MockEventSource.instances.push(this)
    }

    close() {
        this.closed = true
    }
}

interface MockPushSubscription {
    endpoint: string
    unsubscribe: ReturnType<typeof vi.fn>
    toJSON: () => {
        endpoint: string
        expirationTime: number | null
        keys: {
            p256dh: string
            auth: string
        }
    }
}

import { useNotifications } from './use-notifications'

const emptyNotificationPage = {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
}

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

function createPushSubscription(endpoint = 'https://push.example/subscription'): MockPushSubscription {
    return {
        endpoint,
        unsubscribe: vi.fn().mockResolvedValue(true),
        toJSON: () => ({
            endpoint,
            expirationTime: null,
            keys: {
                p256dh: 'p256dh-key',
                auth: 'auth-key',
            },
        }),
    }
}

describe('useNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        lifecycle.mounted = []
        lifecycle.beforeUnmount = []
        intervalState.callback = null
        intervalState.pause.mockReset()
        intervalState.resume.mockReset()
        appFetchMock.mockReset()
        appFetchMock.mockResolvedValue(emptyNotificationPage)
        sessionRef.value = { data: null }
        siteConfigRef.value = {
            webPushEnabled: false,
            webPushPublicKey: '',
        }
        MockEventSource.instances = []

        Object.defineProperty(window, 'EventSource', {
            configurable: true,
            value: MockEventSource,
        })

        Object.defineProperty(window, 'Notification', {
            configurable: true,
            value: {
                permission: 'default',
                requestPermission: vi.fn().mockResolvedValue('granted'),
            },
        })

        Object.defineProperty(window, 'PushManager', {
            configurable: true,
            value: function PushManager() {
                // noop constructor stub
            },
        })

        Object.defineProperty(window, 'atob', {
            configurable: true,
            value: vi.fn((value: string) => Buffer.from(value, 'base64').toString('binary')),
        })

        Object.defineProperty(global.navigator, 'serviceWorker', {
            configurable: true,
            value: {
                getRegistration: vi.fn().mockResolvedValue(null),
                register: vi.fn().mockResolvedValue({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue(null),
                        subscribe: vi.fn().mockResolvedValue(createPushSubscription()),
                    },
                }),
            },
        })

        Object.defineProperty(global.navigator, 'permissions', {
            configurable: true,
            value: {
                query: vi.fn().mockResolvedValue({
                    state: 'granted',
                    onchange: null,
                }),
            },
        })
    })

    afterEach(() => {
        lifecycle.beforeUnmount.forEach((callback) => callback())
        sessionRef.value = { data: null }
    })

    it('认证用户应拉取通知、建立 SSE，并在消息到达时更新本地列表', async () => {
        sessionRef.value = { data: { userId: 'user-1' } }
        appFetchMock.mockResolvedValueOnce({
            items: [{ id: 'seed', isRead: false, title: 'seed', content: '', link: null, createdAt: '', type: 'comment' }],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        })

        const notifications = useNotifications()
        lifecycle.mounted.forEach((callback) => callback())
        await flushPromises()

        expect(appFetchMock).toHaveBeenCalledWith('/api/notifications', {
            query: { limit: 10, unreadOnly: false },
        })
        expect(MockEventSource.instances[0]?.url).toBe('/api/notifications/stream')

        MockEventSource.instances[0]?.onopen?.()
        expect(notifications.isConnected.value).toBe(true)
        expect(intervalState.pause).toHaveBeenCalled()

        MockEventSource.instances[0]?.onmessage?.({
            data: JSON.stringify({
                id: 'incoming',
                isRead: false,
                title: 'New notification',
                content: '',
                link: null,
                createdAt: '',
                type: 'comment',
            }),
        })

        expect(notifications.notifications.value[0]?.id).toBe('incoming')
        expect(notifications.unreadCount.value).toBe(2)
    })

    it('markAsRead 应支持局部与全量已读同步', async () => {
        sessionRef.value = { data: { userId: 'user-1' } }
        appFetchMock.mockImplementation((url: string) => {
            if (url === '/api/notifications') {
                return Promise.resolve({
                    items: [
                        { id: 'n1', isRead: false, title: 'n1', content: '', link: null, createdAt: '', type: 'comment' },
                        { id: 'n2', isRead: false, title: 'n2', content: '', link: null, createdAt: '', type: 'comment' },
                    ],
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                })
            }

            return Promise.resolve({ ok: true })
        })

        const notifications = useNotifications()
        lifecycle.mounted.forEach((callback) => callback())
        await flushPromises()

        await notifications.markAsRead(['n1'])
        expect(appFetchMock).toHaveBeenCalledWith('/api/notifications/read', {
            method: 'PUT',
            body: { ids: ['n1'] },
        })
        expect(notifications.notifications.value.find((item) => item.id === 'n1')?.isRead).toBe(true)
        expect(notifications.notifications.value.find((item) => item.id === 'n2')?.isRead).toBe(false)

        await notifications.markAsRead()
        expect(notifications.notifications.value.every((item) => item.isRead)).toBe(true)
        expect(notifications.unreadCount.value).toBe(0)
    })

    it('SSE 失败时应关闭连接并回退到轮询', async () => {
        sessionRef.value = { data: { userId: 'user-2' } }
        appFetchMock.mockResolvedValueOnce(emptyNotificationPage)

        const notifications = useNotifications()
        lifecycle.mounted.forEach((callback) => callback())
        await flushPromises()

        MockEventSource.instances[0]?.onopen?.()
        MockEventSource.instances[0]?.onerror?.()

        expect(notifications.isConnected.value).toBe(false)
        expect(MockEventSource.instances[0]?.closed).toBe(true)
        expect(intervalState.resume).toHaveBeenCalled()
    })

    it('enableBrowserPush 应在授权后注册并同步订阅', async () => {
        sessionRef.value = { data: { userId: 'user-3' } }
        siteConfigRef.value = {
            webPushEnabled: true,
            webPushPublicKey: 'cHVibGljLWtleQ',
        }
        const notificationApi = {
            permission: 'default',
            requestPermission: vi.fn().mockImplementation(() => {
                notificationApi.permission = 'granted'
                return Promise.resolve<'granted'>('granted')
            }),
        }
        Object.defineProperty(window, 'Notification', {
            configurable: true,
            value: notificationApi,
        })
        appFetchMock.mockImplementation((url: string) => {
            if (url === '/api/notifications') {
                return Promise.resolve({
                    items: [],
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                })
            }

            return Promise.resolve({ ok: true })
        })

        const notifications = useNotifications()
        lifecycle.mounted.forEach((callback) => callback())
        await flushPromises()

        await expect(notifications.enableBrowserPush()).resolves.toBe(true)

        expect(appFetchMock.mock.calls).toContainEqual([
            '/api/user/notifications/push-subscription',
            {
                method: 'PUT',
                body: {
                    endpoint: 'https://push.example/subscription',
                    expirationTime: null,
                    keys: {
                        p256dh: 'p256dh-key',
                        auth: 'auth-key',
                    },
                    permission: 'granted',
                },
            },
        ])
    })

    it('未授权时应取消现有订阅并删除服务端记录', async () => {
        sessionRef.value = { data: { userId: 'user-4' } }
        siteConfigRef.value = {
            webPushEnabled: true,
            webPushPublicKey: 'cHVibGljLWtleQ',
        }
        const existingSubscription = createPushSubscription('https://push.example/existing')
        Object.defineProperty(window, 'Notification', {
            configurable: true,
            value: {
                permission: 'denied',
                requestPermission: vi.fn().mockResolvedValue('denied'),
            },
        })
        Object.defineProperty(global.navigator, 'serviceWorker', {
            configurable: true,
            value: {
                getRegistration: vi.fn().mockResolvedValue({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue(existingSubscription),
                        subscribe: vi.fn(),
                    },
                }),
                register: vi.fn(),
            },
        })
        appFetchMock.mockResolvedValue({ ok: true, items: [], total: 0, page: 1, limit: 10, totalPages: 0 })

        useNotifications()
        lifecycle.mounted.forEach((callback) => callback())
        await flushPromises()

        expect(existingSubscription.unsubscribe).toHaveBeenCalled()
        expect(appFetchMock).toHaveBeenCalledWith('/api/user/notifications/push-subscription', {
            method: 'DELETE',
            body: { endpoint: 'https://push.example/existing' },
        })
    })

    it('登出时应清空通知并在卸载时移除权限监听', async () => {
        sessionRef.value = { data: { userId: 'user-5' } }
        const permissionStatus = {
            state: 'granted',
            onchange: null as null | (() => void),
        }
        Object.defineProperty(global.navigator, 'permissions', {
            configurable: true,
            value: {
                query: vi.fn().mockResolvedValue(permissionStatus),
            },
        })
        appFetchMock.mockResolvedValueOnce({
            items: [{ id: 'seed', isRead: false, title: 'seed', content: '', link: null, createdAt: '', type: 'comment' }],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        })

        const notifications = useNotifications()
        lifecycle.mounted.forEach((callback) => callback())
        await flushPromises()

        sessionRef.value = { data: null }
        await flushPromises()

        expect(notifications.notifications.value).toEqual([])
        expect(notifications.unreadCount.value).toBe(0)

        lifecycle.beforeUnmount.forEach((callback) => callback())
        expect(permissionStatus.onchange).toBeNull()
    })
})
