import { CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS } from '../../lib/ui-library'

/**
 * 「在册族零残留」类结构守卫共用的扫描辅助。
 *
 * 抽出的原因：该口径同时被**已迁移路由守卫**（`ui-library-route-migration-guard.test.ts`，扫描页面文件）
 * 与**过渡组件守卫**（`ui-library-transition-component-guard.test.ts`，扫描过渡组件）消费；
 * 两处各持一份实现会在修复假阳性时只修好一处。在册族清单本身存放在
 * `lib/ui-library.ts`（并存期「路由 → 组件来源」事实源），本模块只放扫描口径。
 */

/**
 * 去掉 `<script>` / `<style>` 块，只留模板区（组件标签的唯一合法位置）参与标签匹配。
 *
 * 为什么要收窄（2026-10-16 `/admin/marketing` 首次命中）：`.vue` 的**脚本块**里存在 TS 泛型实参
 * （实测：`$fetch<ApiResponse<PaginatedData<Tag>>>`）——`<Tag>` 与组件标签在文本上无法区分，
 * 整文件扫描会把类型实参误判为「残留在册族组件」。「模板块 + 显式导入扣除」是两道互补口径：
 * 前者排除脚本块里的同名文本，后者排除模板块内的同名图标。
 *
 * 采用「**反向剥离**」（去掉脚本 / 样式块）而不是「正向提取根 `<template>`」：片段来源（如单测里
 * 的内联模板）不含根 `<template>` 包裹，正向提取会从嵌套的 `<template #slot>` 起匹配、把外层标签
 * 排除在扫描面之外（实测把 `<DataTable>` 漏判为无残留）。反向剥离对片段天然无操作。
 *
 * 已知边界：脚本块内以字符串形式出现的旧标签名不再计入（本仓无此写法）。
 */
export function stripNonTemplateBlocks(source: string): string {
    return source
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gu, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gu, '')
}

/** 组件标签匹配：`<Name` 后必须是空白 / `/` / `>`，避免 `<Button` 命中 `<ButtonGroup`。 */
export function buildComponentTagPattern(name: string): RegExp {
    return new RegExp(`<${name}[\\s/>]`, 'u')
}

/**
 * 剥离注释后再扫描。
 *
 * 守卫按源码文本匹配组件标签，而注释里常需要引用旧标签名做说明
 * （如「迁移前 PrimeVue 列组件的写法」）——不剥离注释会把这类说明误判为残留标签
 * （2026-10-13 `/admin/submissions` 首版即因此假阳性）。
 *
 * 已知边界：只剥离**整行** `//` 注释，故**行尾**注释里引用旧标签名
 * 仍会假阳性（本仓页面注释均为整行 / HTML 块注释，尚未触发）。不做更激进的剥离是为了避免
 * 误伤字符串中的 URL（如 `https://…`）；若后续命中，按「把注释改为整行」修正而不是放宽剥离规则。
 */
export function stripComments(source: string): string {
    return source
        .replace(/<!--[\s\S]*?-->/gu, '')
        .replace(/\/\*[\s\S]*?\*\//gu, '')
        .replace(/^\s*\/\/.*$/gmu, '')
}

/**
 * 收集**显式值导入**的非 PrimeVue 标识符（如 `@lucide/vue` 的图标名）。
 *
 * 守卫按源码文本匹配 `<Name`，而 lucide 图标名与在册族 PrimeVue 组件名存在同名
 * （典型：`Tag`）——不以显式导入清单排除，会把 `<Tag :size="16" />` 这类图标
 * 误判为「残留在册族组件」（2026-10-14 `/admin/waitlist` 迁移首次命中该假阳性）。
 *
 * 排除是安全的：显式导入的绑定会遮蔽 Nuxt 自动导入的同名 PrimeVue 组件绑定，
 * 因此「已显式导入的非 PrimeVue 标识符」在同一文件内不可能同时是 PrimeVue 组件用法。
 *
 * 覆盖面：
 * - 覆盖具名导入、默认导入、混合默认 + 具名、命名空间导入（`import * as ns`）与多行导入；
 * - **不排除** `primevue` / `primevue/*` 导入（避免放过显式引入的 PrimeVue 组件）；
 * - **不排除** `import type { … }` 与具名列表内的内联 `type X`：类型导入在编译期被擦除、
 *   不遮蔽运行时绑定，计入排除集会造成假阴性。
 */
export function collectExplicitlyImportedIdentifiers(source: string): Set<string> {
    const identifiers = new Set<string>()
    const importPattern = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gu

    for (const match of source.matchAll(importPattern)) {
        const [, clause = '', modulePath = ''] = match

        if (modulePath === 'primevue' || modulePath.startsWith('primevue/')) {
            continue
        }

        if (/^\s*type\b/u.test(clause)) {
            continue
        }

        const defaultBinding = /^\s*([A-Za-z_$][\w$]*)\s*(?:,|$)/u.exec(clause)
        if (defaultBinding?.[1]) {
            identifiers.add(defaultBinding[1])
        }

        const namespaceBinding = /^\s*\*\s*as\s+([A-Za-z_$][\w$]*)/u.exec(clause)
        if (namespaceBinding?.[1]) {
            identifiers.add(namespaceBinding[1])
        }

        const namedBlock = /\{([\s\S]*)\}/u.exec(clause)
        const namedList = namedBlock?.[1]
        if (!namedList) {
            continue
        }

        for (const rawBinding of namedList.split(',')) {
            const entry = rawBinding.trim()

            if (!entry || /^type\s/u.test(entry)) {
                continue
            }

            const localName = entry.split(/\s+as\s+/u).pop()?.trim()
            if (localName) {
                identifiers.add(localName)
            }
        }
    }

    return identifiers
}

/**
 * 返回源码中仍以 PrimeVue 组件形式出现的在册族组件名。
 *
 * 口径：剥离注释 → 扣除显式非 PrimeVue 值导入 → 在**去掉 `<script>` / `<style>` 块后**的源码上匹配标签
 * （见 `stripNonTemplateBlocks`；注意是反向剥离，不是正向提取根 `<template>`）。
 *
 * 该收窄只用于**残留扫描**：子路由例外页面的「路由择库标记」扫描仍用整份源码（其 token 不含尖括号，
 * 无假阳性动机；收窄会丢掉脚本块内的 `import` 覆盖）。
 */
export function findInScopePrimeVueResiduals(
    source: string,
    components: readonly string[] = CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS,
): string[] {
    const scanned = stripComments(source)
    const explicitlyImported = collectExplicitlyImportedIdentifiers(scanned)
    const templateOnly = stripNonTemplateBlocks(scanned)

    return components.filter(
        (name) => !explicitlyImported.has(name) && buildComponentTagPattern(name).test(templateOnly),
    )
}
