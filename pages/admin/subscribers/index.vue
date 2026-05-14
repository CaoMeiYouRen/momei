<template>
    <div>
        <AdminListShell
            container-class="admin-subscribers page-container"
            :title="$t('pages.admin.subscribers.title')"
            show-language-switcher
        >
            <template #actions>
                <Button
                    :label="$t('pages.admin.subscribers.export')"
                    icon="pi pi-download"
                    severity="secondary"
                    @click="exportSubscribers"
                />
            </template>

            <template #filters>
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.email"
                        :placeholder="$t('pages.admin.subscribers.search_placeholder')"
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
                    field="email"
                    :header="$t('common.email')"
                    sortable
                />
                <Column field="language" :header="$t('common.language')">
                    <template #body="{data}">
                        <Tag :value="$t(`common.languages.${data.language}`)" severity="secondary" />
                    </template>
                </Column>
                <Column field="isActive" :header="$t('pages.admin.subscribers.active_status')">
                    <template #body="{data}">
                        <Tag
                            :severity="data.isActive ? 'success' : 'secondary'"
                            :value="data.isActive ? $t('pages.admin.subscribers.active') : $t('pages.admin.subscribers.inactive')"
                            style="cursor: pointer"
                            @click="toggleStatus(data)"
                        />
                    </template>
                </Column>
                <Column :header="$t('pages.admin.subscribers.user_associated')">
                    <template #body="{data}">
                        <template v-if="data.user">
                            <div class="flex gap-2 items-center">
                                <AppAvatar
                                    :image="data.user.image"
                                    :email="data.user.email"
                                    :name="data.user.name"
                                    shape="circle"
                                    size="small"
                                />
                                <span>{{ data.user.name || data.user.email }}</span>
                            </div>
                        </template>
                        <Tag
                            v-else
                            severity="warning"
                            :value="$t('pages.admin.subscribers.not_associated')"
                        />
                    </template>
                </Column>
                <Column field="createdAt" :header="$t('pages.admin.subscribers.join_date')">
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
            :message="$t('pages.admin.subscribers.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
import type { Subscriber } from '@/types/subscriber'

const { formatDate } = useI18nDate()

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const filters = reactive({
    email: '',
})

const deleteVisible = ref(false)
const itemToDelete = ref<Subscriber | null>(null)

const {
    items,
    loading,
    pagination,
    onPage,
    onFilterChange: applyFilters,
    refresh,
} = useAdminList<Subscriber, typeof filters>({
    initialFilters: filters,
    initialLimit: 20,
    fetchFn: async ({ page, limit, email }) => {
        const response = await $fetch<{
            code: number
            data: {
                items: Subscriber[]
                total: number
            }
        }>('/api/subscribers', {
            query: {
                page,
                pageSize: limit,
                email,
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

const exportSubscribers = () => {
    window.open('/api/subscribers/export', '_blank')
}

const toggleStatus = async (item: Subscriber) => {
    try {
        await $fetch(`/api/subscribers/${item.id}`, {
            method: 'PUT',
            body: { isActive: !item.isActive },
        })
        item.isActive = !item.isActive
    } catch (error) {
        console.error('Failed to toggle status:', error)
    }
}

const confirmDelete = (item: Subscriber) => {
    itemToDelete.value = item
    deleteVisible.value = true
}

const doDelete = async () => {
    if (!itemToDelete.value) return
    try {
        await $fetch(`/api/subscribers/${itemToDelete.value.id}`, {
            method: 'DELETE',
        })
        await refresh()
        deleteVisible.value = false
        itemToDelete.value = null
    } catch (error) {
        console.error('Failed to delete subscriber:', error)
    }
}
</script>
