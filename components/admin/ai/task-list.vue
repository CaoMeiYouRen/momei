<template>
    <div class="task-list-container">
        <div class="admin-filters">
            <div class="filters-search">
                <!-- 迁移前 `IconField` + `InputIcon` + `InputText`；§6.1 C 组：由 `CaomeiInput` 的 `#prefix` 承接。
                     宽度由 `.filters-search` 包装约束（caomei 字段默认 `width: 100%`）。 -->
                <CaomeiInput
                    v-model="filters.search"
                    :placeholder="$t('common.search')"
                    @update:model-value="$emit('filter-change')"
                >
                    <template #prefix>
                        <Search :size="16" />
                    </template>
                </CaomeiInput>
            </div>
            <div class="filters-actions">
                <!-- `show-clear` 保留；PrimeVue 专有的 `@change` → caomei 的 `@update:model-value`。 -->
                <CaomeiSelect
                    v-model="filters.type"
                    :options="taskTypes"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.ai.type')"
                    show-clear
                    @update:model-value="$emit('filter-change')"
                />
                <CaomeiSelect
                    v-model="filters.status"
                    :options="taskStatuses"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.ai.status')"
                    show-clear
                    @update:model-value="$emit('filter-change')"
                />
                <!-- 迁移前 `outlined` + `severity="danger"` + 纯图标且无可访问名：caomei 侧 `variant="secondary"` +
                     `tone="danger"` + `icon-only`，并按契约补 `:label` 可访问名。 -->
                <CaomeiButton
                    icon-only
                    variant="secondary"
                    tone="danger"
                    :label="$t('common.delete')"
                    :disabled="!selection.length"
                    @click="$emit('bulk-delete')"
                >
                    <template #icon>
                        <Trash2 :size="16" />
                    </template>
                </CaomeiButton>
            </div>
        </div>

        <!-- 懒加载服务端分页 + 行多选：`page` / `@page` 为 1 基受控值（由宿主 composable 归一），
             `selection-mode="multiple"` 由 `CaomeiDataTable` 内建首列（迁移前为 `<Column selection-mode="multiple" />`
             + `data-key="id"` → `row-key="id"`）。 -->
        <!-- 迁移前刷新按钮在 PrimeVue `DataTable` 的 `#header` 插槽内（表格容器内的右上角一行）；
             caomei `DataTable` **无** `#header` 插槽（插槽面为 `cell-*` / `header-*` / `empty` / `groupheader` /
             `expansion`），故同一 `.table-header` 结构改置于表格之上，保持「右对齐的单个刷新按钮」这一观感意图。 -->
        <div class="table-header">
            <CaomeiButton
                icon-only
                variant="ghost"
                tone="neutral"
                rounded
                :label="$t('common.refresh')"
                @click="$emit('refresh')"
            >
                <template #icon>
                    <RefreshCw :size="16" />
                </template>
            </CaomeiButton>
        </div>

        <CaomeiDataTable
            v-model:selection="selection"
            :data="tasks"
            :columns="columns"
            :loading="loading"
            lazy
            :total-records="total"
            :rows="pageSize"
            :page="page"
            paginator
            :rows-per-page-options="[10, 20, 50]"
            selection-mode="multiple"
            row-key="id"
            class="task-list__table"
            @page="$emit('page-change', $event)"
        >
            <template #cell-category="{row}">
                <CaomeiTag v-if="row.category" tone="neutral">
                    {{ $t(`pages.admin.ai.types.${row.category}`) }}
                </CaomeiTag>
                <span v-else>-</span>
            </template>

            <template #cell-type="{row}">
                <div class="type-cell">
                    <component :is="getTypeIcon(row.type)" :size="16" />
                    <span>{{ row.type ? $t(`pages.admin.ai.types.${row.type}`) : '-' }}</span>
                </div>
            </template>

            <template #cell-provider="{row}">
                <!-- `Tag` 无 `value` prop：可见文案写默认插槽；`severity="secondary" outlined` →
                     `tone="neutral"` + `variant="outline"`。 -->
                <CaomeiTag
                    v-if="row.provider"
                    tone="neutral"
                    variant="outline"
                >
                    {{ row.provider }}
                </CaomeiTag>
                <span v-else>-</span>
            </template>

            <template #cell-user="{row}">
                <div class="author-cell">
                    <!-- `:email` 必传：`AppAvatarV2` 在既无 `image` 也无 `email` 时会生成 ui-avatars 远程头像，
                         而迁移前 PrimeVue `Avatar` 的 `:label` 渲染的是**首字母**。补 `:email` 后回退走 gravatar
                         （与 `/admin/users`、`/admin/subscribers` 同口径），避免「首字母徽标 → 远程图片」的
                         未登记观感变化与逐行外部请求。 -->
                    <AppAvatarV2
                        v-if="row.user_image || row.user_name"
                        :image="row.user_image"
                        :name="row.user_name"
                        :email="row.user_email"
                        shape="circle"
                        size="normal"
                    />
                    <div class="author-info">
                        <span class="author-name">{{ row.user_name || 'Unknown' }}</span>
                        <small v-if="row.user_email" class="author-email">{{ row.user_email }}</small>
                    </div>
                </div>
            </template>

            <template #cell-status="{row}">
                <CaomeiTag v-if="row.status" :tone="getStatusTone(row.status)">
                    {{ $t(`pages.admin.ai.statuses.${row.status}`) }}
                </CaomeiTag>
                <span v-else>-</span>
            </template>

            <template #cell-quotaUnits="{row}">
                {{ formatDecimal(row.quotaUnits) }}
            </template>

            <template #cell-actualCost="{row}">
                {{ formatMoney(row.actualCost) }}
            </template>

            <template #cell-chargeStatus="{row}">
                <CaomeiTag v-if="row.chargeStatus" :tone="getChargeStatusTone(row.chargeStatus)">
                    {{ $t(`pages.admin.ai.charge_statuses.${row.chargeStatus}`) }}
                </CaomeiTag>
                <span v-else>-</span>
            </template>

            <template #cell-createdAt="{row}">
                {{ formatDateTime(row.createdAt) }}
            </template>

            <template #cell-actions="{row}">
                <div class="actions-cell">
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        tone="neutral"
                        rounded
                        :label="$t('pages.admin.ai.task_detail.title')"
                        @click="$emit('show-details', row)"
                    >
                        <template #icon>
                            <Eye :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        tone="danger"
                        rounded
                        :label="$t('common.delete')"
                        @click="$emit('delete', row)"
                    >
                        <template #icon>
                            <Trash2 :size="16" />
                        </template>
                    </CaomeiButton>
                </div>
            </template>
        </CaomeiDataTable>
    </div>
