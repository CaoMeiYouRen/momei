<template>
    <div class="marketing-campaign-list">
        <!-- 迁移前本行位于 PrimeVue `DataTable` 的 `#header` 插槽（表格容器内）；
             caomei `DataTable` **无** `#header` 插槽（插槽面为 `cell-*` / `header-*` / `empty` /
             `groupheader` / `expansion`），故同一结构改置于表格之上——上游反馈清单 §2.8 的第 2 个使用者。 -->
        <div class="marketing-campaign-list__header">
            <h3 class="marketing-campaign-list__title">
                {{ $t('pages.admin.marketing.campaign_list') }}
            </h3>
            <CaomeiButton
                icon-only
                variant="ghost"
                tone="neutral"
                rounded
                :label="$t('common.refresh')"
                @click="loadData"
            >
                <template #icon>
                    <RefreshCw :size="16" />
                </template>
            </CaomeiButton>
        </div>

        <!-- `:value` → `:data`；`@page` 载荷由 0 基切为 1 基（caomei 语义），故改受控 `:page`，
             下方的 `onPage` 不再做 `+1` 抬升（与其余路由的 `pageIndexBase: 1` 同口径）。 -->
        <CaomeiDataTable
            :data="items"
            :columns="columns"
            :loading="loading"
            paginator
            :rows="limit"
            :page="page"
            :total-records="total"
            lazy
            class="marketing-campaign-list__table"
            @page="onPage($event)"
        >
            <template #cell-status="{row}">
                <div class="marketing-campaign-list__status">
                    <CaomeiTag v-if="row.status === 'COMPLETED'" tone="success">
                        {{ $t('pages.admin.marketing.status.completed') }}
                    </CaomeiTag>
                    <CaomeiTag v-else-if="row.status === 'SENDING'" tone="primary">
                        <LoaderCircle :size="14" class="marketing-campaign-list__status-icon marketing-campaign-list__status-icon--spin" />
                        {{ $t('pages.admin.marketing.status.sending') }}
                    </CaomeiTag>
                    <CaomeiTag v-else-if="row.status === 'SCHEDULED'" tone="warning">
                        <Calendar :size="14" class="marketing-campaign-list__status-icon" />
                        {{ $t('pages.admin.marketing.status.scheduled') }}
                    </CaomeiTag>
                    <CaomeiTag v-else :tone="getCampaignStatusTone(row.status)">
                        {{ $t(`pages.admin.marketing.status.${row.status?.toLowerCase()}`) }}
                    </CaomeiTag>
                </div>
            </template>

            <template #cell-publishedAt="{row}">
                <span v-if="row.status === 'SCHEDULED' && row.scheduledAt">
                    {{ formatDate(row.scheduledAt) }}
                </span>
                <span v-else>
                    {{ row.sentAt ? formatDate(row.sentAt) : '-' }}
                </span>
            </template>

            <template #cell-actions="{row}">
                <div class="marketing-campaign-list__actions">
                    <CaomeiButton
                        v-if="row.status === 'DRAFT'"
                        v-tooltip.top="$t('pages.admin.marketing.actions.send_now')"
                        icon-only
                        size="sm"
                        tone="success"
                        :label="$t('pages.admin.marketing.actions.send_now')"
                        :loading="isProcessing(row.id)"
                        :disabled="isProcessing(row.id)"
                        @click="handleSend(row.id)"
                    >
                        <template #icon>
                            <Send :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="row.status === 'SCHEDULED'"
                        v-tooltip.top="$t('pages.admin.marketing.actions.cancel_scheduled')"
                        icon-only
                        size="sm"
                        tone="warning"
                        :label="$t('pages.admin.marketing.actions.cancel_scheduled')"
                        :loading="isProcessing(row.id)"
                        :disabled="isProcessing(row.id)"
                        @click="handleCancel(row.id)"
                    >
                        <template #icon>
                            <CircleStop :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="secondary"
                        tone="neutral"
                        size="sm"
                        :label="$t('common.edit')"
                        :disabled="isProcessing(row.id)"
                        @click="$emit('edit', row.id)"
                    >
                        <template #icon>
                            <Pencil :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="row.status !== 'SENDING'"
                        v-tooltip.top="$t('pages.admin.marketing.actions.delete')"
                        icon-only
                        size="sm"
                        tone="danger"
                        :label="$t('pages.admin.marketing.actions.delete')"
                        :loading="isProcessing(row.id)"
                        :disabled="isProcessing(row.id)"
                        @click="handleDelete(row.id)"
                    >
                        <template #icon>
                            <Trash2 :size="16" />
                        </template>
                    </CaomeiButton>
                </div>
            </template>

            <template #empty>
                <div class="marketing-campaign-list__empty">
                    {{ $t('common.no_data') }}
                </div>
            </template>
        </CaomeiDataTable>
    </div>
</template>

