<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.ai.title')" />

        <div class="admin-content">
            <Tabs v-model:value="activeTab">
                <TabList>
                    <Tab value="stats">
                        <i class="mr-2 pi pi-chart-bar" />
                        {{ $t('pages.admin.ai.stats') }}
                    </Tab>
                    <Tab value="tasks">
                        <i class="mr-2 pi pi-list" />
                        {{ $t('pages.admin.ai.tasks') }}
                    </Tab>
                </TabList>

                <TabPanels>
                    <!-- Statistics Panel -->
                    <TabPanel value="stats">
                        <div v-if="stats" class="ai-stats-container">
                            <!-- Stats Overview Cards -->
                            <div class="ai-overview-grid">
                                <Card class="ai-stat-card total">
                                    <template #title>
                                        <div class="card-header">
                                            <span class="card-title">{{ $t('pages.admin.ai.tasks') }}</span>
                                            <i class="icon pi pi-list" />
                                        </div>
                                    </template>
                                    <template #content>
                                        <div class="card-value">
                                            {{ getTotalTasks() }}
                                        </div>
                                    </template>
                                </Card>

                                <Card class="ai-stat-card completed">
                                    <template #title>
                                        <div class="card-header">
                                            <span class="card-title">{{ $t('pages.admin.ai.statuses.completed') }}</span>
                                            <i class="icon pi pi-check-circle" />
                                        </div>
                                    </template>
                                    <template #content>
                                        <div class="card-value">
                                            {{ getStatusCount('completed') }}
                                        </div>
                                    </template>
                                </Card>

                                <Card class="ai-stat-card failed">
                                    <template #title>
                                        <div class="card-header">
                                            <span class="card-title">{{ $t('pages.admin.ai.statuses.failed') }}</span>
                                            <i class="icon pi pi-times-circle" />
                                        </div>
                                    </template>
                                    <template #content>
                                        <div class="card-value">
                                            {{ getStatusCount('failed') }}
                                        </div>
                                    </template>
                                </Card>

                                <Card class="ai-stat-card processing">
                                    <template #title>
                                        <div class="card-header">
                                            <span class="card-title">{{ $t('pages.admin.ai.statuses.processing') }}</span>
                                            <i class="icon pi pi-sync" />
                                        </div>
                                    </template>
                                    <template #content>
                                        <div class="card-value">
                                            {{ getStatusCount('processing') }}
                                        </div>
                                    </template>
                                </Card>
                            </div>

                            <div class="ai-charts-grid">
                                <Card class="ai-chart-card">
                                    <template #title>
                                        <span class="card-title">{{ $t('pages.admin.ai.chart_status') }}</span>
                                    </template>
                                    <template #content>
                                        <div class="stats-list">
                                            <div
                                                v-for="s in stats.statusStats"
                                                :key="s.status"
                                                class="stats-item"
                                            >
                                                <span class="label">{{ $t(`pages.admin.ai.statuses.${s.status}`) }}</span>
                                                <Tag :value="s.count" severity="secondary" />
                                            </div>
                                        </div>
                                    </template>
                                </Card>

                                <Card class="ai-chart-card">
                                    <template #title>
                                        <span class="card-title">{{ $t('pages.admin.ai.chart_type') }}</span>
                                    </template>
                                    <template #content>
                                        <div class="stats-list">
                                            <div
                                                v-for="typeItem in stats.typeStats"
                                                :key="typeItem.type"
                                                class="stats-item"
                                            >
                                                <span class="label">{{ $t(`pages.admin.ai.types.${typeItem.type}`) }}</span>
                                                <Tag :value="typeItem.count" severity="info" />
                                            </div>
                                        </div>
                                    </template>
                                </Card>
                            </div>
                        </div>
                        <div v-else-if="loadingStats" class="ai-loading-state">
                            <i class="pi pi-spin pi-spinner" />
                        </div>
                        <div v-else class="ai-empty-state">
                            {{ $t('pages.admin.ai.no_stats') }}
                        </div>
                    </TabPanel>

                    <!-- Task List Panel -->
                    <TabPanel value="tasks">
                        <div class="admin-filters">
                            <div class="filters-search">
                                <IconField icon-position="left">
                                    <InputIcon class="pi pi-search" />
                                    <InputText
                                        v-model="filters.search"
                                        :placeholder="$t('common.search')"
                                        @input="onFilterChange"
                                    />
                                </IconField>
                            </div>
                            <div class="filters-actions">
                                <Select
                                    v-model="filters.type"
                                    :options="taskTypes"
                                    option-label="label"
                                    option-value="value"
                                    :placeholder="$t('pages.admin.ai.type')"
                                    show-clear
                                    @change="loadTasks"
                                />
                                <Select
                                    v-model="filters.status"
                                    :options="taskStatuses"
                                    option-label="label"
                                    option-value="value"
                                    :placeholder="$t('pages.admin.ai.status')"
                                    show-clear
                                    @change="loadTasks"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    outlined
                                    :disabled="!selectedTasks.length"
                                    @click="confirmBulkDelete"
                                />
                            </div>
                        </div>

                        <DataTable
                            v-model:selection="selectedTasks"
                            :value="tasks"
                            :loading="loadingTasks"
                            lazy
                            :total-records="totalTasks"
                            :rows="pageSize"
                            paginator
                            :rows-per-page-options="[10, 20, 50]"
                            class="p-datatable-sm"
                            @page="onPage"
                        >
                            <template #header>
                                <div class="table-header">
                                    <Button
                                        icon="pi pi-refresh"
                                        text
                                        rounded
                                        @click="loadTasks"
                                    />
                                </div>
                            </template>
                            <Column selection-mode="multiple" class="col-selection" />
                            <Column
                                field="type"
                                :header="$t('pages.admin.ai.type')"
                                class="col-type"
                            >
                                <template #body="{data}">
                                    <div class="type-cell">
                                        <i :class="getTypeIcon(data.type)" />
                                        <span>{{ data.type ? $t(`pages.admin.ai.types.${data.type}`) : '-' }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column
                                field="provider"
                                :header="$t('pages.admin.ai.provider')"
                                class="col-provider"
                            >
                                <template #body="{data}">
                                    <Tag
                                        v-if="data.provider"
                                        :value="data.provider"
                                        severity="secondary"
                                        outlined
                                    />
                                    <span v-else>-</span>
                                </template>
                            </Column>
                            <Column
                                field="model"
                                :header="$t('pages.admin.ai.model')"
                                class="col-model"
                            />
                            <Column
                                field="user"
                                :header="$t('common.author')"
                                class="col-author"
                            >
                                <template #body="{data}">
                                    <div class="author-cell">
                                        <Avatar
                                            v-if="data.user_image || data.user_name"
                                            :image="data.user_image"
                                            :label="!data.user_image ? data.user_name?.[0] : undefined"
                                            shape="circle"
                                        />
                                        <div class="author-info">
                                            <span class="author-name">{{ data.user_name || 'Unknown' }}</span>
                                            <small v-if="data.user_email" class="author-email">{{ data.user_email }}</small>
                                        </div>
                                    </div>
                                </template>
                            </Column>
                            <Column
                                field="status"
                                :header="$t('pages.admin.ai.status')"
                                class="col-status"
                            >
                                <template #body="{data}">
                                    <Tag
                                        v-if="data.status"
                                        :value="$t(`pages.admin.ai.statuses.${data.status}`)"
                                        :severity="getStatusSeverity(data.status)"
                                    />
                                    <span v-else>-</span>
                                </template>
                            </Column>
                            <Column
                                field="createdAt"
                                :header="$t('common.published_at')"
                                class="col-date"
                            >
                                <template #body="{data}">
                                    {{ formatDateTime(data.createdAt) }}
                                </template>
                            </Column>
                            <Column :header="$t('common.actions')" class="col-actions">
                                <template #body="{data}">
                                    <div class="actions-cell">
                                        <Button
                                            icon="pi pi-eye"
                                            text
                                            rounded
                                            @click="showDetails(data)"
                                        />
                                        <Button
                                            icon="pi pi-trash"
                                            text
                                            rounded
                                            severity="danger"
                                            @click="confirmDelete(data)"
                                        />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <!-- Task Details Dialog -->
        <Dialog
            v-model:visible="detailsVisible"
            :header="$t('pages.admin.ai.tasks')"
            modal
            class="max-w-50rem w-full"
        >
            <div v-if="selectedTask" class="flex flex-column gap-4">
                <div class="detail-info grid">
                    <div class="col-12 md:col-6">
                        <div class="detail-item">
                            <span class="label">{{ $t('pages.admin.ai.type') }}:</span>
                            <span class="value">{{ $t(`pages.admin.ai.types.${selectedTask.type}`) }}</span>
                        </div>
                        <div class="detail-item mt-2">
                            <span class="label">{{ $t('pages.admin.ai.status') }}:</span>
                            <Tag :value="$t(`pages.admin.ai.statuses.${selectedTask.status}`)" :severity="getStatusSeverity(selectedTask.status)" />
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="detail-item">
                            <span class="label">{{ $t('pages.admin.ai.provider') }}:</span>
                            <span class="value">{{ selectedTask.provider }} / {{ selectedTask.model }}</span>
                        </div>
                        <div class="detail-item mt-2">
                            <span class="label">{{ $t('common.author') }}:</span>
                            <div class="value">
                                <strong>{{ selectedTask.user_name || 'Unknown' }}</strong>
                                <span>{{ selectedTask.user_email }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="selectedTask.error" class="error-section">
                    <Message
                        severity="error"
                        :closable="false"
                        class="m-0"
                    >
                        <strong>{{ $t('pages.admin.ai.error') }}:</strong><br>
                        <div class="mt-1 text-sm">
                            {{ selectedTask.error }}
                        </div>
                    </Message>
                </div>

                <div v-if="selectedTask.type === 'image_generation' && getTaskImages(selectedTask).length > 0" class="image-preview-section">
                    <h4 class="font-bold m-0 mb-3 text-lg">
                        <i class="mr-2 pi pi-images" />{{ $t('pages.admin.ai.images') }}
                    </h4>
                    <div class="bg-emphasis border-round flex flex-wrap gap-3 p-3">
                        <Image
                            v-for="(img, idx) in getTaskImages(selectedTask)"
                            :key="idx"
                            :src="img"
                            alt="AI Generated"
                            width="240"
                            preview
                            class="border-round hover:scale-105 overflow-hidden shadow-2 transition-transform"
                        />
                    </div>
                </div>

                <div class="data-section grid">
                    <div class="col-12 lg:col-6">
                        <h4 class="align-items-center flex font-bold m-0 mb-2">
                            <i class="mr-2 pi pi-code" />{{ $t('pages.admin.ai.prompt') }}
                        </h4>
                        <div class="json-container">
                            <pre>{{ formatJson(selectedTask.payload) }}</pre>
                        </div>
                    </div>

                    <div v-if="selectedTask.result" class="col-12 lg:col-6">
                        <h4 class="align-items-center flex font-bold m-0 mb-2">
                            <i class="mr-2 pi pi-database" />{{ $t('pages.admin.ai.result') }}
                        </h4>
                        <div class="json-container">
                            <pre>{{ formatJson(selectedTask.result) }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const activeTab = ref('stats')
const stats = ref<any>(null)
const loadingStats = ref(false)

const tasks = ref<any[]>([])
const totalTasks = ref(0)
const loadingTasks = ref(false)
const selectedTasks = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)

const filters = ref({
    search: '',
    type: null,
    status: null,
})

const detailsVisible = ref(false)
const selectedTask = ref<any>(null)

const taskTypes = computed(() => [
    { label: t('pages.admin.ai.types.text_generation'), value: 'text_generation' },
    { label: t('pages.admin.ai.types.image_generation'), value: 'image_generation' },
])

const taskStatuses = computed(() => [
    { label: t('pages.admin.ai.statuses.completed'), value: 'completed' },
    { label: t('pages.admin.ai.statuses.processing'), value: 'processing' },
    { label: t('pages.admin.ai.statuses.failed'), value: 'failed' },
])

const loadStats = async () => {
    loadingStats.value = true
    try {
        stats.value = await $fetch('/api/admin/ai/stats')
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message })
    } finally {
        loadingStats.value = false
    }
}

