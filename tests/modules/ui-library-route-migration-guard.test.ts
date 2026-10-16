import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS,
    CAOMEI_UI_ROUTE_PREFIXES,
    CAOMEI_UI_ROUTE_SCOPES,
    resolveInScopeComponents,
} from '../../lib/ui-library'
import { findInScopePrimeVueResiduals, stripComments } from './ui-library-guard-helpers'

/**
 * 已迁移路由的「在册组件族零残留」守卫。
 *
 * 背景（迁移方案 §5.5 与第六十七阶段第 4 项裁定）：`app.vue` 全局渲染 PrimeVue `Toast` / `ConfirmDialog`，
 * 且浮层类（Dialog / Drawer / Popover / DropdownMenu）显式延后到第六十九阶段，因此「路由内组件来源唯一」
 * 只能按**批次在册组件族**判定——已登记路由的页面文件中不得再出现这些组件族的 PrimeVue 组件，
 * 且必须至少出现一个 caomei-ui 组件（证明切换确实发生）。
 *
 * 扫描口径（注释剥离、显式导入扣除）与在册族清单已抽到共享模块（`./ui-library-guard-helpers` 与 `lib/ui-library.ts`），
 * 与过渡组件守卫共用同一份实现，避免两处漂移。
 *
 * 覆盖边界：本守卫按 `CAOMEI_UI_ROUTE_SCOPES` 逐条扫描——**页面文件**（目录形态
 * `pages/<prefix>/index.vue` 与同名文件形态 `pages/<prefix>.vue`，解析按该顺序回退）
 * 加该路由登记的 **`ownedFiles`**（路由自有实体组件，2026-10-16 新增：薄包装页的
 * 实体不在页面文件内，只扫页面文件会让两条断言同时退化为恒真 / 恒假）。
 * 在册族按**批次基准 + 该路由增量**（`resolveInScopeComponents`）判定：本批新增的
 * `Tabs` 族 / `InputGroup` / `Checkbox` / `Textarea` 只在登记了增量的路由上生效，
 * 避免让已收口批次被动回改。
 * 其余路由自有子组件、跨路由共享壳与 `v-tooltip` 指令由三层视觉回归与各批「文件 → 改动点」清单覆盖（显式豁免）。
 */

/**
 * 候选页面文件（按优先级）：`pages/<prefix>/index.vue`，其次 `pages/<prefix>.vue`。
 *
 * 两种形态在本仓并存——目录形态（如 `pages/admin/waitlist/index.vue`）与同名文件形态
 * （如 `pages/admin/ad/campaigns.vue`、`pages/admin/migrations/link-governance.vue`）。
 * 只认前者会让后者的守卫**无法覆盖本页**——旧实现返回 `index.vue` 路径后 `readFile` 直接 `ENOENT` 报错阻断（属响亮失败，非静默漏扫）。
 */
function resolvePageFileCandidates(prefix: string): string[] {
    const normalizedPrefix = prefix === '/' ? '' : prefix.replace(/\/+$/u, '')
    const base = path.join(process.cwd(), 'pages', normalizedPrefix)

    return [path.join(base, 'index.vue'), `${base}.vue`]
}

async function resolvePageFile(prefix: string): Promise<string> {
    const candidates = resolvePageFileCandidates(prefix)

    for (const candidate of candidates) {
        try {
            await readFile(candidate, 'utf8')
            return candidate
        } catch {
            // 继续尝试下一个候选形态。
        }
    }

    throw new Error(`未找到 ${prefix} 对应的页面文件，已尝试：${candidates.map((item) => path.relative(process.cwd(), item)).join(', ')}`)
}

/**
 * 一条登记项的完整扫描面：页面文件 + 登记的路由自有文件（`ownedFiles`，绝对路径）。
 *
 * `ownedFiles` 声明的是仓库相对路径（POSIX 分隔符），此处统一转绝对路径；
 * 文件不存在时**响亮失败**（与页面文件解析同口径）——否则登记项写错路径会让守卫静默漏扫。
 */
async function resolveScopeFiles(scope: { prefix: string, ownedFiles?: readonly string[] }): Promise<string[]> {
    const pageFile = await resolvePageFile(scope.prefix)
    const ownedFiles: string[] = []

    for (const relativePath of scope.ownedFiles ?? []) {
        const absolutePath = path.join(process.cwd(), relativePath)

        try {
            await readFile(absolutePath, 'utf8')
        } catch {
            throw new Error(`登记项 ${scope.prefix} 的 ownedFiles 不存在：${relativePath}`)
        }

        ownedFiles.push(absolutePath)
    }

    return [pageFile, ...ownedFiles]
}

