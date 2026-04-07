<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t(config.titleKey)" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t(config.createKey)"
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
                        :placeholder="$t(config.searchPlaceholderKey)"
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
                    v-if="config.showParentField"
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
                                v-for="languageOption in locales"
                                :key="languageOption.code"
                                v-tooltip="$t('common.languages.' + languageOption.code)"
                                :value="languageOption.code.toUpperCase()"
                                :severity="hasTranslation(data, languageOption.code) ? 'success' : 'secondary'"
                                class="translation-badge"
                                :class="{'translation-badge--missing': !hasTranslation(data, languageOption.code)}"
                                @click="handleTranslationClick(languageOption.code, hasTranslation(data, languageOption.code), data)"
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
                    v-if="config.showDescriptionField"
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
            class="admin-taxonomy__dialog p-fluid"
        >
            <Tabs v-model:value="activeTab">
                <TabList>
                    <Tab
                        v-for="languageOption in locales"
                        :key="languageOption.code"
                        :value="languageOption.code"
                    >
                        <i
                            v-if="hasTranslationData(languageOption.code)"
                            class="mr-2 pi pi-check-circle text-success"
                        />
                        {{ $t('common.languages.' + languageOption.code) }}
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel
                        v-for="languageOption in locales"
                        :key="languageOption.code"
                        :value="languageOption.code"
                    >
                        <div class="field mt-4">
                            <label :for="'name_' + languageOption.code">{{ $t('common.name') }}</label>
                            <InputGroup>
                                <InputText
                                    :id="'name_' + languageOption.code"
                                    v-model.trim="getFormState(languageOption.code).name"
                                    required
                                    autofocus
                                    :class="{'p-invalid': getErrorState(languageOption.code).name}"
                                />
                                <Button
                                    v-tooltip="$t('common.ai_translate')"
                                    icon="pi pi-sparkles"
                                    severity="secondary"
                                    text
                                    :loading="aiLoading[languageOption.code]?.name"
                                    @click="translateName(languageOption.code)"
                                />
                            </InputGroup>
                            <small v-if="getErrorState(languageOption.code).name" class="p-error">{{ getErrorState(languageOption.code).name }}</small>
                        </div>
                        <div v-if="!editingItem" class="taxonomy-dialog__sync-controls">
                            <div class="taxonomy-dialog__sync-toggle">
                                <Checkbox
                                    v-model="syncToAllLanguages"
                                    :binary="true"
                                    :input-id="'syncAll_' + languageOption.code"
                                />
                                <label :for="'syncAll_' + languageOption.code" class="cursor-pointer">{{ $t(config.syncToAllLanguagesKey) }}</label>
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
                            <label :for="'slug_' + languageOption.code">{{ $t('common.slug') }}</label>
                            <InputGroup>
                                <InputText
                                    :id="'slug_' + languageOption.code"
                                    v-model.trim="getFormState(languageOption.code).slug"
                                    required
                                    :class="{'p-invalid': getErrorState(languageOption.code).slug}"
                                />
                                <Button
                                    v-tooltip="$t('common.ai_generate_slug')"
                                    icon="pi pi-sparkles"
                                    severity="secondary"
                                    text
                                    :loading="aiLoading[languageOption.code]?.slug"
                                    @click="generateSlug(languageOption.code)"
                                />
                            </InputGroup>
                            <small v-if="getErrorState(languageOption.code).slug" class="p-error">{{ getErrorState(languageOption.code).slug }}</small>
                        </div>
                        <div class="field">
                            <label :for="'translationId_' + languageOption.code">
                                {{ $t('common.translation_id') }}
                                <small class="text-secondary">({{ $t('common.optional') }})</small>
                            </label>
                            <InputGroup>
                                <InputText
                                    :id="'translationId_' + languageOption.code"
                                    v-model.trim="getFormState(languageOption.code).translationId"
                                    :placeholder="$t('common.translation_id_hint')"
                                />
                                <Button
                                    icon="pi pi-refresh"
                                    severity="secondary"
                                    text
                                    @click="syncTranslationIdFromSlugMulti(languageOption.code)"
                                />
                            </InputGroup>
                            <TaxonomyTranslationAssociationCard
                                v-if="getAssociationState(languageOption.code).clusterId"
                                :cluster-id="getAssociationState(languageOption.code).clusterId || ''"
                                :uses-slug-fallback="getAssociationState(languageOption.code).usesSlugFallback"
                                :same-language-conflict="getAssociationState(languageOption.code).sameLanguageConflict"
                                :linked-peers="getAssociationState(languageOption.code).linkedPeers"
                                :related-candidates="getAssociationState(languageOption.code).relatedCandidates.map((candidate) => ({
                                    ...candidate,
                                    language: $t(`common.languages.${candidate.language}`)
                                }))"
                                @open-candidate="openAssociationCandidate"
                            />
                        </div>
                        <div v-if="config.showParentField" class="field">
                            <label :for="'parent_' + languageOption.code">{{ $t('common.parent') }}</label>
                            <Select
                                :id="'parent_' + languageOption.code"
                                v-model="getFormState(languageOption.code).parentId"
                                :options="getParentOptions(languageOption.code)"
                                option-label="name"
                                option-value="id"
                                show-clear
                                filter
                                :placeholder="$t(config.parentPlaceholderKey || 'common.select_parent')"
                            />
                        </div>
                        <div v-if="config.showDescriptionField" class="field">
                            <label :for="'description_' + languageOption.code">{{ $t('common.description') }}</label>
                            <Textarea
                                :id="'description_' + languageOption.code"
                                v-model="getFormState(languageOption.code).description"
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
            :title="$t(config.deleteConfirmTitleKey)"
            :message="deleteDialog.message"
            @confirm="deleteItem"
        />
    </div>
