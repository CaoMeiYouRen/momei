<template>
    <div class="notification-delivery-log-list">
        <DataTable
            :value="items"
            :loading="loading"
            paginator
            lazy
            :rows="limit"
            :total-records="total"
            class="notification-delivery-log-list__table"
            @page="onPage"
        >
            <template #header>
                <div class="notification-delivery-log-list__header">
                    <div>
                        <h3 class="notification-delivery-log-list__title">
                            {{ $t('pages.admin.notifications.delivery_logs.title') }}
                        </h3>
                        <p class="notification-delivery-log-list__description">
                            {{ $t('pages.admin.notifications.delivery_logs.description') }}
                        </p>
                        <p v-if="demoPreview" class="notification-delivery-log-list__demo-note">
                            {{ $t('pages.admin.settings.system.demo_preview.description') }}
                        </p>
                    </div>

                    <Button
                        icon="pi pi-refresh"
                        variant="text"
                        :label="$t('pages.admin.notifications.delivery_logs.refresh')"
                        @click="loadLogs"
                    />
                </div>

                <div class="notification-delivery-log-list__filters">
                    <InputText
                        v-model="filters.recipient"
                        :placeholder="$t('pages.admin.notifications.delivery_logs.filters.recipient')"
                    />

                    <Select
                        v-model="filters.notificationType"
                        :options="notificationTypeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.notifications.delivery_logs.filters.type')"
                        show-clear
                    />

                    <Select
                        v-model="filters.channel"
                        :options="channelOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.notifications.delivery_logs.filters.channel')"
                        show-clear
                    />

                    <Select
                        v-model="filters.status"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.notifications.delivery_logs.filters.status')"
                        show-clear
                    />

                    <DatePicker
                        v-model="filters.startDate"
                        show-icon
                        icon-display="input"
                        date-format="yy-mm-dd"
                        :placeholder="$t('pages.admin.notifications.delivery_logs.filters.start_date')"
                    />

                    <DatePicker
                        v-model="filters.endDate"
                        show-icon
                        icon-display="input"
                        date-format="yy-mm-dd"
                        :placeholder="$t('pages.admin.notifications.delivery_logs.filters.end_date')"
                    />

                    <div class="notification-delivery-log-list__filter-actions">
                        <Button
                            :label="$t('pages.admin.notifications.delivery_logs.filters.apply')"
                            size="small"
                            @click="applyFilters"
                        />
                        <Button
                            :label="$t('pages.admin.notifications.delivery_logs.filters.reset')"
                            size="small"
                            severity="secondary"
                            variant="outlined"
                            @click="resetFilters"
                        />
                    </div>
                </div>
            </template>

            <Column :header="$t('pages.admin.notifications.delivery_logs.columns.sent_at')" class="notification-delivery-log-list__time-column">
                <template #body="slotProps">
                    {{ formatDateTime(slotProps.data.sentAt) }}
                </template>
            </Column>

            <Column :header="$t('pages.admin.notifications.delivery_logs.columns.type')">
                <template #body="slotProps">
                    <Tag :severity="getNotificationTypeSeverity(slotProps.data.notificationType)">
                        {{ translateNotificationType(slotProps.data.notificationType) }}
                    </Tag>
                </template>
            </Column>

            <Column :header="$t('pages.admin.notifications.delivery_logs.columns.channel')">
                <template #body="slotProps">
                    <Tag :severity="getChannelSeverity(slotProps.data.channel)">
                        {{ translateChannel(slotProps.data.channel) }}
                    </Tag>
                </template>
            </Column>

            <Column :header="$t('pages.admin.notifications.delivery_logs.columns.status')">
                <template #body="slotProps">
                    <Tag :severity="getStatusSeverity(slotProps.data.status)">
                        {{ translateStatus(slotProps.data.status) }}
                    </Tag>
                </template>
            </Column>

            <Column :header="$t('pages.admin.notifications.delivery_logs.columns.recipient')">
                <template #body="slotProps">
                    <div class="notification-delivery-log-list__recipient-cell">
                        <strong class="notification-delivery-log-list__recipient-primary">
                            {{ getRecipientPrimary(slotProps.data) }}
                        </strong>
                        <span
                            v-if="getRecipientSecondary(slotProps.data)"
                            class="notification-delivery-log-list__recipient-secondary"
                        >
                            {{ getRecipientSecondary(slotProps.data) }}
                        </span>
                        <div
                            v-if="slotProps.data.userId"
                            class="notification-delivery-log-list__recipient-id"
                        >
                            <span>{{ $t('pages.admin.notifications.delivery_logs.recipient.user_id') }}: {{ slotProps.data.userId }}</span>
                            <Button
                                icon="pi pi-copy"
                                text
                                size="small"
                                :aria-label="$t('pages.admin.notifications.delivery_logs.recipient.copy_id')"
                                @click="copyUserId(slotProps.data.userId)"
                            />
                        </div>
                    </div>
                </template>
            </Column>

            <Column :header="$t('pages.admin.notifications.delivery_logs.columns.title')">
                <template #body="slotProps">
                    <div class="notification-delivery-log-list__title-cell">
                        <strong>{{ slotProps.data.title }}</strong>
                        <NuxtLink
                            v-if="resolveNotificationTarget(slotProps.data.targetUrl)"
                            :to="resolveNotificationTarget(slotProps.data.targetUrl)"
                            class="notification-delivery-log-list__target"
                        >
                            {{ getNotificationTargetLabel(slotProps.data.targetUrl) }}
                        </NuxtLink>
                    </div>
                </template>
            </Column>

            <Column :header="$t('pages.admin.notifications.delivery_logs.columns.error')">
                <template #body="slotProps">
                    <span class="notification-delivery-log-list__error">
                        {{ slotProps.data.errorMessage || $t('pages.admin.notifications.delivery_logs.value_states.none') }}
                    </span>
                </template>
            </Column>

            <template #empty>
                <div class="notification-delivery-log-list__empty">
                    {{ $t('pages.admin.notifications.delivery_logs.empty') }}
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '@/types/api'
import type { NotificationDeliveryLogItem, NotificationDeliveryLogListData } from '@/types/notification'
import {
    NotificationDeliveryChannel,
    NotificationDeliveryStatus,
    NotificationType,
    resolveNotificationLinkTarget,
} from '@/utils/shared/notification'

