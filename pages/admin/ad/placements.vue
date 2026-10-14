<template>
    <div>
        <AdminListShell
            container-class="admin-page-container"
            card-class="admin-content-card"
            :title="$t('pages.admin.ad.placements.title')"
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
                :data="placements"
                :columns="columns"
                :loading="loading"
                paginator
                :rows="10"
                class="admin-placements__table"
            >
                <template #cell-location="{row}">
                    <CaomeiTag tone="neutral">
                        {{ row.location }}
                    </CaomeiTag>
                </template>

                <template #cell-format="{row}">
                    <CaomeiTag tone="primary">
                        {{ row.format }}
                    </CaomeiTag>
                </template>

                <template #cell-adapterId="{row}">
                    {{ getAdapterName(row.adapterId) }}
                </template>

                <template #cell-enabled="{row}">
                    <CaomeiTag :tone="row.enabled ? 'success' : 'danger'">
                        {{ row.enabled ? $t('pages.admin.ad.placements.enabled') : $t('pages.admin.ad.placements.disabled') }}
                    </CaomeiTag>
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
                    <!-- 迁移前该按钮为无可见文本 / 无可访问名的纯图标按钮（`:icon` 在 eye / eye-slash
                         之间动态切换）。迁移到 caomei `CaomeiButton icon-only` 时按库契约补齐可访问名
                         （`iconOnly` 要求 `label`），故新增 actions.enable / actions.disable 两个 i18n 键。 -->
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="warning"
                        :label="row.enabled ? $t('pages.admin.ad.placements.actions.disable') : $t('pages.admin.ad.placements.actions.enable')"
                        @click="toggleEnabled(row)"
                    >
                        <template #icon>
                            <EyeOff v-if="row.enabled" :size="16" />
                            <Eye v-else :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="danger"
                        :label="$t('common.delete')"
                        @click="confirmDeletePlacement(row)"
                    >
                        <template #icon>
                            <Trash :size="16" />
                        </template>
                    </CaomeiButton>
                </template>

                <template #empty>
                    <AdminTableEmptyState :label="$t('pages.admin.ad.placements.empty')" />
                </template>
            </CaomeiDataTable>
        </AdminListShell>

        <!-- 浮层显式豁免（迁移方案 §5.5）：Dialog / ConfirmDialog / useConfirm 维持 PrimeVue 至第六十九阶段。
             其**内部**的 InputText / Dropdown / Button 属批次在册族，须随本路由迁移，否则命中「在册族零残留」守卫；
             `InputNumber` / `Checkbox` 不在 B2 在册族清单内（§5.5 显式豁免枚举），保持 PrimeVue 至表单批次。
             弹窗 class 上的 `p-fluid` 是迁移前既有写法：实测构建产物中**不存在 `.p-fluid` 规则**（PrimeVue 4
             只注册类名不产样式），字段全宽由 `styles/main.scss` 的 `.p-inputtext/.p-select/.p-inputnumber/
             .p-datepicker { width: 100% }` 提供；本批按「最小改动」原样保留，死类清理与 `admin-placements__dialog`
             一并登记在 backlog 的迁移期幻影类收尾项。 -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-form-dialog admin-placements__dialog p-fluid"
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
                <label for="location">{{ $t('pages.admin.ad.placements.location') }} *</label>
                <CaomeiSelect
                    id="location"
                    v-model="formData.location"
                    :options="locationOptions"
                    option-label="label"
                    option-value="value"
                    :invalid="Boolean(errors.location)"
                />
                <small v-if="errors.location" class="p-error">{{ errors.location }}</small>
            </div>

            <div class="field">
                <label for="format">{{ $t('pages.admin.ad.placements.format') }} *</label>
                <CaomeiSelect
                    id="format"
                    v-model="formData.format"
                    :options="formatOptions"
                    option-label="label"
                    option-value="value"
                    :invalid="Boolean(errors.format)"
                />
                <small v-if="errors.format" class="p-error">{{ errors.format }}</small>
            </div>

            <div class="field">
                <label for="adapterId">{{ $t('pages.admin.ad.placements.adapter') }} *</label>
                <CaomeiSelect
                    id="adapterId"
                    v-model="formData.adapterId"
                    :options="adapterOptions"
                    option-label="name"
                    option-value="id"
                    :invalid="Boolean(errors.adapterId)"
                />
                <small v-if="errors.adapterId" class="p-error">{{ errors.adapterId }}</small>
            </div>

            <div class="field">
                <label for="metadata_slot">{{ $t('pages.admin.ad.placements.slot_id') }}</label>
                <CaomeiInput
                    id="metadata_slot"
                    v-model.trim="formData.metadata.slot"
                    :placeholder="$t('pages.admin.ad.placements.slot_id_placeholder')"
                />
                <small class="text-color-secondary">{{ $t('pages.admin.ad.placements.slot_id_hint') }}</small>
            </div>

            <div class="field">
                <label for="priority">{{ $t('pages.admin.ad.placements.priority') }}</label>
                <InputNumber
                    id="priority"
                    v-model="formData.priority"
                    :min="0"
                    :max="100"
                />
            </div>

            <div class="field flex gap-2 items-center">
                <Checkbox
                    v-model="formData.enabled"
                    :binary="true"
                    input-id="enabled"
                />
                <label for="enabled" class="cursor-pointer">{{ $t('pages.admin.ad.placements.enabled') }}</label>
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
import { Eye, EyeOff, Pencil, Plus, Trash } from '@lucide/vue'
import { useConfirm } from 'primevue/useconfirm'
import type { DataTableColumn } from 'caomei-ui'
import { AdFormat, AdLocation, type AdPlacement, type AdPlacementMetadata } from '@/types/ad'

