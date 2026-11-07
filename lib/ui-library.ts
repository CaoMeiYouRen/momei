/**
 * 双库并存期的「路由 → 组件来源」单一事实源。
 *
 * 迁移期约束（见 docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md §5.5）：
 * - 隔离单位是**路由**：同一路由（含子路由）内组件来源必须唯一，禁止同路由混用两套组件。
 * - 某路由只有在涉及组件全部迁移完成、且通过该批三层视觉回归后，才从 PrimeVue 切到 caomei-ui；
 *   不接受「半个路由」切换。
 *
 * 本模块是并存期唯一可读事实源：新增已迁移路由时只改这里，不要在页面内散落判断，
 * 也不要在 nuxt.config.ts 重复维护第二份清单。
 */

/** 组件库来源标识。 */
export type UiLibrarySource = 'primevue' | 'caomei-ui'

/**
 * 批次在册组件族（PrimeVue 名）：已迁移路由的页面文件中不得以 PrimeVue 组件形式残留。
 *
 * 与迁移方案 §5.5 的说明同源——本常量是该说明的**可执行形态**，供结构守卫直接消费，
 * 避免「文档里的清单」与「守卫里的清单」两处漂移。
 * `Dropdown` 是 PrimeVue `Select` 的旧名（迁移方案 §6.1 C 组：`Dropdown` → `CaomeiSelect`）：
 * 计入在册族是**加固**，否则页面改用旧名即可绕过「Select 零残留」的意图。
 *
 * **2026-10-16 说明**：本清单是**批次基准在册族**，对所有已登记路由生效；
 * 单条路由在基准之外还需要额外纳入的组件族，写在 `CAOMEI_UI_ROUTE_SCOPES` 的 `inScopeComponents`
 * 里（**路由级增量**，见该接口注释）。
 *
 * 为什么不直接把新族塞进本清单：组件型目标路由用到的 `Tabs` / `InputGroup` / `Checkbox` / `Textarea`
 * 在**已收口批次**的页面里同样存在（实测 `pages/admin/submissions/index.vue` 命中 `Checkbox` / `Textarea`），
 * 一旦全局纳入就会让这些已完成路由重新判红、被迫回改——按「已收口批次不因后续批次被动回改」的口径，
 * 这类族只能按路由增量登记。
 * 注意**仍留在批次外**的族（`Card` / `ProgressSpinner` / `Message` / `Image` / `DatePicker` /
 * `MultiSelect` / `RadioButton` 等展示与表单族，随 B3 / B4 批次）——未列入的组件名不会被守卫拦截。
 * `Tab` 的标签匹配口径沿用「`<Name` 后须为空白 / `/` / `>`」：`<TabList` 不会命中 `<Tab`。
 */
export const CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS = [
    'Button',
    'IconField',
    'InputIcon',
    'InputText',
    'Select',
    'Dropdown',
    'DataTable',
    'Column',
    'Tag',
    'Badge',
    'Avatar',
    'Skeleton',
    'ToggleSwitch',
    'Paginator',
    // 第六十九阶段浮层族（Dialog / Drawer / Popover / DropdownMenu / Menu / ConfirmDialog）
    // 已整族迁移，纳入在册族后任何已登记路由的回退都会被守卫拦截。
    'Dialog',
    'Drawer',
    'Popover',
    'DropdownMenu',
    'Menu',
    'ConfirmDialog',
] as const

/**
 * 已登记路由的**迁移范围**条目：除路由前缀外，还声明「随本路由迁移、但不在守卫默认扫描面内」的文件。
 *
 * 为什么需要它（2026-10-16 新增，依据见 `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md` §5.5）：在册族零残留守卫的默认扫描面是
 * **页面文件**（`pages/<prefix>/index.vue` → `pages/<prefix>.vue`）。本仓存在**薄包装页**——
 * 页面文件只有一行 `<AdminTaxonomyPage :config="…" />`，实体落在 `components/` 下。对这类路由：
 * 「在册族零残留」恒真（页面文件里没有任何组件）、「至少使用一个 caomei-ui 组件」恒假
 * （页面文件里必然没有），两条断言都形同虚设。故把路由自有实体文件显式登记进 `ownedFiles`，
 * 由守卫合并扫描。
 *
 * `ownedFiles` 只登记**仅被本路由消费或随本路由迁移**的文件（路径相对仓库根、POSIX 分隔符）；
 * 跨路由共享壳走「过渡组件」机制（见迁移方案 §5.5），不在此登记——否则一个文件会被多条登记
 * 重复约束，且未迁移消费者会被迫提前切换。
 */
