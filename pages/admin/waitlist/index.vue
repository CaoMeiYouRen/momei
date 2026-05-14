<template>
    <div>
        <AdminListShell
            container-class="admin-waitlist page-container"
            :title="$t('pages.admin.waitlist.title')"
            show-language-switcher
        >
            <template #actions>
                <Button
                    :label="$t('pages.admin.waitlist.export')"
                    icon="pi pi-download"
                    severity="secondary"
                    @click="exportWaitlist"
                />
            </template>

            <template #filters>
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
            </template>

            <DataTable
                :value="items"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
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
                    <AdminTableEmptyState :label="$t('pages.posts.empty')" />
                </template>
            </DataTable>
        </AdminListShell>

        <ConfirmDeleteDialog
            v-model:visible="deleteVisible"
            :message="$t('pages.admin.waitlist.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
interface WaitlistEntry {
    id: number
    name: string
    email: string
    purpose: string | null
    locale: string | null
    createdAt: string
}

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const { formatDate } = useI18nDate()

const filters = reactive({
    search: '',
    purpose: '',
})

const deleteVisible = ref(false)
const itemToDelete = ref<WaitlistEntry | null>(null)

const {
    items,
    loading,
    pagination,
    onPage,
    onFilterChange: applyFilters,
    refresh,
} = useAdminList<WaitlistEntry, typeof filters>({
    initialFilters: filters,
    initialLimit: 20,
    fetchFn: async ({ page, limit, search, purpose }) => {
        const response = await $fetch<{
            code: number
            data: {
                items: WaitlistEntry[]
                total: number
            }
        }>('/api/admin/waitlist', {
            query: {
                page,
                pageSize: limit,
                search,
                purpose,
            },
        })

        return {
            data: response.code === 200 ? response.data.items : [],
            total: response.code === 200 ? response.data.total : 0,
        }
    },
})

const onFilterChange = useDebounceFn(() => {
    applyFilters()
}, 500)

const exportWaitlist = () => {
    const params = new URLSearchParams()
    if (filters.purpose) {
        params.set('purpose', filters.purpose)
    }
    const url = `/api/admin/waitlist/export${params.toString() ? `?${params.toString()}` : ''}`
    window.open(url, '_blank')
}

const confirmDelete = (item: WaitlistEntry) => {
    itemToDelete.value = item
    deleteVisible.value = true
}

const doDelete = async () => {
    if (!itemToDelete.value) return
    try {
        await $fetch(`/api/admin/waitlist/${itemToDelete.value.id}`, {
            method: 'DELETE',
        })
        await refresh()
        deleteVisible.value = false
        itemToDelete.value = null
    } catch (error) {
        console.error('Failed to delete waitlist entry:', error)
    }
}
</script>

<style lang="scss" scoped>
.admin-waitlist {
    &__purpose-input {
        min-width: 160px;
    }
}
</style>
