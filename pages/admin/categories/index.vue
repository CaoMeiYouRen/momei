<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.categories.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.categories.create')"
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
                        :placeholder="$t('pages.admin.categories.search_placeholder')"
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
                :rows-per-page-options="[5, 10, 20, 50]"
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
                    field="parent.name"
                    :header="$t('common.parent')"
                    header-style="min-width: 8rem"
                >
                    <template #body="{data}">
                        {{ data.parent?.name || '-' }}
                    </template>
                </Column>
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
                    field="description"
                    :header="$t('common.description')"
                    class="hidden md:table-cell"
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
            class="admin-categories__dialog p-fluid"
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
                            <InputGroup>
                                <InputText
                                    :id="'name_' + l.code"
                                    v-model.trim="multiForm[l.code].name"
                                    required
                                    autofocus
                                    :class="{'p-invalid': multiErrors[l.code]?.name}"
                                />
                                <Button
                                    v-tooltip="$t('common.ai_translate')"
                                    icon="pi pi-sparkles"
                                    severity="secondary"
                                    text
                                    :loading="aiLoading[l.code]?.name"
                                    @click="translateName(l.code)"
                                />
                            </InputGroup>
                            <small v-if="multiErrors[l.code]?.name" class="p-error">{{ multiErrors[l.code]?.name }}</small>
                        </div>
                        <div v-if="!editingItem" class="taxonomy-dialog__sync-controls">
                            <div class="taxonomy-dialog__sync-toggle">
                                <Checkbox
                                    v-model="syncToAllLanguages"
                                    :binary="true"
                                    :input-id="'syncAll_' + l.code"
                                />
                                <label :for="'syncAll_' + l.code" class="cursor-pointer">{{ $t('pages.admin.categories.sync_to_all_languages') }}</label>
                            </div>
                            <Button
                                v-if="syncToAllLanguages"
                                v-tooltip="$t('common.ai_translate')"
                                icon="pi pi-sparkles"
                                severity="secondary"
                                text
                                size="small"
                                class="taxonomy-dialog__sync-ai"
                                @click="syncAIAllLanguages"
                            />
                        </div>
                        <div class="field">
                            <label :for="'slug_' + l.code">{{ $t('common.slug') }}</label>
                            <InputGroup>
                                <InputText
                                    :id="'slug_' + l.code"
                                    v-model.trim="multiForm[l.code].slug"
                                    required
                                    :class="{'p-invalid': multiErrors[l.code]?.slug}"
                                />
                                <Button
                                    v-tooltip="$t('common.ai_generate_slug')"
                                    icon="pi pi-sparkles"
                                    severity="secondary"
                                    text
                                    :loading="aiLoading[l.code]?.slug"
                                    @click="generateSlug(l.code)"
                                />
                            </InputGroup>
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
                            <TaxonomyTranslationAssociationCard
                                v-if="getAssociationState(l.code).clusterId"
                                :cluster-id="getAssociationState(l.code).clusterId || ''"
                                :uses-slug-fallback="getAssociationState(l.code).usesSlugFallback"
                                :same-language-conflict="getAssociationState(l.code).sameLanguageConflict"
                                :linked-peers="getAssociationState(l.code).linkedPeers"
                                :related-candidates="getAssociationState(l.code).relatedCandidates.map((candidate) => ({
                                    ...candidate,
                                    language: $t(`common.languages.${candidate.language}`)
                                }))"
                                @open-candidate="openAssociationCandidate"
                            />
                        </div>
                        <div class="field">
                            <label :for="'parent_' + l.code">{{ $t('common.parent') }}</label>
                            <Select
                                :id="'parent_' + l.code"
                                v-model="multiForm[l.code].parentId"
                                :options="parentOptionsMulti[l.code]"
                                option-label="name"
                                option-value="id"
                                show-clear
                                filter
                                :placeholder="$t('common.select_parent')"
                            />
                        </div>
                        <div class="field">
                            <label :for="'description_' + l.code">{{ $t('common.description') }}</label>
                            <Textarea
                                :id="'description_' + l.code"
                                v-model="multiForm[l.code].description"
                                rows="3"
                                cols="20"
                            />
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
            :title="$t('pages.admin.categories.delete_confirm_title')"
            :message="deleteDialog.message"
            @confirm="deleteCategory"
        />
    </div>
</template>

