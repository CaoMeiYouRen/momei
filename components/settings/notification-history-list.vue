<template>
    <div class="notification-history-list">
        <div class="notification-history-list__header">
            <div>
                <h3 class="notification-history-list__title">
                    {{ $t('pages.settings.notifications.history.title') }}
                </h3>
                <p class="notification-history-list__description">
                    {{ $t('pages.settings.notifications.history.description') }}
                </p>
            </div>

            <div class="notification-history-list__actions">
                <CaomeiButton
                    v-if="hasUnread"
                    variant="ghost"
                    :label="$t('pages.settings.notifications.history.mark_all_read')"
                    @click="markAllAsRead"
                >
                    <template #icon>
                        <Check :size="16" />
                    </template>
                    {{ $t('pages.settings.notifications.history.mark_all_read') }}
                </CaomeiButton>
                <CaomeiButton
                    variant="ghost"
                    :label="$t('common.refresh')"
                    @click="loadNotifications"
                >
                    <template #icon>
                        <RefreshCw :size="16" />
                    </template>
                    {{ $t('common.refresh') }}
                </CaomeiButton>
            </div>
        </div>

        <CaomeiDataTable
            :data="items"
            :columns="columns"
            :loading="loading"
            paginator
            lazy
            :page="page"
            :rows="limit"
            :total-records="total"
            class="notification-history-list__table"
            @page="onPage"
        >
            <template #cell-createdAt="{row}">
                {{ formatDateTime(row.createdAt) }}
            </template>

            <template #cell-type="{row}">
                <CaomeiTag :tone="getTypeTone(row.type)">
                    {{ translateNotificationType(row.type) }}
                </CaomeiTag>
            </template>

            <template #cell-content="{row}">
                <div class="notification-history-list__content">
                    <strong>{{ row.title }}</strong>
                    <p>{{ row.content }}</p>
                </div>
            </template>

            <template #cell-isRead="{row}">
                <CaomeiTag :tone="row.isRead ? 'success' : 'warning'">
                    {{ row.isRead
                        ? $t('pages.settings.notifications.history.status.read')
                        : $t('pages.settings.notifications.history.status.unread') }}
                </CaomeiTag>
            </template>

            <template #cell-target="{row}">
                <NuxtLink
                    v-if="resolveNotificationTarget(row.link)"
                    :to="resolveNotificationTarget(row.link)"
                    class="notification-history-list__target"
                >
                    {{ $t('pages.settings.notifications.history.view_target') }}
                </NuxtLink>
                <span v-else class="notification-history-list__muted">-</span>
            </template>

            <template #cell-actions="{row}">
                <CaomeiButton
                    v-if="!row.isRead"
                    variant="ghost"
                    :label="$t('pages.settings.notifications.history.mark_read')"
                    @click="markSingleAsRead(row.id)"
                >
                    <template #icon>
                        <CheckCircle2 :size="16" />
                    </template>
                    {{ $t('pages.settings.notifications.history.mark_read') }}
                </CaomeiButton>
                <span v-else class="notification-history-list__muted">-</span>
            </template>

            <template #empty>
                <div class="notification-history-list__empty">
                    {{ $t('pages.settings.notifications.history.empty') }}
                </div>
            </template>
        </CaomeiDataTable>
    </div>
</template>

<script setup lang="ts">
import { Check, CheckCircle2, RefreshCw } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import type { NotificationHistoryResponseData, UserNotificationHistoryItem } from '@/types/notification'
import { resolveNotificationLinkTarget } from '@/utils/shared/notification'
import { isAdmin } from '@/utils/shared/roles'
import { getErrorDetail } from '@/utils/shared/error-detail'

const { $appFetch } = useAppApi()
const { formatDateTime } = useI18nDate()
const toast = useToast()
const { t } = useI18n()
const localePath = useLocalePath()
const session = authClient.useSession()

const items = ref<UserNotificationHistoryItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)

const hasUnread = computed(() => items.value.some((item) => !item.isRead))
const allowAdminNotificationTargets = computed(() => isAdmin(session.value?.data?.user?.role))

function resolveNotificationTarget(link: string | null) {
    const resolved = resolveNotificationLinkTarget(link, {
        allowAdminPaths: allowAdminNotificationTargets.value,
    })

    if (!resolved) {
        return undefined
    }

    return localePath(resolved)
}

function translateNotificationType(type: string) {
    const key = `pages.settings.notifications.notification_types.${type.toLowerCase()}`
    const translated = t(key)
    return translated === key ? type : translated
}

function getTypeTone(type: string) {
    switch (type) {
        case 'SECURITY':
            return 'danger'
        case 'COMMENT_REPLY':
            return 'primary'
        case 'MARKETING':
            return 'neutral'
        default:
            return 'neutral'
    }
}

async function loadNotifications() {
    loading.value = true
    try {
        const response = await $appFetch<NotificationHistoryResponseData>('/api/notifications', {
            query: {
                page: page.value,
                limit: limit.value,
                unreadOnly: false,
            },
        })

        items.value = response.items || []
        total.value = response.total || 0
    } catch (error) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: getErrorDetail(error, t('common.error_loading')),
            duration: 3000,
        })
    } finally {
        loading.value = false
    }
}

async function markSingleAsRead(id: string) {
    await $appFetch('/api/notifications/read', {
        method: 'PUT',
        body: { ids: [id] },
    })
    await loadNotifications()
}

async function markAllAsRead() {
    await $appFetch('/api/notifications/read', {
        method: 'PUT',
        body: {},
    })
    await loadNotifications()
}

const columns = computed<DataTableColumn<UserNotificationHistoryItem>[]>(() => [
    { key: 'createdAt', header: t('pages.settings.notifications.history.columns.time'), headerClass: 'notification-history-list__time-column', bodyClass: 'notification-history-list__time-column' },
    { key: 'type', header: t('pages.settings.notifications.history.columns.type') },
    { key: 'content', header: t('pages.settings.notifications.history.columns.content') },
    { key: 'isRead', header: t('pages.settings.notifications.history.columns.status') },
    { key: 'target', header: t('pages.settings.notifications.history.columns.target') },
    { key: 'actions', header: t('common.actions') },
])

function onPage(event: { page: number, rows: number }) {
    /* caomei 的 `@page` 是 1 基页码（迁移前 PrimeVue 为 0 基偏移）。 */
    page.value = event.page
    limit.value = event.rows
    void loadNotifications()
}

onMounted(() => {
    void loadNotifications()
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.notification-history-list {
    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: $spacing-md;

        @media (width <= 768px) {
            flex-direction: column;
        }
    }

    &__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    &__description {
        margin: $spacing-xs 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__actions {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
    }

    &__content {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;

        p {
            margin: 0;
            color: var(--p-text-muted-color);
            white-space: pre-wrap;
        }
    }

    &__target {
        color: var(--p-primary-color);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__muted {
        color: var(--p-text-muted-color);
    }

    &__empty {
        padding: $spacing-lg;
        text-align: center;
        color: var(--p-text-muted-color);
    }

    &__time-column {
        min-width: 12rem;
    }
}
</style>
