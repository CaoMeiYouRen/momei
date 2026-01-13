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
                    field="language"
                    :header="$t('common.language')"
                    sortable
                >
                    <template #body="{data}">
                        <Tag :value="$t(`common.languages.${data.language}`)" severity="secondary" />
                    </template>
                </Column>
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
            <div v-if="isPureEnglish && !editingItem" class="field flex gap-2 items-center">
                <Checkbox
                    v-model="syncToAllLanguages"
                    :binary="true"
                    input-id="syncAll"
                />
                <label for="syncAll" class="cursor-pointer">{{ $t('pages.admin.tags.sync_to_all_languages') }}</label>
            </div>
            <div class="field">
                <label for="language">{{ $t('common.language') }}</label>
                <Select
                    id="language"
                    v-model="form.language"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                    required
                />
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
            <div class="field">
                <label for="translationId">
                    {{ $t('common.translation_id') }}
                    <small class="text-secondary">({{ $t('common.optional') }})</small>
                </label>
                <InputGroup>
                    <InputText
                        id="translationId"
                        v-model.trim="form.translationId"
                        :placeholder="$t('common.translation_id_hint')"
                    />
                    <Button
                        icon="pi pi-refresh"
                        severity="secondary"
                        text
                        @click="syncTranslationIdFromSlug"
                    />
                </InputGroup>
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

const { t, locale, locales } = useI18n()
const toast = useToast()

interface Tag {
    id: string
    name: string
    slug: string
    language: string
    translationId?: string | null
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
    url: '/api/tags',
    initialFilters: {
        search: '',
    },
})

const { contentLanguage } = useAdminI18n()

const languageOptions = computed(() => locales.value.map((l: any) => ({
    label: t(`common.languages.${l.code}`),
    value: l.code,
})))

const dialogVisible = ref(false)
const editingItem = ref<Tag | null>(null)
const submitted = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const form = ref({
    name: '',
    slug: '',
    language: contentLanguage.value || locale.value,
    translationId: null as string | null,
})

const syncTranslationIdFromSlug = () => {
    if (form.value.slug) {
        form.value.translationId = form.value.slug
    }
}

const oldSlugValue = ref('')
watch(() => form.value.slug, (newSlug) => {
    if (!editingItem.value && (!form.value.translationId || form.value.translationId === oldSlugValue.value)) {
        form.value.translationId = newSlug
    }
    oldSlugValue.value = newSlug
})

const syncToAllLanguages = ref(false)
const isPureEnglish = computed(() => {
    return /^[a-zA-Z0-9\s\-_]+$/.test(form.value.name)
})

const openDialog = (item?: Tag) => {
    editingItem.value = item || null
    if (item) {
        form.value = {
            name: item.name,
            slug: item.slug,
            language: item.language,
            translationId: item.translationId || null,
        }
        oldSlugValue.value = item.slug
    } else {
        form.value = {
            name: '',
            slug: '',
            language: contentLanguage.value || locale.value,
            translationId: null,
        }
        oldSlugValue.value = ''
    }
    syncToAllLanguages.value = false
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
        } else if (syncToAllLanguages.value && isPureEnglish.value) {
            // 同步创建所有语言版本
            const firstRes = await $fetch<any>('/api/tags', {
                method: 'POST',
                body: form.value,
            })
            const translationId = firstRes.data.translationId

            const otherLocales = locales.value.filter((l: any) => l.code !== form.value.language)
            const promises = otherLocales.map((l: any) => {
                return $fetch('/api/tags', {
                    method: 'POST',
                    body: {
                        ...form.value,
                        language: l.code,
                        translationId,
                    },
                }).catch((e) => console.error(`Failed to sync tag to ${l.code}`, e))
            })
            await Promise.all(promises)
        } else {
            await $fetch('/api/tags', {
                method: 'POST',
                body: form.value,
            })
        }
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.tags.save_success'), life: 3000 })
        hideDialog()
        loadData()
    } catch (error: any) {
        console.error('Failed to save tag', error)
        const serverMessage = error.data?.message || error.statusMessage || t('common.save_failed')
        toast.add({ severity: 'error', summary: t('common.error'), detail: serverMessage, life: 5000 })
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