interface PlacementFormState {
    name: string
    location: AdLocation
    format: AdFormat
    adapterId: string
    metadata: AdPlacementMetadata
    priority: number
    enabled: boolean
}

const createEmptyForm = (): PlacementFormState => ({
    name: '',
    location: AdLocation.SIDEBAR,
    format: AdFormat.RESPONSIVE,
    adapterId: 'adsense',
    metadata: {},
    priority: 0,
    enabled: true,
})

const { t } = useI18n()

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const confirm = useConfirm()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const saving = ref(false)

const {
    items: placements,
    loading,
    refresh: loadPlacements,
} = useAdminEntityList<AdPlacement>({
    loadItems: async () => {
        try {
            const response = await $fetch<{ data?: AdPlacement[] }>('/api/admin/ad/placements')
            return response.data || []
        } catch (error) {
            showErrorToast(error, { fallbackKey: 'pages.admin.ad.placements.messages.load_failed' })
            throw error
        }
    },
})

const formData = reactive<PlacementFormState>(createEmptyForm())

const {
    dialogVisible,
    editingItem,
    errors,
    resetErrors,
    openDialog,
    closeDialog,
} = useAdminFormDialog<AdPlacement, PlacementFormState>({
    formData,
    createEmptyForm,
    assignItemToForm: (item, form) => {
        Object.assign(form, {
            name: item.name,
            location: item.location,
            format: item.format,
            adapterId: item.adapterId,
            metadata: item.metadata || {},
            priority: item.priority,
            enabled: item.enabled,
        })
    },
})

const adapterOptions = [
    { id: 'adsense', name: 'Google AdSense' },
    { id: 'baidu', name: '百度联盟' },
    { id: 'tencent', name: '腾讯广告 (广点通)' },
]

const locationOptions = computed(() => [
    { label: t('pages.admin.ad.placements.locations.header'), value: AdLocation.HEADER },
    { label: t('pages.admin.ad.placements.locations.sidebar'), value: AdLocation.SIDEBAR },
    { label: t('pages.admin.ad.placements.locations.content_top'), value: AdLocation.CONTENT_TOP },
    { label: t('pages.admin.ad.placements.locations.content_middle'), value: AdLocation.CONTENT_MIDDLE },
    { label: t('pages.admin.ad.placements.locations.content_bottom'), value: AdLocation.CONTENT_BOTTOM },
    { label: t('pages.admin.ad.placements.locations.footer'), value: AdLocation.FOOTER },
])