const loadTasks = async () => {
    loadingTasks.value = true
    try {
        const response: any = await $fetch('/api/admin/ai/tasks', {
            query: {
                page: page.value,
                pageSize: pageSize.value,
                type: filters.value.type,
                status: filters.value.status,
                search: filters.value.search,
            },
        })
        tasks.value = response.items
        totalTasks.value = response.total
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message })
    } finally {
        loadingTasks.value = false
    }
}

const onPage = (event: any) => {
    page.value = event.page + 1
    pageSize.value = event.rows
    loadTasks()
}

const onFilterChange = () => {
    page.value = 1
    loadTasks()
}

const getTypeIcon = (type: string) => {
    return type === 'image_generation' ? 'pi pi-image' : 'pi pi-align-left'
}

const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'completed': return 'success'
        case 'processing': return 'info'
        case 'failed': return 'danger'
        default: return 'secondary'
    }
}

const getTotalTasks = () => {
    return stats.value?.statusStats?.reduce((acc: number, s: any) => acc + Number(s.count), 0) || 0
}

const getStatusCount = (status: string) => {
    return stats.value?.statusStats?.find((s: any) => s.status === status)?.count || 0
}

const formatDateTime = (date: any) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const formatJson = (data: any) => {
    if (!data) return ''
    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        return JSON.stringify(parsed, null, 2)
    } catch (e) {
        return data.toString()
    }
}

