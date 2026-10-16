import { vi } from 'vitest'
import { defineComponent, h, watch } from 'vue'
import { z } from 'zod'

/**
 * `CaomeiInput` 桩的 `focus()` 调用记录（参数为该字段的 `id`）：`nameFieldRefs` 显式聚焦机制
 * （承接迁移前原生 `autofocus`）的可断言落点——`:ref` 回调会在每次重渲染时覆盖实例引用，
 * 故不能靠测试内替换引用来观测；记录 `id` 是为了能判「交回的是哪个字段」（否则写死语言 / 交回
 * slug 的错误实现同样能让「被调用过」的断言通过）。
 */
export const caomeiInputFocusCalls = vi.fn((id: string) => id)

/**
 * 迁移期组件桩与夹具（caomei-ui 组件 + 浮层豁免组件 + 路由自有子组件）。
 *
 * 服务范围：`admin-taxonomy-page.vue`（host `/admin/categories` + `/admin/tags`）系列，以及
 * `components/admin/ai/task-list.vue` 等「多文件渲染同一批 caomei 组件」的用例——
 * 三处各持一份桩集会在后续批次只改一处、留下静默漂移（迁移期已多次出现该问题）。
 *
 * 抽出的原因：多个测试文件（路由自有组件 + 两个 host 页面 + 子组件）渲染的是同一批组件，
 * 迁移后所需桩集完全相同；三处各持一份会在后续批次只改一处、留下静默漂移
 * （迁移期已多次出现「守卫 / 夹具两套实现」问题，见 `docs/standards/testing.md` §7）。
 *
 * 桩口径与 `/admin/posts` 用例一致：
 * - caomei 组件一律用 `defineComponent` 桩（保留可断言的 `data-*` 契约位，不依赖库内部结构）；
 * - `Dialog` / `ConfirmDeleteDialog` 属浮层显式豁免（见 `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md` §5.5），继续用轻量桩；
 * - `CaomeiTabs` 桩渲染**全部** `CaomeiTabContent`（不对齐真实 `unmountOnHide` 行为）：
 *   便于断言「非活动语言页签的表单桶是否已灌入」，这是本组件 hydration 契约的核心。
 */

export const CaomeiDataTableStub = defineComponent({
    name: 'CaomeiDataTable',
    props: {
        data: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        lazy: { type: Boolean, default: false },
        paginator: { type: Boolean, default: false },
        page: { type: Number, default: undefined },
        rows: { type: Number, default: 0 },
        totalRecords: { type: Number, default: undefined },
        rowsPerPageOptions: { type: Array, default: () => [] },
        rowKey: { type: [String, Function], default: undefined },
        selectionMode: { type: String, default: undefined },
        selection: { type: [Array, Object], default: undefined },
    },
    emits: ['page', 'sort', 'update:selection'],
    setup(props, { slots, emit }) {
        return () => {
            const columns = props.columns as { key: string, header?: string, headerClass?: string, bodyClass?: string, accessor?: unknown, sortable?: boolean }[]
            const rows = props.data as Record<string, unknown>[]
            const resolveAccessor = (row: Record<string, unknown>, column: { key: string, accessor?: unknown }) => {
                const accessor = typeof column.accessor === 'string' ? column.accessor : column.key

                return accessor.split('.').reduce<unknown>((acc, segment) => (acc as Record<string, unknown> | null)?.[segment] ?? null, row)
            }
            const defaultCell = (value: unknown) => {
                if (value === null || value === undefined) {
                    return ''
                }

                return typeof value === 'string' ? value : JSON.stringify(value)
            }
            const renderCell = (row: Record<string, unknown>, index: number, column: { key: string, accessor?: unknown }) => {
                const cellSlot = slots[`cell-${column.key}`]
                const value = resolveAccessor(row, column)
                const content = cellSlot ? cellSlot({ row, value, index, column }) : defaultCell(value)

                return h('span', { class: 'stub-td', 'data-key': column.key }, content)
            }

            return h('div', { class: 'datatable caomei-data-table' }, [
                h('div', { class: 'stub-headers' }, columns.map((column) => h('span', {
                    class: 'stub-th',
                    'data-key': column.key,
                    'data-header-class': column.headerClass ?? '',
                    'data-body-class': column.bodyClass ?? '',
                    'data-sortable': String(Boolean(column.sortable)),
                }, column.header))),
                ...rows.map((row, index) => h('div', { class: 'stub-row' }, columns.map((column) => renderCell(row, index, column)))),
                rows.length === 0 ? h('div', { class: 'stub-empty' }, slots.empty?.()) : null,
                h('button', {
                    class: 'stub-next-page',
                    onClick: () => emit('page', { page: 2, rows: props.rows, first: props.rows, pageCount: 3 }),
                }, 'next'),
                h('button', {
                    class: 'stub-sort',
                    onClick: () => emit('sort', { sortField: 'name', sortOrder: 'asc' }),
                }, 'sort'),
            ])
        }
    },
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        variant: { type: String, default: '' },
        tone: { type: String, default: '' },
        size: { type: String, default: '' },
        rounded: { type: Boolean, default: false },
        loading: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-variant': props.variant,
            'data-tone': props.tone,
            'data-size': props.size,
            'data-icon-only': String(props.iconOnly),
            'data-rounded': String(props.rounded),
            'data-loading': String(props.loading),
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: {
        modelValue: { type: String, default: '' },
        id: { type: String, default: '' },
        placeholder: { type: String, default: '' },
        invalid: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { slots, emit, expose }) {
        expose({ focus: () => caomeiInputFocusCalls(props.id) })

        return () => h('span', { class: 'caomei-input', 'data-invalid': String(props.invalid) }, [
            slots.prefix?.(),
            h('input', {
                id: props.id,
                value: props.modelValue,
                placeholder: props.placeholder,
                onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
            }),
        ])
    },
})

