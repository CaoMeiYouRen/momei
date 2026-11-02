import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildComponentTagPattern, stripComments, stripNonTemplateBlocks } from './ui-library-guard-helpers'

/**
 * 浮层族整族迁出 PrimeVue 后的**全仓零残留**守卫。
 *
 * 与 `ui-library-route-migration-guard.test.ts` 的分工：后者只保证**已登记路由**内不出现
 * 在册族 PrimeVue 组件，允许尚未迁移的页面继续使用；本守卫在浮层族收尾后
 * 收紧为**全仓口径**——浮层族（Dialog / Drawer / Popover / DropdownMenu / Menu /
 * ConfirmDialog / `useToast` / `useConfirm` / `v-tooltip`）已整族迁移，任何生产文件再引入
 * PrimeVue 版本都应在这里失败，而不是等下一次视觉回归才发现。
 *
 * 不扫描 `*.test.ts`：测试里为验证 V1 兼容或迁移差异会显式引用旧形态。
 * `ConfirmDeleteDialog` 是 momei 自有共享壳（内部已用 `CaomeiDialog`），刻意保留，不计入残留。
 */

const SCAN_ROOTS = ['components', 'pages', 'layouts', 'composables', 'plugins', 'utils', 'middleware', 'modules']

/** 根级入口文件：`app.vue` 是 provider 挂载点，PrimeVue 全局壳最容易在这里被回填。 */
const SCAN_ROOT_FILES = ['app.vue', 'error.vue']

/**
 * 本族只覆盖 `v-tooltip` 时代的 6 个组件名。
 * `MenuBar` / `TieredMenu` / `ContextMenu` / `MegaMenu` / `PanelMenu` 与 `from 'primevue'`
 * 根桶导入不在本阶段范围内，若后续出现需先确认是否属浮层族再扩面。
 */
const PRIMEVUE_OVERLAY_COMPONENTS = ['Dialog', 'Drawer', 'Popover', 'DropdownMenu', 'Menu', 'ConfirmDialog']

/** `v-tooltip` 指令：只匹配调用形态，注释里以反引号或空格提及不算。 */
const TOOLTIP_DIRECTIVE_PATTERN = /v-tooltip(?=[.:=\s>])/u

const SERVICE_RESIDUE_PATTERNS: readonly [string, RegExp][] = [
    ['primevue/useconfirm 导入', /from\s+['"]primevue\/useconfirm['"]/u],
    ['primevue/usetoast 导入', /from\s+['"]primevue\/usetoast['"]/u],
    ['toast.add(', /\btoast\.add\s*\(/u],
    ['confirm.require(', /\bconfirm\.require\s*\(/u],
]

async function listSourceFiles(directory: string): Promise<string[]> {
    const absolute = path.join(process.cwd(), directory)
    const entries = await readdir(absolute, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
        const relativePath = path.posix.join(directory, entry.name)

        if (entry.isDirectory()) {
            files.push(...await listSourceFiles(relativePath))
            continue
        }

        if (!/\.(?:vue|ts)$/u.test(entry.name) || /\.(?:test|spec)\.ts$/u.test(entry.name)) {
            continue
        }

        files.push(relativePath)
    }

    return files
}

const productionFiles = [
    ...(await Promise.all(SCAN_ROOTS.map(listSourceFiles))).flat(),
    ...SCAN_ROOT_FILES,
]

function templateOf(source: string): string {
    return stripComments(stripNonTemplateBlocks(source))
}

describe('浮层族：全仓零残留', () => {
    it('扫描面非空且包含根级入口（防止路径写错后守卫静默通过）', () => {
        expect(productionFiles.length).toBeGreaterThan(100)
        expect(productionFiles).toContain('app.vue')
    })

    it('不再使用 v-tooltip 指令（由 AppTooltip 桥接 CaomeiTooltip）', async () => {
        const offenders: string[] = []

        for (const file of productionFiles.filter((item) => item.endsWith('.vue'))) {
            const template = templateOf(await readFile(file, 'utf8'))

            if (TOOLTIP_DIRECTIVE_PATTERN.test(template)) {
                offenders.push(file)
            }
        }

        expect(offenders, `以下文件仍在使用 v-tooltip：${offenders.join(', ')}`).toEqual([])
    })

    it('不再出现浮层族的 PrimeVue 组件标签', async () => {
        const offenders: string[] = []

        for (const file of productionFiles.filter((item) => item.endsWith('.vue'))) {
            const template = templateOf(await readFile(file, 'utf8'))
            const names = PRIMEVUE_OVERLAY_COMPONENTS.filter((name) => buildComponentTagPattern(name).test(template))

            if (names.length > 0) {
                offenders.push(`${file}（${names.join(', ')}）`)
            }
        }

        expect(offenders, `以下文件仍残留在册族 PrimeVue 浮层组件：${offenders.join('; ')}`).toEqual([])
    })

    it('Toast / Confirm 只走 caomei-ui 服务层', async () => {
        const offenders: string[] = []

        for (const file of productionFiles) {
            const source = stripComments(await readFile(file, 'utf8'))

            for (const [label, pattern] of SERVICE_RESIDUE_PATTERNS) {
                if (pattern.test(source)) {
                    offenders.push(`${file}（${label}）`)
                }
            }
        }

        expect(offenders, `以下文件仍有 PrimeVue 服务层残留：${offenders.join('; ')}`).toEqual([])
    })
})