describe('已迁移路由：在册组件族零残留', () => {
    it('事实源至少登记一个路由前缀，且格式为绝对前缀', () => {
        expect(CAOMEI_UI_ROUTE_PREFIXES.length).toBeGreaterThan(0)
        for (const prefix of CAOMEI_UI_ROUTE_PREFIXES) {
            expect(prefix.startsWith('/')).toBe(true)
            expect(prefix).not.toBe('/')
        }
    })

    it('前缀清单由范围登记派生（不允许两处各持一份）', () => {
        expect(CAOMEI_UI_ROUTE_PREFIXES).toEqual(CAOMEI_UI_ROUTE_SCOPES.map((scope) => scope.prefix))
    })

    it('在册组件族清单非空（防止守卫被清空而静默失效）', () => {
        expect(CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS.length).toBeGreaterThan(0)
    })

    for (const scope of CAOMEI_UI_ROUTE_SCOPES) {
        it(`${scope.prefix}：扫描面内不得残留在册族 PrimeVue 组件，且至少使用一个 caomei-ui 组件`, async () => {
            const files = await resolveScopeFiles(scope)
            const sources = await Promise.all(files.map(async (file) => ({ file, source: await readFile(file, 'utf8') })))
            const inScopeComponents = resolveInScopeComponents(scope)

            for (const { file, source } of sources) {
                const residual = findInScopePrimeVueResiduals(source, inScopeComponents)

                expect(
                    residual,
                    `${scope.prefix} 的 ${path.relative(process.cwd(), file)} 仍残留在册族 PrimeVue 组件：${residual.join(', ')}`,
                ).toEqual([])
            }

            // 「至少一个 caomei-ui 组件」按**扫描面聚合**判定：薄包装页（页面文件只有一行组件引用）
            // 的实体在 ownedFiles 内，按单文件判定会让这类路由恒假。
            const usesCaomei = sources.some(({ source }) => /<Caomei[A-Z]/u.test(stripComments(source)))

            expect(usesCaomei, `${scope.prefix} 扫描面内未检出任何 caomei-ui 组件`).toBe(true)
        })
    }
})

/**
 * 已登记前缀下的**子路由页面**（相对仓库根、POSIX 分隔符）：`pages/<prefix>/**` 中除 `index.vue`
 * 之外的全部 `.vue` 页面（测试文件不计）。
 *
 * 为什么需要枚举：登记前缀是**前缀语义**，子路由会被连带解析为 caomei-ui；未在本批范围内的子路由
 * 必须显式登记为例外，否则「已迁移」这一事实与子路由实现相互矛盾且无门禁拦截。
 */
async function listSubRoutePages(prefix: string): Promise<string[]> {
    const normalizedPrefix = prefix === '/' ? '' : prefix.replace(/\/+$/u, '')
    const base = path.join(process.cwd(), 'pages', normalizedPrefix)

    let entries: string[] = []

    try {
        entries = await readdir(base, { recursive: true }) as string[]
    } catch (error) {
        /* 同名文件形态的路由（如 `pages/admin/ad/campaigns.vue`）没有同名目录 —— 无子路由即空集。
         * 「页面文件是否存在」由 `resolvePageFile` 单独断言（两种形态都不存在时报错），此处不重复兜底。
         * 只吞 ENOENT：权限 / 非目录等异常必须外抛，否则会静默把「扫不了」当成「没有子路由」。 */
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return []
        }

        throw error
    }

    return entries
        .filter((entry) => entry.endsWith('.vue'))
        /* 只豁免**前缀根**的 `index.vue`（页面文件本身）：嵌套目录形态的子路由页（如
         * `pages/<prefix>/x/index.vue`）同样会被前缀登记连带解析，必须登记为例外，不能一并放过。 */
        .filter((entry) => entry.replaceAll('\\', '/') !== 'index.vue')
        .map((entry) => path.posix.join('pages', normalizedPrefix, entry.replaceAll('\\', '/')))
        .sort()
}

