<template>
    <div class="admin-tags page-container">
        <AdminPageHeader :title="$t('pages.admin.tags.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.tags.create')"
                    icon="pi pi-plus"
                    @click="openDialog()"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-tags__card">
            <div class="admin-tags__filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('pages.admin.tags.search_placeholder')"
                        @input="onFilterChange"
                    />
                </IconField>
            </div>

            <DataTable
                :value="items"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                paginator
                class="p-datatable-sm"
                @page="onPage"
                @sort="onSort"
            >
                <Column
                    field="name"
                    :header="$t('common.name')"
                    sortable
                />
                <Column
                    field="slug"
                    :header="$t('common.slug')"
                    sortable
                />
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
                            @click="confirmDeleteAction(data)"
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

        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-tags__dialog p-fluid"
        >
            <div class="field">
                <label for="name">{{ $t('common.name') }}</label>
                <InputText
                    id="name"
                    v-model.trim="form.name"
                    required
                    autofocus
                    :class="{'p-invalid': errors.name}"
                />
                <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>
            <div class="field">
                <label for="slug">{{ $t('common.slug') }}</label>
                <InputText
                    id="slug"
                    v-model.trim="form.slug"
                    required
                    :class="{'p-invalid': errors.slug}"
                />
                <small v-if="errors.slug" class="p-error">{{ errors.slug }}</small>
            </div>

            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    icon="pi pi-times"
                    text
                    @click="hideDialog"
                />
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    text
                    :loading="saving"
                    @click="saveItem"
                />
            </template>
        </Dialog>

        <ConfirmDeleteDialog
            v-model:visible="deleteDialog.visible"
            :title="$t('pages.admin.tags.delete_confirm_title')"
            :message="deleteDialog.message"
            @confirm="deleteTag"
        />
    </div>
</template>

<script setup lang="ts">
import { tagBodySchema, tagUpdateSchema } from '@/utils/schemas/tag'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const toast = useToast()

interface Tag {
    id: string
    name: string
    slug: string
}

const {
    items,
    loading,
    pagination,
    filters,
    onPage,
    onSort,
    onFilterChange,
    refresh: loadData,
} = useAdminList<Tag, { search: string }>({
    fetchFn: async (params) => {
        const response = await $fetch<any>('/api/tags', {
            query: {
                page: params.page,
                limit: params.limit,
                search: params.search,
                sortBy: params.sortBy,
                sortDirection: params.sortDirection,
            },
        })
        return {
            data: response.data.items,
            total: response.data.total,
        }
    },
    initialFilters: {
        search: '',
    },
})

const dialogVisible = ref(false)
const editingItem = ref<Tag | null>(null)
const submitted = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const form = ref({
    name: '',
    slug: '',
})

const openDialog = (item?: Tag) => {
    editingItem.value = item || null
    if (item) {
        form.value = {
            name: item.name,
            slug: item.slug,
        }
    } else {
        form.value = {
            name: '',
            slug: '',
        }
    }
    submitted.value = false
    dialogVisible.value = true
}

const hideDialog = () => {
    dialogVisible.value = false
    submitted.value = false
}

const saveItem = async () => {
    submitted.value = true
    errors.value = {}

    const schema = editingItem.value ? tagUpdateSchema : tagBodySchema
    const result = schema.safeParse(form.value)

    if (!result.success) {
        result.error.issues.forEach((issue) => {
            errors.value[String(issue.path[0])] = issue.message
        })
        return
    }

    saving.value = true
    try {
        if (editingItem.value) {
            await $fetch(`/api/tags/${editingItem.value.id}`, {
                method: 'PUT' as any,
                body: form.value,
            })
        } else {
            await $fetch('/api/tags', {
                method: 'POST',
                body: form.value,
            })
        }
        toast.add({ severity: 'success', summary: 'Success', detail: t('pages.admin.tags.save_success'), life: 3000 })
        hideDialog()
        loadData()
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.statusMessage || 'Failed to save', life: 3000 })
    } finally {
        saving.value = false
    }
}

const deleteDialog = reactive({
    visible: false,
    item: null as Tag | null,
    message: '',
})

const confirmDeleteAction = (item: Tag) => {
    deleteDialog.item = item
    deleteDialog.message = t('pages.admin.tags.delete_confirm')
    deleteDialog.visible = true
}

const deleteTag = async () => {
    if (!deleteDialog.item) return
    try {
        await $fetch(`/api/tags/${deleteDialog.item.id}`, {
            method: 'DELETE' as any,
        })
        toast.add({ severity: 'success', summary: 'Success', detail: t('pages.admin.tags.delete_success'), life: 3000 })
        loadData()
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.statusMessage || 'Failed to delete', life: 3000 })
    }
}

onMounted(() => {
    loadData()
})
</script>

<style lang="scss" scoped>
.admin-tags {
    &__card {
        background-color: var(--p-surface-card);
        border-radius: 1rem;
        padding: 1.5rem;
        border: 1px solid var(--p-surface-border);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    &__filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    &__dialog {
        width: 450px;
    }
}

.field {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
        font-weight: 600;
    }
}

.empty-state {
    padding: 2rem 0;
    text-align: center;
    color: var(--p-text-muted-color);
}
</style>

<style lang="scss" scoped>
.page-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .page-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--p-text-color);
    }
}

.content-card {
    background-color: var(--p-surface-card);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--p-surface-border);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.field {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
        font-weight: 600;
    }
}
</style>
