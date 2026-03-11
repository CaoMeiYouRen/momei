<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.ad.placements.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('common.create')"
                    icon="pi pi-plus"
                    @click="openDialog()"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-content-card">
            <DataTable
                :value="placements"
                :loading="loading"
                paginator
                :rows="10"
                class="p-datatable-sm"
            >
                <Column
                    field="name"
                    :header="$t('common.name')"
                    sortable
                />
                <Column
                    field="location"
                    :header="$t('pages.admin.ad.placements.location')"
                >
                    <template #body="{data}">
                        <Tag :value="data.location" severity="secondary" />
                    </template>
                </Column>
                <Column
                    field="format"
                    :header="$t('pages.admin.ad.placements.format')"
                >
                    <template #body="{data}">
                        <Tag :value="data.format" severity="info" />
                    </template>
                </Column>
                <Column
                    field="adapterId"
                    :header="$t('pages.admin.ad.placements.adapter')"
                >
                    <template #body="{data}">
                        {{ getAdapterName(data.adapterId) }}
                    </template>
                </Column>
                <Column
                    field="enabled"
                    :header="$t('pages.admin.ad.placements.status')"
                >
                    <template #body="{data}">
                        <Tag
                            :value="data.enabled ? $t('pages.admin.ad.placements.enabled') : $t('pages.admin.ad.placements.disabled')"
                            :severity="data.enabled ? 'success' : 'danger'"
                        />
                    </template>
                </Column>
                <Column
                    field="priority"
                    :header="$t('pages.admin.ad.placements.priority')"
                    sortable
                />
                <Column
                    :header="$t('common.actions')"
                    class="text-right"
                    style="min-width: 8rem"
                >
                    <template #body="{data}">
                        <Button
                            icon="pi pi-pencil"
                            text
                            rounded
                            severity="info"
                            @click="openDialog(data)"
                        />
                        <Button
                            :icon="data.enabled ? 'pi pi-eye-slash' : 'pi pi-eye'"
                            text
                            rounded
                            severity="warning"
                            @click="toggleEnabled(data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            text
                            rounded
                            severity="danger"
                            @click="confirmDelete(data)"
                        />
                    </template>
                </Column>
                <template #empty>
                    <div class="empty-state">
                        {{ $t('pages.admin.ad.placements.empty') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-form-dialog admin-placements__dialog p-fluid"
        >
            <div class="field">
                <label for="name">{{ $t('common.name') }} *</label>
                <InputText
                    id="name"
                    v-model.trim="formData.name"
                    required
                    autofocus
                    :class="{'p-invalid': errors.name}"
                />
                <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>

            <div class="field">
                <label for="location">{{ $t('pages.admin.ad.placements.location') }} *</label>
                <Dropdown
                    id="location"
                    v-model="formData.location"
                    :options="locationOptions"
                    option-label="label"
                    option-value="value"
                    :class="{'p-invalid': errors.location}"
                />
                <small v-if="errors.location" class="p-error">{{ errors.location }}</small>
            </div>

            <div class="field">
                <label for="format">{{ $t('pages.admin.ad.placements.format') }} *</label>
                <Dropdown
                    id="format"
                    v-model="formData.format"
                    :options="formatOptions"
                    option-label="label"
                    option-value="value"
                    :class="{'p-invalid': errors.format}"
                />
                <small v-if="errors.format" class="p-error">{{ errors.format }}</small>
            </div>

            <div class="field">
                <label for="adapterId">{{ $t('pages.admin.ad.placements.adapter') }} *</label>
                <Dropdown
                    id="adapterId"
                    v-model="formData.adapterId"
                    :options="adapterOptions"
                    option-label="name"
                    option-value="id"
                    :class="{'p-invalid': errors.adapterId}"
                />
                <small v-if="errors.adapterId" class="p-error">{{ errors.adapterId }}</small>
            </div>

            <div class="field">
                <label for="metadata_slot">{{ $t('pages.admin.ad.placements.slot_id') }}</label>
                <InputText
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
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    @click="dialogVisible = false"
                />
                <Button
                    :label="$t('common.save')"
                    :loading="saving"
                    @click="save"
                />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { AdFormat, AdLocation, type AdPlacementMetadata } from '@/types/ad'

const { t } = useI18n()

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const confirm = useConfirm()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const loading = ref(true)
const placements = ref<any[]>([])
const dialogVisible = ref(false)
const editingItem = ref<any>(null)
const saving = ref(false)

const formData = reactive<{
    name: string
    location: AdLocation
    format: AdFormat
    adapterId: string
    metadata: AdPlacementMetadata
    priority: number
    enabled: boolean
}>({
    name: '',
    location: AdLocation.SIDEBAR,
    format: AdFormat.RESPONSIVE,
    adapterId: 'adsense',
    metadata: {},
    priority: 0,
    enabled: true,
})

const errors = reactive<Record<string, string>>({})

// 适配器列表
const adapterOptions = [
    { id: 'adsense', name: 'Google AdSense' },
    { id: 'baidu', name: '百度联盟' },
    { id: 'tencent', name: '腾讯广告 (广点通)' },
]

// 位置选项
const locationOptions = computed(() => [
    { label: t('pages.admin.ad.placements.locations.header'), value: AdLocation.HEADER },
    { label: t('pages.admin.ad.placements.locations.sidebar'), value: AdLocation.SIDEBAR },
    { label: t('pages.admin.ad.placements.locations.content_top'), value: AdLocation.CONTENT_TOP },
    { label: t('pages.admin.ad.placements.locations.content_middle'), value: AdLocation.CONTENT_MIDDLE },
    { label: t('pages.admin.ad.placements.locations.content_bottom'), value: AdLocation.CONTENT_BOTTOM },
    { label: t('pages.admin.ad.placements.locations.footer'), value: AdLocation.FOOTER },
])

// 格式选项
const formatOptions = computed(() => [
    { label: t('pages.admin.ad.placements.formats.display'), value: AdFormat.DISPLAY },
    { label: t('pages.admin.ad.placements.formats.native'), value: AdFormat.NATIVE },
    { label: t('pages.admin.ad.placements.formats.video'), value: AdFormat.VIDEO },
    { label: t('pages.admin.ad.placements.formats.responsive'), value: AdFormat.RESPONSIVE },
])

async function loadPlacements() {
    loading.value = true
    try {
        const response = await $fetch<any>('/api/admin/ad/placements')
        placements.value = response.data || []
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.ad.placements.messages.load_failed' })
    } finally {
        loading.value = false
    }
}

function openDialog(item?: any) {
    editingItem.value = item || null

    if (item) {
        Object.assign(formData, {
            name: item.name,
            location: item.location,
            format: item.format,
            adapterId: item.adapterId,
            metadata: item.metadata || {},
            priority: item.priority,
            enabled: item.enabled,
        })
    } else {
        Object.assign(formData, {
            name: '',
            location: AdLocation.SIDEBAR,
            format: AdFormat.RESPONSIVE,
            adapterId: 'adsense',
            metadata: {},
            priority: 0,
            enabled: true,
        })
    }

    Object.keys(errors).forEach((key) => delete errors[key])
    dialogVisible.value = true
}

async function save() {
    // 验证
    Object.keys(errors).forEach((key) => delete errors[key])

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

        dialogVisible.value = false
        await loadPlacements()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.ad.placements.messages.save_failed' })
    } finally {
        saving.value = false
    }
}

function confirmDelete(item: any) {
    confirm.require({
        message: t('pages.admin.ad.placements.messages.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            void deleteItem(item)
        },
    })
}

async function deleteItem(item: any) {
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

async function toggleEnabled(item: any) {
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

onMounted(() => {
    loadPlacements()
})
</script>

<style scoped lang="scss">
</style>
