import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findInScopePrimeVueResiduals, stripComments } from './ui-library-guard-helpers'

/**
 * 共享壳过渡组件的结构守卫。
 *
 * 并存期有两类过渡组件（判定口径见迁移方案 §5.5「过渡组件的两种择库机制」）：
 * - **组件内按路由择库**：跨边界展示型壳（消费者 ≥3、横跨公开页与 admin），内部调用
 *   `resolveUiLibraryForRoutePath`，未迁移路由回退到 V1；
 * - **消费处静态择库**：admin 专属、消费者恰好两个（一迁移一未迁移）的有状态 / 多 prop 壳，
 *   组件本身是纯 caomei 实现，由已迁移路由直接使用。
 *
 * 本守卫锁住三条容易在后续维护中静默失效的性质：
 * 1. **caomei 分支零残留**：过渡组件内不得再出现批次在册族的 PrimeVue 组件——否则
 *    已迁移路由会在过渡组件内部把 PrimeVue 重新引入（守卫只管页面文件，管不到组件）。
 * 2. **机制声明与实现一致**：组件内择库的必须引用路由 → 组件来源单一事实源；
 *    消费处择库的不得引用（否则出现两套择库逻辑，与声明不符）。
 * 3. **注册表与磁盘一致**：`components/**` 下的 `*-v2.vue` 必须全部登记，
 *    避免新增过渡组件后守卫静默漏扫。
 */

/** 组件内按路由择库的过渡组件。 */
const INTERNAL_PICKING_TRANSITION_COMPONENTS = [
    'components/app-avatar-v2.vue',
    'components/app-uploader-v2.vue',
] as const

/** 消费处静态择库的过渡组件。 */
const CONSUMER_PICKING_TRANSITION_COMPONENTS = [
    'components/admin/content-language-switcher-v2.vue',
    'components/admin/posts/post-audit-badge-v2.vue',
    'components/admin/posts/post-audit-dialog-v2.vue',
    'components/admin/posts/publish-push-dialog-v2.vue',
] as const

/**
 * 路由 → 组件来源单一事实源的**调用**与**导入来源**判定。
 *
 * 三重加固（每一重都来自一次负向验证的假阴性）：
 * 1. 判定前先 `stripComments`——否则把真实导入 / 调用改成注释即可满足「引用了事实源」（已实证）；
 * 2. 用「导入来源 + 调用」两段独立判定，而不是裸字符串包含——裸包含会被 `…ForRoutePathX` 这类改名骗过；
 * 3. 调用形态兼容具名、别名（`as`）与命名空间导入——只认具名形态会把合法写法判成违规。
 */
