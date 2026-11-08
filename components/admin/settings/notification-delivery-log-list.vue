<template>
    <div class="notification-delivery-log-list">
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

            <CaomeiButton
                variant="ghost"
                :label="$t('common.refresh')"
                @click="loadLogs"
            >
                <template #icon>
                    <RefreshCw :size="16" />
                </template>
                {{ $t('common.refresh') }}
            </CaomeiButton>
        </div>

        <div class="notification-delivery-log-list__filters">
            <CaomeiInput
                v-model="filters.recipient"
                :placeholder="$t('pages.admin.notifications.delivery_logs.filters.recipient')"
            />

            <CaomeiSelect
                v-model="filters.notificationType"
                :options="notificationTypeOptions"
                option-label="label"
                option-value="value"
                :placeholder="$t('pages.admin.notifications.delivery_logs.filters.type')"
                show-clear
            />

            <CaomeiSelect
                v-model="filters.channel"
                :options="channelOptions"
                option-label="label"
                option-value="value"
                :placeholder="$t('pages.admin.notifications.delivery_logs.filters.channel')"
                show-clear
            />

            <CaomeiSelect
                v-model="filters.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                :placeholder="$t('pages.admin.notifications.delivery_logs.filters.status')"
                show-clear
            />

            <CaomeiDatePicker
                v-model="filters.startDate"
                date-format="yy-mm-dd"
                :placeholder="$t('pages.admin.notifications.delivery_logs.filters.start_date')"
            />

            <CaomeiDatePicker
                v-model="filters.endDate"
                date-format="yy-mm-dd"
                :placeholder="$t('pages.admin.notifications.delivery_logs.filters.end_date')"
            />

            <div class="notification-delivery-log-list__filter-actions">
                <CaomeiButton
                    size="sm"
                    :label="$t('pages.admin.notifications.delivery_logs.filters.apply')"
                    @click="applyFilters"
                >
                    {{ $t('pages.admin.notifications.delivery_logs.filters.apply') }}
                </CaomeiButton>
                <CaomeiButton
                    size="sm"
                    variant="secondary"
                    :label="$t('pages.admin.notifications.delivery_logs.filters.reset')"
                    @click="resetFilters"
                >
                    {{ $t('pages.admin.notifications.delivery_logs.filters.reset') }}
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
            class="notification-delivery-log-list__table"
            @page="onPage"
        >
            <template #cell-sentAt="{row}">
                {{ formatDateTime(row.sentAt) }}
            </template>

            <template #cell-type="{row}">
                <CaomeiTag :tone="getNotificationTypeTone(row.notificationType)">
                    {{ translateNotificationType(row.notificationType) }}
                </CaomeiTag>
            </template>

            <template #cell-channel="{row}">
                <CaomeiTag :tone="getChannelTone(row.channel)">
                    {{ translateChannel(row.channel) }}
                </CaomeiTag>
            </template>

            <template #cell-status="{row}">
                <CaomeiTag :tone="getNotificationDeliveryStatusTone(row.status)">
                    {{ translateStatus(row.status) }}
                </CaomeiTag>
            </template>

            <template #cell-recipient="{row}">
                <div class="notification-delivery-log-list__recipient-cell">
                    <strong class="notification-delivery-log-list__recipient-primary">
                        {{ getRecipientPrimary(row) }}
                    </strong>
                    <span
                        v-if="getRecipientSecondary(row)"
                        class="notification-delivery-log-list__recipient-secondary"
                    >
                        {{ getRecipientSecondary(row) }}
                    </span>
                    <div
                        v-if="row.userId"
                        class="notification-delivery-log-list__recipient-id"
                    >
                        <span>{{ $t('pages.admin.notifications.delivery_logs.recipient.user_id') }}: {{ row.userId }}</span>
                        <CaomeiButton
                            icon-only
                            variant="ghost"
                            size="sm"
                            :label="$t('pages.admin.notifications.delivery_logs.recipient.copy_id')"
                            @click="copyUserId(row.userId)"
                        >
                            <template #icon>
                                <Copy :size="14" />
                            </template>
                        </CaomeiButton>
                    </div>
                </div>
            </template>

            <template #cell-title="{row}">
                <div class="notification-delivery-log-list__title-cell">
                    <strong>{{ row.title }}</strong>
                    <NuxtLink
                        v-if="resolveNotificationTarget(row.targetUrl)"
                        :to="resolveNotificationTarget(row.targetUrl)"
                        class="notification-delivery-log-list__target"
                    >
                        {{ getNotificationTargetLabel(row.targetUrl) }}
                    </NuxtLink>
                </div>
            </template>

            <template #cell-error="{row}">
                <span class="notification-delivery-log-list__error">
                    {{ row.errorMessage || $t('pages.admin.notifications.delivery_logs.value_states.none') }}
                </span>
            </template>

            <template #empty>
                <div class="notification-delivery-log-list__empty">
                    {{ $t('pages.admin.notifications.delivery_logs.empty') }}
                </div>
            </template>
        </CaomeiDataTable>
    </div>
