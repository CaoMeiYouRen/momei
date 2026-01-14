<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.tags.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.tags.create')"
                    icon="pi pi-plus"
                    @click="openDialog()"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-content-card">
            <div class="admin-filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('pages.admin.tags.search_placeholder')"
                        @input="onFilterChange"
                    />
                </IconField>
                <div class="admin-filters__right">
                    <div class="aggregate-toggle">
                        <ToggleSwitch
                            v-model="filters.aggregate"
                            input-id="aggregate-switch"
                            @change="onFilterChange"
                        />
                        <label for="aggregate-switch" class="cursor-pointer">{{ $t('common.aggregate_translations') }}</label>
                    </div>
                </div>
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
                    header-style="min-width: 10rem"
                />
                <Column
                    field="slug"
                    :header="$t('common.slug')"
                    sortable
                    header-style="min-width: 8rem"
                />
                <Column
                    v-if="filters.aggregate"
                    :header="$t('common.translation_status')"
                    header-class="text-center"
                    body-class="text-center"
                    header-style="min-width: 8rem"
                >
                    <template #body="{data}">
                        <div class="justify-content-center translation-badges">
                            <Badge
                                v-for="l in locales"
                                :key="l.code"
                                v-tooltip="$t('common.languages.' + l.code)"
                                :value="l.code.toUpperCase()"
                                :severity="hasTranslation(data, l.code) ? 'success' : 'secondary'"
                                class="translation-badge"
                                :class="{'translation-badge--missing': !hasTranslation(data, l.code)}"
                                @click="handleTranslationClick(l.code, hasTranslation(data, l.code), data)"
                            />
                        </div>
                    </template>
                </Column>
                <Column
                    v-else
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
            <Tabs v-model:value="activeTab">
                <TabList>
                    <Tab
                        v-for="l in locales"
                        :key="l.code"
                        :value="l.code"
                    >
                        <i
                            v-if="hasTranslationData(l.code)"
                            class="mr-2 pi pi-check-circle text-success"
                        />
                        {{ $t('common.languages.' + l.code) }}
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel
                        v-for="l in locales"
                        :key="l.code"
                        :value="l.code"
                    >
                        <div class="field mt-4">
                            <label :for="'name_' + l.code">{{ $t('common.name') }}</label>
                            <InputText
                                :id="'name_' + l.code"
                                v-model.trim="multiForm[l.code].name"
                                required
                                autofocus
                                :class="{'p-invalid': multiErrors[l.code]?.name}"
                            />
                            <small v-if="multiErrors[l.code]?.name" class="p-error">{{ multiErrors[l.code]?.name }}</small>
                        </div>
                        <div v-if="isPureEnglishMulti(l.code) && !editingItem" class="field flex gap-2 items-center">
                            <Checkbox
                                v-model="syncToAllLanguages"
                                :binary="true"
                                :input-id="'syncAll_' + l.code"
                            />
                            <label :for="'syncAll_' + l.code" class="cursor-pointer">{{ $t('pages.admin.tags.sync_to_all_languages') }}</label>
                        </div>
                        <div class="field">
                            <label :for="'slug_' + l.code">{{ $t('common.slug') }}</label>
                            <InputText
                                :id="'slug_' + l.code"
                                v-model.trim="multiForm[l.code].slug"
                                required
                                :class="{'p-invalid': multiErrors[l.code]?.slug}"
                            />
                            <small v-if="multiErrors[l.code]?.slug" class="p-error">{{ multiErrors[l.code]?.slug }}</small>
                        </div>
                        <div class="field">
                            <label :for="'translationId_' + l.code">
                                {{ $t('common.translation_id') }}
                                <small class="text-secondary">({{ $t('common.optional') }})</small>
                            </label>
                            <InputGroup>
                                <InputText
                                    :id="'translationId_' + l.code"
                                    v-model.trim="multiForm[l.code].translationId"
                                    :placeholder="$t('common.translation_id_hint')"
                                />
                                <Button
                                    icon="pi pi-refresh"
                                    severity="secondary"
                                    text
                                    @click="syncTranslationIdFromSlugMulti(l.code)"
                                />
                            </InputGroup>
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    icon="pi pi-times"
                    text
                    @click="hideDialog"
                />
                <Button
                    v-if="editingItem"
                    :label="$t('common.delete')"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    @click="confirmDeleteActionMulti"
                />
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    text
                    :loading="saving"
                    @click="saveItemMulti"
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
    translations?: Array<{
        id: string
        language: string
        name: string
        slug: string
    }>
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
} = useAdminList<Tag, { search: string, aggregate: boolean }>({
    url: '/api/tags',
    initialFilters: {
        search: '',
        aggregate: true,
    },
})

const hasTranslation = (data: Tag, langCode: string) => {
    if (!data.translations) return data.language === langCode ? data : null
    return data.translations.find((t: any) => t.language === langCode) || null
}

const handleTranslationClick = (langCode: string, translation: any, item: any) => {
    if (translation) {
        openDialog(translation)
    } else {
        // Create new translation
        openDialog({
            name: '',
            slug: item.slug,
            language: langCode,
            translationId: item.translationId || item.id,
        } as any)
    }
}

const { contentLanguage } = useAdminI18n()

const languageOptions = computed(() => locales.value.map((l: any) => ({
    label: t(`common.languages.${l.code}`),
    value: l.code,
})))

