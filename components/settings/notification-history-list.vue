<template>
    <div class="notification-history-list">
        <DataTable
            :value="items"
            :loading="loading"
            paginator
            lazy
            :rows="limit"
            :total-records="total"
            class="notification-history-list__table"
            @page="onPage"
        >
            <template #header>
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
                        <Button
                            v-if="hasUnread"
                            icon="pi pi-check"
                            variant="text"
                            :label="$t('pages.settings.notifications.history.mark_all_read')"
                            @click="markAllAsRead"
                        />
                        <Button
                            icon="pi pi-refresh"
                            variant="text"
                            :label="$t('pages.settings.notifications.history.refresh')"
                            @click="loadNotifications"
                        />
                    </div>
                </div>
            </template>

            <Column :header="$t('pages.settings.notifications.history.columns.time')" class="notification-history-list__time-column">
                <template #body="slotProps">
                    {{ formatDateTime(slotProps.data.createdAt) }}
                </template>
            </Column>

            <Column :header="$t('pages.settings.notifications.history.columns.type')">
                <template #body="slotProps">
                    <Tag :severity="getTypeSeverity(slotProps.data.type)">
                        {{ translateNotificationType(slotProps.data.type) }}
                    </Tag>
                </template>
            </Column>

            <Column :header="$t('pages.settings.notifications.history.columns.content')">
                <template #body="slotProps">
                    <div class="notification-history-list__content">
                        <strong>{{ slotProps.data.title }}</strong>
                        <p>{{ slotProps.data.content }}</p>
                    </div>
                </template>
            </Column>

            <Column :header="$t('pages.settings.notifications.history.columns.status')">
                <template #body="slotProps">
                    <Tag :severity="slotProps.data.isRead ? 'success' : 'warn'">
                        {{ slotProps.data.isRead
                            ? $t('pages.settings.notifications.history.status.read')
                            : $t('pages.settings.notifications.history.status.unread') }}
                    </Tag>
                </template>
            </Column>

            <Column :header="$t('pages.settings.notifications.history.columns.target')">
                <template #body="slotProps">
                    <NuxtLink
                        v-if="slotProps.data.link"
                        :to="localePath(slotProps.data.link)"
                        class="notification-history-list__target"
                    >
                        {{ $t('pages.settings.notifications.history.view_target') }}
                    </NuxtLink>
                    <span v-else class="notification-history-list__muted">-</span>
                </template>
            </Column>

            <Column :header="$t('pages.settings.notifications.history.columns.actions')">
                <template #body="slotProps">
                    <Button
                        v-if="!slotProps.data.isRead"
                        icon="pi pi-check-circle"
                        variant="text"
                        :label="$t('pages.settings.notifications.history.mark_read')"
                        @click="markSingleAsRead(slotProps.data.id)"
                    />
                    <span v-else class="notification-history-list__muted">-</span>
                </template>
            </Column>

            <template #empty>
                <div class="notification-history-list__empty">
                    {{ $t('pages.settings.notifications.history.empty') }}
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import type { NotificationHistoryResponseData, UserNotificationHistoryItem } from '@/types/notification'

const { $appFetch } = useAppApi()
const { formatDateTime } = useI18nDate()
const toast = useToast()
const { t } = useI18n()
const localePath = useLocalePath()

const items = ref<UserNotificationHistoryItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)

const hasUnread = computed(() => items.value.some((item) => !item.isRead))

function getErrorDetail(error: unknown, fallback: string) {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}

function translateNotificationType(type: string) {
    const key = `pages.settings.notifications.notification_types.${type.toLowerCase()}`
    const translated = t(key)
    return translated === key ? type : translated
}

function getTypeSeverity(type: string) {
    switch (type) {
        case 'SECURITY':
            return 'danger'
        case 'COMMENT_REPLY':
            return 'info'
        case 'MARKETING':
            return 'contrast'
        default:
            return 'secondary'
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
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.error_loading')),
            life: 3000,
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

function onPage(event: { page: number, rows: number }) {
    page.value = event.page + 1
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
