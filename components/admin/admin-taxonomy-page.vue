<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t(config.titleKey)" show-language-switcher>
            <template #actions>
                <!-- 可见文案写默认插槽（迁移方案 §6.2 执行提示 3）。 -->
                <CaomeiButton @click="openDialog()">
                    <template #icon>
                        <Plus :size="16" />
                    </template>
                    {{ $t(config.createKey) }}
                </CaomeiButton>
            </template>
        </AdminPageHeader>

        <div class="admin-content-card">
            <div class="admin-filters">
                <!-- `IconField` + `InputIcon` + `InputText` → `CaomeiInput` 的 `#prefix`（§6.1 C 组）。 -->
                <CaomeiInput
                    v-model.trim="filters.search"
                    class="admin-filters__search"
                    :placeholder="$t(config.searchPlaceholderKey)"
                    @update:model-value="onFilterChange"
                >
                    <template #prefix>
                        <Search :size="16" />
                    </template>
                </CaomeiInput>
                <div class="admin-filters__right">
                    <div class="aggregate-toggle">
                        <!-- caomei `id` 落在 Reka `SwitchRoot`（labelable），原生 `label[for]` 语义保持。 -->
                        <CaomeiSwitch
                            id="aggregate-switch"
                            v-model="filters.aggregate"
                            @change="onFilterChange"
                        />
                        <label for="aggregate-switch" class="cursor-pointer">{{ $t('common.aggregate_translations') }}</label>
                    </div>
                </div>
            </div>

            <!-- 受控 `:page` 由 `pageIndexBase: 1` 归一；受控后的「页码越界不自动夹取」边界见回归记录本批窗口。 -->
            <CaomeiDataTable
                :data="items"
                :columns="columns"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                :page="pagination.page"
                paginator
                :rows-per-page-options="[5, 10, 20, 50]"
                row-key="id"
                class="admin-taxonomy__table"
                @page="onPage"
                @sort="onSort"
            >
                <template #cell-parent="{row}">
                    {{ row.parent?.name || '-' }}
                </template>
                <template #cell-translations="{row}">
                    <div class="justify-content-center translation-badges">
                        <!-- `Badge` 确有 `value` prop（`Tag` 没有，见 §6.2 执行提示 3）；`severity` → `tone`。 -->
                        <CaomeiBadge
                            v-for="languageOption in locales"
                            :key="languageOption.code"
                            v-tooltip="$t('common.languages.' + languageOption.code)"
                            :value="languageOption.code.toUpperCase()"
                            :tone="hasTranslation(row, languageOption.code) ? 'success' : 'neutral'"
                            class="translation-badge"
                            :class="{'translation-badge--missing': !hasTranslation(row, languageOption.code)}"
                            @click="handleTranslationClick(languageOption.code, hasTranslation(row, languageOption.code), row)"
                        />
                    </div>
                </template>
                <template #cell-language="{row}">
                    <CaomeiTag tone="neutral">
                        {{ $t(`common.languages.${row.language}`) }}
                    </CaomeiTag>
                </template>
                <template #cell-actions="{row}">
                    <!-- `text rounded` + 纯图标 → `icon-only` + `variant="ghost"`；迁移前无可访问名，此处补 `:label`。 -->
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="primary"
                        :label="$t('common.edit')"
                        @click="openDialog(row)"
                    >
                        <template #icon>
                            <Pencil :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="danger"
                        :label="$t('common.delete')"
                        @click="confirmDeleteAction(row)"
                    >
                        <template #icon>
                            <Trash2 :size="16" />
                        </template>
                    </CaomeiButton>
                </template>
                <template #empty>
                    <div class="empty-state">
                        {{ $t('pages.posts.empty') }}
                    </div>
                </template>
            </CaomeiDataTable>
        </div>

        <!-- 浮层显式豁免（§5.5）：`Dialog` / `ConfirmDeleteDialog` 维持 PrimeVue；弹窗内部控件按本条路由登记的路由级在册族增量迁移。 -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingItem ? $t('common.edit') : $t('common.create')"
            modal
            class="admin-taxonomy__dialog p-fluid"
            :style="taxonomyDialogStyle"
            @show="handleDialogShow"
            @focusin="handleDialogFocusIn"
        >
            <CaomeiTabs v-model="activeTab">
                <CaomeiTabList>
                    <CaomeiTabTrigger
                        v-for="languageOption in locales"
                        :key="languageOption.code"
                        :value="languageOption.code"
                    >
                        <CircleCheck
                            v-if="hasTranslationData(languageOption.code)"
                            :size="16"
                            class="taxonomy-dialog__tab-check"
                        />
                        {{ $t('common.languages.' + languageOption.code) }}
                    </CaomeiTabTrigger>
                </CaomeiTabList>
                <CaomeiTabContent
                    v-for="languageOption in locales"
                    :key="languageOption.code"
                    :value="languageOption.code"
                >
                    <!-- `InputGroup` 与 `InputText` 结构耦合（靠子元素 `.p-inputtext` 做 flex / 圆角拼接），成组迁移；`.p-invalid` → `:invalid`。 -->
                    <div class="field mt-4">
                        <label :for="'name_' + languageOption.code">{{ $t('common.name') }}</label>
                        <CaomeiInputGroup>
                            <CaomeiInput
                                :id="'name_' + languageOption.code"
                                :ref="(el) => setNameFieldRef(languageOption.code, el)"
                                v-model="getFormState(languageOption.code).name"
                                :invalid="Boolean(getErrorState(languageOption.code).name)"
                            />
                            <CaomeiButton
                                v-tooltip="$t('common.ai_translate')"
                                icon-only
                                variant="ghost"
                                tone="neutral"
                                :label="$t('common.ai_translate')"
                                :loading="aiLoading[languageOption.code]?.name"
                                @click="translateName(languageOption.code)"
                            >
                                <template #icon>
                                    <Sparkles :size="16" />
                                </template>
                            </CaomeiButton>
                        </CaomeiInputGroup>
                        <small v-if="getErrorState(languageOption.code).name" class="p-error">{{ getErrorState(languageOption.code).name }}</small>
                    </div>
                    <div v-if="!editingItem" class="taxonomy-dialog__sync-controls">
                        <div class="taxonomy-dialog__sync-toggle">
                            <CaomeiCheckbox :id="'syncAll_' + languageOption.code" v-model="syncToAllLanguages" />
                            <label :for="'syncAll_' + languageOption.code" class="cursor-pointer">{{ $t(config.syncToAllLanguagesKey) }}</label>
                        </div>
                        <CaomeiButton
                            v-if="syncToAllLanguages"
                            v-tooltip="$t('common.ai_translate')"
                            icon-only
                            variant="ghost"
                            tone="neutral"
                            size="sm"
                            class="taxonomy-dialog__sync-ai"
                            :label="$t('common.ai_translate')"
                            @click="syncAIAllLanguages"
                        >
                            <template #icon>
                                <Sparkles :size="16" />
                            </template>
                        </CaomeiButton>
                    </div>
                    <div class="field">
                        <label :for="'slug_' + languageOption.code">{{ $t('common.slug') }}</label>
                        <CaomeiInputGroup>
                            <CaomeiInput
                                :id="'slug_' + languageOption.code"
                                v-model="getFormState(languageOption.code).slug"
                                :invalid="Boolean(getErrorState(languageOption.code).slug)"
                            />
                            <CaomeiButton
                                v-tooltip="$t('common.ai_generate_slug')"
                                icon-only
                                variant="ghost"
                                tone="neutral"
                                :label="$t('common.ai_generate_slug')"
                                :loading="aiLoading[languageOption.code]?.slug"
                                @click="generateSlug(languageOption.code)"
                            >
                                <template #icon>
                                    <Sparkles :size="16" />
                                </template>
                            </CaomeiButton>
                        </CaomeiInputGroup>
                        <small v-if="getErrorState(languageOption.code).slug" class="p-error">{{ getErrorState(languageOption.code).slug }}</small>
                    </div>
                    <div class="field">
                        <label :for="'translationId_' + languageOption.code">
                            {{ $t('common.translation_id') }}
                            <small class="text-secondary">({{ $t('common.optional') }})</small>
                        </label>
                        <CaomeiInputGroup>
                            <CaomeiInput
                                :id="'translationId_' + languageOption.code"
                                :model-value="getFormState(languageOption.code).translationId ?? ''"
                                :placeholder="$t('common.translation_id_hint')"
                                @update:model-value="setTranslationId(languageOption.code, $event)"
                            />
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="neutral"
                                :label="$t('common.translation_id')"
                                @click="syncTranslationIdFromSlugMulti(languageOption.code)"
                            >
                                <template #icon>
                                    <RefreshCw :size="16" />
                                </template>
                            </CaomeiButton>
                        </CaomeiInputGroup>
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
                        <!-- caomei `Select` 无 `filter`（§6.3 有意差异 #1），筛选用 `CaomeiAutoComplete` + `strict` 承接；清除时空串回写 `null`。 -->
                        <CaomeiAutoComplete
                            :id="'parent_' + languageOption.code"
                            :model-value="getFormState(languageOption.code).parentId ?? ''"
                            :options="getParentSelectOptions(languageOption.code)"
                            strict
                            dropdown
                            :placeholder="$t(config.parentPlaceholderKey || 'common.select_parent')"
                            @update:model-value="setParentId(languageOption.code, $event)"
                        />
                    </div>
                    <div v-if="config.showDescriptionField" class="field">
                        <label :for="'description_' + languageOption.code">{{ $t('common.description') }}</label>
                        <CaomeiTextarea
                            :id="'description_' + languageOption.code"
                            v-model="getFormState(languageOption.code).description"
                            :rows="3"
                        />
                    </div>
                </CaomeiTabContent>
            </CaomeiTabs>
            <template #footer>
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    @click="hideDialog"
                >
                    <template #icon>
                        <X :size="16" />
                    </template>
                    {{ $t('common.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    v-if="editingItem"
                    variant="ghost"
                    tone="danger"
                    @click="confirmDeleteActionMulti"
                >
                    <template #icon>
                        <Trash2 :size="16" />
                    </template>
                    {{ $t('common.delete') }}
                </CaomeiButton>
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    :loading="saving"
                    @click="saveItemMulti"
                >
                    <template #icon>
                        <Check :size="16" />
                    </template>
                    {{ $t('common.save') }}
                </CaomeiButton>
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
import { Check, CircleCheck, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2, X } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
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
    // caomei `DataTable` 的 `page` / `@page` 为 1 基（PrimeVue 为 0 基），显式声明页码基准。
    pageIndexBase: 1,
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
const deleteDialog = ref({
    visible: false,
    item: null as TaxonomyItem | null,
    message: '',
})

/**
 * 名称字段聚焦**交接**（迁移前为名称 `InputText` 上的原生 `autofocus`）：
 *
 * - 迁移前：PrimeVue `Dialog` 的 `onAfterEnter` → `focus()` 会命中默认插槽内的 `[autofocus]`（名称输入框），
 *   故弹窗打开后焦点落在名称字段（实测 `document.activeElement === input#name_zh-CN`）。
 * - 迁移后：caomei `CaomeiInput` 无 `autofocus` 契约（透传属性落在不可聚焦的字段外壳），插槽内不再有命中项，
 *   浮层的 focus trap 回落到其 header 的关闭按钮。
 * - 处置：捕获浮层打开后的**第一次** `focusin`（即 focus trap 落到关闭按钮的那次），把焦点交回当前语言页签的
 *   名称字段。用事件交接而非固定延时，避免对过渡时长产生隐式依赖。
 *
 * 页签切换不再接管焦点：Reka Tabs 在激活时把焦点留在触发器上（WAI-ARIA tabs 的标准行为），
 * 与迁移前 PrimeVue 逐页签重挂载时的 `autofocus` 效果不同，属本批登记的行为差异。
 */
const nameFieldRefs = ref<Record<string, { focus?: () => void } | null>>({})
const pendingInitialFocus = ref(false)

/**
 * 弹窗宽度：迁移前由内容驱动（实测 444px，分类 / 标签两页一致，`p-fluid` 字段撑满弹窗）；
 * caomei 字段宽度只由容器决定、字段外壳更窄，弹窗随之收窄到 372px。故显式声明迁移前实测宽度
 * （「迁移不改几何」）。用 `style` 绑定而非 scoped 类：该浮层由 PrimeVue 组件渲染，类选择器与
 * scoped 作用域属性的落点依赖库内部结构，属性级声明更稳。
 */
const taxonomyDialogStyle = { width: 'min(90vw, 444px)' }

const setNameFieldRef = (lang: string, instance: unknown) => {
    nameFieldRefs.value[lang] = (instance as { focus?: () => void } | null) ?? null
}

const handleDialogShow = () => {
    pendingInitialFocus.value = true
}

const handleDialogFocusIn = () => {
    if (!pendingInitialFocus.value) {
        return
    }

    pendingInitialFocus.value = false
    nameFieldRefs.value[activeTab.value]?.focus?.()
}

/**
 * 列定义与迁移前 PrimeVue 列组件一一对应（按 `config` 开关与聚合开关为 4~6 列）：
 * `style` / `class` 两侧镜像（PrimeVue `Column` 的二者同时落 `th` 与 `td`，与 `/admin/posts` 批次实测一致），
 * `parent.name` 用 `accessor` 承载；`hidden md:table-cell` 为已知幻影类，保留原声明并两侧镜像。
 */
const columns = computed<DataTableColumn<TaxonomyItem>[]>(() => {
    const list: DataTableColumn<TaxonomyItem>[] = [
        {
            key: 'name',
            header: t('common.name'),
            sortable: true,
            headerStyle: { minWidth: '10rem' },
        },
        {
            key: 'slug',
            header: t('common.slug'),
            sortable: true,
            headerStyle: { minWidth: '8rem' },
        },
    ]

    if (props.config.showParentField) {
        list.push({
            key: 'parent',
            accessor: 'parent.name',
            header: t('common.parent'),
            headerStyle: { minWidth: '8rem' },
        })
    }

    if (filters.value.aggregate) {
        list.push({
            key: 'translations',
            header: t('common.translation_status'),
            headerClass: 'text-center',
            bodyClass: 'text-center',
            headerStyle: { minWidth: '8rem' },
        })
    } else {
        list.push({
            key: 'language',
            header: t('common.language'),
            sortable: true,
        })
    }

    if (props.config.showDescriptionField) {
        list.push({
            key: 'description',
            header: t('common.description'),
            headerClass: 'hidden md:table-cell',
            bodyClass: 'hidden md:table-cell',
        })
    }

    list.push({
        key: 'actions',
        header: t('common.actions'),
        headerClass: 'text-right',
        bodyClass: 'text-right',
        headerStyle: { minWidth: '8rem' },
        bodyStyle: { minWidth: '8rem' },
    })

    return list
})

const {
    getAssociationState,
} = useTaxonomyTranslationAssociation<TaxonomyItem>({
    endpoint: props.config.endpoint,
    dialogVisible,
    locales: locales as Ref<{ code: string }[]>,
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
    locales.value.forEach((languageOption) => {
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

/** `CaomeiAutoComplete` 的选项形态为 `{ label, value }`，与迁移前 `Select` 映射同一份 `Category[]`。 */
const getParentSelectOptions = (lang: string) => getParentOptions(lang).map((option) => ({
    label: option.name,
    value: option.id,
}))

/** 清除时空串回写 `null`，维持 `parentId: string | null` 契约。 */
const setParentId = (lang: string, value: unknown) => {
    getFormState(lang).parentId = typeof value === 'string' && value !== '' ? value : null
}

/** `translationId` 为 `string | null` 而 `CaomeiInput` 只收 `string`：按迁移前语义只回写字符串。 */
const setTranslationId = (lang: string, value: unknown) => {
    if (typeof value === 'string') {
        getFormState(lang).translationId = value
    }
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
    locales.value.forEach((languageOption: { code: string }) => {
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

    const response = await $fetch<{ data: { items: TaxonomyItem[] } }>(props.config.endpoint, {
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

    const response = await $fetch<{ data: { items: TaxonomyItem[] } }>(props.config.endpoint, {
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
        locales.value.forEach((languageOption: { code: string }) => {
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
        locales.value.forEach((languageOption: { code: string }) => {
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
        locales.value.forEach((languageOption: { code: string }) => {
            void fetchParentOptionsMulti(languageOption.code)
        })
    }
}

const hideDialog = () => {
    dialogVisible.value = false
    submitted.value = false
    // 关闭时复位交接标记：若首次 `focusin` 未到达（浮层无 focusable 元素等），
    // 标记会挂到下次打开，导致用户在浮层内的首次点击被抢焦点。
    pendingInitialFocus.value = false
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

    const modifiedLocales = locales.value.filter((languageOption: { code: string }) => hasTranslationData(languageOption.code))

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
            .map((languageOption: { code: string }) => resolveTranslationClusterId(
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
                    method: 'PUT' as const,
                    body: formData,
                })
                continue
            }

            const response = await $fetch<{ data: { translationId: string } }>(props.config.endpoint, {
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

    deleteDialog.value.item = { id: currentItem.id } as TaxonomyItem
    deleteDialog.value.message = t(props.config.deleteConfirmKey)
    deleteDialog.value.visible = true
}

const confirmDeleteAction = (item: TaxonomyItem) => {
    deleteDialog.value.item = item
    deleteDialog.value.message = t(props.config.deleteConfirmKey)
    deleteDialog.value.visible = true
}

const deleteItem = async () => {
    if (!deleteDialog.value.item) {
        return
    }

    try {
        await $fetch(`${props.config.endpoint}/${deleteDialog.value.item.id}`, {
            method: 'DELETE' as const,
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
// 搜索字段宽度：caomei 字段默认 `width: 100%`，在 `.admin-filters`（flex 行）内会撑满容器；
// 迁移前 `.p-iconfield` 实测固有宽 261px，故显式约束为同一值。
.admin-filters__search {
    width: 261px;
    max-width: 100%;
}

// caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中），用 token 保持迁移前布局。
.admin-taxonomy__table {
    --caomei-data-table-pagination-justify: center;
}

// 迁移前为 `pi pi-check-circle text-success`（primeicons 字体图标，`mr-2` + 字体自带基线）；
// 换成 lucide SVG 后按实测补基线补偿 `vertical-align: -0.15em`（SVG 默认贴基线，会比字体图标低约 2px）。
.taxonomy-dialog__tab-check {
    margin-right: 0.5rem;
    vertical-align: -0.15em;
    color: var(--p-green-500);
}

// caomei `Badge` 的尺寸档位与 PrimeVue `Badge` 不同（caomei 默认 20px 高 / 12px 字号）。
// 迁移前这几个翻译徽标的尺寸来源是三处叠加：PrimeVue Aura `Badge` 根 token（`height: 1.5rem` /
// `minWidth: 1.5rem`）+ 全局 `.translation-badge.p-badge { padding: 2px 4px; font-size: 0.7rem }`
// + `.translation-badge { min-width: 2rem }`。元素类改为 `caomei-badge` 后 `&.p-badge` 规则静默失效，
// 故按实测口径覆盖 caomei token（token 是文档化定制路径，通道①）：高 24px / 最小宽 32px /
// 横向内边距 4px / 字号 0.7rem（与 `/admin/posts` 同口径同值）。
.translation-badge {
    --caomei-badge-height: 1.5rem;
    --caomei-badge-min-width: 2rem;
    --caomei-badge-padding-x: 4px;
    --caomei-badge-font-size: 0.7rem;
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
