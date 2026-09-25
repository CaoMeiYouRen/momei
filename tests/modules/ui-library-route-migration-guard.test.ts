import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CAOMEI_UI_ROUTE_PREFIXES } from '../../lib/ui-library'

/**
 * 已迁移路由的「在册组件族零残留」守卫。
 *
 * 背景（迁移方案 §5.5 与第六十七阶段第 4 项裁定）：`app.vue` 全局渲染 PrimeVue `Toast` / `ConfirmDialog`，
 * 且浮层类（Dialog / Drawer / Popover / DropdownMenu）显式延后到第六十九阶段，因此「路由内组件来源唯一」
 * 只能按**批次在册组件族**判定——已登记路由的页面文件中不得再出现这些组件族的 PrimeVue 组件，
 * 且必须至少出现一个 caomei-ui 组件（证明切换确实发生）。
 *
 * 覆盖边界：本守卫只扫描登记前缀对应的页面文件（`pages/<prefix>/index.vue`）；路由自有子组件、
 * 跨路由共享壳与 `v-tooltip` 指令由三层视觉回归与各批「文件 → 改动点」清单覆盖（显式豁免）。
 */

/** 在册（本批）组件族：迁移后不得在已登记路由的页面文件中以 PrimeVue 组件形式残留。 */
const IN_SCOPE_PRIMEVUE_COMPONENTS = [
    'Button',
    'IconField',
    'InputIcon',
    'InputText',
    'Select',
    'DataTable',
    'Column',
    'Tag',
    'Badge',
    'Avatar',
    'Skeleton',
    'ToggleSwitch',
    'Paginator',
] as const

/** 组件标签匹配：`<Name` 后必须是空白 / `/` / `>`，避免 `<Button` 命中 `<ButtonGroup`。 */
function buildComponentTagPattern(name: string): RegExp {
    return new RegExp(`<${name}[\\s/>]`, 'u')
}

function resolvePageFile(prefix: string): string {
    const normalizedPrefix = prefix === '/' ? '' : prefix.replace(/\/+$/u, '')

    return path.join(process.cwd(), 'pages', normalizedPrefix, 'index.vue')
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
        expect(IN_SCOPE_PRIMEVUE_COMPONENTS.length).toBeGreaterThan(0)
    })

    for (const prefix of CAOMEI_UI_ROUTE_PREFIXES) {
        it(`${prefix}：页面文件不得残留在册族 PrimeVue 组件，且至少使用一个 caomei-ui 组件`, async () => {
            const pageFile = resolvePageFile(prefix)
            const source = await readFile(pageFile, 'utf8')

            const residual = IN_SCOPE_PRIMEVUE_COMPONENTS.filter((name) => buildComponentTagPattern(name).test(source))

            expect(residual, `${prefix} 仍残留在册族 PrimeVue 组件：${residual.join(', ')}`).toEqual([])
            expect(/<Caomei[A-Z]/u.test(source), `${prefix} 未检出任何 caomei-ui 组件`).toBe(true)
        })
    }
})
