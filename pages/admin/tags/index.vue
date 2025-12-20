<template>
    <div class="page-container">
        <div class="page-header">
            <h1 class="page-title">
                {{ $t('pages.admin.tags.title') }}
            </h1>
            <Button
                :label="$t('pages.admin.tags.create')"
                icon="pi pi-plus"
                @click="openDialog()"
            />
        </div>

        <div class="content-card">
            <div class="filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('pages.admin.tags.search_placeholder')"
                        @keydown.enter="loadData"
                    />
                </IconField>
            </div>

            <DataTable
                :value="items"
                :loading="pending"
                lazy
                :total-records="total"
                :rows="limit"
                paginator
                :rows-per-page-options="[5, 10, 20]"
                table-style="min-width: 50rem"
                @page="onPage"
            >
                <Column field="name" :header="$t('common.name')" />
                <Column field="slug" :header="$t('common.slug')" />
                <Column
                    :header="$t('common.actions')"
                    :exportable="false"
                    style="min-width:8rem"
                >
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            text
                            rounded
                            severity="info"
                            @click="openDialog(slotProps.data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            text
                            rounded
                            severity="danger"
                            @click="confirmDelete(slotProps.data)"
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
            class="p-fluid"
            :style="{width: '450px'}"
        >
            <div class="field">
                <label for="name">{{ $t('common.name') }}</label>
                <InputText
                    id="name"
                    v-model.trim="form.name"
                    required
                    autofocus
                    :class="{'p-invalid': submitted && !form.name}"
                />
                <small v-if="submitted && !form.name" class="p-error">Name is required.</small>
            </div>
            <div class="field">
                <label for="slug">{{ $t('common.slug') }}</label>
                <InputText
                    id="slug"
                    v-model.trim="form.slug"
                    required
                    :class="{'p-invalid': submitted && !form.slug}"
                />
                <small v-if="submitted && !form.slug" class="p-error">Slug is required.</small>
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()

interface Tag {
    id: string
    name: string
    slug: string
}

const items = ref<Tag[]>([])
const total = ref(0)
const limit = ref(10)
const page = ref(1)
const pending = ref(false)
const filters = ref({
    search: '',
})

const dialogVisible = ref(false)
const editingItem = ref<Tag | null>(null)
const submitted = ref(false)
const saving = ref(false)

const form = ref({
    name: '',
    slug: '',
})

const loadData = async () => {
    pending.value = true
    try {
        const { data } = await useFetch('/api/tags', {
            query: {
                page: page.value,
                limit: limit.value,
                search: filters.value.search,
            },
        })
        if (data.value) {
            items.value = data.value.data.list
            total.value = data.value.data.total
        }
    } catch (error) {
        console.error(error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 })
    } finally {
        pending.value = false
    }
}

const onPage = (event: any) => {
    page.value = event.page + 1
    limit.value = event.rows
    loadData()
}

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
    if (!form.value.name || !form.value.slug) return

    saving.value = true
    try {
        if (editingItem.value) {
            await $fetch(`/api/tags/${editingItem.value.id}`, {
                method: 'PUT',
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

const confirmDelete = (item: Tag) => {
    confirm.require({
        message: t('pages.admin.tags.delete_confirm'),
        header: t('common.confirm'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await $fetch(`/api/tags/${item.id}`, {
                    method: 'DELETE',
                })
                toast.add({ severity: 'success', summary: 'Success', detail: t('pages.admin.tags.delete_success'), life: 3000 })
                loadData()
            } catch (error: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: error.statusMessage || 'Failed to delete', life: 3000 })
            }
        },
    })
}

onMounted(() => {
    loadData()
})
</script>

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
        color: var(--text-color);
    }
}

.content-card {
    background: var(--surface-card);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: var(--card-shadow);
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