const CaomeiInputGroupStub = defineComponent({
    name: 'CaomeiInputGroup',
    setup: (_props, { slots }) => () => h('div', { class: 'caomei-input-group' }, slots.default?.()),
})

const CaomeiSwitchStub = defineComponent({
    name: 'CaomeiSwitch',
    props: { modelValue: { type: Boolean, default: false }, id: { type: String, default: '' } },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
        return () => h('button', {
            class: 'caomei-switch',
            'data-id': props.id,
            'data-checked': String(props.modelValue),
            onClick: () => {
                emit('update:modelValue', !props.modelValue)
                emit('change', !props.modelValue)
            },
        }, 'switch')
    },
})

const CaomeiCheckboxStub = defineComponent({
    name: 'CaomeiCheckbox',
    props: { modelValue: { type: Boolean, default: false }, id: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'caomei-checkbox',
            id: props.id,
            type: 'checkbox',
            checked: props.modelValue,
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked),
        })
    },
})

const CaomeiTextareaStub = defineComponent({
    name: 'CaomeiTextarea',
    props: { modelValue: { type: String, default: '' }, id: { type: String, default: '' }, rows: { type: Number, default: 0 } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('textarea', {
            class: 'caomei-textarea',
            id: props.id,
            rows: props.rows,
            value: props.modelValue,
            onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
        })
    },
})

const CaomeiAutoCompleteStub = defineComponent({
    name: 'CaomeiAutoComplete',
    props: {
        modelValue: { type: String, default: '' },
        options: { type: Array, default: () => [] },
        id: { type: String, default: '' },
        strict: { type: Boolean, default: false },
        dropdown: { type: Boolean, default: false },
        placeholder: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('span', {
            class: 'caomei-auto-complete',
            'data-id': props.id,
            'data-strict': String(props.strict),
            'data-dropdown': String(props.dropdown),
            'data-options': (props.options as { value: string }[]).map((option) => option.value).join(','),
        }, [
            h('input', {
                id: props.id,
                value: props.modelValue,
                placeholder: props.placeholder,
                onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
            }),
        ])
    },
})

