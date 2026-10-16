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

export const CAOMEI_UI_ROUTE_SCOPES: readonly CaomeiUiRouteScope[] = [
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
    { prefix: '/admin/posts' },
    // 组件型目标型路由（`/admin/categories` + `/admin/tags`）：两个 host 共享同一份路由自有实体组件
    // 与同一组在册族增量，故复用同一范围常量——同一文件被两条口径分别判定的可能性在结构上被排除。
    { prefix: '/admin/categories', ...TAXONOMY_ROUTE_SCOPE },
    { prefix: '/admin/tags', ...TAXONOMY_ROUTE_SCOPE },
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
 * 当前两条子路由**均未被路由择库型过渡组件触达**（全仓消费 `resolveUiLibraryForRoute(Path)` 的仅
 * `AdminPageHeader` / `AppAvatarV2` / `AppUploaderV2`：`/admin/posts/[id]` 用编辑器自有头部，
 * `/admin/ai/tasks/[id]` 的 `AdminPageHeader` 未开 `show-language-switcher`，故切换器不渲染），
 * 已逐处核对，无路由内混用；但该性质**目前无守卫兜底**——若后续把上述过渡组件引入子路由子树，
 * 组件会静默切到 caomei 而无门禁拦截，故登记为收尾项（见 `docs/plan/backlog.md` 迁移收尾跟踪：
 * 为「已登记前缀的非 index 子路由页面」补结构守卫）。
 *
 * 在册组件族（本批）范围见上方 `CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS`（本模块内单点定义，
 * 避免与守卫各持一份）；显式豁免清单（全局壳 `Toast` / `ConfirmDialog`、延后批次浮层、`v-tooltip` 指令）
 * 以迁移方案 §5.5 为唯一载体（跨路由共享壳走「过渡组件」而非豁免）。
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