</template>

<script setup lang="ts">
import { Copy, RefreshCw } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import { useToast } from 'caomei-ui'
import type { ApiResponse } from '@/types/api'
import type { NotificationDeliveryLogItem, NotificationDeliveryLogListData } from '@/types/notification'
import {
    NotificationDeliveryChannel,
    NotificationDeliveryStatus,
    NotificationType,
    resolveNotificationLinkTarget,
} from '@/utils/shared/notification'
import { getErrorDetail } from '@/utils/shared/error-detail'

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

const filters = ref({
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
        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: t('pages.admin.notifications.delivery_logs.recipient.copy_id_success'),
            duration: 2000,
        })
    } catch (error) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: getErrorDetail(error, t('common.error_loading')),
            duration: 3000,
        })
    }
}

function getNotificationTypeTone(type: string) {
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

function getChannelTone(channel: string) {
    switch (channel) {
        case 'EMAIL':
            return 'primary'
        case 'WEB_PUSH':
            return 'warning'
        case 'SSE':
            return 'success'
        default:
            return 'neutral'
    }
}

function getNotificationDeliveryStatusTone(status: string) {
    switch (status) {
        case 'SUCCESS':
            return 'success'
        case 'FAILED':
            return 'danger'
        default:
            return 'warning'
    }
}

async function loadLogs() {
    loading.value = true
    try {
        const response = await $appFetch<NotificationDeliveryLogResponse>('/api/admin/notifications/delivery-logs', {
            query: {
                page: page.value,
                limit: limit.value,
                recipient: filters.value.recipient || undefined,
                notificationType: filters.value.notificationType || undefined,
                channel: filters.value.channel || undefined,
                status: filters.value.status || undefined,
                startDate: filters.value.startDate?.toISOString(),
                endDate: filters.value.endDate?.toISOString(),
            },
        })

        items.value = response.data.items || []
        total.value = response.data.total || 0
        demoPreview.value = Boolean(response.data.demoPreview)
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

const columns = computed<DataTableColumn<NotificationDeliveryLogItem>[]>(() => [
    { key: 'sentAt', header: t('pages.admin.notifications.delivery_logs.columns.sent_at'), headerClass: 'notification-delivery-log-list__time-column', bodyClass: 'notification-delivery-log-list__time-column' },
    { key: 'type', header: t('pages.admin.notifications.delivery_logs.columns.type') },
    { key: 'channel', header: t('pages.admin.notifications.delivery_logs.columns.channel') },
    { key: 'status', header: t('pages.admin.notifications.delivery_logs.columns.status') },
    { key: 'recipient', header: t('pages.admin.notifications.delivery_logs.columns.recipient') },
    { key: 'title', header: t('pages.admin.notifications.delivery_logs.columns.title') },
    { key: 'error', header: t('pages.admin.notifications.delivery_logs.columns.error') },
])

function applyFilters() {
    page.value = 1
    void loadLogs()
}

function resetFilters() {
    filters.value.recipient = ''
    filters.value.notificationType = null
    filters.value.channel = null
    filters.value.status = null
    filters.value.startDate = null
    filters.value.endDate = null
    page.value = 1
    void loadLogs()
}

function onPage(event: { page: number, rows: number }) {
    /* caomei 的 `@page` 是 1 基页码（迁移前 PrimeVue 为 0 基偏移）。 */
    page.value = event.page
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
        color: var(--caomei-color-text-muted);
        line-height: 1.6;
    }

    &__demo-note {
        margin: $spacing-xs 0 0;
        color: var(--m-primary-600);
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
        color: var(--caomei-color-text-muted);
        font-size: 0.85rem;
        overflow-wrap: anywhere;
    }

    &__recipient-id {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        color: var(--caomei-color-text-muted);
        font-size: 0.75rem;
        overflow-wrap: anywhere;
    }

    &__target {
        color: var(--caomei-color-primary);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__error {
        color: var(--caomei-color-text-muted);
        overflow-wrap: anywhere;
    }

    &__empty {
        padding: $spacing-lg;
        text-align: center;
        color: var(--caomei-color-text-muted);
    }

    &__time-column {
        min-width: 12rem;
    }
}
</style>
