<template>
    <div>
        <AdminListShell
            container-class="admin-page-container"
            card-class="admin-content-card"
            :title="$t('pages.admin.ad.campaigns.title')"
            show-language-switcher
        >
            <template #actions>
                <CaomeiButton @click="openDialog()">
                    <template #icon>
                        <Plus :size="16" />
                    </template>
                    {{ $t('common.create') }}
                </CaomeiButton>
            </template>

            <!-- 客户端分页：不传 `page` / 不设 `lazy`，由 caomei `DataTable` 按 `rows` 自持切片，
                 与迁移前 PrimeVue 表格消费整份 `value` 的行为一致。 -->
            <CaomeiDataTable
                :data="campaigns"
                :columns="columns"
                :loading="loading"
                paginator
                :rows="10"
                class="admin-campaigns__table"
            >
                <template #cell-status="{row}">
                    <CaomeiTag :tone="getAdCampaignStatusTone(row.status)">
                        {{ row.status }}
                    </CaomeiTag>
                </template>

                <template #cell-startDate="{row}">
                    {{ row.startDate ? formatDateTime(row.startDate, 'YYYY-MM-DD HH:mm') : '-' }}
                </template>

                <template #cell-endDate="{row}">
                    {{ row.endDate ? formatDateTime(row.endDate, 'YYYY-MM-DD HH:mm') : '-' }}
                </template>

                <template #cell-revenue="{row}">
                    ${{ row.revenue?.toFixed(2) || '0.00' }}
                </template>

                <template #cell-actions="{row}">
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
                        @click="confirmDeleteAdCampaign(row)"
                    >
                        <template #icon>
                            <Trash :size="16" />
                        </template>
                    </CaomeiButton>
                </template>

                <template #empty>
                    <AdminTableEmptyState :label="$t('pages.admin.ad.campaigns.empty')" />
                </template>
            </CaomeiDataTable>
        </AdminListShell>

        <!-- 浮层显式豁免（迁移方案 §5.5）：Dialog / ConfirmDialog / useConfirm 维持 PrimeVue 至第六十九阶段。
             其**内部**的 InputText / Dropdown / Button 属批次在册族，须随本路由迁移，否则命中「在册族零残留」守卫；
             `DatePicker` 不在 B2 在册族清单内（§5.5 显式豁免枚举），保持 PrimeVue 至表单 / 浮层批次；
             弹窗上的 `p-fluid` 亦为仍是 PrimeVue 的 `DatePicker` 保留，待其迁移后一并移除。 -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-campaigns__dialog admin-form-dialog admin-form-dialog--compact p-fluid"
        >
            <div class="field">
                <label for="name">{{ $t('common.name') }} *</label>
                <CaomeiInput
                    id="name"
                    v-model.trim="formData.name"
                    :invalid="Boolean(errors.name)"
                />
                <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>

            <div class="field">
                <label for="status">{{ $t('pages.admin.ad.campaigns.status') }} *</label>
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

            <div class="field">
                <label for="startDate">{{ $t('pages.admin.ad.campaigns.start_date') }}</label>
                <DatePicker
                    id="startDate"
                    v-model="formData.startDate"
                    show-time
                    hour-format="24"
                    :show-seconds="false"
                />
            </div>

            <div class="field">
                <label for="endDate">{{ $t('pages.admin.ad.campaigns.end_date') }}</label>
                <DatePicker
                    id="endDate"
                    v-model="formData.endDate"
                    show-time
                    hour-format="24"
                    :show-seconds="false"
                />
            </div>

            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="closeDialog()"
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

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { Pencil, Plus, Trash } from '@lucide/vue'
import { useConfirm } from 'primevue/useconfirm'
import type { DataTableColumn } from 'caomei-ui'
import { CampaignStatus, type AdCampaign } from '@/types/ad'

interface CampaignFormState {
    name: string
    status: CampaignStatus
    startDate: Date | null
    endDate: Date | null
}

const createEmptyForm = (): CampaignFormState => ({
    name: '',
    status: CampaignStatus.DRAFT,
    startDate: null,
    endDate: null,
})

const { t } = useI18n()
const { formatDateTime } = useI18nDate()

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const confirm = useConfirm()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const saving = ref(false)

const {
    items: campaigns,
    loading,
    refresh: loadCampaigns,
} = useAdminEntityList<AdCampaign>({
    loadItems: async () => {
        try {
            const response = await $fetch<{ data?: AdCampaign[] }>('/api/admin/ad/campaigns')
            return response.data || []
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.ad.campaigns.messages.load_failed' })
            throw error
        }
    },
})