export interface CaomeiUiRouteScope {
    /** 路由前缀（与 `resolveUiLibraryForRoute` 的匹配口径一致）。 */
    prefix: string
    /** 随本路由迁移、且不在默认扫描面（页面文件）内的路由自有文件。 */
    ownedFiles?: readonly string[]
    /**
     * **路由级在册族增量**：本路由在批次基准在册族（`CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS`）之外，
     * 额外纳入「零残留」约束的 PrimeVue 组件族。
     *
     * 为什么是增量而不是全局登记：同一组件族在已收口批次的页面里可能仍合法存在
     * （典型：`pages/admin/submissions/index.vue` 的 `Checkbox` / `Textarea`，按 §5.5 属 B3 表单族），
     * 全局纳入会让这些路由重新判红；而本批目标页（`admin-taxonomy-page.vue`）因为
     * 「整路由迁移、不做半路由切换」必须一次迁完，故按路由收敛范围。
     */
    inScopeComponents?: readonly string[]
    /**
     * 本前缀下**刻意维持 PrimeVue** 的子路由页面（相对仓库根、POSIX 分隔符）。
     *
     * 为什么需要它：登记前缀是**前缀语义**，子路由会被连带解析为 caomei-ui。若某子路由不在本批范围内
     * （典型：与 B4 展示族同页、或与未迁移页面共享组件），就必须显式登记为例外，否则「已迁移」这一事实
     * 与子路由实现相互矛盾且无门禁拦截。
     *
     * 守卫据此放行该页面的「在册族零残留」判定，但**仍强制三条**：① 每条必须给出理由；
     * ② 该页面不得引用**组件内择库型**过渡组件（`AppAvatar` / `AppUploader`），也不得开启
     * `AdminPageHeader` 的 `show-language-switcher`——这三者都会因前缀登记而在子路由内静默切到 caomei，
     * 造成路由内库间混用；③ 已登记前缀下的**其他**非 `index.vue` 页面若未登记则守卫响亮失败。
     */
    primeVueSubRoutes?: readonly { file: string, reason: string }[]
    /**
     * **已随本路由迁移的子路由页面**（仓库相对路径）。
     *
     * 与 `primeVueSubRoutes` 互斥：登记在此的页面会被**纳入零残留扫描面**（同 `ownedFiles`），
     * 允许引用组件内择库型过渡组件（因为前缀已登记，它们会正确渲染 caomei 分支）。
     * 子路由必须二选一显式登记，避免「前缀命中但页面既未迁移也未声明」的静默漏扫。
     */
    migratedSubRoutes?: readonly string[]
}

/**
 * 组件型目标路由（`/admin/categories` + `/admin/tags`）共用的迁移范围。
 *
 * - `ownedFiles`：两页均为薄包装页，实体落在 `admin-taxonomy-page.vue`（其唯一自有子组件是
 *   `taxonomy-translation-association-card.vue`），故两条登记指向同一组文件。
 * - `inScopeComponents`（路由级在册族增量）：`Tabs` 族（弹窗的标签页容器）、`InputGroup`
 *   （与 `InputText` 结构耦合——PrimeVue `InputGroup` 靠子元素 `.p-inputtext` 做 flex 与圆角拼接，
 *   只迁输入框会静默破版）、`Checkbox` / `Textarea`（弹窗表单控件，与输入框同处一个渲染单元，
 *   按「整路由迁移、不做半路由切换」一次迁完）。
 */
