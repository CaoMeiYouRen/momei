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
 * 已整路由迁移到 caomei-ui 的路由前缀（单点事实源）。
 *
 * 迁移期初始为空数组；每完成一个路由的整体迁移后在此登记（批次划分见
 * `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md` 的分批执行计划章节）。
 * 登记项使用路由前缀语义：登记 `/admin/posts` 表示该路由及其子路由已迁移。
 *
 * 在册组件族（本批）范围：DataTable / Column（列插槽·选择·排序·lazy·分页）、Paginator、Tag、
 * Button、InputText、Select、Badge、ToggleSwitch、IconField / InputIcon、Skeleton、Avatar。
 * 显式豁免：全局壳 `Toast` / `ConfirmDialog`、延后批次的浮层（Dialog / Drawer / Popover /
 * DropdownMenu，含 `ConfirmDeleteDialog`）、跨路由共享壳与 `v-tooltip` 指令。
 */
export const CAOMEI_UI_ROUTE_PREFIXES: readonly string[] = [
    '/admin/comments',
]

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
