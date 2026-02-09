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
                                            <i class="icon pi pi-check-circle" />
                                        </div>
                                    </template>
                                    <template #content>
                                        <div class="card-value">
                                            {{ getTotalTasks() }}
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
                        <div class="admin-filters mb-4">
                            <IconField icon-position="left">
                                <InputIcon class="pi pi-search" />
                                <InputText
                                    v-model="filters.search"
                                    :placeholder="$t('common.search')"
                                    @input="onFilterChange"
                                />
                            </IconField>
                            <div class="admin-filters__right flex gap-2">
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
                                <div class="flex justify-content-end">
                                    <Button
                                        icon="pi pi-refresh"
                                        text
                                        rounded
                                        @click="loadTasks"
                                    />
                                </div>
                            </template>
                            <Column selection-mode="multiple" header-style="width: 3rem" />
                            <Column field="type" :header="$t('pages.admin.ai.type')">
                                <template #body="{data}">
                                    <div class="align-items-center flex gap-2">
                                        <i :class="getTypeIcon(data.type)" />
                                        <span>{{ $t(`pages.admin.ai.types.${data.type}`) }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="provider" :header="$t('pages.admin.ai.provider')">
                                <template #body="{data}">
                                    <Tag
                                        :value="data.provider"
                                        severity="secondary"
                                        outlined
                                    />
                                </template>
                            </Column>
                            <Column field="model" :header="$t('pages.admin.ai.model')" />
                            <Column field="user" :header="$t('common.author')">
                                <template #body="{data}">
                                    <div class="align-items-center flex gap-2">
                                        <Avatar
                                            :image="data.user?.image"
                                            :label="data.user?.name?.[0]"
                                            shape="circle"
                                            size="small"
                                        />
                                        <span>{{ data.user?.name || 'Unknown' }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="status" :header="$t('pages.admin.ai.status')">
                                <template #body="{data}">
                                    <Tag :value="$t(`pages.admin.ai.statuses.${data.status}`)" :severity="getStatusSeverity(data.status)" />
                                </template>
                            </Column>
                            <Column field="createdAt" :header="$t('common.published_at')">
                                <template #body="{data}">
                                    {{ formatDateTime(data.createdAt) }}
                                </template>
                            </Column>
                            <Column :header="$t('common.actions')">
                                <template #body="{data}">
                                    <div class="flex gap-2">
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
            class="max-w-30rem"
        >
            <div v-if="selectedTask" class="flex flex-column gap-3">
                <div class="grid">
                    <div class="col-4 font-bold">
                        {{ $t('pages.admin.ai.type') }}:
                    </div>
                    <div class="col-8">
                        {{ $t(`pages.admin.ai.types.${selectedTask.type}`) }}
                    </div>

                    <div class="col-4 font-bold">
                        {{ $t('pages.admin.ai.provider') }}:
                    </div>
                    <div class="col-8">
                        {{ selectedTask.provider }} ({{ selectedTask.model }})
                    </div>

                    <div v-if="selectedTask.error" class="col-12">
                        <Message
                            severity="error"
                            :closable="false"
                            class="m-0"
                        >
                            <strong>{{ $t('pages.admin.ai.error') }}:</strong><br>
                            {{ selectedTask.error }}
                        </Message>
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

    &.failed {
        border-left: 4px solid var(--p-red-500);
        .icon { color: var(--p-red-500); }
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

    @media (width <= 768px) {
        flex-direction: column;
        align-items: stretch;
    }

    &__right {
        display: flex;
        gap: 0.75rem;

        @media (width <= 576px) {
            flex-direction: column;
        }
    }
}
</style>
