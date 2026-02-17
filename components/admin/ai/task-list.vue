<template>
    <div class="task-list-container">
        <div class="admin-filters">
            <div class="filters-search">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('common.search')"
                        @input="$emit('filter-change')"
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
                    @change="$emit('filter-change')"
                />
                <Select
                    v-model="filters.status"
                    :options="taskStatuses"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.ai.status')"
                    show-clear
                    @change="$emit('filter-change')"
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    :disabled="!selection.length"
                    @click="$emit('bulk-delete')"
                />
            </div>
        </div>

        <DataTable
            v-model:selection="selection"
            :value="tasks"
            :loading="loading"
            lazy
            :total-records="total"
            :rows="pageSize"
            paginator
            :rows-per-page-options="[10, 20, 50]"
            class="p-datatable-sm"
            data-key="id"
            @page="$emit('page-change', $event)"
        >
            <template #header>
                <div class="table-header">
                    <Button
                        icon="pi pi-refresh"
                        text
                        rounded
                        @click="$emit('refresh')"
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
                            @click="$emit('show-details', data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            text
                            rounded
                            severity="danger"
                            @click="$emit('delete', data)"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const props = defineProps<{
    tasks: any[]
    total: number
    loading: boolean
    pageSize: number
}>()

const selection = defineModel<any[]>('selection', { default: () => [] })
const filters = defineModel<any>('filters', { required: true })

defineEmits<{
    (e: 'refresh'): void
    (e: 'page-change', event: any): void
    (e: 'filter-change'): void
    (e: 'show-details', task: any): void
    (e: 'delete', task: any): void
    (e: 'bulk-delete'): void
}>()

const { t } = useI18n()

const taskTypes = computed(() => [
    { label: t('pages.admin.ai.types.text_generation'), value: 'text_generation' },
    { label: t('pages.admin.ai.types.image_generation'), value: 'image_generation' },
    { label: t('pages.admin.ai.types.tts'), value: 'tts' },
    { label: t('pages.admin.ai.types.podcast'), value: 'podcast' },
])

const taskStatuses = computed(() => [
    { label: t('pages.admin.ai.statuses.completed'), value: 'completed' },
    { label: t('pages.admin.ai.statuses.processing'), value: 'processing' },
    { label: t('pages.admin.ai.statuses.pending'), value: 'pending' },
    { label: t('pages.admin.ai.statuses.failed'), value: 'failed' },
])

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'image_generation': return 'pi pi-image'
        case 'tts': return 'pi pi-volume-up'
        case 'podcast': return 'pi pi-microphone'
        default: return 'pi pi-align-left'
    }
}

const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'completed': return 'success'
        case 'processing': return 'info'
        case 'failed': return 'danger'
        default: return 'secondary'
    }
}

const formatDateTime = (date: any) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.admin-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;

    .filters-search {
        flex: 1;
        min-width: 200px;

        .p-inputtext {
            width: 100%;
        }
    }

    .filters-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }
}

.type-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
        font-size: 1rem;
        color: var(--text-color-secondary);
    }
}

.author-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .author-info {
        display: flex;
        flex-direction: column;

        .author-name {
            font-weight: 600;
            font-size: 0.875rem;
        }

        .author-email {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }
    }
}

.actions-cell {
    display: flex;
    gap: 0.25rem;
}

.table-header {
    display: flex;
    justify-content: flex-end;
}
</style>