const getTaskImages = (task: any) => {
    if (!task || task.type !== 'image_generation' || !task.result) return []
    try {
        const res = typeof task.result === 'string' ? JSON.parse(task.result) : task.result
        if (res.images && Array.isArray(res.images)) {
            return res.images.map((img: any) => img.url).filter(Boolean)
        }
        return []
    } catch (e) {
        return []
    }
}

const showDetails = (task: any) => {
    selectedTask.value = task
    detailsVisible.value = true
}

const confirmDelete = (task: any) => {
    confirm.require({
        message: t('pages.admin.ai.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: t('common.cancel'),
            severity: 'secondary',
            outlined: true,
        },
        acceptProps: {
            label: t('common.delete'),
            severity: 'danger',
        },
        accept: async () => {
            try {
                await $fetch('/api/admin/ai/tasks', {
                    method: 'DELETE',
                    query: { ids: task.id },
                })
                toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
                loadTasks()
                loadStats()
            } catch (e: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: e.message })
            }
        },
    })
}

const confirmBulkDelete = () => {
    confirm.require({
        message: t('pages.admin.ai.delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                const ids = selectedTasks.value.map((t) => t.id).join(',')
                await $fetch('/api/admin/ai/tasks', {
                    method: 'DELETE',
                    query: { ids },
                })
                toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
                selectedTasks.value = []
                loadTasks()
                loadStats()
            } catch (e: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: e.message })
            }
        },
    })
}

