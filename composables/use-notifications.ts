import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useAppApi } from './use-app-fetch'
import { authClient } from '@/lib/auth-client'
import type { NotificationHistoryResponseData, UserNotificationHistoryItem } from '@/types/notification'

type BrowserPushPermission = NotificationPermission | 'unsupported'

export type Notification = UserNotificationHistoryItem

export function useNotifications() {
    const notifications = ref<Notification[]>([])
    const unreadCount = ref(0)
    const isConnected = ref(false)
    const eventSource = ref<EventSource | null>(null)
    const browserPermission = ref<BrowserPushPermission>('unsupported')
    const { $appFetch } = useAppApi()
    const { siteConfig } = useMomeiConfig()

    let permissionStatus: PermissionStatus | null = null

    const { pause, resume } = useIntervalFn(() => {
        void fetchNotifications()
    }, 60 * 1000 * 2, { immediate: false })

    const session = authClient.useSession()
    const authStatus = computed(() => session.value?.data ? 'authenticated' : 'unauthenticated')
    const isBrowserPushSupported = computed(() => {
        if (typeof window === 'undefined') {
            return false
        }

        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    })
    const browserPushReady = computed(() => isBrowserPushSupported.value && siteConfig.value.webPushEnabled && Boolean(siteConfig.value.webPushPublicKey))

    const updateBrowserPermission = () => {
        if (!isBrowserPushSupported.value) {
            browserPermission.value = 'unsupported'
            return
        }

        browserPermission.value = window.Notification.permission
    }

    const urlBase64ToUint8Array = (base64String: string) => {
        const normalized = base64String.padEnd(Math.ceil(base64String.length / 4) * 4, '=')
            .replace(/-/g, '+')
            .replace(/_/g, '/')
        const rawData = window.atob(normalized)
        const outputArray = new Uint8Array(rawData.length)

        for (let index = 0; index < rawData.length; index += 1) {
            outputArray[index] = rawData.charCodeAt(index)
        }

        return outputArray
    }

    const getPushRegistration = async () => {
        if (!browserPushReady.value) {
            return null
        }

        const existingRegistration = await navigator.serviceWorker.getRegistration('/web-push-sw.js')
        if (existingRegistration) {
            return existingRegistration
        }

        return await navigator.serviceWorker.register('/web-push-sw.js')
    }

    const removeServerSubscription = async (endpoint?: string) => {
        if (authStatus.value !== 'authenticated') {
            return
        }

        await $appFetch('/api/user/notifications/push-subscription', {
            method: 'DELETE',
            body: endpoint ? { endpoint } : {},
        })
    }

    const syncServerSubscription = async (subscription: PushSubscription) => {
        const serialized = subscription.toJSON()
        if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
            return
        }

        await $appFetch('/api/user/notifications/push-subscription', {
            method: 'PUT',
            body: {
                endpoint: serialized.endpoint,
                expirationTime: serialized.expirationTime ?? null,
                keys: serialized.keys,
                permission: browserPermission.value === 'unsupported' ? 'default' : browserPermission.value,
            },
        })
    }

    const syncBrowserPushSubscription = async () => {
        if (!import.meta.client || authStatus.value !== 'authenticated' || !browserPushReady.value) {
            return
        }

        updateBrowserPermission()

        const registration = await getPushRegistration()
        if (!registration) {
            return
        }

        const existingSubscription = await registration.pushManager.getSubscription()

        if (browserPermission.value !== 'granted') {
            if (existingSubscription) {
                const endpoint = existingSubscription.endpoint
                await existingSubscription.unsubscribe().catch((error) => {
                    console.error('Failed to unsubscribe browser push:', error)
                })
                await removeServerSubscription(endpoint).catch((error) => {
                    console.error('Failed to remove browser push subscription:', error)
                })
            }
            return
        }

        let subscription = existingSubscription

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(siteConfig.value.webPushPublicKey),
            })
        }

        await syncServerSubscription(subscription)
    }

    const enableBrowserPush = async () => {
        if (!browserPushReady.value) {
            return false
        }

        const permission = await window.Notification.requestPermission()
        browserPermission.value = permission

        await syncBrowserPushSubscription().catch((error) => {
            console.error('Failed to enable browser push:', error)
        })

        return permission === 'granted'
    }

    const observeNotificationPermission = async () => {
        updateBrowserPermission()

        if (!isBrowserPushSupported.value || !('permissions' in navigator)) {
            return
        }

        permissionStatus = await navigator.permissions.query({
            name: 'notifications' as PermissionName,
        })

        permissionStatus.onchange = () => {
            browserPermission.value = permissionStatus?.state === 'prompt'
                ? 'default'
                : (permissionStatus?.state || 'default')
            void syncBrowserPushSubscription()
        }
    }

    const fetchNotifications = async () => {
        if (authStatus.value !== 'authenticated') {
            return
        }
        try {
            const res = await $appFetch<NotificationHistoryResponseData>('/api/notifications', {
                query: { limit: 10, unreadOnly: false },
            })
            notifications.value = res.items
            unreadCount.value = res.items.filter((notification) => !notification.isRead).length
        } catch (err) {
            console.error('Failed to fetch notifications:', err)
        }
    }

    const markAsRead = async (ids?: string[]) => {
        try {
            await $appFetch('/api/notifications/read', {
                method: 'PUT',
                body: { ids },
            })
            if (ids) {
                notifications.value.forEach((n) => {
                    if (ids.includes(n.id)) {
                        n.isRead = true
                    }
                })
            } else {
                notifications.value.forEach((n) => (n.isRead = true))
            }
            unreadCount.value = notifications.value.filter((n) => !n.isRead).length
        } catch (err) {
            console.error('Failed to mark notifications as read:', err)
        }
    }

    const connectSSE = () => {
        if (typeof window === 'undefined' || !window.EventSource) {
            startPolling()
            return
        }

        if (eventSource.value) {
            return
        }

        const url = '/api/notifications/stream'
        const es = new EventSource(url)

        es.onopen = () => {
            isConnected.value = true
            stopPolling()
        }

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === 'HEARTBEAT') {
                    return
                }

                // 新通知，加到列表头部
                notifications.value.unshift(data)
                unreadCount.value++

                // 限制长度
                if (notifications.value.length > 50) {
                    notifications.value.pop()
                }
            } catch (err) {
                console.error('Failed to parse SSE message:', err)
            }
        }

        es.onerror = () => {
            isConnected.value = false
            es.close()
            eventSource.value = null
            // SSE 失败，降级为轮询
            startPolling()
        }

        eventSource.value = es
    }

    const startPolling = () => {
        resume()
    }

    const stopPolling = () => {
        pause()
    }

    const disconnectSSE = () => {
        if (eventSource.value) {
            eventSource.value.close()
            eventSource.value = null
        }
        isConnected.value = false
        stopPolling()
    }

    watch(authStatus, (newVal) => {
        if (newVal === 'authenticated') {
            void fetchNotifications()
            connectSSE()
            void syncBrowserPushSubscription()
        } else {
            disconnectSSE()
            notifications.value = []
            unreadCount.value = 0
        }
    })

    watch([
        authStatus,
        () => siteConfig.value.webPushEnabled,
        () => siteConfig.value.webPushPublicKey,
    ], ([newStatus]) => {
        if (newStatus === 'authenticated') {
            void syncBrowserPushSubscription()
        }
    })

    onMounted(() => {
        void observeNotificationPermission()

        if (authStatus.value === 'authenticated') {
            void fetchNotifications()
            connectSSE()
            void syncBrowserPushSubscription()
        }
    })

    onUnmounted(() => {
        disconnectSSE()

        if (permissionStatus) {
            permissionStatus.onchange = null
            permissionStatus = null
        }
    })

    return {
        notifications,
        unreadCount,
        isConnected,
        browserPermission,
        isBrowserPushSupported,
        browserPushReady,
        fetchNotifications,
        markAsRead,
        enableBrowserPush,
    }
}
