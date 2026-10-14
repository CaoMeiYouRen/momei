<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.external_links.title')" show-language-switcher>
            <template #actions>
                <CaomeiButton @click="openDialog()">
                    <template #icon>
                        <Plus :size="16" />
                    </template>
                    {{ $t('common.create') }}
                </CaomeiButton>
            </template>
        </AdminPageHeader>

        <div class="admin-content-card">
            <!-- 客户端分页：不传 `page` / 不设 `lazy`，由 caomei `DataTable` 按 `rows` 自持切片，
                 与迁移前 PrimeVue 表格消费整份 `value` 的行为一致。 -->
            <CaomeiDataTable
                :data="links"
                :columns="columns"
                :loading="loading"
                paginator
                :rows="10"
                class="admin-external-links__table"
            >
                <template #cell-shortCode="{row}">
                    <div class="flex gap-2 items-center">
                        <code class="short-code">{{ row.shortCode }}</code>
                        <CaomeiButton
                            v-tooltip="$t('common.copy')"
                            icon-only
                            variant="ghost"
                            rounded
                            size="sm"
                            :label="$t('common.copy')"
                            @click="copyShortCode(row.shortCode)"
                        >
                            <template #icon>
                                <Copy :size="16" />
                            </template>
                        </CaomeiButton>
                    </div>
                </template>

                <template #cell-originalUrl="{row}">
                    <div class="url-truncate" :title="row.originalUrl">
                        {{ row.originalUrl }}
                    </div>
                </template>

                <template #cell-status="{row}">
                    <CaomeiTag :tone="getExternalLinkStatusTone(row.status)">
                        {{ row.status }}
                    </CaomeiTag>
                </template>

                <template #cell-showRedirectPage="{row}">
                    <Check
                        v-if="row.showRedirectPage"
                        :size="16"
                        class="text-success"
                    />
                    <X
                        v-else
                        :size="16"
                        class="text-secondary"
                    />
                </template>

                <template #cell-actions="{row}">
                    <CaomeiButton
                        v-tooltip="$t('pages.admin.external_links.stats')"
                        icon-only
                        variant="ghost"
                        rounded
                        tone="primary"
                        :label="$t('pages.admin.external_links.stats')"
                        @click="showStats(row)"
                    >
                        <template #icon>
                            <ChartBar :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="primary"
                        :label="$t('common.edit')"
                        @click="openDialog(row)"
                    >
                        <template #icon>
                            <Pencil :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="danger"
                        :label="$t('common.delete')"
                        @click="confirmDeleteExternalLink(row)"
                    >
                        <template #icon>
                            <Trash :size="16" />
                        </template>
                    </CaomeiButton>
                </template>

                <template #empty>
                    <div class="empty-state">
                        {{ $t('pages.admin.external_links.empty') }}
                    </div>
                </template>
            </CaomeiDataTable>
        </div>

        <!-- 浮层显式豁免（迁移方案 §5.5）：Dialog / Checkbox / ConfirmDialog / v-tooltip 维持 PrimeVue 至第六十九阶段。
             其**内部**的 InputText / Select / Button 属批次在册族，须随本路由迁移，否则命中「在册族零残留」守卫。 -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-external-links__dialog admin-form-dialog admin-form-dialog--wide p-fluid"
        >
            <div class="field">
                <label for="originalUrl">{{ $t('pages.admin.external_links.original_url') }} *</label>
                <CaomeiInput
                    id="originalUrl"
                    v-model.trim="formData.originalUrl"
                    :placeholder="$t('pages.admin.external_links.url_placeholder')"
                    :invalid="Boolean(errors.originalUrl)"
                />
                <small v-if="errors.originalUrl" class="p-error">{{ errors.originalUrl }}</small>
            </div>

            <div class="field">
                <label for="metadata_title">{{ $t('common.title') }}</label>
                <CaomeiInput
                    id="metadata_title"
                    v-model.trim="formData.metadata.title"
                    :placeholder="$t('pages.admin.external_links.title_placeholder')"
                />
            </div>

            <div class="field">
                <label for="status">{{ $t('pages.admin.external_links.status') }} *</label>
                <CaomeiSelect
                    id="status"
                    v-model="formData.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    :invalid="Boolean(errors.status)"
                />
                <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
            </div>

            <div class="field flex gap-2 items-center">
                <Checkbox
                    v-model="formData.noFollow"
                    :binary="true"
                    input-id="noFollow"
                />
                <label for="noFollow" class="cursor-pointer">
                    {{ $t('pages.admin.external_links.no_follow') }}
                </label>
            </div>

            <div class="field flex gap-2 items-center">
                <Checkbox
                    v-model="formData.showRedirectPage"
                    :binary="true"
                    input-id="showRedirectPage"
                />
                <label for="showRedirectPage" class="cursor-pointer">
                    {{ $t('pages.admin.external_links.show_redirect_page') }}
                </label>
            </div>

            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="dialogVisible = false"
                >
                    {{ $t('common.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    :loading="saving"
                    @click="save"
                >
                    {{ $t('common.save') }}
                </CaomeiButton>
            </template>
        </Dialog>

        <!-- Stats Dialog -->
        <Dialog
            v-model:visible="statsDialogVisible"
            :header="$t('pages.admin.external_links.stats')"
            modal
            class="p-fluid"
        >
            <div v-if="currentStats" class="stats-container">
                <div class="stat-item">
                    <label>{{ $t('pages.admin.external_links.short_code') }}</label>
                    <div class="stat-value">
                        <code>{{ currentStats.shortCode }}</code>
                    </div>
                </div>
                <div class="stat-item">
                    <label>{{ $t('pages.admin.external_links.clicks') }}</label>
                    <div class="stat-value">
                        {{ currentStats.clickCount }}
                    </div>
                </div>
                <div class="stat-item">
                    <label>{{ $t('pages.admin.external_links.original_url') }}</label>
                    <div class="stat-value url-value">
                        {{ currentStats.originalUrl }}
                    </div>
                </div>
                <div class="stat-item">
                    <label>{{ $t('common.created_at') }}</label>
                    <div class="stat-value">
                        {{ formatDateTime(currentStats.createdAt, 'YYYY-MM-DD HH:mm') }}
                    </div>
                </div>
            </div>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ChartBar, Check, Copy, Pencil, Plus, Trash, X } from '@lucide/vue'
import { useConfirm } from 'primevue/useconfirm'
import type { DataTableColumn } from 'caomei-ui'
import { LinkStatus, type ExternalLinkMetadata } from '@/types/ad'

const { t } = useI18n()
const { formatDateTime } = useI18nDate()

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const confirm = useConfirm()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const loading = ref(true)
const links = ref<any[]>([])
const dialogVisible = ref(false)
const statsDialogVisible = ref(false)
const editingItem = ref<any>(null)
const saving = ref(false)
const currentStats = ref<any>(null)

const formData = reactive<{
    originalUrl: string
    status: LinkStatus
    noFollow: boolean
    showRedirectPage: boolean
    metadata: ExternalLinkMetadata
}>({
    originalUrl: '',
    status: LinkStatus.ACTIVE,
    noFollow: false,
    showRedirectPage: true,
    metadata: {},
})

const errors = reactive<Record<string, string>>({})

const statusOptions = computed(() => [
    { label: t('pages.admin.external_links.statuses.active'), value: LinkStatus.ACTIVE },
    { label: t('pages.admin.external_links.statuses.blocked'), value: LinkStatus.BLOCKED },
    { label: t('pages.admin.external_links.statuses.expired'), value: LinkStatus.EXPIRED },
])

// 列定义与迁移前 PrimeVue 列组件一一对应：默认取值的短码 / 原始链接 / 状态 / 点击次数 / 跳转页 / 动作。
// 不新增显式 `width`；动作列沿用迁移前声明的 `text-right` + `min-width: 8rem`（PrimeVue 的 `class` / `style`
// 同时落在表头与表体单元格，故此处以 `align: 'right'` + 双 style 等价还原，不改列宽与对齐）。
const columns = computed<DataTableColumn<any>[]>(() => [
    { key: 'shortCode', header: t('pages.admin.external_links.short_code') },
    { key: 'originalUrl', header: t('pages.admin.external_links.original_url') },
    { key: 'status', header: t('pages.admin.external_links.status') },
    { key: 'clickCount', header: t('pages.admin.external_links.clicks'), sortable: true },
    { key: 'showRedirectPage', header: t('pages.admin.external_links.show_redirect') },
    {
        key: 'actions',
        header: t('common.actions'),
        align: 'right',
        headerStyle: { minWidth: '8rem' },
        bodyStyle: { minWidth: '8rem' },
    },
])

async function loadLinks() {
    loading.value = true
    try {
        const response = await $fetch<any>('/api/admin/external-links')
        links.value = response.data || []
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.external_links.messages.load_failed' })
    } finally {
        loading.value = false
    }
}

function openDialog(item?: any) {
    editingItem.value = item || null

    if (item) {
        Object.assign(formData, {
            originalUrl: item.originalUrl,
            status: item.status,
            noFollow: item.noFollow,
            showRedirectPage: item.showRedirectPage,
            metadata: item.metadata || {},
        })
    } else {
        Object.assign(formData, {
            originalUrl: '',
            status: LinkStatus.ACTIVE,
            noFollow: false,
            showRedirectPage: true,
            metadata: {},
        })
    }

    Object.keys(errors).forEach((key) => delete errors[key])
    dialogVisible.value = true
}

async function save() {
    Object.keys(errors).forEach((key) => delete errors[key])

    if (!formData.originalUrl) {
        errors.originalUrl = t('pages.admin.external_links.messages.url_required')
    }

    if (Object.keys(errors).length > 0) {
        return
    }

    saving.value = true
    try {
        const url = editingItem.value
            ? `/api/admin/external-links/${editingItem.value.id}`
            : '/api/admin/external-links'

        const method = editingItem.value ? 'PUT' : 'POST'

        const body = { ...formData }

        await $fetch(url, {
            method,
            body,
        })

        showSuccessToast(
            editingItem.value
                ? 'pages.admin.external_links.messages.update_success'
                : 'pages.admin.external_links.messages.create_success',
        )

        dialogVisible.value = false
        await loadLinks()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.external_links.messages.save_failed' })
    } finally {
        saving.value = false
    }
}

function confirmDeleteExternalLink(item: any) {
    confirm.require({
        message: t('pages.admin.external_links.messages.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            void deleteItem(item)
        },
    })
}

async function deleteItem(item: any) {
    try {
        await $fetch(`/api/admin/external-links/${item.id}`, {
            method: 'DELETE',
        })

        showSuccessToast('pages.admin.external_links.messages.delete_success')

        await loadLinks()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.external_links.messages.delete_failed' })
    }
}

async function showStats(item: any) {
    try {
        const response = await $fetch<any>(`/api/admin/external-links/${item.id}/stats`)
        currentStats.value = response.data
        statsDialogVisible.value = true
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.external_links.messages.stats_failed' })
    }
}

function copyShortCode(code: string) {
    const url = `${window.location.origin}/goto/${code}`
    navigator.clipboard.writeText(url).then(() => {
        showSuccessToast('pages.admin.external_links.messages.copy_success', { life: 2000 })
    })
}

// caomei Tag 无 `severity`，改用 `tone`（迁移方案 §6.2 / §6.3 有意差异）：
// `success` / `danger` / `warning` 直接对应，PrimeVue `secondary` 取有损近似 `neutral`。
function getExternalLinkStatusTone(status: LinkStatus): 'success' | 'danger' | 'warning' | 'neutral' {
    switch (status) {
        case LinkStatus.ACTIVE:
            return 'success'
        case LinkStatus.BLOCKED:
            return 'danger'
        case LinkStatus.EXPIRED:
            return 'warning'
        default:
            return 'neutral'
    }
}

onMounted(() => {
    loadLinks()
})
</script>

<style scoped lang="scss">
.admin-external-links__table {
    // caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中）；用 0.4.0 起提供的
    // `--caomei-data-table-pagination-justify` token 保持迁移前布局（迁移不改几何）。
    --caomei-data-table-pagination-justify: center;
}

.short-code {
    background: var(--surface-ground);
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius);
    font-family: monospace;
}

.url-truncate {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stats-container {
    .stat-item {
        margin-bottom: 1rem;

        label {
            display: block;
            color: var(--text-color-secondary);
            margin-bottom: 0.25rem;
        }

        .stat-value {
            font-size: 1.1rem;
            font-weight: 500;

            code {
                background: var(--surface-ground);
                padding: 0.25rem 0.5rem;
                border-radius: var(--border-radius);
            }

            &.url-value {
                word-break: break-all;
            }
        }
    }
}
</style>