/**
 * 组件内择库型过渡组件与路由择库开关：出现在例外子路由内会因前缀登记而静默切到 caomei。
 *
 * 归一化匹配（去大小写与连字符）以覆盖 `<app-avatar-v2>` / `:showLanguageSwitcher` 等写法。
 *
 * **已知边界（不构成门禁保证，故显式声明）**：
 * 1. 动态择库（`<component :is="…">`）与**把过渡组件再包一层**的写法无法由静态子串发现；
 * 2. 只扫例外页面自身，**不扫其 import 子树**——共享组件若在别处引入过渡组件，本守卫不会响
 *    （该维度登记在 `docs/plan/backlog.md` 的「例外背后的 `components/<prefix>/**` 子树」待跟踪项）；
 * 3. 当前两条例外页面已逐处人工核对无触达，本守卫用于防**回退**，不替代一次性人工核对与三层视觉回归。
 */
const ROUTE_PICKING_MARKER_TOKENS = ['appavatarv2', 'appuploaderv2', 'showlanguageswitcher'] as const

/** 归一化：去大小写与连字符，使 kebab / camel / Pascal 写法落在同一判定面上。 */
function normalizeMarkerSource(source: string): string {
    return source.toLowerCase().replaceAll('-', '')
}

describe('已登记前缀的子路由页面：例外登记与路由择库标记', () => {
    it('已登记前缀下的每个非 index 子路由页面都必须显式登记为例外（否则响亮失败）', async () => {
        for (const scope of CAOMEI_UI_ROUTE_SCOPES) {
            const declared = new Set((scope.primeVueSubRoutes ?? []).map((item) => item.file))
            const found = await listSubRoutePages(scope.prefix)

            for (const page of found) {
                expect(
                    declared.has(page),
                    `${scope.prefix} 的子路由页面 ${page} 未在 primeVueSubRoutes 登记——请显式声明「本批是否迁移它的哪个部分」`,
                ).toBe(true)
            }
        }
    })

    it('登记的例外页面必须存在（写错路径响亮失败，不静默漏扫）', async () => {
        for (const scope of CAOMEI_UI_ROUTE_SCOPES) {
            for (const item of scope.primeVueSubRoutes ?? []) {
                await expect(readFile(path.join(process.cwd(), item.file), 'utf8')).resolves.toBeTypeOf('string')
            }
        }
    })

    it('例外页面不得引用组件内择库型过渡组件或开启路由择库的头部切换器', async () => {
        for (const scope of CAOMEI_UI_ROUTE_SCOPES) {
            for (const item of scope.primeVueSubRoutes ?? []) {
                const source = normalizeMarkerSource(stripComments(await readFile(path.join(process.cwd(), item.file), 'utf8')))
                const hits = ROUTE_PICKING_MARKER_TOKENS.filter((marker) => source.includes(marker))

                expect(
                    hits,
                    `${item.file} 出现路由择库标记 ${hits.join(', ')}——前缀登记会让这些组件在该子路由内静默切到 caomei，须先决定子路由归属`,
                ).toEqual([])
            }
        }
    })

    it('每条例外都给出理由（防止把「未迁移」写成静默默认）', () => {
        for (const scope of CAOMEI_UI_ROUTE_SCOPES) {
            for (const item of scope.primeVueSubRoutes ?? []) {
                expect(item.reason.length).toBeGreaterThan(10)
            }
        }
    })
})

describe('登记项扫描面：ownedFiles 登记与解析', () => {
    it('ownedFiles 路径使用仓库相对 POSIX 形式', () => {
        for (const scope of CAOMEI_UI_ROUTE_SCOPES) {
            for (const relativePath of scope.ownedFiles ?? []) {
                expect(path.isAbsolute(relativePath)).toBe(false)
                expect(relativePath).not.toContain('\\')
            }
        }
    })

    it('不存在的 ownedFiles 会抛出并点名登记项（假阴性防线）', async () => {
        await expect(resolveScopeFiles({
            prefix: '/admin/categories',
            ownedFiles: ['components/admin/__not-exist__.vue'],
        })).rejects.toThrow(/ownedFiles 不存在/u)
    })

    it('薄包装页：页面文件本身不含任何组件，实体在 ownedFiles 内', async () => {
        const scope = CAOMEI_UI_ROUTE_SCOPES.find((item) => item.prefix === '/admin/categories')
        const files = await resolveScopeFiles(scope as { prefix: string, ownedFiles?: readonly string[] })
        const pageFile = files[0] as string
        const ownedFile = files[1] as string

        // 页面文件：无 caomei 组件（故单文件判定会恒假）——这是 `ownedFiles` 机制存在的直接原因。
        expect(/<Caomei[A-Z]/u.test(await readFile(pageFile, 'utf8'))).toBe(false)
        // 路由自有实体文件：承载实际组件。
        expect(/<Caomei[A-Z]/u.test(await readFile(ownedFile, 'utf8'))).toBe(true)
        expect(path.relative(process.cwd(), ownedFile)).toBe(path.join('components', 'admin', 'admin-taxonomy-page.vue'))
    })
})