export const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: {
        modelValue: { type: [String, Number, Object], default: null },
        options: { type: Array, default: () => [] },
        optionLabel: { type: String, default: 'label' },
        optionValue: { type: String, default: 'value' },
        placeholder: { type: String, default: '' },
        showClear: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('select', {
            class: 'caomei-select',
            'data-show-clear': String(props.showClear),
            'data-options': (props.options as Record<string, string>[]).map((option) => option[props.optionValue]).join(','),
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as Record<string, string>[]).map((option) => h('option', {
            value: option[props.optionValue] ?? '',
        }, option[props.optionLabel] ?? '')))
    },
})

/** 共享壳过渡组件（组件内按路由择库）：桩掉以免用例依赖路由上下文。 */
export const AppAvatarV2Stub = defineComponent({
    name: 'AppAvatarV2',
    props: {
        image: { type: String, default: null },
        name: { type: String, default: null },
        email: { type: String, default: null },
        emailHash: { type: String, default: null },
        size: { type: String, default: 'normal' },
        shape: { type: String, default: 'square' },
    },
    setup: (props) => () => h('span', {
        class: 'app-avatar-v2',
        'data-name': props.name ?? '',
        'data-shape': props.shape,
    }),
})

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: {
        tone: { type: String, default: 'neutral' },
        variant: { type: String, default: 'soft' },
    },
    setup(props, { slots }) {
        return () => h('span', {
            class: 'caomei-tag',
            'data-tone': props.tone,
            'data-variant': props.variant,
        }, slots.default?.())
    },
})

const CaomeiBadgeStub = defineComponent({
    name: 'CaomeiBadge',
    props: { value: { type: [String, Number], default: '' }, tone: { type: String, default: 'neutral' } },
    emits: ['click'],
    setup(props, { emit }) {
        return () => h('span', {
            class: 'caomei-badge',
            'data-value': props.value,
            'data-tone': props.tone,
            onClick: () => emit('click'),
        }, String(props.value))
    },
})

/** `CaomeiTabs` 桩：渲染全部内容面板（见文件头说明）。 */
export const CaomeiTabsStub = defineComponent({
    name: 'CaomeiTabs',
    props: { modelValue: { type: [String, Number], default: undefined } },
    emits: ['update:modelValue'],
    setup: (_props, { slots }) => () => h('div', { class: 'caomei-tabs' }, slots.default?.()),
})

const CaomeiTabListStub = defineComponent({
    name: 'CaomeiTabList',
    setup: (_props, { slots }) => () => h('div', { class: 'caomei-tab-list' }, slots.default?.()),
})

const CaomeiTabTriggerStub = defineComponent({
    name: 'CaomeiTabTrigger',
    props: { value: { type: [String, Number], required: true } },
    setup(props, { slots }) {
        return () => h('button', { class: 'caomei-tab-trigger', 'data-value': String(props.value), type: 'button' }, slots.default?.())
    },
})

const CaomeiTabContentStub = defineComponent({
    name: 'CaomeiTabContent',
    props: { value: { type: [String, Number], required: true } },
    setup(props, { slots }) {
        return () => h('div', { class: 'caomei-tab-content', 'data-value': String(props.value) }, slots.default?.())
    },
})

/** 浮层显式豁免组件（维持 PrimeVue，随浮层批次收敛）与路由自有子组件的轻量桩。 */
export const dialogStubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String, showLanguageSwitcher: Boolean },
        setup: (props, { slots }) => () => h('div', { class: 'admin-header', 'data-title': props.title }, [
            h('h1', props.title),
            slots.actions?.(),
        ]),
    }),
    Dialog: defineComponent({
        name: 'Dialog',
        props: { visible: Boolean, header: String },
        emits: ['show'],
        setup: (props, { slots, emit }) => {
            watch(() => props.visible, (visible) => {
                if (visible) {
                    emit('show')
                }
            })

            return () => (props.visible
                ? h('div', { class: 'dialog', 'data-header': props.header }, [
                    slots.default?.(),
                    h('div', { class: 'dialog-footer' }, slots.footer?.()),
                ])
                : null)
        },
    }),
    ConfirmDeleteDialog: defineComponent({
        name: 'ConfirmDeleteDialog',
        props: { visible: Boolean, title: String, message: String },
        setup: () => () => h('div', { class: 'confirm-delete-dialog' }),
    }),
    TaxonomyTranslationAssociationCard: defineComponent({
        name: 'TaxonomyTranslationAssociationCard',
        props: {
            clusterId: { type: String, default: '' },
            usesSlugFallback: { type: Boolean, default: false },
            sameLanguageConflict: { type: Object, default: null },
            linkedPeers: { type: Array, default: () => [] },
            relatedCandidates: { type: Array, default: () => [] },
        },
        emits: ['open-candidate'],
        setup(props, { emit }) {
            return () => h('div', {
                // 与真实组件一致：同语言冲突时带 `--warn` 修饰类。
                class: [
                    'taxonomy-translation-association',
                    { 'taxonomy-translation-association--warn': Boolean(props.sameLanguageConflict) },
                ],
                'data-cluster-id': props.clusterId,
            }, [
                h('span', { class: 'cluster-id' }, props.clusterId),
                ...(props.relatedCandidates as { id: string, name: string }[]).map((candidate) => h('button', {
                    class: 'candidate',
                    onClick: () => emit('open-candidate', candidate),
                }, candidate.name)),
            ])
        },
    }),
}

