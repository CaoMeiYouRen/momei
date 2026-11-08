<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { authClient } from '@/lib/auth-client'
import { useNotifications } from '@/composables/use-notifications'
import { resolveNotificationLinkTarget } from '@/utils/shared/notification'
import { isAdmin } from '@/utils/shared/roles'
import { Bell, Inbox, Info, Megaphone, MessageSquare, Shield } from '@lucide/vue'

const { t } = useI18n()
const { notifications, unreadCount, markAsRead, browserPermission, browserPushReady, enableBrowserPush } = useNotifications()
const { formatDateTime } = useI18nDate()
const localePath = useLocalePath()
const session = authClient.useSession()
const enablingBrowserPush = ref(false)
const allowAdminNotificationTargets = computed(() => isAdmin(session.value?.data?.user?.role))

const browserPushHint = computed(() => {
    if (!browserPushReady.value) {
        return ''
    }

    if (browserPermission.value === 'denied') {
        return t('components.notifications.browser_status.denied')
    }

    return t('components.notifications.browser_status.default')
})

const handleMarkAsRead = async (id?: string) => {
    await markAsRead(id ? [id] : undefined)
}

const handleEnableBrowserPush = async () => {
    enablingBrowserPush.value = true

    try {
        await enableBrowserPush()
    } finally {
        enablingBrowserPush.value = false
    }
}

const getNotificationIcon = (type: string): Component => {
    switch (type) {
        case 'COMMENT_REPLY':
            return MessageSquare
        case 'SECURITY':
            return Shield
        case 'SYSTEM':
            return Info
        case 'MARKETING':
            return Megaphone
        default:
            return Bell
    }
}

const formatTime = (time: string) => {
    return formatDateTime(time)
}

const resolveNotificationTarget = (link: string | null) => {
    const resolved = resolveNotificationLinkTarget(link, {
        allowAdminPaths: allowAdminNotificationTargets.value,
    })

    if (!resolved) {
        return undefined
    }

    return localePath(resolved)
}
</script>

<template>
    <div class="app-notifications">
        <CaomeiPopover>
            <CaomeiPopoverTrigger as-child>
                <AppTooltip :content="$t('components.notifications.title')" side="bottom">
                    <CaomeiButton
                        id="notification-btn"
                        variant="ghost"
                        rounded
                        icon-only
                        :badge="unreadCount > 0 ? unreadCount.toString() : undefined"
                        badge-tone="danger"
                        :label="$t('components.notifications.title')"
                    >
                        <template #icon>
                            <Bell :size="16" />
                        </template>
                    </CaomeiButton>
                </AppTooltip>
            </CaomeiPopoverTrigger>
            <CaomeiPopoverContent
                side="bottom"
                align="end"
                :style="{padding: 0}"
            >
                <div class="notification-popover">
                    <div class="notification-header">
                        <span class="title">{{ $t('components.notifications.title') }}</span>
                        <CaomeiButton
                            v-if="unreadCount > 0"
                            variant="ghost"
                            size="sm"
                            @click="handleMarkAsRead()"
                        >
                            {{ $t('components.notifications.mark_all_read') }}
                        </CaomeiButton>
                    </div>

                    <div class="notification-content">
                        <div
                            v-if="browserPushReady && browserPermission !== 'granted'"
                            class="notification-browser-state"
                        >
                            <CaomeiMessage
                                :tone="browserPermission === 'denied' ? 'warning' : 'neutral'"
                                :closable="false"
                            >
                                <div class="browser-state-content">
                                    <span>{{ browserPushHint }}</span>
                                    <CaomeiButton
                                        v-if="browserPermission === 'default'"
                                        size="sm"
                                        variant="ghost"
                                        :loading="enablingBrowserPush"
                                        @click.stop="handleEnableBrowserPush"
                                    >
                                        {{ $t('components.notifications.browser_enable') }}
                                    </CaomeiButton>
                                </div>
                            </CaomeiMessage>
                        </div>

                        <div
                            v-if="notifications.length === 0"
                            class="empty-state"
                        >
                            <Inbox :size="32" />
                            <p>{{ $t('components.notifications.empty') }}</p>
                        </div>

                        <ul
                            v-else
                            class="notification-list"
                        >
                            <li
                                v-for="item in notifications"
                                :key="item.id"
                                class="notification-item"
                                :class="{'is-unread': !item.isRead}"
                                @click="handleMarkAsRead(item.id)"
                            >
                                <div class="item-icon">
                                    <component :is="getNotificationIcon(item.type)" :size="14" />
                                </div>
                                <div class="item-body">
                                    <NuxtLink
                                        v-if="resolveNotificationTarget(item.link)"
                                        :to="resolveNotificationTarget(item.link)"
                                        class="item-title"
                                    >
                                        {{ item.title }}
                                    </NuxtLink>
                                    <span
                                        v-else
                                        class="item-title"
                                    >
                                        {{ item.title }}
                                    </span>
                                    <p class="item-text">
                                        {{ item.content }}
                                    </p>
                                    <span class="item-time">{{ formatTime(item.createdAt) }}</span>
                                </div>
                                <div
                                    v-if="!item.isRead"
                                    class="unread-dot"
                                />
                            </li>
                        </ul>
                    </div>

                    <div
                        v-if="notifications.length > 0"
                        class="notification-footer"
                    >
                        <NuxtLink :to="localePath('/settings?tab=notifications')">
                            {{ $t('components.notifications.view_all') }}
                        </NuxtLink>
                    </div>
                </div>
            </CaomeiPopoverContent>
        </CaomeiPopover>
    </div>
</template>

<style lang="scss" scoped>
.notification-popover {
    width: 320px;
    max-height: 480px;
    display: flex;
    flex-direction: column;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--caomei-color-border);

    .title {
        font-weight: 600;
        font-size: 1rem;
    }
}

.notification-content {
    flex: 1;
    overflow-y: auto;

    .notification-browser-state {
        padding: 12px 16px 0;

        :deep(.caomei-message) {
            margin: 0;
        }
    }

    .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: var(--caomei-color-text-muted);

        svg {
            margin-bottom: 8px;
        }
    }
}

.browser-state-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.notification-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.notification-item {
    display: flex;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;
    gap: 12px;

    &:hover {
        background-color: var(--m-surface-hover);
    }

    &.is-unread {
        background-color: var(--m-primary-50);

        .item-title {
            font-weight: 600;
        }
    }
}

.item-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--m-surface-0);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--caomei-color-border);
    flex-shrink: 0;

    svg {
        color: var(--m-primary-500);
    }
}

.item-body {
    flex: 1;
    min-width: 0;

    .item-title {
        display: block;
        font-size: 0.9rem;
        color: var(--caomei-color-text);
        margin-bottom: 4px;
        text-decoration: none;
        word-break: break-all;

        &:hover {
            color: var(--caomei-color-primary);
        }
    }

    .item-text {
        font-size: 0.8rem;
        color: var(--caomei-color-text-muted);
        margin: 0 0 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .item-time {
        font-size: 0.75rem;
        color: var(--caomei-color-text-muted);
    }
}

.unread-dot {
    width: 8px;
    height: 8px;
    background-color: var(--m-red-500);
    border-radius: 50%;
    position: absolute;
    right: 16px;
    top: 16px;
}

.notification-footer {
    padding: 12px;
    text-align: center;
    border-top: 1px solid var(--caomei-color-border);

    a {
        font-size: 0.85rem;
        color: var(--caomei-color-primary);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
