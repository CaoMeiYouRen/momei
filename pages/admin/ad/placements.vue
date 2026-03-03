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
                    :header="$t('pages.admin.ad.location')"
                >
                    <template #body="{data}">
                        <Tag :value="data.location" severity="secondary" />
                    </template>
                </Column>
                <Column
                    field="format"
                    :header="$t('pages.admin.ad.format')"
                >
                    <template #body="{data}">
                        <Tag :value="data.format" severity="info" />
                    </template>
                </Column>
                <Column
                    field="adapterId"
                    :header="$t('pages.admin.ad.adapter')"
                >
                    <template #body="{data}">
                        {{ getAdapterName(data.adapterId) }}
                    </template>
                </Column>
                <Column
                    field="enabled"
                    :header="$t('common.status')"
                >
                    <template #body="{data}">
                        <Tag
                            :value="data.enabled ? $t('common.enabled') : $t('common.disabled')"
                            :severity="data.enabled ? 'success' : 'danger'"
                        />
                    </template>
                </Column>
                <Column
                    field="priority"
                    :header="$t('pages.admin.ad.priority')"
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
            class="p-fluid"
            style="width: 32rem"
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
                <label for="location">{{ $t('pages.admin.ad.location') }} *</label>
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
                <label for="format">{{ $t('pages.admin.ad.format') }} *</label>
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
                <label for="adapterId">{{ $t('pages.admin.ad.adapter') }} *</label>
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
                <label for="metadata_slot">{{ $t('pages.admin.ad.slot_id') }}</label>
                <InputText
                    id="metadata_slot"
                    v-model.trim="formData.metadata.slot"
                    :placeholder="$t('pages.admin.ad.slot_id_placeholder')"
                />
                <small class="text-color-secondary">{{ $t('pages.admin.ad.slot_id_hint') }}</small>
            </div>

            <div class="field">
                <label for="priority">{{ $t('pages.admin.ad.priority') }}</label>
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
                <label for="enabled" class="cursor-pointer">{{ $t('common.enabled') }}</label>
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
import { useToast } from 'primevue/usetoast'
import { AdFormat, AdLocation, type AdPlacementMetadata } from '@/types/ad'

definePageMeta({
    middleware: ['auth'],
    layout: 'admin' as any,
})

const confirm = useConfirm()
const toast = useToast()

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
const locationOptions = [
    { label: 'Header', value: AdLocation.HEADER },
    { label: 'Sidebar', value: AdLocation.SIDEBAR },
    { label: 'Content Top', value: AdLocation.CONTENT_TOP },
    { label: 'Content Middle', value: AdLocation.CONTENT_MIDDLE },
    { label: 'Content Bottom', value: AdLocation.CONTENT_BOTTOM },
    { label: 'Footer', value: AdLocation.FOOTER },
]

// 格式选项
const formatOptions = [
    { label: 'Display', value: AdFormat.DISPLAY },
    { label: 'Native', value: AdFormat.NATIVE },
    { label: 'Video', value: AdFormat.VIDEO },
    { label: 'Responsive', value: AdFormat.RESPONSIVE },
]

async function loadPlacements() {
    loading.value = true
    try {
        const response = await $fetch<any>('/api/admin/ad/placements')
        placements.value = response.data || []
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load placements',
            life: 3000,
        })
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
        errors.name = 'Name is required'
    }
    if (!formData.location) {
        errors.location = 'Location is required'
    }
    if (!formData.format) {
        errors.format = 'Format is required'
    }
    if (!formData.adapterId) {
        errors.adapterId = 'Adapter is required'
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

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: editingItem.value
                ? 'Placement updated successfully'
                : 'Placement created successfully',
            life: 3000,
        })

        dialogVisible.value = false
        await loadPlacements()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to save placement',
            life: 3000,
        })
    } finally {
        saving.value = false
    }
}

function confirmDelete(item: any) {
    confirm.require({
        message: 'Are you sure you want to delete this placement?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteItem(item),
    })
}

async function deleteItem(item: any) {
    try {
        await $fetch(`/api/admin/ad/placements/${item.id}`, {
            method: 'DELETE',
        })

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Placement deleted successfully',
            life: 3000,
        })

        await loadPlacements()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete placement',
            life: 3000,
        })
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

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Placement ${item.enabled ? 'disabled' : 'enabled'} successfully`,
            life: 3000,
        })

        await loadPlacements()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update placement',
            life: 3000,
        })
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