const formData = reactive<CampaignFormState>(createEmptyForm())

const {
    dialogVisible,
    editingItem,
    errors,
    resetErrors,
    openDialog,
    closeDialog,
} = useAdminFormDialog<AdCampaign, CampaignFormState>({
    formData,
    createEmptyForm,
    assignItemToForm: (item, form) => {
        Object.assign(form, {
            name: item.name,
            status: item.status,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
        })
    },
})

const statusOptions = computed(() => [
    { label: t('pages.admin.ad.campaigns.statuses.draft'), value: CampaignStatus.DRAFT },
    { label: t('pages.admin.ad.campaigns.statuses.active'), value: CampaignStatus.ACTIVE },
    { label: t('pages.admin.ad.campaigns.statuses.paused'), value: CampaignStatus.PAUSED },
    { label: t('pages.admin.ad.campaigns.statuses.ended'), value: CampaignStatus.ENDED },
])

// 列定义与迁移前 PrimeVue 列组件一一对应：名称 / 状态 / 开始 / 结束 / 展示 / 点击 / 收益 / 动作。
// 不新增显式 `width`；动作列沿用迁移前声明的 `text-right` + `min-width: 8rem`（PrimeVue 的 `class` / `style`
// 同时落在表头与表体单元格，故以 `align: 'right'` + 双 style 等价还原，不改列宽与对齐）。
const columns = computed<DataTableColumn<AdCampaign>[]>(() => [
    { key: 'name', header: t('common.name'), sortable: true },
    { key: 'status', header: t('pages.admin.ad.campaigns.status') },
    { key: 'startDate', header: t('pages.admin.ad.campaigns.start_date') },
    { key: 'endDate', header: t('pages.admin.ad.campaigns.end_date') },
    { key: 'impressions', header: t('pages.admin.ad.campaigns.impressions'), sortable: true },
    { key: 'clicks', header: t('pages.admin.ad.campaigns.clicks'), sortable: true },
    { key: 'revenue', header: t('pages.admin.ad.campaigns.revenue') },
    {
        key: 'actions',
        header: t('common.actions'),
        align: 'right',
        headerStyle: { minWidth: '8rem' },
        bodyStyle: { minWidth: '8rem' },
    },
])

async function save() {
    resetErrors()

    if (!formData.name) {
        errors.name = t('pages.admin.ad.campaigns.messages.name_required')
    }

    if (Object.keys(errors).length > 0) {
        return
    }

    saving.value = true
    try {
        const url = editingItem.value
            ? `/api/admin/ad/campaigns/${editingItem.value.id}`
            : '/api/admin/ad/campaigns'

        const method = editingItem.value ? 'PUT' : 'POST'

        await $fetch(url, {
            method,
            body: {
                ...formData,
                targeting: {},
                impressions: 0,
                clicks: 0,
                revenue: 0,
            },
        })

        showSuccessToast(
            editingItem.value
                ? 'pages.admin.ad.campaigns.messages.update_success'
                : 'pages.admin.ad.campaigns.messages.create_success',
        )

        closeDialog()
        await loadCampaigns()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.ad.campaigns.messages.save_failed' })
    } finally {
        saving.value = false
    }
}

function confirmDeleteAdCampaign(item: AdCampaign) {
    confirm.require({
        message: t('pages.admin.ad.campaigns.messages.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            void deleteItem(item)
        },
    })
}

async function deleteItem(item: AdCampaign) {
    try {
        await $fetch(`/api/admin/ad/campaigns/${item.id}`, {
            method: 'DELETE',
        })

        showSuccessToast('pages.admin.ad.campaigns.messages.delete_success')

        await loadCampaigns()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.ad.campaigns.messages.delete_failed' })
    }
}

// caomei Tag 无 `severity`，改用 `tone`（迁移方案 §6.2 / §6.3 有意差异）：
// `success` / `warning` / `danger` 直接对应，PrimeVue `secondary` 取有损近似 `neutral`。
function getAdCampaignStatusTone(status: CampaignStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
        case CampaignStatus.ACTIVE:
            return 'success'
        case CampaignStatus.PAUSED:
            return 'warning'
        case CampaignStatus.ENDED:
            return 'danger'
        default:
            return 'neutral'
    }
}
</script>

<style scoped lang="scss">
.admin-campaigns {
    // caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中）；用 0.4.0 起提供的
    // `--caomei-data-table-pagination-justify` token 保持迁移前布局（迁移不改几何）。
    &__table {
        --caomei-data-table-pagination-justify: center;
    }
}
</style>