onMounted(() => {
    loadStats()
    loadTasks()
})
</script>

<style lang="scss" scoped>
.ai-stats-container {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.ai-overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;

    @media (width >= 1200px) {
        grid-template-columns: repeat(4, 1fr);
    }
}

.ai-stat-card {
    border: none;
    box-shadow: 0 4px 15px rgb(0 0 0 / 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    border-radius: 12px;
    overflow: hidden;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgb(0 0 0 / 0.08);
    }

    &.total {
        border-left: 4px solid var(--p-primary-color);
        .icon { color: var(--p-primary-color); }
    }

    &.completed {
        border-left: 4px solid var(--p-green-500);
        .icon { color: var(--p-green-500); }
    }

    &.failed {
        border-left: 4px solid var(--p-red-500);
        .icon { color: var(--p-red-500); }
    }

    &.processing {
        border-left: 4px solid var(--p-blue-500);
        .icon { color: var(--p-blue-500); }
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
            font-size: 1rem;
            font-weight: 500;
            color: var(--p-text-secondary-color);
        }

        .icon {
            font-size: 1.5rem;
            opacity: 0.8;
        }
    }

    .card-value {
        font-size: 2.25rem;
        font-weight: 700;
        margin-top: 0.5rem;
        color: var(--p-text-color);
    }
}

.ai-charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;

    @media (width <= 600px) {
        grid-template-columns: 1fr;
    }
}