const { $appFetch } = useAppApi()
const { formatDateTime } = useI18nDate()
const toast = useToast()
const { t } = useI18n()
const localePath = useLocalePath()

const items = ref<NotificationDeliveryLogItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(true)
const demoPreview = ref(false)

const filters = reactive({
    recipient: '',
    notificationType: null as NotificationType | null,
    channel: null as NotificationDeliveryChannel | null,
    status: null as NotificationDeliveryStatus | null,
    startDate: null as Date | null,
    endDate: null as Date | null,
})

type NotificationDeliveryLogResponse = ApiResponse<NotificationDeliveryLogListData>

const notificationTypeOptions = computed(() => Object.values(NotificationType).map((value) => ({
    label: translateNotificationType(value),
    value,
})))

const channelOptions = computed(() => Object.values(NotificationDeliveryChannel).map((value) => ({
    label: translateChannel(value),
    value,
})))

const statusOptions = computed(() => Object.values(NotificationDeliveryStatus).map((value) => ({
    label: translateStatus(value),
    value,
})))

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

function translateChannel(channel: string) {
    const key = `pages.admin.notifications.delivery_logs.channels.${channel.toLowerCase()}`
    const translated = t(key)
    return translated === key ? channel : translated
}

function translateStatus(status: string) {
    const key = `pages.admin.notifications.delivery_logs.statuses.${status.toLowerCase()}`
    const translated = t(key)
    return translated === key ? status : translated
}

function resolveNotificationTarget(link: string | null) {
    const resolved = resolveNotificationLinkTarget(link)

    if (!resolved) {
        return undefined
    }

    return localePath(resolved)
}

function getNotificationTargetLabel(link: string | null) {
    return resolveNotificationLinkTarget(link) || ''
}

function getRecipientPrimary(item: NotificationDeliveryLogItem) {
    return item.recipientName || item.recipientEmail || item.recipient || t('pages.admin.notifications.delivery_logs.value_states.unknown_user')
}

function getRecipientSecondary(item: NotificationDeliveryLogItem) {
    if (item.recipientEmail && item.recipientEmail !== item.recipientName) {
        return item.recipientEmail
    }

    if (item.recipient && item.recipient !== item.recipientName && item.recipient !== item.recipientEmail) {
        return item.recipient
    }

    return null
}

async function copyUserId(userId: string) {
    try {
        await navigator.clipboard.writeText(userId)
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.notifications.delivery_logs.recipient.copy_id_success'),
            life: 2000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.error_loading')),
            life: 3000,
        })
    }
}

function getNotificationTypeSeverity(type: string) {
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

function getChannelSeverity(channel: string) {
    switch (channel) {
        case 'EMAIL':
            return 'info'
        case 'WEB_PUSH':
            return 'warn'
        case 'SSE':
            return 'success'
        default:
            return 'secondary'
    }
}

function getStatusSeverity(status: string) {
    switch (status) {
        case 'SUCCESS':
            return 'success'
        case 'FAILED':
            return 'danger'
        default:
            return 'warn'
    }
}

async function loadLogs() {
    loading.value = true
    try {
        const response = await $appFetch<NotificationDeliveryLogResponse>('/api/admin/notifications/delivery-logs', {
            query: {
                page: page.value,
                limit: limit.value,
                recipient: filters.recipient || undefined,
                notificationType: filters.notificationType || undefined,
                channel: filters.channel || undefined,
                status: filters.status || undefined,
                startDate: filters.startDate?.toISOString(),
                endDate: filters.endDate?.toISOString(),
            },
        })

        items.value = response.data.items || []
        total.value = response.data.total || 0
        demoPreview.value = Boolean(response.data.demoPreview)
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

function applyFilters() {
    page.value = 1
    void loadLogs()
}

function resetFilters() {
    filters.recipient = ''
    filters.notificationType = null
    filters.channel = null
    filters.status = null
    filters.startDate = null
    filters.endDate = null
    page.value = 1
    void loadLogs()
}

function onPage(event: { page: number, rows: number }) {
    page.value = event.page + 1
    limit.value = event.rows
    void loadLogs()
}

onMounted(() => {
    void loadLogs()
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.notification-delivery-log-list {
    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: $spacing-md;
        margin-bottom: $spacing-md;

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

    &__demo-note {
        margin: $spacing-xs 0 0;
        color: var(--p-primary-600);
    }

    &__filters {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: $spacing-sm;
        margin-bottom: $spacing-md;

        @media (width <= 960px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (width <= 640px) {
            grid-template-columns: 1fr;
        }
    }

    &__filter-actions {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
    }

    &__title-cell {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__recipient-cell {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
        min-width: 0;
    }

    &__recipient-primary {
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    &__recipient-secondary {
        color: var(--p-text-muted-color);
        font-size: 0.85rem;
        overflow-wrap: anywhere;
    }

    &__recipient-id {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        color: var(--p-text-muted-color);
        font-size: 0.75rem;
        overflow-wrap: anywhere;
    }

    &__target {
        color: var(--p-primary-color);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__error {
        color: var(--p-text-muted-color);
        overflow-wrap: anywhere;
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