</template>

<script setup lang="ts">
import type { ZodTypeAny } from 'zod'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import type { Category } from '@/types/category'
import type { Tag } from '@/types/tag'

type TaxonomyItem = (Category | Tag) & {
    description?: string | null
    parent?: Category | null
    parentId?: string | null
}

interface TaxonomyFormState {
    description?: string
    id: string | null
    language: string
    name: string
    parentId?: string | null
    slug: string
    translationId: string | null
}

interface TaxonomyPageConfig {
    buildEmptyForm: (lang: string) => TaxonomyFormState
    buildFormFromItem: (item: TaxonomyItem) => TaxonomyFormState
    buildMissingTranslationDraft: (item: TaxonomyItem, langCode: string) => TaxonomyFormState
    createKey: string
    createSchema: ZodTypeAny
    deleteConfirmKey: string
    deleteConfirmTitleKey: string
    deleteSuccessKey: string
    endpoint: string
    parentPlaceholderKey?: string
    saveSuccessKey: string
    searchPlaceholderKey: string
    showDescriptionField?: boolean
    showParentField?: boolean
    syncToAllLanguagesKey: string
    titleKey: string
    updateSchema: ZodTypeAny
}

const props = defineProps<{
    config: TaxonomyPageConfig
}>()

const { t, locale, locales } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const { contentLanguage } = useAdminI18n()

const {
    items,
    loading,
    pagination,
    filters,
    onPage,
    onSort,
    onFilterChange,
    refresh: loadData,
} = useAdminList<TaxonomyItem, { search: string, aggregate: boolean }>({
    url: props.config.endpoint,
    initialFilters: {
        search: '',
        aggregate: true,
    },
})

const dialogVisible = ref(false)
const editingItem = ref<TaxonomyItem | null>(null)
const submitted = ref(false)
const saving = ref(false)
const activeTab = ref<string>(String(locale.value))
const syncToAllLanguages = ref(false)
const multiForm = ref<Record<string, TaxonomyFormState>>({})
const multiErrors = ref<Record<string, Record<string, string>>>({})
const parentOptionsMulti = ref<Record<string, Category[]>>({})
const deleteDialog = reactive({
    visible: false,
    item: null as TaxonomyItem | null,
    message: '',
})