<script setup lang="ts">
import { categoryBodySchema, categoryUpdateSchema } from '@/utils/schemas/category'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import { isPureEnglish } from '@/utils/shared/validate'
import type { Category } from '@/types/category'

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const { t, locale, locales } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const {
    items,
    loading,
    pagination,
    filters,
    onPage,
    onSort,
    onFilterChange,
    refresh: loadData,
} = useAdminList<Category, { search: string, aggregate: boolean }>({
    url: '/api/categories',
    initialFilters: {
        search: '',
        aggregate: true,
    },
})

const hasTranslation = (data: Category, langCode: string) => {
    if (!data.translations) return data.language === langCode ? data : null
    return data.translations.find((t: any) => t.language === langCode) || null
}

const handleTranslationClick = (langCode: string, translation: any, item: any) => {
    if (translation) {
        openDialog(translation)
    } else {
        const translationClusterId = resolveTranslationClusterId(item.translationId, item.slug, item.id)

        // Create new translation
        openDialog({
            name: '',
            slug: item.slug,
            language: langCode,
            translationId: translationClusterId,
            parentId: item.parentId,
        } as any)
    }
}

const { contentLanguage } = useAdminI18n()

const languageOptions = computed(() => locales.value.map((l: any) => ({
    label: t(`common.languages.${l.code}`),
    value: l.code,
})))

const dialogVisible = ref(false)
const editingItem = ref<Category | null>(null)
const submitted = ref(false)
const saving = ref(false)
const activeTab = ref(locale.value)

const syncToAllLanguages = ref(false)

const multiForm = ref<Record<string, any>>({})

const {
    getAssociationState,
} = useTaxonomyTranslationAssociation<Category>({
    endpoint: '/api/categories',
    dialogVisible,
    locales: locales as any,
    multiForm,
})

const { aiLoading, translateName, generateSlug, syncAIAllLanguages } = useAdminAI(multiForm, activeTab)

const createEmptyForm = (lang: string) => ({
    id: null as string | null,
    name: '',
    slug: '',
    description: '',
    parentId: null as string | null,
    language: lang,
    translationId: null as string | null,
})

const multiErrors = ref<Record<string, Record<string, string>>>({})
const parentOptionsMulti = ref<Record<string, Category[]>>({})

// Initialize multiForm
locales.value.forEach((l: any) => {
    multiForm.value[l.code] = createEmptyForm(l.code)
    multiErrors.value[l.code] = {}
    parentOptionsMulti.value[l.code] = []
})

const hasTranslationData = (langCode: string) => {
    return !!multiForm.value[langCode]?.id || !!multiForm.value[langCode]?.name
}

watch(syncToAllLanguages, (val) => {
    if (val) {
        syncAIAllLanguages()
    }
})

const syncTranslationIdFromSlugMulti = (lang: string) => {
    const translationClusterId = resolveTranslationClusterId(undefined, multiForm.value[lang].slug)

    if (translationClusterId) {
        multiForm.value[lang].translationId = translationClusterId
        // Default sync to other tabs if they are empty
        locales.value.forEach((l: any) => {
            if (!multiForm.value[l.code].translationId) {
                multiForm.value[l.code].translationId = translationClusterId
            }
        })
    }
}

const openAssociationCandidate = async (candidate: Category) => {
    await openDialog(candidate)
}

const fetchParentOptionsMulti = async (lang: string) => {
    const response = await $fetch<any>('/api/categories', {
        query: {
            limit: 100,
            language: lang,
        },
    })
    if (response.data) {
        parentOptionsMulti.value[lang] = response.data.items
    }
}