export const caomeiComponentStubs = {
    ...dialogStubs,
    AppAvatarV2: AppAvatarV2Stub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
    CaomeiInputGroup: CaomeiInputGroupStub,
    CaomeiSwitch: CaomeiSwitchStub,
    CaomeiCheckbox: CaomeiCheckboxStub,
    CaomeiTextarea: CaomeiTextareaStub,
    CaomeiAutoComplete: CaomeiAutoCompleteStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiBadge: CaomeiBadgeStub,
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTabs: CaomeiTabsStub,
    CaomeiTabList: CaomeiTabListStub,
    CaomeiTabTrigger: CaomeiTabTriggerStub,
    CaomeiTabContent: CaomeiTabContentStub,
}

/** 校验用 schema：与 `utils/schemas/category.ts` 的字段集合一致（仅用于契约用例）。 */
export const taxonomyTestSchema = z.object({
    id: z.string().nullable().optional(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string(),
    translationId: z.string().nullable().optional(),
})

export interface TaxonomyTestFormState {
    description?: string
    id: string | null
    language: string
    name: string
    parentId?: string | null
    slug: string
    translationId: string | null
}

/** 组件用例用的 config 夹具（`showParentField` / `showDescriptionField` 全开 = 分类页形态）。 */
export const taxonomyTestConfig = {
    endpoint: '/api/categories',
    titleKey: 'pages.admin.categories.title',
    createKey: 'pages.admin.categories.create',
    searchPlaceholderKey: 'pages.admin.categories.search_placeholder',
    deleteConfirmTitleKey: 'pages.admin.categories.delete_confirm_title',
    deleteConfirmKey: 'pages.admin.categories.delete_confirm',
    saveSuccessKey: 'pages.admin.categories.save_success',
    deleteSuccessKey: 'pages.admin.categories.delete_success',
    syncToAllLanguagesKey: 'pages.admin.categories.sync_to_all_languages',
    createSchema: taxonomyTestSchema,
    updateSchema: taxonomyTestSchema,
    showParentField: true,
    showDescriptionField: true,
    buildEmptyForm: (lang: string): TaxonomyTestFormState => ({
        id: null,
        name: '',
        slug: '',
        description: '',
        parentId: null,
        language: lang,
        translationId: null,
    }),
    buildFormFromItem: (item: any): TaxonomyTestFormState => ({
        id: (item.id as string) ?? null,
        name: (item.name as string) ?? '',
        slug: (item.slug as string) ?? '',
        description: (item.description as string) ?? '',
        parentId: (item.parentId as string) ?? null,
        language: (item.language as string) ?? 'zh-CN',
        translationId: (item.translationId as string) ?? null,
    }),
    buildMissingTranslationDraft: (item: any, langCode: string): TaxonomyTestFormState => ({
        id: null,
        name: '',
        slug: (item.slug as string) ?? '',
        description: '',
        parentId: (item.parentId as string) ?? null,
        language: langCode,
        translationId: (item.translationId as string) ?? null,
    }),
}