const {
    getAssociationState,
} = useTaxonomyTranslationAssociation<TaxonomyItem>({
    endpoint: props.config.endpoint,
    dialogVisible,
    locales: locales as any,
    multiForm,
})

const { aiLoading, translateName, generateSlug, syncAIAllLanguages } = useAdminAI(multiForm, activeTab)

const hasTranslation = (data: TaxonomyItem, langCode: string) => {
    if (!data.translations) {
        return data.language === langCode ? data : null
    }

    return data.translations.find((translation) => translation.language === langCode) || null
}

const hasTranslationData = (langCode: string) => {
    const formState = getFormState(langCode)
    return !!formState.id || !!formState.name
}

const initializeLocaleBuckets = () => {
    locales.value.forEach((languageOption: any) => {
        multiForm.value[languageOption.code] = props.config.buildEmptyForm(languageOption.code)
        multiErrors.value[languageOption.code] = {}
        parentOptionsMulti.value[languageOption.code] = []
    })
}

initializeLocaleBuckets()

const getFormState = (lang: string) => {
    if (!multiForm.value[lang]) {
        multiForm.value[lang] = props.config.buildEmptyForm(lang)
    }

    return multiForm.value[lang]!
}

const getErrorState = (lang: string) => {
    if (!multiErrors.value[lang]) {
        multiErrors.value[lang] = {}
    }

    return multiErrors.value[lang]!
}

const getParentOptions = (lang: string) => {
    if (!parentOptionsMulti.value[lang]) {
        parentOptionsMulti.value[lang] = []
    }

    return parentOptionsMulti.value[lang]!
}

watch(syncToAllLanguages, (value) => {
    if (value) {
        syncAIAllLanguages()
    }
})

const syncTranslationIdFromSlugMulti = (lang: string) => {
    const formState = getFormState(lang)
    const translationClusterId = resolveTranslationClusterId(undefined, formState.slug)

    if (!translationClusterId) {
        return
    }

    formState.translationId = translationClusterId
    locales.value.forEach((languageOption: any) => {
        const localeFormState = getFormState(languageOption.code)
        if (!localeFormState.translationId) {
            localeFormState.translationId = translationClusterId
        }
    })
}

const fetchParentOptionsMulti = async (lang: string) => {
    if (!props.config.showParentField) {
        return
    }

    const response = await $fetch<any>(props.config.endpoint, {
        query: {
            limit: 100,
            language: lang,
        },
    })

    if (response.data) {
        parentOptionsMulti.value[lang] = response.data.items
    }
}

const openAssociationCandidate = async (candidate: TaxonomyItem) => {
    await openDialog(candidate)
}

const populateExistingTranslations = async (item: TaxonomyItem) => {
    if (item.translations) {
        const allItems = [item, ...item.translations]
        allItems.forEach((entry) => {
            multiForm.value[entry.language] = props.config.buildFormFromItem(entry as TaxonomyItem)
        })
        return
    }

    const translationClusterId = resolveTranslationClusterId(item.translationId, item.slug, item.id)
    if (!translationClusterId) {
        multiForm.value[item.language] = props.config.buildFormFromItem(item)
        return
    }

    const response = await $fetch<any>(props.config.endpoint, {
        query: { translationId: translationClusterId, limit: 10 },
    })

    response.data.items.forEach((entry: TaxonomyItem) => {
        multiForm.value[entry.language] = props.config.buildFormFromItem(entry)
    })
}

const openDialog = async (item?: TaxonomyItem) => {
    editingItem.value = item || null
    activeTab.value = item?.language || contentLanguage.value || String(locale.value)
    initializeLocaleBuckets()

    if (item) {
        await populateExistingTranslations(item)
    }

    syncToAllLanguages.value = false
    submitted.value = false
    dialogVisible.value = true

    if (props.config.showParentField) {
        locales.value.forEach((languageOption: any) => {
            void fetchParentOptionsMulti(languageOption.code)
        })
    }
}