.ai-chart-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.03);

    .card-title {
        font-size: 1.1rem;
        font-weight: 600;
    }

    .stats-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .stats-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgb(var(--p-primary-rgb), 0.05);

        &:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .label {
            font-size: 0.95rem;
            color: var(--p-text-color);
        }
    }
}

.ai-loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5rem;

    i {
        font-size: 3rem;
        color: var(--p-primary-color);
    }
}

.ai-empty-state {
    padding: 5rem;
    text-align: center;
    color: var(--p-text-secondary-color);
    font-size: 1.1rem;
    background: rgb(var(--p-primary-rgb), 0.02);
    border-radius: 12px;
    border: 2px dashed rgb(var(--p-primary-rgb), 0.1);
}

.admin-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 0.5rem 0;

    .filters-search {
        flex: 1;
        min-width: 250px;

        .p-iconfield {
            width: 100%;
        }

        .p-inputtext {
            width: 100%;
        }
    }

    .filters-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        @media (width <= 576px) {
            width: 100%;
            flex-direction: column;

            .p-select, .p-button {
                width: 100%;
            }
        }
    }
}

:deep(.p-datatable) {
    .table-header {
        display: flex;
        justify-content: flex-end;
        padding: 0.5rem;
    }

    .p-datatable-thead > tr > th {
        background: transparent;
        color: var(--p-text-color);
        font-weight: 600;
        border-bottom: 2px solid var(--p-content-border-color);
        padding: 1rem;
        white-space: nowrap;
    }

    .p-datatable-tbody > tr {
        background: transparent;
        transition: background-color 0.2s;

        &:hover {
            background-color: var(--p-content-hover-background);
        }

        > td {
            padding: 1rem;
            border-bottom: 1px solid var(--p-content-border-color);
        }
    }

    .col-selection { width: 3.5rem; }
    .col-type { min-width: 140px; }

    .col-provider {
        min-width: 120px;
        text-align: center;
    }
    .col-model { min-width: 180px; }
    .col-author { min-width: 220px; }

    .col-status {
        min-width: 120px;
        text-align: center;
    }
    .col-date { min-width: 160px; }

    .col-actions {
        width: 120px;
        text-align: right;
    }
}

:deep(.p-datatable-wrapper) {
    border-radius: 8px;
    border: 1px solid var(--p-content-border-color);
    background: var(--p-content-background);
}

.type-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i {
        font-size: 1.1rem;
        color: var(--p-primary-color);
    }
}

.author-cell {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.25rem 0;

    .p-avatar {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        background-color: var(--p-primary-50);
        color: var(--p-primary-600);
        font-weight: 600;
        border: 1px solid var(--p-primary-100);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .author-info {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;

        .author-name {
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--p-text-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: block;
        }

        .author-email {
            font-size: 0.75rem;
            color: var(--p-text-secondary-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: block;
            margin-top: 1px;
        }
    }
}

.actions-cell {
    display: flex;
    gap: 0.5rem;
}

.detail-info {
    background: var(--p-content-hover-background);
    padding: 1.25rem;
    border-radius: 8px;
    border-left: 4px solid var(--p-primary-color);

    .detail-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;

        .label {
            font-weight: 600;
            color: var(--p-text-secondary-color);
            min-width: 80px;
            padding-top: 2px;
        }

        .value {
            color: var(--p-text-color);
            font-weight: 500;
            display: flex;
            flex-direction: column;
            gap: 2px;
            line-height: 1.4;

            strong {
                display: block;
                font-size: 0.95rem;
                font-weight: 700;
            }

            span {
                display: block;
                font-size: 0.8rem;
                opacity: 0.7;
                color: var(--p-text-secondary-color);
            }
        }
    }
}

.error-section {
    margin-top: 1.25rem;
}

.json-container {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    font-family: var(--p-font-family-monospace, monospace);
    font-size: 0.85rem;
    line-height: 1.5;
    overflow: auto;
    max-height: 300px;
    border: 1px solid var(--p-content-border-color);

    pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
    }

    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 3px;
    }
}

.bg-emphasis {
    background-color: var(--p-content-hover-background);
}
</style>
