<template>
    <div class="marketing-campaign-list">
        <DataTable
            :value="items"
            :loading="loading"
            paginator
            :rows="limit"
            :total-records="total"
            lazy
            class="marketing-campaign-list__table"
            @page="onPage($event)"
        >
            <template #header>
                <div class="marketing-campaign-list__header">
                    <h3 class="marketing-campaign-list__title">
                        {{ $t('pages.admin.marketing.campaign_list') }}
                    </h3>
                    <Button
                        icon="pi pi-refresh"
                        variant="text"
                        @click="loadData"
                    />
                </div>
            </template>

            <Column field="title" :header="$t('pages.admin.marketing.form.title')" />

            <Column :header="$t('pages.admin.marketing.stats.delivered')">
                <template #body="slotProps">
                    <div class="marketing-campaign-list__status">
                        <Tag v-if="slotProps.data.status === 'COMPLETED'" severity="success">
                            {{ $t('pages.admin.marketing.status.completed') }}
                        </Tag>
                        <Tag v-else-if="slotProps.data.status === 'SENDING'" severity="info">
                            <i class="marketing-campaign-list__status-icon pi pi-spin pi-spinner" /> {{ $t('pages.admin.marketing.status.sending') }}
                        </Tag>
                        <Tag v-else-if="slotProps.data.status === 'SCHEDULED'" severity="warn">
                            <i class="marketing-campaign-list__status-icon pi pi-calendar" /> {{ $t('pages.admin.marketing.status.scheduled') }}
                        </Tag>
                        <Tag v-else :severity="getStatusSeverity(slotProps.data.status)">
                            {{ $t(`pages.admin.marketing.status.${slotProps.data.status?.toLowerCase()}`) }}
                        </Tag>
                    </div>
                </template>
            </Column>

            <Column :header="$t('common.published_at')">
                <template #body="slotProps">
                    <span v-if="slotProps.data.status === 'SCHEDULED' && slotProps.data.scheduledAt">
                        {{ formatDate(slotProps.data.scheduledAt) }}
                    </span>
                    <span v-else>
                        {{ slotProps.data.sentAt ? formatDate(slotProps.data.sentAt) : '-' }}
                    </span>
                </template>
            </Column>

            <Column :header="$t('common.actions')" class="marketing-campaign-list__actions-column">
                <template #body="slotProps">
                    <div class="marketing-campaign-list__actions">
                        <Button
                            v-if="slotProps.data.status === 'DRAFT'"
                            v-tooltip.top="$t('pages.admin.marketing.actions.send_now')"
                            icon="pi pi-send"
                            severity="success"
                            size="small"
                            @click="handleSend(slotProps.data.id)"
                        />
                        <Button
                            icon="pi pi-pencil"
                            severity="secondary"
                            size="small"
                            @click="$emit('edit', slotProps.data.id)"
                        />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="marketing-campaign-list__empty">
                    {{ $t('common.no_data') }}
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import type { MarketingCampaign, PaginatedData } from '@/types/marketing'
import type { ApiResponse } from '@/types/api'

const { t } = useI18n()
const toast = useToast()
const { formatDate } = useI18nDate()

const items = ref<MarketingCampaign[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(true)

const loadData = async () => {
    loading.value = true
    try {
        const res = await $fetch<ApiResponse<PaginatedData<MarketingCampaign>>>('/api/admin/marketing/campaigns', {
            query: {
                page: page.value,
                limit: limit.value,
            },
        })
        items.value = res.data.items || []
        total.value = res.data.total || 0
    } catch (e) {
        console.error('Failed to load campaigns:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.error_loading'),
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

const onPage = (event: { page: number }) => {
    page.value = event.page + 1
    loadData()
}

const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'success'
        case 'SENDING': return 'info'
        case 'FAILED': return 'danger'
        case 'DRAFT': return 'secondary'
        default: return 'secondary'
    }
}

const handleSend = async (id: string) => {
    try {
        await $fetch(`/api/admin/marketing/campaigns/${id}/send`, {
            method: 'POST',
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.marketing.actions.send_success'),
            life: 3000,
        })
        loadData()
    } catch (e) {
        console.error('Failed to send campaign:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.admin.marketing.actions.send_failed'),
            life: 3000,
        })
    }
}

onMounted(() => {
    loadData()
})

defineEmits(['edit'])
defineExpose({ refresh: loadData })
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.marketing-campaign-list {
    margin-top: $spacing-md;

    &__table {
        border-radius: $border-radius-md;
        overflow: hidden;
        box-shadow: var(--p-card-shadow);
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-sm;
    }

    &__title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--p-text-color);
    }

    &__status {
        display: flex;
        align-items: center;
    }

    &__status-icon {
        margin-right: $spacing-xs;
    }

    &__actions-column {
        :deep(.p-column-header-content) {
            justify-content: flex-end;
        }
    }

    &__actions {
        display: flex;
        gap: $spacing-sm;
        justify-content: flex-end;
    }

    &__empty {
        padding: $spacing-xl;
        text-align: center;
        color: var(--p-text-color-secondary);
    }
}
</style>
