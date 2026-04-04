<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.external_links.title')" show-language-switcher>
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
                :value="links"
                :loading="loading"
                paginator
                :rows="10"
                class="p-datatable-sm"
            >
                <Column
                    field="shortCode"
                    :header="$t('pages.admin.external_links.short_code')"
                >
                    <template #body="{data}">
                        <div class="flex gap-2 items-center">
                            <code class="short-code">{{ data.shortCode }}</code>
                            <Button
                                v-tooltip="$t('common.copy')"
                                icon="pi pi-copy"
                                text
                                rounded
                                size="small"
                                @click="copyShortCode(data.shortCode)"
                            />
                        </div>
                    </template>
                </Column>
                <Column
                    field="originalUrl"
                    :header="$t('pages.admin.external_links.original_url')"
                >
                    <template #body="{data}">
                        <div class="url-truncate" :title="data.originalUrl">
                            {{ data.originalUrl }}
                        </div>
                    </template>
                </Column>
                <Column
                    field="status"
                    :header="$t('pages.admin.external_links.status')"
                >
                    <template #body="{data}">
                        <Tag
                            :value="data.status"
                            :severity="getStatusSeverity(data.status)"
                        />
                    </template>
                </Column>
                <Column
                    field="clickCount"
                    :header="$t('pages.admin.external_links.clicks')"
                    sortable
                />
                <Column
                    field="showRedirectPage"
                    :header="$t('pages.admin.external_links.show_redirect')"
                >
                    <template #body="{data}">
                        <i
                            :class="[
                                data.showRedirectPage ? 'pi pi-check' : 'pi pi-times',
                                data.showRedirectPage ? 'text-success' : 'text-secondary'
                            ]"
                        />
                    </template>
                </Column>
                <Column
                    :header="$t('common.actions')"
                    class="text-right"
                    style="min-width: 8rem"
                >
                    <template #body="{data}">
                        <Button
                            v-tooltip="$t('pages.admin.external_links.stats')"
                            icon="pi pi-chart-bar"
                            text
                            rounded
                            severity="info"
                            @click="showStats(data)"
                        />
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
                        {{ $t('pages.admin.external_links.empty') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-external-links__dialog admin-form-dialog admin-form-dialog--wide p-fluid"
        >
            <div class="field">
                <label for="originalUrl">{{ $t('pages.admin.external_links.original_url') }} *</label>
                <InputText
                    id="originalUrl"
                    v-model.trim="formData.originalUrl"
                    :placeholder="$t('pages.admin.external_links.url_placeholder')"
                    :class="{'p-invalid': errors.originalUrl}"
                />
                <small v-if="errors.originalUrl" class="p-error">{{ errors.originalUrl }}</small>
            </div>

            <div class="field">
                <label for="metadata_title">{{ $t('common.title') }}</label>
                <InputText
                    id="metadata_title"
                    v-model.trim="formData.metadata.title"
                    :placeholder="$t('pages.admin.external_links.title_placeholder')"
                />
            </div>

            <div class="field">
                <label for="status">{{ $t('pages.admin.external_links.status') }} *</label>
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
                        {{ formatDate(currentStats.createdAt) }}
                    </div>
                </div>
            </div>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
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

function confirmDelete(item: any) {
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

function getStatusSeverity(status: LinkStatus): string {
    switch (status) {
        case LinkStatus.ACTIVE:
            return 'success'
        case LinkStatus.BLOCKED:
            return 'danger'
        case LinkStatus.EXPIRED:
            return 'warning'
        default:
            return 'secondary'
    }
}

function formatDate(date: string): string {
    return formatDateTime(date, 'YYYY-MM-DD HH:mm')
}

onMounted(() => {
    loadLinks()
})
</script>

<style scoped lang="scss">
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