const formatOptions = computed(() => [
    { label: t('pages.admin.ad.placements.formats.display'), value: AdFormat.DISPLAY },
    { label: t('pages.admin.ad.placements.formats.native'), value: AdFormat.NATIVE },
    { label: t('pages.admin.ad.placements.formats.video'), value: AdFormat.VIDEO },
    { label: t('pages.admin.ad.placements.formats.responsive'), value: AdFormat.RESPONSIVE },
])

// 列定义与迁移前 PrimeVue 列组件一一对应：名称 / 位置 / 格式 / 适配器 / 状态 / 优先级 / 动作。
// 不新增显式 `width`；动作列沿用迁移前声明的 `text-right` + `min-width: 8rem`（PrimeVue 的 `class` / `style`
// 同时落在表头与表体单元格，故以 `align: 'right'` + 双 style 等价还原，不改列宽与对齐）。
const columns = computed<DataTableColumn<AdPlacement>[]>(() => [
    { key: 'name', header: t('common.name'), sortable: true },
    { key: 'location', header: t('pages.admin.ad.placements.location') },
    { key: 'format', header: t('pages.admin.ad.placements.format') },
    { key: 'adapterId', header: t('pages.admin.ad.placements.adapter') },
    { key: 'enabled', header: t('pages.admin.ad.placements.status') },
    { key: 'priority', header: t('pages.admin.ad.placements.priority'), sortable: true },
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
        errors.name = t('pages.admin.ad.placements.messages.name_required')
    }
    if (!formData.location) {
        errors.location = t('pages.admin.ad.placements.messages.location_required')
    }
    if (!formData.format) {
        errors.format = t('pages.admin.ad.placements.messages.format_required')
    }
    if (!formData.adapterId) {
        errors.adapterId = t('pages.admin.ad.placements.messages.adapter_required')
    }

    if (Object.keys(errors).length > 0) {
        return
    }

    saving.value = true
    try {
        const url = editingItem.value
            ? `/api/admin/ad/placements/${editingItem.value.id}`
            : '/api/admin/ad/placements'

        const method = editingItem.value ? 'PUT' : 'POST'

        await $fetch(url, {
            method,
            body: formData,
        })

        showSuccessToast(
            editingItem.value
                ? 'pages.admin.ad.placements.messages.update_success'
                : 'pages.admin.ad.placements.messages.create_success',
        )

        closeDialog()
        await loadPlacements()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.ad.placements.messages.save_failed' })
    } finally {
        saving.value = false
    }
}

function confirmDeletePlacement(item: AdPlacement) {
    confirm.require({
        message: t('pages.admin.ad.placements.messages.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            void deleteItem(item)
        },
    })
}

async function deleteItem(item: AdPlacement) {
    try {
        await $fetch(`/api/admin/ad/placements/${item.id}`, {
            method: 'DELETE',
        })

        showSuccessToast('pages.admin.ad.placements.messages.delete_success')

        await loadPlacements()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.ad.placements.messages.delete_failed' })
    }
}

async function toggleEnabled(item: AdPlacement) {
    try {
        await $fetch(`/api/admin/ad/placements/${item.id}`, {
            method: 'PUT',
            body: {
                ...item,
                enabled: !item.enabled,
            },
        })

        showSuccessToast(
            item.enabled
                ? 'pages.admin.ad.placements.messages.disable_success'
                : 'pages.admin.ad.placements.messages.enable_success',
        )

        await loadPlacements()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.ad.placements.messages.update_failed' })
    }
}

function getAdapterName(adapterId: string): string {
    const adapter = adapterOptions.find((a) => a.id === adapterId)
    return adapter?.name || adapterId
}
</script>

<style scoped lang="scss">
.admin-placements {
    // caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中）；用 0.4.0 起提供的
    // `--caomei-data-table-pagination-justify` token 保持迁移前布局（迁移不改几何）。
    &__table {
        --caomei-data-table-pagination-justify: center;
    }
}
</style>
