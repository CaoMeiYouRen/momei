<template>
    <div class="admin-waitlist page-container">
        <AdminPageHeader :title="$t('pages.admin.waitlist.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.waitlist.export')"
                    icon="pi pi-download"
                    severity="secondary"
                    @click="exportWaitlist"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-waitlist__card">
            <div class="admin-waitlist__filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('pages.admin.waitlist.search_placeholder')"
                        @input="onFilterChange"
                    />
                </IconField>
                <IconField icon-position="left">
                    <InputIcon class="pi pi-tag" />
                    <InputText
                        v-model="filters.purpose"
                        :placeholder="$t('pages.admin.waitlist.purpose_filter')"
                        class="admin-waitlist__purpose-input"
                        @input="onFilterChange"
                    />
                </IconField>
            </div>

            <DataTable
                :value="items"
                :loading="loading"
                lazy
                :total-records="total"
                :rows="pagination.pageSize"
                paginator
                class="p-datatable-sm"
                @page="onPage"
            >
                <Column
                    field="name"
                    :header="$t('pages.admin.waitlist.columns.name')"
                />
                <Column
                    field="email"
                    :header="$t('pages.admin.waitlist.columns.email')"
                />
                <Column field="purpose" :header="$t('pages.admin.waitlist.columns.purpose')">
                    <template #body="{data}">
                        <Tag :value="data.purpose || 'benefit'" severity="info" />
                    </template>
                </Column>
                <Column field="locale" :header="$t('pages.admin.waitlist.columns.locale')">
                    <template #body="{data}">
                        <Tag
                            v-if="data.locale"
                            :value="data.locale"
                            severity="secondary"
                        />
                        <span v-else>—</span>
                    </template>
                </Column>
                <Column field="createdAt" :header="$t('pages.admin.waitlist.columns.createdAt')">
                    <template #body="{data}">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>
                <Column :header="$t('common.actions')" class="text-right">
                    <template #body="{data}">
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
                        {{ $t('pages.posts.empty') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <ConfirmDeleteDialog
            v-model:visible="deleteVisible"
            :message="$t('pages.admin.waitlist.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const { t } = useI18n()
const { formatDate } = useI18nDate()

const loading = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const pagination = reactive({
    page: 1,
    pageSize: 20,
})
const filters = reactive({
    search: '',
    purpose: '',
})

const deleteVisible = ref(false)
const itemToDelete = ref<any>(null)

const loadData = async () => {
    loading.value = true
    try {
        const query: Record<string, any> = {
            page: pagination.page,
            pageSize: pagination.pageSize,
            search: filters.search || undefined,
            purpose: filters.purpose || undefined,
        }
        const res = await $fetch<any>('/api/admin/waitlist', { query })
        if (res.code === 200) {
            items.value = res.data.items
            total.value = res.data.total
        }
    } catch (error) {
        console.error('Failed to load waitlist:', error)
    } finally {
        loading.value = false
    }
}

const onPage = (event: any) => {
    pagination.page = event.page + 1
    pagination.pageSize = event.rows
    loadData()
}

const onFilterChange = useDebounceFn(() => {
    pagination.page = 1
    loadData()
}, 500)

const exportWaitlist = () => {
    const params = new URLSearchParams()
    if (filters.purpose) {
        params.set('purpose', filters.purpose)
    }
    const url = `/api/admin/waitlist/export${params.toString() ? `?${params.toString()}` : ''}`
    window.open(url, '_blank')
}

const confirmDelete = (item: any) => {
    itemToDelete.value = item
    deleteVisible.value = true
}

const doDelete = async () => {
    if (!itemToDelete.value) return
    try {
        await $fetch(`/api/admin/waitlist/${itemToDelete.value.id}`, {
            method: 'DELETE',
        })
        deleteVisible.value = false
        itemToDelete.value = null
        loadData()
    } catch (error) {
        console.error('Failed to delete waitlist entry:', error)
    }
}

onMounted(() => {
    loadData()
})
</script>

<style lang="scss" scoped>
.admin-waitlist {
    &__card {
        background: var(--surface-card);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgb(0 0 0 / 0.05);
    }

    &__filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    &__purpose-input {
        min-width: 160px;
    }
}

.empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
}
</style>