describe('路由级在册族增量', () => {
    it('基准在册族不含路由增量族（否则已收口批次会被动回改）', () => {
        for (const name of ['Tabs', 'TabList', 'Tab', 'TabPanels', 'TabPanel', 'InputGroup', 'Checkbox', 'Textarea']) {
            expect(CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS).not.toContain(name)
        }
    })

    it('无增量的登记沿用基准在册族（同一引用，避免每次合并产生新数组）', () => {
        expect(resolveInScopeComponents({ prefix: '/admin/posts' })).toBe(CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS)
        expect(resolveInScopeComponents()).toBe(CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS)
    })

    it('有增量的登记返回「基准 + 增量」，且与基准重复的成员不重复出现', () => {
        const merged = resolveInScopeComponents({
            prefix: '/admin/categories',
            inScopeComponents: ['Tabs', 'Textarea', 'Button'],
        })

        expect(merged).toContain('Tabs')
        expect(merged).toContain('Textarea')
        expect(merged.filter((name) => name === 'Button')).toHaveLength(1)
        expect(merged.filter((name) => name === 'Textarea')).toHaveLength(1)
    })

    it('共享同一个路由自有文件的多条登记，其有效在册族必须一致（防同一文件被两套口径判定）', () => {
        const byOwnedFile = new Map<string, unknown[]>()

        for (const scope of CAOMEI_UI_ROUTE_SCOPES) {
            for (const ownedFile of scope.ownedFiles ?? []) {
                const merged = [...resolveInScopeComponents(scope)].sort()
                const previous = byOwnedFile.get(ownedFile)

                if (previous) {
                    expect(merged, `${ownedFile} 在多条登记下的有效在册族不一致`).toEqual(previous)
                    continue
                }

                byOwnedFile.set(ownedFile, merged)
            }
        }
    })
})

describe('页面文件形态解析：目录形态与同名文件形态', () => {
    it('候选顺序为 `<prefix>/index.vue` → `<prefix>.vue`', () => {
        const candidates = resolvePageFileCandidates('/admin/ad/campaigns')

        expect(candidates.map((item) => path.relative(process.cwd(), item))).toEqual([
            path.join('pages', 'admin', 'ad', 'campaigns', 'index.vue'),
            path.join('pages', 'admin', 'ad', 'campaigns.vue'),
        ])
    })

    it('目录形态（index.vue）与同名文件形态（<prefix>.vue）都能解析到真实文件', async () => {
        // 目录形态
        expect(path.relative(process.cwd(), await resolvePageFile('/admin/waitlist')))
            .toBe(path.join('pages', 'admin', 'waitlist', 'index.vue'))
        // 同名文件形态（非 index.vue）
        expect(path.relative(process.cwd(), await resolvePageFile('/admin/ad/campaigns')))
            .toBe(path.join('pages', 'admin', 'ad', 'campaigns.vue'))
    })

    it('前缀去除尾斜杠后仍能解析', async () => {
        expect(await resolvePageFile('/admin/waitlist/')).toBe(await resolvePageFile('/admin/waitlist'))
    })

    it('两种形态都不存在时报错并列出已尝试路径（避免静默跳过守卫）', async () => {
        await expect(resolvePageFile('/admin/__not-exist__')).rejects.toThrow(/未找到 \/admin\/__not-exist__ 对应的页面文件/u)
    })
})

