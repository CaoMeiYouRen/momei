<template>
    <div>
        <AdminListShell
            container-class="admin-page-container"
            card-class="admin-content-card"
            :title="$t('pages.admin.ad.campaigns.title')"
            show-language-switcher
        >
            <template #actions>
                <Button
                    :label="$t('common.create')"
                    icon="pi pi-plus"
                    @click="openDialog()"
                />
            </template>

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
                            :severity="getAdCampaignStatusSeverity(data.status)"
                        />
                    </template>
                </Column>
                <Column
                    field="startDate"
                    :header="$t('pages.admin.ad.campaigns.start_date')"
                >
                    <template #body="{data}">
                        {{ data.startDate ? formatDateTime(data.startDate, 'YYYY-MM-DD HH:mm') : '-' }}
                    </template>
                </Column>
                <Column
                    field="endDate"
                    :header="$t('pages.admin.ad.campaigns.end_date')"
                >
                    <template #body="{data}">
                        {{ data.endDate ? formatDateTime(data.endDate, 'YYYY-MM-DD HH:mm') : '-' }}
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
                            @click="confirmDeleteAdCampaign(data)"
                        />
                    </template>
                </Column>
                <template #empty>
                    <AdminTableEmptyState :label="$t('pages.admin.ad.campaigns.empty')" />
                </template>
            </DataTable>
        </AdminListShell>

        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-campaigns__dialog admin-form-dialog admin-form-dialog--compact p-fluid"
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
                    @click="closeDialog()"
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
import { useConfirm } from 'primevue/useconfirm'
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

function getAdCampaignStatusSeverity(status: CampaignStatus): string {
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
</script>

<style scoped lang="scss">
</style>