const ROUTE_SOURCE_MODULE_PATTERN = /from\s*['"]@\/lib\/ui-library['"]/u
const ROUTE_SOURCE_DIRECT_CALL_PATTERN = /\bresolveUiLibraryForRoutePath\s*\(/u
const ROUTE_SOURCE_ALIAS_PATTERN = /resolveUiLibraryForRoutePath\s+as\s+([A-Za-z_$][\w$]*)/u
const ROUTE_SOURCE_NAMESPACE_PATTERN = /import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from\s*['"]@\/lib\/ui-library['"]/u

/** 在已剥离注释的源码中判断「是否真的导入并调用了路由 → 组件来源事实源」。 */
function usesRouteSource(scanned: string): boolean {
    if (!ROUTE_SOURCE_MODULE_PATTERN.test(scanned)) {
        return false
    }

    if (ROUTE_SOURCE_DIRECT_CALL_PATTERN.test(scanned)) {
        return true
    }

    const alias = ROUTE_SOURCE_ALIAS_PATTERN.exec(scanned)?.[1]
    if (alias && new RegExp(`\\b${alias}\\s*\\(`, 'u').test(scanned)) {
        return true
    }

    const namespace = ROUTE_SOURCE_NAMESPACE_PATTERN.exec(scanned)?.[1]

    return Boolean(namespace && new RegExp(`\\b${namespace}\\.resolveUiLibraryForRoutePath\\s*\\(`, 'u').test(scanned))
}

/**
 * 递归收集过渡组件候选文件。
 *
 * 判定用**宽口径**（文件名含 `v` + 数字的版本标记，如 `v2` / `V2` / `v3`，不区分大小写与分隔符），
 * 覆盖三种漏扫形态：命名约定外（`FooV2.vue`、`foo_v2.vue`）、**版本族外**（`*-v3.vue` 等）、
 * 位置约定外（`pages/**`、`layouts/**`）。
 * 收集到之后再断言「必须登记」与「必须符合 `-v2.vue` 命名约定」——把命名约定也变成被守卫的事实，
 * 而不是守卫的隐含前提。
 */
const TRANSITION_COMPONENT_SCAN_ROOTS = ['components', 'pages', 'layouts'] as const
// 版本标记宽口径：`v` + 数字（覆盖 v2 / v3 / V2 …）；仅匹配 `v2` 会让 `*-v3.vue` 静默漏扫。
const TRANSITION_COMPONENT_NAME_PATTERN = /v\d/iu
const TRANSITION_COMPONENT_SUFFIX = '-v2.vue'

async function collectTransitionComponentCandidates(dir: string): Promise<string[]> {
    let entries

    try {
        entries = await readdir(dir, { withFileTypes: true })
    } catch {
        // 目录不存在（例如本仓无 `layouts/`）时跳过，不视为失败。
        return []
    }

    const found: string[] = []

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            found.push(...await collectTransitionComponentCandidates(fullPath))
            continue
        }

        if (entry.isFile() && entry.name.endsWith('.vue') && TRANSITION_COMPONENT_NAME_PATTERN.test(entry.name)) {
            found.push(path.relative(process.cwd(), fullPath))
        }
    }

    return found
}

async function collectTransitionComponentFiles(): Promise<string[]> {
    const roots = TRANSITION_COMPONENT_SCAN_ROOTS.map((root) => path.join(process.cwd(), root))
    const found = (await Promise.all(roots.map((root) => collectTransitionComponentCandidates(root)))).flat()

    return found.sort()
}

async function readSource(relativePath: string): Promise<string> {
    return readFile(path.join(process.cwd(), relativePath), 'utf8')
}

/** 由过渡组件路径推导 V1 组件名（`components/app-avatar-v2.vue` → `AppAvatar`）。 */
function resolveLegacyComponentName(relativePath: string): string {
    const baseName = path.basename(relativePath, '.vue').replace(/-v2$/u, '')

    return baseName
        .split('-')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join('')
}

describe('过渡组件注册表与磁盘一致', () => {
    it('`components/**` 与 `pages/**`、`layouts/**` 下的过渡组件候选全部登记（防止新增后漏扫）', async () => {
        const onDisk = await collectTransitionComponentFiles()
        const registered = [
            ...INTERNAL_PICKING_TRANSITION_COMPONENTS,
            ...CONSUMER_PICKING_TRANSITION_COMPONENTS,
        ].sort()

        expect(onDisk).toEqual(registered)
    })

    it('过渡组件命名必须符合 `-v2.vue` 约定（`FooV2.vue` / `*-v3.vue` 等版本族外形态会被本用例拦下）', async () => {
        const onDisk = await collectTransitionComponentFiles()
        const violating = onDisk.filter((file) => !file.endsWith(TRANSITION_COMPONENT_SUFFIX))

        expect(violating, `以下文件疑似过渡组件但不符合命名约定：${violating.join(', ')}`).toEqual([])
    })

    it('两类注册表均非空（防止守卫被清空而静默失效）', () => {
        expect(INTERNAL_PICKING_TRANSITION_COMPONENTS.length).toBeGreaterThan(0)
        expect(CONSUMER_PICKING_TRANSITION_COMPONENTS.length).toBeGreaterThan(0)
    })
})

describe('过渡组件：caomei 分支零残留 + 渲染 caomei 组件', () => {
    const all = [
        ...INTERNAL_PICKING_TRANSITION_COMPONENTS,
        ...CONSUMER_PICKING_TRANSITION_COMPONENTS,
    ]

    for (const relativePath of all) {
        it(`${relativePath}：不得残留在册族 PrimeVue 组件，且至少渲染一个 caomei-ui 组件`, async () => {
            const source = await readSource(relativePath)
            const residual = findInScopePrimeVueResiduals(source)

            expect(residual, `${relativePath} 残留在册族 PrimeVue 组件：${residual.join(', ')}`).toEqual([])
            expect(/<Caomei[A-Z]/u.test(stripComments(source)), `${relativePath} 未检出任何 caomei-ui 组件`).toBe(true)
        })
    }
})

describe('过渡组件：择库机制声明与实现一致', () => {
    for (const relativePath of INTERNAL_PICKING_TRANSITION_COMPONENTS) {
        it(`${relativePath}：组件内择库须引用路由事实源，并保留 V1 回退分支`, async () => {
            const source = await readSource(relativePath)
            const scanned = stripComments(source)

            expect(scanned, `${relativePath} 未从 @/lib/ui-library 导入并调用择库函数`).toSatisfy(usesRouteSource)

            const legacyName = resolveLegacyComponentName(relativePath)
            expect(source, `${relativePath} 未保留 V1 回退分支 <${legacyName}>`).toContain(`<${legacyName}`)

            // V1 组件本体必须仍存在（否则回退分支指向空）
            const legacyPath = path.join(path.dirname(relativePath), `${legacyName.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase()}.vue`)
            await expect(readFile(path.join(process.cwd(), legacyPath), 'utf8')).resolves.toBeTruthy()
        })
    }

    for (const relativePath of CONSUMER_PICKING_TRANSITION_COMPONENTS) {
        it(`${relativePath}：消费处择库不得引用路由事实源（否则出现两套择库逻辑）`, async () => {
            const source = await readSource(relativePath)

            expect(stripComments(source)).not.toSatisfy(usesRouteSource)
        })
    }

    it('`AdminPageHeader` 作为消费处择库的既有范式，仍按事实源选择切换器实现', async () => {
        const source = await readSource('components/admin-page-header.vue')

        expect(stripComments(source)).toSatisfy(usesRouteSource)
    })
})