describe('守卫扫描口径：假阳性 / 假阴性双向验证', () => {
    it('剥离 HTML / 块 / 整行注释中引用的旧标签名（不含 URL 误伤）', () => {
        const source = [
            '<!-- 迁移前 PrimeVue <Tag :severity="x" /> 的写法 -->',
            '/* <Button icon="pi pi-plus" /> */',
            '// <DataTable :value="rows" />',
            '<a href="https://example.com/select">https://example.com</a>',
            '<CaomeiTag tone="primary">ok</CaomeiTag>',
        ].join('\n')

        expect(findInScopePrimeVueResiduals(source)).toEqual([])
    })

    it('显式值导入的 lucide 图标同名不被误判（<Tag /> 来自 @lucide/vue）', () => {
        const source = [
            'import { Tag } from \'@lucide/vue\'',
            '<CaomeiInput v-model="value">',
            '    <template #prefix><Tag :size="16" /></template>',
            '</CaomeiInput>',
        ].join('\n')

        expect(findInScopePrimeVueResiduals(source)).toEqual([])
    })

    it('默认导入 / 混合默认 + 具名 / 命名空间导入的绑定同样计入排除集', () => {
        const defaultImport = [
            'import Tag from \'@lucide/vue\'',
            '<CaomeiTag tone="primary"><Tag :size="16" /></CaomeiTag>',
        ].join('\n')
        const mixedImport = [
            'import Checks, { Tag as TagIcon } from \'./icons\'',
            '<TagIcon />',
        ].join('\n')
        const namespaceImport = [
            'import * as lucide from \'@lucide/vue\'',
            '<lucide.Tag />',
        ].join('\n')

        expect(findInScopePrimeVueResiduals(defaultImport)).toEqual([])
        expect(findInScopePrimeVueResiduals(mixedImport)).toEqual([])
        expect(findInScopePrimeVueResiduals(namespaceImport)).toEqual([])
    })

    it('多行具名导入仍被正确解析', () => {
        const source = [
            'import {',
            '    Tag,',
            '    Search,',
            '} from \'@lucide/vue\'',
            '<CaomeiInput><template #prefix><Tag :size="16" /></template></CaomeiInput>',
        ].join('\n')

        expect(findInScopePrimeVueResiduals(source)).toEqual([])
    })

    it('无显式导入时，真·PrimeVue 在册族组件仍被检出（假阴性防线）', () => {
        const source = [
            '<DataTable :value="rows">',
            '    <Column field="name" :header="t(\'name\')" />',
            '    <Tag :severity="status" :value="status" />',
            '</DataTable>',
        ].join('\n')

        expect(findInScopePrimeVueResiduals(source)).toEqual(['DataTable', 'Column', 'Tag'])
    })

    it('显式导入 lucide Tag 不掩盖同一文件内其它 PrimeVue 在册族组件', () => {
        const source = [
            'import { Tag } from \'@lucide/vue\'',
            '<DataTable :value="rows">',
            '    <template #body="{data}"><Tag :size="16" /></template>',
            '</DataTable>',
        ].join('\n')

        expect(findInScopePrimeVueResiduals(source)).toEqual(['DataTable'])
    })

    it('primevue/* 显式导入不被排除（避免显式引入的 PrimeVue 组件被放过）', () => {
        const source = [
            'import { Button } from \'primevue/button\'',
            '<Button label="x" />',
            '<CaomeiTag tone="primary">ok</CaomeiTag>',
        ].join('\n')

        expect(findInScopePrimeVueResiduals(source)).toEqual(['Button'])
    })

    it('在册族含 `Dropdown`（PrimeVue `Select` 旧名），且无显式导入时被检出', () => {
        // 成员清单本身也要断言：否则该成员被静默移除后守卫会失效，而全部用例仍绿。
        expect(CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS).toContain('Dropdown')
        expect(findInScopePrimeVueResiduals('<Dropdown :options="options" option-label="label" />')).toEqual(['Dropdown'])
    })

    it('`<DropdownMenu` / `<DropdownTrigger` 不因前缀命中 `<Dropdown` 而被误判', () => {
        expect(findInScopePrimeVueResiduals('<DropdownMenu><CaomeiButton /></DropdownMenu>')).toEqual([])
        expect(findInScopePrimeVueResiduals('<DropdownTrigger><CaomeiButton /></DropdownTrigger>')).toEqual([])
    })

    it('import type 与内联 type 说明符不计入排除集（假阴性防线）', () => {
        const typeOnlyImport = [
            'import type { Button } from \'some-types\'',
            '<Button label="x" />',
        ].join('\n')
        const inlineTypeSpecifier = [
            'import { type Button, Tag } from \'some-module\'',
            '<Button label="x" />',
        ].join('\n')

        // `Button` 为类型导入 → 不遮蔽运行时绑定 → 必须仍被检出为残留。
        expect(findInScopePrimeVueResiduals(typeOnlyImport)).toEqual(['Button'])
        expect(findInScopePrimeVueResiduals(inlineTypeSpecifier)).toEqual(['Button'])
    })

    it('`<ButtonGroup` 不因前缀命中 `<Button` 而被误判', () => {
        expect(findInScopePrimeVueResiduals('<ButtonGroup><CaomeiButton /></ButtonGroup>')).toEqual([])
    })
})