const TAXONOMY_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/admin-taxonomy-page.vue',
        'components/admin/taxonomy-translation-association-card.vue',
    ],
    inScopeComponents: ['Tabs', 'TabList', 'Tab', 'TabPanels', 'TabPanel', 'InputGroup', 'Checkbox', 'Textarea'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 组件型目标型路由 `/admin/ai` 的迁移范围。
 *
 * - `ownedFiles`：路由自有组件；`task-detail-content.vue` 随任务详情子路由整迁后一并纳入（此前因跨子路由共享刻意延后）。
 * - `inScopeComponents`（路由级在册族增量）：页面本体使用 `Tabs` 族承载「使用统计 / 任务记录」两个面板，
 *   按「整路由迁移、不做半路由切换」纳入；其余在册族均属批次基准（`DataTable` / `Column` / `Button` /
 *   `InputText` / `Select` / `IconField` / `InputIcon` / `Tag` / `Avatar`）。
 * - `migratedSubRoutes`：任务详情子路由 `/admin/ai/tasks/[id]` 与本批整迁，纳入零残留扫描面。
 */
const AI_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/ai/task-list.vue',
        'components/admin/ai/stats-overview.vue',
        'components/admin/ai/task-details-dialog.vue',
        'components/admin/ai/task-detail-content.vue',
        'components/admin/ai/metric-card.vue',
        'components/admin/ai/detail-metric.vue',
    ],
    inScopeComponents: ['Tabs', 'TabList', 'Tab', 'TabPanels', 'TabPanel', 'Card', 'Message', 'ProgressSpinner', 'Image'],
    migratedSubRoutes: ['pages/admin/ai/tasks/[id].vue'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 组件型目标路由 `/admin/settings`（第七十阶段条目 2a）的迁移范围。
 *
 * - `ownedFiles`：设置页为薄包装（页面只负责标签页与保存动作），实体分散在 `components/admin/settings/`；
 *   `admin-floating-actions.vue` 为页面与三个设置面板共享的保存条，随本路由迁移。
 * - `inScopeComponents`（路由级在册族增量）：本批迁入的表单与展示族——`Password` / `InputNumber` /
 *   `Textarea` / `Card` / `Message` / `Divider` / `Image` / `MultiSelect` / `Accordion` 族 / `Tabs` 族。
 *   不全局纳入的原因同 `TAXONOMY_ROUTE_SCOPE`：这些族在已收口路由里仍合法存在。
 * - 主题工作台（`/admin/settings/theme` + 5 个 `theme-*` 组件）于条目 2b 同批迁移，故不再登记子路由例外。
 */
const ADMIN_SETTINGS_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/admin-floating-actions.vue',
        'components/admin/settings/admin-notification-settings.vue',
        'components/admin/settings/agreement-edit-dialog.vue',
        'components/admin/settings/agreements-settings.vue',
        'components/admin/settings/ai-alert-thresholds-editor.vue',
        'components/admin/settings/ai-cost-factors-editor.vue',
        'components/admin/settings/ai-quota-policies-editor.vue',
        'components/admin/settings/ai-settings.vue',
        'components/admin/settings/analytics-settings.vue',
        'components/admin/settings/auth-settings.vue',
        'components/admin/settings/commercial-settings.vue',
        'components/admin/settings/email-settings.vue',
        'components/admin/settings/email-template-settings-panel.vue',
        'components/admin/settings/external-feed-sources-editor.vue',
        'components/admin/settings/general-settings.vue',
        'components/admin/settings/limits-settings.vue',
        'components/admin/settings/localized-setting-editor.vue',
        'components/admin/settings/security-settings.vue',
        'components/admin/settings/setting-audit-log-list.vue',
        'components/admin/settings/setting-explanation-card.vue',
        'components/admin/settings/setting-form-field.vue',
        'components/admin/settings/setting-input.vue',
        'components/admin/settings/setting-password.vue',
        'components/admin/settings/setting-textarea.vue',
        'components/admin/settings/setup-follow-up-card.vue',
        'components/admin/settings/storage-settings.vue',
        'components/admin/settings/third-party-settings.vue',
        'components/admin/settings/theme-color-field.vue',
        'components/admin/settings/theme-config-section.vue',
        'components/admin/settings/theme-gallery-dialog.vue',
        'components/admin/settings/theme-preview-section.vue',
        'components/admin/settings/theme-save-dialog.vue',
    ],
    inScopeComponents: [
        'Password',
        'InputNumber',
        'Textarea',
        'Card',
        'Message',
        'Divider',
        'Image',
        'MultiSelect',
        'Accordion',
        'AccordionPanel',
        'AccordionHeader',
        'AccordionContent',
        'Tabs',
        'TabList',
        'Tab',
        'TabPanels',
        'TabPanel',
        // 条目 2b（主题工作台）
        'Panel',
        'ColorPicker',
        'SelectButton',
        'DataView',
    ],
    migratedSubRoutes: [
        'pages/admin/settings/theme.vue',
    ],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 组件型目标型路由 `/admin/marketing` 的迁移范围。
 *
 * - `ownedFiles`：路由自有实体组件（页面为薄包装，实体落在列表与表单两个组件）。
 * - `inScopeComponents`：**无路由级增量**——本路由用到的在册族（`DataTable` / `Column` / `Button` /
 *   `Tag` / `InputText` / `Select`）全部落在批次基准内；`Dialog` 已随浮层族迁入 caomei-ui，
 *   未迁移的 `Card` / `DatePicker` / `MultiSelect` / `RadioButton` 仍随 B3 / B4 批次。
 * - 无子路由（`pages/admin/marketing/index.vue` 为唯一页面），故无 `primeVueSubRoutes`。
 */
const MARKETING_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/marketing-campaign-list.vue',
        'components/admin/marketing-campaign-form.vue',
    ],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 路由 `/admin/notifications` 的迁移范围。
 *
 * 该页是薄包装（标题 + 简介 + 一张卡），实体落在共享列表
 * `components/admin/settings/notification-delivery-log-list.vue`——该组件虽位于 settings 目录，
 * 唯一消费路由就是这里，故登记为本路由的 `ownedFiles`。
 */