</template>

<script setup lang="ts">
import { AlignLeft, Eye, Image as ImageIcon, List, MessageSquare, Mic, RefreshCw, Search, Trash2, Volume2 } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import type { Component } from 'vue'
import { formatDecimal } from '@/utils/shared/number'
import { formatAICost } from '@/utils/shared/ai-cost'
import { getAIChargeStatusSeverity, getAITaskStatusSeverity } from '@/utils/shared/ai-admin'
import type { AdminAiPageEvent } from '@/composables/use-admin-ai-page'
import type {
    AIAdminTaskListFilters,
    AIAdminTaskListItem,
    AICostDisplay,
} from '@/types/ai'

const props = defineProps<{
    tasks: AIAdminTaskListItem[]
    total: number
    loading: boolean
    pageSize: number
    page: number
    costDisplay?: AICostDisplay | null
}>()

const selection = defineModel<AIAdminTaskListItem[]>('selection', { default: () => [] })
const filters = defineModel<AIAdminTaskListFilters>('filters', { required: true })

defineEmits<{
    (e: 'refresh'): void
    (e: 'page-change', event: AdminAiPageEvent): void
    (e: 'filter-change'): void
    (e: 'show-details', task: AIAdminTaskListItem): void
    (e: 'delete', task: AIAdminTaskListItem): void
    (e: 'bulk-delete'): void
}>()

const { t } = useI18n()
const { formatDateTime } = useI18nDate()
const formatMoney = (value: unknown) => formatAICost(value, props.costDisplay)

const taskTypes = computed(() => [
    { label: t('pages.admin.ai.types.text_generation'), value: 'text_generation' },
    { label: t('pages.admin.ai.types.image_generation'), value: 'image_generation' },
    { label: t('pages.admin.ai.types.tts'), value: 'tts' },
    { label: t('pages.admin.ai.types.podcast'), value: 'podcast' },
    { label: t('pages.admin.ai.types.transcription'), value: 'transcription' },
])

