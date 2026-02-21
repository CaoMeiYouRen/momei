import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useAppApi } from './use-app-fetch'
import { authClient } from '@/lib/auth-client'

export interface Notification {
    id: string
    type: string
    title: string
    content: string
    link: string | null
    isRead: boolean
    createdAt: string
}

export function useNotifications() {
    const notifications = ref<Notification[]>([])
    const unreadCount = ref(0)
    const isConnected = ref(false)
    const eventSource = ref<EventSource | null>(null)
    const { $appFetch } = useAppApi()

    const { pause, resume } = useIntervalFn(() => {
        void fetchNotifications()
    }, 60 * 1000 * 2, { immediate: false })

    const session = authClient.useSession()
    const authStatus = computed(() => session.value?.data ? 'authenticated' : 'unauthenticated')

    const fetchNotifications = async () => {
        if (authStatus.value !== 'authenticated') {
            return
        }
        try {
            const res = await $appFetch('/api/notifications', {
                query: { limit: 10, unreadOnly: false },
            })
            if (res.code === 200 && res.data) {
                notifications.value = res.data.items
                // 重新统计未读数（通常后端应该给个总数，这里简单处理）
                unreadCount.value = res.data.items.filter((n: Notification) => !n.isRead).length
            }
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
        } else {
            disconnectSSE()
            notifications.value = []
            unreadCount.value = 0
        }
    }, { immediate: true })

    onMounted(() => {
        if (authStatus.value === 'authenticated') {
            void fetchNotifications()
            connectSSE()
        }
    })

    onUnmounted(() => {
        disconnectSSE()
    })

    return {
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        markAsRead,
    }
}
