import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS, CAOMEI_UI_ROUTE_PREFIXES } from '../../lib/ui-library'
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
 * 覆盖边界：本守卫只扫描登记前缀对应的**页面文件**——目录形态 `pages/<prefix>/index.vue` 与
 * 同名文件形态 `pages/<prefix>.vue`（两种在本仓并存，解析按该顺序回退）；路由自有子组件、
 * 跨路由共享壳与 `v-tooltip` 指令由三层视觉回归与各批「文件 → 改动点」清单覆盖（显式豁免）。
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

describe('已迁移路由：在册组件族零残留', () => {
    it('事实源至少登记一个路由前缀，且格式为绝对前缀', () => {
        expect(CAOMEI_UI_ROUTE_PREFIXES.length).toBeGreaterThan(0)
        for (const prefix of CAOMEI_UI_ROUTE_PREFIXES) {
            expect(prefix.startsWith('/')).toBe(true)
            expect(prefix).not.toBe('/')
        }
    })

    it('在册组件族清单非空（防止守卫被清空而静默失效）', () => {
        expect(CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS.length).toBeGreaterThan(0)
    })

    for (const prefix of CAOMEI_UI_ROUTE_PREFIXES) {
        it(`${prefix}：页面文件不得残留在册族 PrimeVue 组件，且至少使用一个 caomei-ui 组件`, async () => {
            const pageFile = await resolvePageFile(prefix)
            const source = await readFile(pageFile, 'utf8')
            const scanned = stripComments(source)

            const residual = findInScopePrimeVueResiduals(source)

            expect(residual, `${prefix} 仍残留在册族 PrimeVue 组件：${residual.join(', ')}`).toEqual([])
            expect(/<Caomei[A-Z]/u.test(scanned), `${prefix} 未检出任何 caomei-ui 组件`).toBe(true)
        })
    }
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
