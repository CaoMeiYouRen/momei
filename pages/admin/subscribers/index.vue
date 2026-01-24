<template>
    <div class="admin-subscribers page-container">
        <AdminPageHeader :title="$t('pages.admin.subscribers.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.subscribers.export')"
                    icon="pi pi-download"
                    severity="secondary"
                    @click="exportSubscribers"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-subscribers__card">
            <div class="admin-subscribers__filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.email"
                        :placeholder="$t('pages.admin.subscribers.search_placeholder')"
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
                    <div class="empty-state">
                        {{ $t('pages.posts.empty') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <ConfirmDeleteDialog
            v-model:visible="deleteVisible"
            :message="$t('pages.admin.subscribers.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { formatDate } = useI18nDate()

definePageMeta({
    layout: 'default',
})

interface Subscriber {
    id: string
    email: string
    isActive: boolean
    language: string
    userId: string | null
    createdAt: string
    user?: {
        name?: string | null
        email: string
        image?: string | null
    } | null
}

const loading = ref(false)
const items = ref<Subscriber[]>([])
const total = ref(0)
const pagination = reactive({
    page: 1,
    pageSize: 20,
})
const filters = reactive({
    email: '',
})

const deleteVisible = ref(false)
const itemToDelete = ref<any>(null)

const loadData = async () => {
    loading.value = true
    try {
        const query = {
            page: pagination.page,
            pageSize: pagination.pageSize,
            email: filters.email || undefined,
        }
        const res = await $fetch('/api/subscribers', { query })
        if (res.code === 200) {
            items.value = res.data.items
            total.value = res.data.total
        }
    } catch (error) {
        console.error('Failed to load subscribers:', error)
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

const exportSubscribers = () => {
    window.open('/api/subscribers/export', '_blank')
}

const toggleStatus = async (item: any) => {
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

const confirmDelete = (item: any) => {
    itemToDelete.value = item
    deleteVisible.value = true
}

const doDelete = async () => {
    if (!itemToDelete.value) return
    try {
        await $fetch(`/api/subscribers/${itemToDelete.value.id}`, {
            method: 'DELETE',
        })
        deleteVisible.value = false
        itemToDelete.value = null
        loadData()
    } catch (error) {
        console.error('Failed to delete subscriber:', error)
    }
}

onMounted(() => {
    loadData()
})
</script>

<style lang="scss" scoped>
.admin-subscribers {
    &__card {
        background: var(--surface-card);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgb(0 0 0 / 0.05);
    }

    &__filters {
        margin-bottom: 1.5rem;
    }
}

.empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
}
</style>