<script setup lang="ts">
import { Calendar, CircleStop, LoaderCircle, Pencil, RefreshCw, Send, Trash2 } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import type { MarketingCampaign, PaginatedData } from '@/types/marketing'
import type { ApiResponse } from '@/types/api'
import { useConfirm } from 'primevue/useconfirm'

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const { formatDate } = useI18nDate()
const emit = defineEmits(['edit', 'changed'])

const items = ref<MarketingCampaign[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(true)
const processingIds = ref<string[]>([])

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
    // caomei `DataTable` 的 `@page` 为 **1 基**（迁移前 PrimeVue 为 0 基，此处原先 `+1` 抬升）。
    page.value = event.page
    loadData()
}

const startProcessing = (id: string) => {
    if (!processingIds.value.includes(id)) {
        processingIds.value = [...processingIds.value, id]
    }
}

const stopProcessing = (id: string) => {
    processingIds.value = processingIds.value.filter((itemId) => itemId !== id)
}

const isProcessing = (id: string) => processingIds.value.includes(id)

/**
 * 列定义与迁移前的 4 个 `Column` 一一对应。
 *
 * - 首列有 `field="title"` → 无插槽，直接由 accessor 渲染；
 * - 其余三列在迁移前**无 `field`**（仅 body 插槽），故 key 为迁移期新取的语义名（`status` /
 *   `publishedAt` / `actions`）——注意 `DataTableColumn.key` **同时是默认取值字段**（accessor 缺省即 key，
 *   由 `#cell-{key}` 插槽的 `value` 暴露）；本处因提供了 `cell-*` 插槽，取值结果不参与渲染，
 *   且 4 列均未开 `sortable`，故不参与排序。若后续给某列开 `sortable` 或把真实字段名换成 key，需复核语义。
 * - `actions` 列用 caomei 原生 `align: 'right'` 取代迁移前的 `:deep(.p-column-header-content)
 *   { justify-content: flex-end }`（该 PrimeVue 内部类在 caomei 侧不存在）。
 */
const columns = computed<DataTableColumn<MarketingCampaign>[]>(() => [
    { key: 'title', header: t('pages.admin.marketing.form.title') },
    { key: 'status', header: t('pages.admin.marketing.stats.delivered') },
    { key: 'publishedAt', header: t('common.published_at') },
    { key: 'actions', header: t('common.actions'), align: 'right' },
])

/**
 * 语义色映射（页面本地，不改共享 helper）：按迁移方案 §6.2 的 `severity → tone` 总则逐档转换
 * （`secondary → neutral` 为有损近似）。迁移前的内联 `severity="success" | "info" | "warn"` 已随
 * 分支直接写成 `tone="success" | "primary" | "warning"`，此处只承接其余状态。
 */
const getCampaignStatusTone = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'success'
        case 'SENDING': return 'primary'
        case 'FAILED': return 'danger'
        case 'DRAFT': return 'neutral'
        default: return 'neutral'
    }
}

const handleSend = async (id: string) => {
    startProcessing(id)
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
    } finally {
        stopProcessing(id)
    }
}

const handleCancel = async (id: string) => {
    startProcessing(id)
    try {
        await $fetch(`/api/admin/marketing/campaigns/${id}/cancel`, {
            method: 'POST',
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.marketing.actions.cancel_success'),
            life: 3000,
        })
        await loadData()
        emit('changed')
    } catch (e) {
        console.error('Failed to cancel campaign:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.admin.marketing.actions.cancel_failed'),
            life: 3000,
        })
    } finally {
        stopProcessing(id)
    }
}

const handleDelete = (id: string) => {
    confirm.require({
        message: t('pages.admin.marketing.actions.delete_confirm_message'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            startProcessing(id)
            try {
                await $fetch(`/api/admin/marketing/campaigns/${id}`, {
                    method: 'DELETE',
                })
                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('pages.admin.marketing.actions.delete_success'),
                    life: 3000,
                })
                await loadData()
                emit('changed')
            } catch (e) {
                console.error('Failed to delete campaign:', e)
                toast.add({
                    severity: 'error',
                    summary: t('common.error'),
                    detail: t('pages.admin.marketing.actions.delete_failed'),
                    life: 3000,
                })
            } finally {
                stopProcessing(id)
            }
        },
    })
}

onMounted(() => {
    loadData()
})

defineExpose({ refresh: loadData })
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.marketing-campaign-list {
    margin-top: $spacing-md;

    &__table {
        border-radius: $border-radius-md;
        overflow: hidden;

        // 迁移前该表由 PrimeVue `DataTable` 渲染并沿用 `--p-card-shadow`（PrimeVue 卡片的同一 token，
        // 本页仍与 `Card` / `Dialog` 共存），保持同一取值以避免额外的未归因视觉差异。
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

        &--spin {
            // 迁移前为 primeicons 的 `pi-spin`（CSS 动画）；lucide 无内置动画，按同仓既有写法补本地关键帧。
            animation: marketing-campaign-list-spin 1s linear infinite;
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

@keyframes marketing-campaign-list-spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .marketing-campaign-list__status-icon--spin {
        animation: none;
    }
}
</style>