const taskStatuses = computed(() => [
    { label: t('pages.admin.ai.statuses.completed'), value: 'completed' },
    { label: t('pages.admin.ai.statuses.processing'), value: 'processing' },
    { label: t('pages.admin.ai.statuses.pending'), value: 'pending' },
    { label: t('pages.admin.ai.statuses.failed'), value: 'failed' },
])

/**
 * 任务类型图标：迁移前用 `getAITaskTypeIcon(type)` 返回 `pi pi-*` 字体图标类（该 util 同时服务未迁移的
 * 任务详情组件，故不改动共享实现），此处按同一分支顺序落在 **lucide 组件映射**上（图标随组件库迁移）。
 */
const TYPE_ICON_MAP: Record<string, Component> = {
    image_generation: ImageIcon,
    tts: Volume2,
    podcast: Mic,
    transcription: MessageSquare,
    text_generation: AlignLeft,
}

const getTypeIcon = (type: AIAdminTaskListItem['type']) => TYPE_ICON_MAP[String(type)] ?? AlignLeft

/**
 * 语义色映射（页面本地，不改共享 helper）：`getAITaskStatusSeverity` / `getAIChargeStatusSeverity`
 * 返回 PrimeVue `severity` 词表，且同时服务未迁移的任务详情组件；此处按迁移方案 §6.2 的
 * `severity → tone` 总则逐档转换（`info → primary`、`secondary / contrast → neutral` 为有损近似）。
 */
const getStatusTone = (status: AIAdminTaskListItem['status']) => {
    switch (getAITaskStatusSeverity(status)) {
        case 'success':
            return 'success'
        case 'danger':
            return 'danger'
        case 'info':
            return 'primary'
        default:
            return 'neutral'
    }
}

const getChargeStatusTone = (status: AIAdminTaskListItem['chargeStatus']) => {
    switch (getAIChargeStatusSeverity(status)) {
        case 'success':
            return 'success'
        case 'warning':
            return 'warning'
        default:
            return 'neutral'
    }
}

/**
 * 列定义与迁移前 PrimeVue 列组件一一对应（12 列：选择列由 `selection-mode` 内建 + 11 个数据列）。
 *
 * - `category` / `type` / `provider` / `user` / `status` / `quotaUnits` / `actualCost` / `chargeStatus` /
 *   `createdAt` / `actions` 沿用字段名作 key（`model` 列无插槽，直接由 accessor 渲染）。
 * - 迁移前的 `class="col-*"` 在本组件内**无对应样式规则**（scoped 样式只定义 `.type-cell` 等内部类），
 *   故不迁移（幻影类，与 `/admin/posts` 批次的 `hidden md:table-cell` 同口径登记）。
 */
const columns = computed<DataTableColumn<AIAdminTaskListItem>[]>(() => [
    { key: 'category', header: t('pages.admin.ai.category') },
    { key: 'type', header: t('pages.admin.ai.type') },
    { key: 'provider', header: t('pages.admin.ai.provider') },
    { key: 'model', header: t('pages.admin.ai.model') },
    { key: 'user', header: t('common.author') },
    { key: 'status', header: t('pages.admin.ai.status') },
    { key: 'quotaUnits', header: t('pages.admin.ai.quota_units') },
    { key: 'actualCost', header: t('pages.admin.ai.actual_cost') },
    { key: 'chargeStatus', header: t('pages.admin.ai.charge_status') },
    { key: 'createdAt', header: t('common.published_at') },
    { key: 'actions', header: t('common.actions'), headerClass: 'text-right', bodyClass: 'text-right' },
])
</script>

<style lang="scss" scoped>
.admin-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;

    .filters-search {
        flex: 1;
        min-width: 200px;

        // caomei 字段默认 `width: 100%`；迁移前该行由 PrimeVue `InputText` 撑满 `.filters-search`
        // （`.p-inputtext { width: 100% }` 本地规则），故保持同一意图。
        :deep(.caomei-input) {
            width: 100%;
        }
    }

    .filters-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }
}

.type-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg {
        flex-shrink: 0;
        color: var(--text-color-secondary);
    }
}

.author-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .author-info {
        display: flex;
        flex-direction: column;

        .author-name {
            font-weight: 600;
            font-size: 0.875rem;
        }

        .author-email {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }
    }
}

.actions-cell {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
}

.table-header {
    display: flex;
    justify-content: flex-end;
}
</style>