const dialogVisible = ref(false)
const editingItem = ref<Tag | null>(null)
const submitted = ref(false)
const saving = ref(false)
const activeTab = ref(locale.value)

const createEmptyForm = (lang: string) => ({
    id: null as string | null,
    name: '',
    slug: '',
    language: lang,
    translationId: null as string | null,
})

const multiForm = ref<Record<string, any>>({})
const multiErrors = ref<Record<string, Record<string, string>>>({})

// Initialize multiForm
locales.value.forEach((l: any) => {
    multiForm.value[l.code] = createEmptyForm(l.code)
    multiErrors.value[l.code] = {}
})

const hasTranslationData = (langCode: string) => {
    return !!multiForm.value[langCode]?.id || !!multiForm.value[langCode]?.name
}

const syncToAllLanguages = ref(false)
const isPureEnglishMulti = (lang: string) => {
    return /^[a-zA-Z0-9\s\-_]+$/.test(multiForm.value[lang].name)
}

const syncTranslationIdFromSlugMulti = (lang: string) => {
    if (multiForm.value[lang].slug) {
        multiForm.value[lang].translationId = multiForm.value[lang].slug
        locales.value.forEach((l: any) => {
            if (!multiForm.value[l.code].translationId) {
                multiForm.value[l.code].translationId = multiForm.value[lang].translationId
            }
        })
    }
}

const openDialog = async (item?: any) => {
    editingItem.value = item || null
    activeTab.value = item?.language || contentLanguage.value || locale.value

    locales.value.forEach((l: any) => {
        multiForm.value[l.code] = createEmptyForm(l.code)
        multiErrors.value[l.code] = {}
    })

    if (item) {
        if (item.translations) {
            const allItems = [item, ...item.translations]
            for (const it of allItems) {
                const lang = it.language
                multiForm.value[lang] = {
                    id: it.id,
                    name: it.name,
                    slug: it.slug,
                    language: it.language,
                    translationId: it.translationId || null,
                }
            }
        } else if (item.translationId) {
            const res = await $fetch<any>('/api/tags', {
                query: { translationId: item.translationId, limit: 10 },
            })
            res.data.items.forEach((it: any) => {
                multiForm.value[it.language] = {
                    id: it.id,
                    name: it.name,
                    slug: it.slug,
                    language: it.language,
                    translationId: it.translationId || null,
                }
            })
        } else {
            multiForm.value[item.language] = {
                id: item.id,
                name: item.name,
                slug: item.slug,
                language: item.language,
                translationId: item.translationId || null,
            }
        }
    }

    syncToAllLanguages.value = false
    submitted.value = false
    dialogVisible.value = true
}

const hideDialog = () => {
    dialogVisible.value = false
    submitted.value = false
}

const saveItemMulti = async () => {
    submitted.value = true
    let hasErrors = false

    const modifiedLocales = locales.value.filter((l: any) => hasTranslationData(l.code))

    for (const l of modifiedLocales) {
        multiErrors.value[l.code] = {}
        const schema = multiForm.value[l.code].id ? tagUpdateSchema : tagBodySchema
        const result = schema.safeParse(multiForm.value[l.code])
        if (!result.success) {
            result.error.issues.forEach((issue) => {
                if (multiErrors.value[l.code]) {
                    multiErrors.value[l.code]![String(issue.path[0])] = issue.message
                }
            })
            hasErrors = true
            activeTab.value = l.code
        }
    }

    if (hasErrors) return

    saving.value = true
    try {
        let sharedTranslationId = modifiedLocales.find((l) => multiForm.value[l.code].translationId)?.translationId
            || modifiedLocales.find((l) => multiForm.value[l.code].id)?.translationId

        for (const l of modifiedLocales) {
            const formData = { ...multiForm.value[l.code] }
            if (sharedTranslationId) formData.translationId = sharedTranslationId

            if (formData.id) {
                await $fetch(`/api/tags/${formData.id}`, {
                    method: 'PUT' as any,
                    body: formData,
                })
            } else {
                const res = await $fetch<any>('/api/tags', {
                    method: 'POST',
                    body: formData,
                })
                if (!sharedTranslationId && res.data.translationId) {
                    sharedTranslationId = res.data.translationId
                }
            }
        }

        toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.tags.save_success'), life: 3000 })
        hideDialog()
        loadData()
    } catch (error: any) {
        console.error('Failed to save tag', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: error.data?.message || t('common.save_failed'), life: 5000 })
    } finally {
        saving.value = false
    }
}

const confirmDeleteActionMulti = () => {
    const currentItem = multiForm.value[activeTab.value]
    if (currentItem.id) {
        deleteDialog.item = { id: currentItem.id } as any
        deleteDialog.message = t('pages.admin.tags.delete_confirm')
        deleteDialog.visible = true
    }
}

const confirmDeleteAction = (item: Tag) => {
    deleteDialog.item = item
    deleteDialog.message = t('pages.admin.tags.delete_confirm')
    deleteDialog.visible = true
}

const deleteDialog = reactive({
    visible: false,
    item: null as Tag | null,
    message: '',
})

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

.translation-badges {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;

    &.justify-content-center {
        justify-content: center;
    }
}

.translation-badge {
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }

    &--missing {
        filter: grayscale(1) opacity(0.5);
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