const openMissingTranslationDialog = async (item: TaxonomyItem, langCode: string) => {
    editingItem.value = item
    activeTab.value = langCode
    initializeLocaleBuckets()
    await populateExistingTranslations(item)
    multiForm.value[langCode] = props.config.buildMissingTranslationDraft(item, langCode)
    syncToAllLanguages.value = false
    submitted.value = false
    dialogVisible.value = true

    if (props.config.showParentField) {
        locales.value.forEach((languageOption: any) => {
            void fetchParentOptionsMulti(languageOption.code)
        })
    }
}

const openDraftDialog = async (draft: TaxonomyFormState) => {
    editingItem.value = null
    activeTab.value = draft.language
    initializeLocaleBuckets()
    multiForm.value[draft.language] = draft
    syncToAllLanguages.value = false
    submitted.value = false
    dialogVisible.value = true

    if (props.config.showParentField) {
        locales.value.forEach((languageOption: any) => {
            void fetchParentOptionsMulti(languageOption.code)
        })
    }
}

const hideDialog = () => {
    dialogVisible.value = false
    submitted.value = false
}

const handleTranslationClick = (langCode: string, translation: TaxonomyItem | null, item: TaxonomyItem) => {
    if (translation) {
        void openDialog(translation)
        return
    }

    void openMissingTranslationDialog(item, langCode)
}

const saveItemMulti = async () => {
    submitted.value = true
    let hasErrors = false

    const modifiedLocales = locales.value.filter((languageOption: any) => hasTranslationData(languageOption.code))

    for (const languageOption of modifiedLocales) {
        multiErrors.value[languageOption.code] = {}
        const formValue = getFormState(languageOption.code)
        const schema = formValue.id ? props.config.updateSchema : props.config.createSchema
        const result = schema.safeParse(formValue)

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                multiErrors.value[languageOption.code]![String(issue.path[0])] = issue.message
            })
            hasErrors = true
            activeTab.value = languageOption.code
        }
    }

    if (hasErrors) {
        return
    }

    saving.value = true
    try {
        let sharedTranslationId = modifiedLocales
            .map((languageOption: any) => resolveTranslationClusterId(
                getFormState(languageOption.code).translationId,
                getFormState(languageOption.code).slug,
                getFormState(languageOption.code).id,
            ))
            .find(Boolean) || null

        for (const languageOption of modifiedLocales) {
            const formData = { ...getFormState(languageOption.code) }
            formData.translationId = resolveTranslationClusterId(sharedTranslationId, formData.slug, formData.id)

            if (formData.id) {
                await $fetch(`${props.config.endpoint}/${formData.id}`, {
                    method: 'PUT' as any,
                    body: formData,
                })
                continue
            }

            const response = await $fetch<any>(props.config.endpoint, {
                method: 'POST',
                body: formData,
            })

            if (!sharedTranslationId && response.data.translationId) {
                sharedTranslationId = response.data.translationId
            }
        }

        showSuccessToast(props.config.saveSuccessKey)
        hideDialog()
        loadData()
    } catch (error) {
        console.error(`Failed to save taxonomy items for ${props.config.endpoint}`, error)
        showErrorToast(error, { fallbackKey: 'common.save_failed' })
    } finally {
        saving.value = false
    }
}

const confirmDeleteActionMulti = () => {
    const currentItem = getFormState(activeTab.value)
    if (!currentItem.id) {
        return
    }

    deleteDialog.item = { id: currentItem.id } as TaxonomyItem
    deleteDialog.message = t(props.config.deleteConfirmKey)
    deleteDialog.visible = true
}

const confirmDeleteAction = (item: TaxonomyItem) => {
    deleteDialog.item = item
    deleteDialog.message = t(props.config.deleteConfirmKey)
    deleteDialog.visible = true
}

const deleteItem = async () => {
    if (!deleteDialog.item) {
        return
    }

    try {
        await $fetch(`${props.config.endpoint}/${deleteDialog.item.id}`, {
            method: 'DELETE' as any,
        })
        showSuccessToast(props.config.deleteSuccessKey)
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
