<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.ad.campaigns.title')" show-language-switcher>
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
                :value="campaigns"
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
                    field="status"
                    :header="$t('pages.admin.ad.campaigns.status')"
                >
                    <template #body="{data}">
                        <Tag
                            :value="data.status"
                            :severity="getStatusSeverity(data.status)"
                        />
                    </template>
                </Column>
                <Column
                    field="startDate"
                    :header="$t('pages.admin.ad.campaigns.start_date')"
                >
                    <template #body="{data}">
                        {{ formatDate(data.startDate) }}
                    </template>
                </Column>
                <Column
                    field="endDate"
                    :header="$t('pages.admin.ad.campaigns.end_date')"
                >
                    <template #body="{data}">
                        {{ formatDate(data.endDate) }}
                    </template>
                </Column>
                <Column
                    field="impressions"
                    :header="$t('pages.admin.ad.campaigns.impressions')"
                    sortable
                />
                <Column
                    field="clicks"
                    :header="$t('pages.admin.ad.campaigns.clicks')"
                    sortable
                />
                <Column
                    field="revenue"
                    :header="$t('pages.admin.ad.campaigns.revenue')"
                >
                    <template #body="{data}">
                        ${{ data.revenue?.toFixed(2) || '0.00' }}
                    </template>
                </Column>
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
                        {{ $t('pages.admin.ad.campaigns.empty') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-campaigns__dialog p-fluid"
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
                <label for="status">{{ $t('pages.admin.ad.campaigns.status') }} *</label>
                <Dropdown
                    id="status"
                    v-model="formData.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    :class="{'p-invalid': errors.status}"
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
import { CampaignStatus } from '@/types/ad'

const { t } = useI18n()

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const confirm = useConfirm()
const toast = useToast()

const loading = ref(true)
const campaigns = ref<any[]>([])
const dialogVisible = ref(false)
const editingItem = ref<any>(null)
const saving = ref(false)

const formData = reactive<{
    name: string
    status: CampaignStatus
    startDate: Date | null
    endDate: Date | null
}>({
    name: '',
    status: CampaignStatus.DRAFT,
    startDate: null,
    endDate: null,
})

const errors = reactive<Record<string, string>>({})

const statusOptions = computed(() => [
    { label: t('pages.admin.ad.campaigns.statuses.draft'), value: CampaignStatus.DRAFT },
    { label: t('pages.admin.ad.campaigns.statuses.active'), value: CampaignStatus.ACTIVE },
    { label: t('pages.admin.ad.campaigns.statuses.paused'), value: CampaignStatus.PAUSED },
    { label: t('pages.admin.ad.campaigns.statuses.ended'), value: CampaignStatus.ENDED },
])

async function loadCampaigns() {
    loading.value = true
    try {
        const response = await $fetch<any>('/api/admin/ad/campaigns')
        campaigns.value = response.data || []
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('pages.admin.ad.campaigns.messages.load_failed'),
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
            status: item.status,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
        })
    } else {
        Object.assign(formData, {
            name: '',
            status: CampaignStatus.DRAFT,
            startDate: null,
            endDate: null,
        })
    }

    Object.keys(errors).forEach((key) => delete errors[key])
    dialogVisible.value = true
}

async function save() {
    Object.keys(errors).forEach((key) => delete errors[key])

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

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: editingItem.value
                ? t('pages.admin.ad.campaigns.messages.update_success')
                : t('pages.admin.ad.campaigns.messages.create_success'),
            life: 3000,
        })

        dialogVisible.value = false
        await loadCampaigns()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('pages.admin.ad.campaigns.messages.save_failed'),
            life: 3000,
        })
    } finally {
        saving.value = false
    }
}

function confirmDelete(item: any) {
    confirm.require({
        message: t('pages.admin.ad.campaigns.messages.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteItem(item),
    })
}

async function deleteItem(item: any) {
    try {
        await $fetch(`/api/admin/ad/campaigns/${item.id}`, {
            method: 'DELETE',
        })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.ad.campaigns.messages.delete_success'),
            life: 3000,
        })

        await loadCampaigns()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('pages.admin.ad.campaigns.messages.delete_failed'),
            life: 3000,
        })
    }
}

function getStatusSeverity(status: CampaignStatus): string {
    switch (status) {
        case CampaignStatus.ACTIVE:
            return 'success'
        case CampaignStatus.PAUSED:
            return 'warning'
        case CampaignStatus.ENDED:
            return 'danger'
        default:
            return 'secondary'
    }
}

function formatDate(date: string | null): string {
    if (!date) return '-'
    return new Date(date).toLocaleString()
}

onMounted(() => {
    loadCampaigns()
})
</script>

<style scoped lang="scss">
:deep(.admin-campaigns__dialog) {
    width: min(34rem, calc(100vw - 1.5rem));
    min-width: 30rem;
}

:deep(.admin-campaigns__dialog .p-dialog-content) {
    padding-top: 0.75rem;
}

:deep(.admin-campaigns__dialog .field) {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    align-items: center;
    gap: 0.25rem 0.75rem;
    margin-bottom: 0.875rem;
}

:deep(.admin-campaigns__dialog .field > label) {
    margin: 0;
    font-weight: 600;
    line-height: 1.35;
}

:deep(.admin-campaigns__dialog .field > .p-error) {
    grid-column: 2;
    margin-top: 0.125rem;
}

:deep(.admin-campaigns__dialog .p-inputtext),
:deep(.admin-campaigns__dialog .p-select),
:deep(.admin-campaigns__dialog .p-datepicker),
:deep(.admin-campaigns__dialog .p-datepicker-input) {
    width: 100%;
}

:deep(.admin-campaigns__dialog .p-dialog-footer) {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.875rem;
}

@media (width <= 640px) {
    :deep(.admin-campaigns__dialog) {
        min-width: 0;
    }

    :deep(.admin-campaigns__dialog .field) {
        grid-template-columns: 1fr;
        gap: 0.375rem;
    }

    :deep(.admin-campaigns__dialog .field > .p-error) {
        grid-column: auto;
    }
}
</style>