const ADMIN_NOTIFICATIONS_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/settings/notification-delivery-log-list.vue',
    ],
    // `Card`（页面外壳）与 `DatePicker`（筛选区间，首个生产用法）不在批次基准族内。
    inScopeComponents: ['Card', 'DatePicker'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 安装向导 `/installation` 的迁移范围。
 *
 * - 页面为容器（步骤编排 + 表单状态），实体分散在 `components/installation/` 的 6 个步骤组件、
 *   1 个字段状态组件（`field-status.vue`）与 1 个清单图标映射（`checklist-icons.ts`）；都必须登记，
 *   否则「在册族零残留」只扫页面、组件会被静默漏扫。
 * - `inScopeComponents`（路由级在册族增量）：`Stepper` 族与 `Accordion` 族均为首次生产迁移，
 *   外加展示 / 表单族 `Card` / `Message` / `Password` / `Textarea` / `InputNumber` / `ProgressSpinner`。
 */
const INSTALLATION_ROUTE_SCOPE = {
    ownedFiles: [
        'components/installation/checklist-icons.ts',
        'components/installation/field-status.vue',
        'components/installation/step-admin-account.vue',
        'components/installation/step-complete.vue',
        'components/installation/step-database.vue',
        'components/installation/step-extra-config.vue',
        'components/installation/step-health-check.vue',
        'components/installation/step-site-config.vue',
    ],
    inScopeComponents: [
        'Stepper',
        'StepList',
        'Step',
        'StepPanels',
        'StepPanel',
        'Accordion',
        'AccordionPanel',
        'AccordionHeader',
        'AccordionContent',
        'Card',
        'Message',
        'Password',
        'Textarea',
        'InputNumber',
        'ProgressSpinner',
    ],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 用户设置 `/settings` 的迁移范围（第七十阶段条目 4）。
 *
 * - `ownedFiles`：页面为容器，实体落在 `components/settings/` 的 5 个面板 + 通知历史列表；
 *   `notification-history-list` 内嵌于通知面板、唯一消费者是本路由。
 * - 商用链接三件套（`commercial-link-manager` / `-section` / `-dialog`）同时被 `/admin/settings`
 *   消费；两条路由均已迁移，故一并纳入扫描面（此前它们是「跨路由共享但未迁移」的漏扫面）。
 * - `inScopeComponents`：本批首次纳入的表单 / 展示族；`InputText` / `Select` / `Button` / `Tag` /
 *   `DataTable` / `Column` / `ToggleSwitch` 属批次基准。
 */
const USER_SETTINGS_ROUTE_SCOPE = {
    ownedFiles: [
        'components/commercial-link-dialog.vue',
        'components/commercial-link-manager.vue',
        'components/commercial-link-section.vue',
        'components/settings/notification-history-list.vue',
        'components/settings/settings-api-keys.vue',
        'components/settings/settings-commercial.vue',
        'components/settings/settings-notifications.vue',
        'components/settings/settings-profile.vue',
        'components/settings/settings-security.vue',
    ],
    inScopeComponents: [
        'Card',
        'Message',
        'Password',
        'Divider',
        'Image',
        'MultiSelect',
        'FileUpload',
        'Checkbox',
        'ToggleButton',
        'ProgressSpinner',
    ],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 公开列表页（`/archives` / `/categories` / `/tags`）的迁移范围（第七十一阶段条目 3）。
 *
 * - 三个索引页均为页面自包含（无路由自有组件），`Skeleton` / `Message` / `Paginator` 已在各批迁完。
 * - `/categories` 与 `/tags` 的详情子路由共用 `components/taxonomy-post-page.vue`，该组件随本批迁完，
 *   故登记为 `migratedSubRoutes` 纳入零残留扫描面（`Panel` 之外无路由自有文件）。
 */
const PUBLIC_LIST_ROUTE_SCOPE = {
    inScopeComponents: ['Skeleton', 'Message'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

const CATEGORY_INDEX_ROUTE_SCOPE = {
    ...PUBLIC_LIST_ROUTE_SCOPE,
    migratedSubRoutes: ['pages/categories/[slug].vue'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

const TAG_INDEX_ROUTE_SCOPE = {
    ...PUBLIC_LIST_ROUTE_SCOPE,
    migratedSubRoutes: ['pages/tags/[slug].vue'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 文章列表 `/posts` 的迁移范围（第七十一阶段条目 3）。
 *
 * - 页面为自包含列表（`Skeleton` / `Message` / `Paginator`），详情子路由 `[id].vue` 随本批整迁，
 *   登记为 `migratedSubRoutes` 纳入零残留扫描面。
 * - `inScopeComponents`：`Message`（错误条）为该路由增量；`Skeleton` / `Paginator` 属批次基准。
 */
const POSTS_ROUTE_SCOPE = {
    inScopeComponents: ['Message'],
    migratedSubRoutes: ['pages/posts/[id].vue'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 友链页 `/friend-links` 的迁移范围（第七十一阶段条目 3）。
 *
 * - 页面自包含（卡片 / 标签 / 表单），登录用户的上传壳改用 `AppUploader`（路由登记后渲染 caomei 分支）。
 * - `inScopeComponents`：`Card`（引导 / 空态 / 申请卡）与 `Textarea`（申请表单）为该路由增量；
 *   `Button` / `InputText` / `Select` / `Tag` 属批次基准。
 */
const FRIEND_LINKS_ROUTE_SCOPE = {
    inScopeComponents: ['Card', 'Textarea'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 法务协议页（`/privacy-policy` / `/user-agreement`）的迁移范围（第七十一阶段条目 3）。
 *
 * 两个页面共用 `components/legal-agreement-page.vue`；`Tag` 属批次基准族，`Divider` 按路由增量登记。
 */
const LEGAL_AGREEMENT_ROUTE_SCOPE = {
    ownedFiles: ['components/legal-agreement-page.vue'],
    inScopeComponents: ['Divider'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 认证 / 提交页（`/login` / `/register` / `/forgot-password` / `/reset-password` / `/submit`）的迁移范围。
 *
 * 前四条共享 `components/auth-card.vue`（壳 + 提交按钮 + 错误条），故都登记为 `ownedFiles`；
 * `/submit` 为独立页面，仅纳入其自身。
 */
const AUTH_ROUTE_SCOPE = {
    ownedFiles: ['components/auth-card.vue'],
    inScopeComponents: ['Card', 'Checkbox', 'Divider', 'Message', 'Password'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

const SUBMIT_ROUTE_SCOPE = {
    inScopeComponents: ['Card', 'Message', 'Textarea'],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 仪表盘 `/admin`（第七十一阶段条目 2）的迁移范围。
 *
 * - `ownedFiles`：页面为容器，实体落在 `components/admin/dashboard/` 的指标卡与创作统计面板。
 * - `inScopeComponents`（路由级在册族增量）：仅 Tabs 族（仪表盘的可见 / 创作两个页签）。
 *   **`Card` / `ProgressSpinner` 不登记**：二者属 B4 展示族，按 [B4 清单 §4](../design/governance/2026-11-06-b4-migration-inventory.md)
 *   的口径在「全部 B4 路由迁移完成 + B3 残留族收口」后并入基准在册族；本批若登记为 `/admin` 增量，
 *   会连带要求 `/admin/marketing` 与 `/admin/migrations/link-governance` 的既有展示族残留提前回改
 *   （并重采 8 条 parity 基线），超出本批范围。
 * - `migratedSubRoutes` / `primeVueSubRoutes`：登记 `/admin` 是**前缀语义**，会把整个管理端树纳入
 *   caomei-ui，故每个非 `index.vue` 页面都必须显式声明归属——这里逐页登记**已随各自批次迁移**的页面，
 *   只把编辑器 `/admin/posts/[id]` 留作未迁移例外。新增管理端页面时守卫会响亮失败，迫使补登记。
 */
const ADMIN_DASHBOARD_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/dashboard/metric-card.vue',
        'components/admin/dashboard/creator-metric-card.vue',
        'components/admin/dashboard/creator-stats-panel.vue',
    ],
    inScopeComponents: ['Tabs', 'TabList', 'Tab', 'TabPanels', 'TabPanel'],
    migratedSubRoutes: [
        'pages/admin/ad/campaigns.vue',
        'pages/admin/ad/placements.vue',
        'pages/admin/ai/index.vue',
        'pages/admin/ai/tasks/[id].vue',
        'pages/admin/calendar/index.vue',
        'pages/admin/categories/index.vue',
        'pages/admin/comments/index.vue',
        'pages/admin/external-links/index.vue',
        'pages/admin/friend-links/index.vue',
        'pages/admin/marketing/index.vue',
        'pages/admin/migrations/link-governance.vue',
        'pages/admin/notifications/index.vue',
        'pages/admin/posts/[id].vue',
        'pages/admin/posts/index.vue',
        'pages/admin/settings/index.vue',
        'pages/admin/settings/theme.vue',
        'pages/admin/snippets/capture.vue',
        'pages/admin/snippets/index.vue',
        'pages/admin/submissions/index.vue',
        'pages/admin/subscribers/index.vue',
        'pages/admin/tags/index.vue',
        'pages/admin/users/index.vue',
        'pages/admin/waitlist/index.vue',
    ],

} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 内容日历 `/admin/calendar` 的迁移范围。
 *
 * - `ownedFiles`：页面为容器，实体落在 `components/admin/calendar/` 的月历与看板视图。
 * - `inScopeComponents`：本批首次纳入的 Tabs 族 / `SelectButton` / `ProgressSpinner`；
 *   `Select` / `Tag` / `Button` 属批次基准。
 */
const ADMIN_CALENDAR_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/calendar/calendar-view.vue',
        'components/admin/calendar/kanban-view.vue',
    ],
    inScopeComponents: [
        'Tabs',
        'TabList',
        'Tab',
        'TabPanels',
        'TabPanel',
        'SelectButton',
        'ProgressSpinner',
    ],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

/**
 * 灵感收纳箱 `/admin/snippets` 的迁移范围。
 *
 * - `ownedFiles`：页面为容器，实体落在 `components/admin/snippets/` 的 5 个组件。
 * - `migratedSubRoutes`：`/admin/snippets/capture` 随本批整路由迁移，需纳入零残留扫描面。
 * - `inScopeComponents`：本批首次纳入的展示 / 表单族（`Button` / `Tag` / `InputText` / `Select` /
 *   `Paginator` 属批次基准；浮层族已在基准内）。
 */
const ADMIN_SNIPPETS_ROUTE_SCOPE = {
    ownedFiles: [
        'components/admin/snippets/snippet-aggregate-dialog.vue',
        'components/admin/snippets/snippet-bookmarklet.vue',
        'components/admin/snippets/snippet-card.vue',
        'components/admin/snippets/snippet-edit-dialog.vue',
        'components/admin/snippets/snippet-quick-capture.vue',
    ],
    migratedSubRoutes: ['pages/admin/snippets/capture.vue'],
    inScopeComponents: [
        'Checkbox',
        'Textarea',
        'InputNumber',
        'ProgressSpinner',
        'Divider',
        'Card',
        'Image',
        'SelectButton',
        'Accordion',
        'AccordionPanel',
        'AccordionHeader',
        'AccordionContent',
    ],
} as const satisfies Omit<CaomeiUiRouteScope, 'prefix'>

export const CAOMEI_UI_ROUTE_SCOPES: readonly CaomeiUiRouteScope[] = [
    // 仪表盘：管理端树的根前缀（前缀语义会把 `pages/admin/**` 全部纳入，逐页归属见该 scope 的声明）。
    { prefix: '/admin', ...ADMIN_DASHBOARD_ROUTE_SCOPE },
    { prefix: '/admin/comments' },
    { prefix: '/admin/submissions' },
    { prefix: '/admin/external-links' },
    { prefix: '/admin/waitlist' },
    { prefix: '/admin/ad/campaigns' },
    { prefix: '/admin/ad/placements' },
    { prefix: '/admin/migrations/link-governance' },
    { prefix: '/admin/subscribers' },
    { prefix: '/admin/users' },
    { prefix: '/admin/friend-links' },
    // 内容日历：页面 + 月历 / 看板视图。
    { prefix: '/admin/calendar', ...ADMIN_CALENDAR_ROUTE_SCOPE },
    // 灵感收纳箱：页面 + 5 个片段组件；`/capture` 子路由随本批迁移。
    { prefix: '/admin/snippets', ...ADMIN_SNIPPETS_ROUTE_SCOPE },
    // 文章路由：列表页 + 编辑器子路由（第七十一阶段条目 2 编辑器子批整迁）。
    // 编辑器族与列表页共享三件套（`post-audit-badge` / `post-audit-dialog` / `publish-push-dialog`）；
    // 编辑器迁移后 V1 的消费者清零并已删除，本批去掉 `-v2` 后缀收敛为正式名。
    {
        prefix: '/admin/posts',
        ownedFiles: [
            'components/admin/posts/ai-image-generator.vue',
            'components/admin/posts/post-audit-badge.vue',
            'components/admin/posts/post-audit-dialog.vue',
            'components/admin/posts/post-distribution-button.vue',
            'components/admin/posts/post-editor-drag-mask.vue',
            'components/admin/posts/post-editor-header.vue',
            'components/admin/posts/post-editor-media-settings.vue',
            'components/admin/posts/post-editor-perspective-panel.vue',
            'components/admin/posts/post-editor-review-panel.vue',
            'components/admin/posts/post-editor-rewrite-compare.vue',
            'components/admin/posts/post-editor-settings.vue',
            'components/admin/posts/post-editor-setup-reminder.vue',
            'components/admin/posts/post-editor-voice-overlay.vue',
            'components/admin/posts/post-history-panel.vue',
            'components/admin/posts/post-media-preview-cell.vue',
            'components/admin/posts/post-social-dialog.vue',
            'components/admin/posts/post-translation-workflow-dialog.vue',
            'components/admin/posts/post-tts-dialog.vue',
            'components/admin/posts/publish-push-dialog.vue',
        ],
        inScopeComponents: [
            // 编辑器批次迁入、此前不在批次基准的族。
            'Textarea',
            'Message',
            'Skeleton',
            'Divider',
            'Image',
            'ProgressSpinner',
            'ProgressBar',
            'Checkbox',
            'RadioButton',
            'ToggleSwitch',
            'AutoComplete',
            'InputGroup',
            'SplitButton',
            'ButtonGroup',
            'Avatar',
            'InputNumber',
            // **不登记 `DatePicker`**：发布确认浮层的排期选择仍为 PrimeVue（B3 表单族，随 B3 残留族收口），
            // 登记会让本路由立即判红。`Card` 同理（编辑器不使用）。
        ],
        migratedSubRoutes: ['pages/admin/posts/[id].vue'],
    },
    // 组件型目标型路由（`/admin/categories` + `/admin/tags`）：两个 host 共享同一份路由自有实体组件
    // 与同一组在册族增量，故复用同一范围常量——同一文件被两条口径分别判定的可能性在结构上被排除。
    { prefix: '/admin/categories', ...TAXONOMY_ROUTE_SCOPE },
    { prefix: '/admin/tags', ...TAXONOMY_ROUTE_SCOPE },
    // 组件型目标型路由（`/admin/ai`）：路由自有组件位于 `components/admin/ai/`。
    // `task-detail-content.vue` 已于任务详情子路由整迁时一并迁移并纳入 `ownedFiles`。
    { prefix: '/admin/ai', ...AI_ROUTE_SCOPE },
    // 组件型目标型路由（`/admin/marketing`）：页面 + 列表 + 表单（弹窗内表单控件随本批迁移，
    // 浮层本体已迁入 `CaomeiDialog`；`DatePicker` / `MultiSelect` / `RadioButton` 维持 PrimeVue）。
    { prefix: '/admin/marketing', ...MARKETING_ROUTE_SCOPE },
    // 组件型目标路由（`/admin/settings`）：设置页 + 设置面板族（2a）+ 主题工作台子路由（2b，经 `migratedSubRoutes` 纳入扫描面）。
    { prefix: '/admin/settings', ...ADMIN_SETTINGS_ROUTE_SCOPE },
    // 通知管理：页面 + 共享投递日志列表。
    { prefix: '/admin/notifications', ...ADMIN_NOTIFICATIONS_ROUTE_SCOPE },
    // 安装向导：容器页 + 6 个步骤组件 + 字段状态 + 清单图标映射（Stepper / Accordion 族首次生产迁移）。
    { prefix: '/installation', ...INSTALLATION_ROUTE_SCOPE },
    // 用户设置：页面 + 设置面板族 + 通知历史列表 + 商用链接三件套。
    { prefix: '/settings', ...USER_SETTINGS_ROUTE_SCOPE },
    // 友链页：卡片 / 标签 / 申请表单 + 登录用户上传壳（caomei 单一实现）。
    { prefix: '/friend-links', ...FRIEND_LINKS_ROUTE_SCOPE },
    // 文章列表：页面 + 详情子路由。
    { prefix: '/posts', ...POSTS_ROUTE_SCOPE },
    // 公开列表页：索引页 + taxonomy 详情子路由（共用 taxonomy-post-page）。
    { prefix: '/archives', ...PUBLIC_LIST_ROUTE_SCOPE },
    { prefix: '/categories', ...CATEGORY_INDEX_ROUTE_SCOPE },
    { prefix: '/tags', ...TAG_INDEX_ROUTE_SCOPE },
    // 法务协议页：两页共用 legal-agreement-page。
    { prefix: '/privacy-policy', ...LEGAL_AGREEMENT_ROUTE_SCOPE },
    { prefix: '/user-agreement', ...LEGAL_AGREEMENT_ROUTE_SCOPE },
    // 认证页：四条共享 `auth-card`；`/submit` 为独立页面。
    { prefix: '/login', ...AUTH_ROUTE_SCOPE },
    { prefix: '/register', ...AUTH_ROUTE_SCOPE },
    { prefix: '/forgot-password', ...AUTH_ROUTE_SCOPE },
    { prefix: '/reset-password', ...AUTH_ROUTE_SCOPE },
    { prefix: '/submit', ...SUBMIT_ROUTE_SCOPE },
]

/**
 * 某条登记的**有效在册族**：批次基准在册族 + 该路由的增量（去重、保序）。
 *
 * 单点实现「基准 + 增量」的合并口径，避免守卫与测试各写一份合并逻辑（两处漂移会让增量静默失效）。
 */
export function resolveInScopeComponents(scope?: CaomeiUiRouteScope): readonly string[] {
    if (!scope?.inScopeComponents?.length) {
        return CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS
    }

    return [
        ...CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS,
        ...scope.inScopeComponents.filter(
            (name) => !(CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS as readonly string[]).includes(name),
        ),
    ]
}

/**
 * 已整路由迁移到 caomei-ui 的路由前缀（单点事实源）。
 *
 * **由 `CAOMEI_UI_ROUTE_SCOPES` 派生**：前缀清单与各路由的迁移范围（`ownedFiles`）在同一处维护，
 * 两处各持一份的漂移面因此消失；消费方按字符串数组使用。**覆盖边界**：派生只保证「前缀 ↔ 范围条目
 * 同源」，不保证 `ownedFiles` 的**完整性**——薄包装页若漏登记实体文件，守卫的「至少一个 caomei 组件」
 * 断言会响亮失败；**非**薄包装页（页面文件自身含 caomei 组件）的实体文件漏登记仍是已知无守卫面，
 * 由三层视觉回归与该批「文件 → 改动点」清单覆盖。
 * 迁移期初始为空数组；每完成一个路由的整体迁移后在此登记（批次划分见
 * `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md` 的分批执行计划章节）。
 * 登记项使用路由前缀语义：登记 `/admin/posts` 表示**该路由**已迁移（匹配规则按 `/` 分段前缀比较，
 * 故其子路径也命中同一来源）。
 *
 * **子路由例外（2026-10-16 补记）**：前缀语义会连带**子路由**，因此登记前必须核对子路由是否也在
 * 迁移范围内。已知例外：`/admin/posts` 的编辑器子路由 `/admin/posts/[id]` **不在**数据列表批次范围内
 * （仍全面使用 PrimeVue；其共享组件走「消费处静态择库」，继续使用 V1）；
 * `/admin/ai` 的任务详情子路由 `/admin/ai/tasks/[id]` 同理（组件型目标批次范围外的 B4 展示族）。
 * **2026-11-08 起已无例外**：`/admin/posts/[id]`（2026-11-07 编辑器子批）与 `/admin/ai/tasks/[id]`
 * （2026-11-06）先后转为 `migratedSubRoutes`；`primeVueSubRoutes` 机制保留，供后续新增未迁移子路由时登记。
 * 同日起全仓不再有路由择库型过渡组件（`AdminPageHeader` / `AppAvatar` / `AppUploader` 均收敛为单一实现），
 * 过渡组件守卫改为锁「版本标记文件零残留 + 共享壳不得重新引入路由择库」。
 * 已迁移的子路由登记在 `migratedSubRoutes`（纳入零残留扫描面），与未迁移例外互斥。
 *
 * 在册组件族（本批）范围见上方 `CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS`（本模块内单点定义，
 * 避免与守卫各持一份）；显式豁免清单以迁移方案 §5.5 为唯一载体（跨路由共享壳走「过渡组件」而非豁免）。
 * 第六十九阶段浮层族已纳入在册族；`v-tooltip` 指令已由 `AppTooltip`（`CaomeiTooltip` 桥接）承接。
 */
export const CAOMEI_UI_ROUTE_PREFIXES: readonly string[] = CAOMEI_UI_ROUTE_SCOPES.map((scope) => scope.prefix)

import { APP_LOCALE_CODES } from '@/i18n/config/locale-registry'

/**
 * 剥离 `route.path` 上可能存在的 locale 前缀（本项目 i18n `strategy: 'prefix_and_default'`，
 * 非默认语言的实际路径形如 `/en-US/admin/comments`）。
 *
 * 只剥离**已知 locale 码**的首段，避免把两字母业务段（如 `/ai`）误判为语言前缀。
 */
function stripLocalePrefix(routePath: string): string {
    const withLeadingSlash = routePath.startsWith('/') ? routePath : `/${routePath}`
    const [firstSegment = ''] = withLeadingSlash.slice(1).split('/', 1)
    const isLocalePrefix = APP_LOCALE_CODES.some((code) => code.toLowerCase() === firstSegment.toLowerCase())

    if (!isLocalePrefix) {
        return withLeadingSlash
    }

    const stripped = withLeadingSlash.slice(1 + firstSegment.length)

    return stripped === '' ? '/' : stripped
}

/**
 * 归一化路由路径：补齐前导 `/`、去掉尾部 `/`，根路由统一表示为 `/`。
 *
 * 归一化是为了让 `/admin/posts`、`admin/posts/`、`/admin/posts/` 得到同一比较结果。
 */
function normalizeRoutePath(routePath: string): string {
    const withLeadingSlash = routePath.startsWith('/') ? routePath : `/${routePath}`
    const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/u, '')

    return withoutTrailingSlash === '' ? '/' : withoutTrailingSlash
}

/**
 * 解析某个路由当前使用的组件库来源。
 *
 * 匹配规则为**前缀段匹配**（按 `/` 分段比较），因此登记 `/admin` 会命中 `/admin/posts`，
 * 但不会把 `/admin-posts` 误判为已迁移。
 *
 * 边界语义：
 * - 登记 `/` **只命中根路由本身**，不表示「全站已迁移」；需要全站切换时应逐个登记顶层前缀。
 * - 入参应是路由的已归一化路径；含 `..`、大小写差异或百分号编码的输入会保守回退为 `primevue`。
 *
 * @param routePath 路由路径，可带或不带前导 `/`。
 * @param migratedPrefixes 已迁移路由前缀清单，默认取模块级事实源，测试时可显式传入。
 * @returns 该路由应使用的组件库来源。
 */
export function resolveUiLibraryForRoute(
    routePath: string,
    migratedPrefixes: readonly string[] = CAOMEI_UI_ROUTE_PREFIXES,
): UiLibrarySource {
    const normalizedPath = normalizeRoutePath(routePath)

    const isMigrated = migratedPrefixes.some((prefix) => {
        const normalizedPrefix = normalizeRoutePath(prefix)

        return normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`)
    })

    return isMigrated ? 'caomei-ui' : 'primevue'
}

/**
 * 面向 `useRoute().path` 的便捷入口：先剥离 locale 前缀再解析组件库来源。
 *
 * 组件内（如 `AdminPageHeader`）应使用本函数，避免各处重复实现 locale 前缀剥离；
 * 纯路径判断场景（已是业务路径）可继续直接用 `resolveUiLibraryForRoute`。
 */
export function resolveUiLibraryForRoutePath(
    routePath: string,
    migratedPrefixes: readonly string[] = CAOMEI_UI_ROUTE_PREFIXES,
): UiLibrarySource {
    return resolveUiLibraryForRoute(stripLocalePrefix(routePath), migratedPrefixes)
}