const openDialog = async (item?: any) => {
    // If we are grouping, item might be the cluster root.
    // We need to fetch all translations if not provided.
    editingItem.value = item || null
    activeTab.value = item?.language || contentLanguage.value || locale.value

    // Clear forms
    locales.value.forEach((l: any) => {
        multiForm.value[l.code] = createEmptyForm(l.code)
        multiErrors.value[l.code] = {}
    })

    if (item) {
        // If it's a cluster (has translations array from API)
        if (item.translations) {
            // It's already the primary item in a cluster
            const allItems = [item, ...item.translations]
            for (const it of allItems) {
                const lang = it.language
                multiForm.value[lang] = {
                    id: it.id,
                    name: it.name,
                    slug: it.slug,
                    description: it.description || '',
                    parentId: it.parentId || null,
                    language: it.language,
                    translationId: resolveTranslationClusterId(it.translationId, it.slug),
                }
            }
        } else if (resolveTranslationClusterId(item.translationId, item.slug, item.id)) {
            // It's a single item with translationId, fetch peers
            const translationClusterId = resolveTranslationClusterId(item.translationId, item.slug, item.id)
            const res = await $fetch<any>('/api/categories', {
                query: { translationId: translationClusterId, limit: 10 },
            })
            res.data.items.forEach((it: any) => {
                multiForm.value[it.language] = {
                    id: it.id,
                    name: it.name,
                    slug: it.slug,
                    description: it.description || '',
                    parentId: it.parentId || null,
                    language: it.language,
                    translationId: resolveTranslationClusterId(it.translationId, it.slug),
                }
            })
        } else {
            // Single item, no translationId
            multiForm.value[item.language] = {
                id: item.id,
                name: item.name,
                slug: item.slug,
                description: item.description || '',
                parentId: item.parentId || null,
                language: item.language,
                translationId: resolveTranslationClusterId(item.translationId, item.slug),
            }
        }
    }

    syncToAllLanguages.value = false
    submitted.value = false
    dialogVisible.value = true

    // Fetch parent options for all tabs
    locales.value.forEach((l: any) => fetchParentOptionsMulti(l.code))
}

const hideDialog = () => {
    dialogVisible.value = false
    submitted.value = false
}

const saveItemMulti = async () => {
    submitted.value = true
    let hasErrors = false

    // Validate only modified or existing translations
    const modifiedLocales = locales.value.filter((l: any) => hasTranslationData(l.code))

    for (const l of modifiedLocales) {
        multiErrors.value[l.code] = {}
        const schema = multiForm.value[l.code].id ? categoryUpdateSchema : categoryBodySchema
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
        // Find a common translationId if possible
        let sharedTranslationId = modifiedLocales
            .map((l) => resolveTranslationClusterId(
                multiForm.value[l.code].translationId,
                multiForm.value[l.code].slug,
                multiForm.value[l.code].id,
            ))
            .find(Boolean) || null

        // Sequential save to ensure translationId consistency
        for (const l of modifiedLocales) {
            const formData = { ...multiForm.value[l.code] }
            formData.translationId = resolveTranslationClusterId(sharedTranslationId, formData.slug, formData.id)

            if (formData.id) {
                await $fetch(`/api/categories/${formData.id}`, {
                    method: 'PUT' as any,
                    body: formData,
                })
            } else {
                const res = await $fetch<any>('/api/categories', {
                    method: 'POST',
                    body: formData,
                })
                if (!sharedTranslationId && res.data.translationId) {
                    sharedTranslationId = res.data.translationId
                }
            }
        }

        showSuccessToast('pages.admin.categories.save_success')
        hideDialog()
        loadData()
    } catch (error) {
        console.error('Failed to save category', error)
        showErrorToast(error, { fallbackKey: 'common.save_failed' })
    } finally {
        saving.value = false
    }
}

const confirmDeleteActionMulti = () => {
    const currentItem = multiForm.value[activeTab.value]
    if (currentItem.id) {
        deleteDialog.item = { id: currentItem.id } as any
        deleteDialog.message = t('pages.admin.categories.delete_confirm')
        deleteDialog.visible = true
    }
}

const deleteDialog = reactive({
    visible: false,
    item: null as Category | null,
    message: '',
})

const confirmDeleteAction = (item: Category) => {
    deleteDialog.item = item
    deleteDialog.message = t('pages.admin.categories.delete_confirm')
    deleteDialog.visible = true
}

const deleteCategory = async () => {
    if (!deleteDialog.item) return
    try {
        await $fetch(`/api/categories/${deleteDialog.item.id}`, {
            method: 'DELETE' as any,
        })
        showSuccessToast('pages.admin.categories.delete_success')
        loadData()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.delete_failed' })
    }
}

onMounted(() => {
    loadData()
})
</script>

<style lang="scss" scoped>
.admin-categories {
    &__card {
        background-color: var(--p-surface-card);
        border-radius: 1rem;
        padding: 1.5rem;
        border: 1px solid var(--p-surface-border);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    &__filters {
        label {
            font-weight: 600;
        }
    }
}

.taxonomy-dialog__sync-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.taxonomy-dialog__sync-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
}

.taxonomy-dialog__sync-ai {
    flex-shrink: 0;
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
