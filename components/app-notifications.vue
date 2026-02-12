<script setup lang="ts">
import { ref } from 'vue'
import { useNotifications } from '@/composables/use-notifications'
import type { Notification } from '@/composables/use-notifications'

const { notifications, unreadCount, markAsRead } = useNotifications()
const localePath = useLocalePath()
const op = ref()

const toggle = (event: any) => {
    op.value.toggle(event)
}

const handleMarkAsRead = async (id?: string) => {
    await markAsRead(id ? [id] : undefined)
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'COMMENT_REPLY':
            return 'pi pi-comment'
        case 'SECURITY':
            return 'pi pi-shield'
        case 'SYSTEM':
            return 'pi pi-info-circle'
        case 'MARKETING':
            return 'pi pi-megaphone'
        default:
            return 'pi pi-bell'
    }
}

const formatTime = (time: string) => {
    const date = new Date(time)
    return date.toLocaleString()
}
</script>

<template>
    <div class="app-notifications">
        <Button
            id="notification-btn"
            v-tooltip.bottom="$t('components.notifications.title')"
            icon="pi pi-bell"
            text
            rounded
            :badge="unreadCount > 0 ? unreadCount.toString() : undefined"
            badge-severity="danger"
            :aria-label="$t('components.notifications.title')"
            @click="toggle"
        />

        <Popover ref="op">
            <div class="notification-popover">
                <div class="notification-header">
                    <span class="title">{{ $t('components.notifications.title') }}</span>
                    <Button
                        v-if="unreadCount > 0"
                        :label="$t('components.notifications.mark_all_read')"
                        text
                        size="small"
                        @click="handleMarkAsRead()"
                    />
                </div>

                <div class="notification-content">
                    <div
                        v-if="notifications.length === 0"
                        class="empty-state"
                    >
                        <i class="pi pi-inbox" />
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
                                <i :class="getNotificationIcon(item.type)" />
                            </div>
                            <div class="item-body">
                                <NuxtLink
                                    v-if="item.link"
                                    :to="localePath(item.link)"
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
        </Popover>
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
    border-bottom: 1px solid var(--p-content-border-color);

    .title {
        font-weight: 600;
        font-size: 1rem;
    }
}

.notification-content {
    flex: 1;
    overflow-y: auto;

    .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: var(--p-text-muted-color);

        i {
            font-size: 2rem;
            margin-bottom: 8px;
        }
    }
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
        background-color: var(--p-content-hover-background);
    }

    &.is-unread {
        background-color: var(--p-primary-50);

        .item-title {
            font-weight: 600;
        }
    }
}

.item-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--p-content-background);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--p-content-border-color);
    flex-shrink: 0;

    i {
        font-size: 0.9rem;
        color: var(--p-primary-500);
    }
}

.item-body {
    flex: 1;
    min-width: 0;

    .item-title {
        display: block;
        font-size: 0.9rem;
        color: var(--p-text-color);
        margin-bottom: 4px;
        text-decoration: none;
        word-break: break-all;

        &:hover {
            color: var(--p-primary-color);
        }
    }

    .item-text {
        font-size: 0.8rem;
        color: var(--p-text-muted-color);
        margin: 0 0 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .item-time {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
    }
}

.unread-dot {
    width: 8px;
    height: 8px;
    background-color: var(--p-red-500);
    border-radius: 50%;
    position: absolute;
    right: 16px;
    top: 16px;
}

.notification-footer {
    padding: 12px;
    text-align: center;
    border-top: 1px solid var(--p-content-border-color);

    a {
        font-size: 0.85rem;
        color: var(--p-primary-color);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
