import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    PRIME_CLASS_PATTERN,
    PRIME_CLASS_SELECTOR_PATTERN,
    buildReport,
    collectFiles,
    isProductionFile,
    projectRoot,
    stripCommentsForClassScan,
} from '../../scripts/governance/count-primevue-usage.mjs'

/**
 * PrimeVue 卸载后的**全量零残留守卫**。
 *
 * 与 `tests/modules/overlay-family-residual-guard.test.ts` 的分工：后者是浮层族专用守卫
 * （组件标签 / `v-tooltip` / `toast.add` / `confirm.require`），保留不动；本守卫覆盖
 * 全仓口径的组件 / 图标 / token / class / 选择器 / 依赖 / 配置 / 包导入。
 *
 * 覆盖面：
 * 1. 组件开标签 / 图标 / `--p-*` token（复用 `governance:count:primevue-usage` 的扫描口径）；
 * 2. 生产源码里的 `p-*` class 与 `.p-*` 选择器（测试 fixture 不计入，见 `isProductionFile`；
 *    注释先剥离，回填「迁移前为 …」的说明不算残留）；
 * 3. `package.json` 依赖与 `nuxt.config.ts` 配置中的 PrimeVue / PrimeUIX / primeicons / primelocale；
 * 4. 生产源码中的包引用（`from` / 动态 `import()` / `require()` / 副作用 import / CSS `@import`）、
 *    `@layer primevue`、`usePrimeVue()`；
 * 5. 迁移期过渡组件文件名（`*-v2.vue` / `*V2.vue`），对应已删除的过渡组件守卫契约。
 *
 * 扫描边界（已知且刻意保留）：`collectFiles` 只收 `.css` / `.scss` / `.ts` / `.vue`，故 scripts 目录下的
 * `.mjs`、`public` 静态资源与非 `package.json` 的 JSON 不在扫描面；`package.json` 由独立用例检查。
 */
const PRIME_PACKAGE_NAME_PATTERN = /^(?:primevue|@primevue\/|@primeuix\/|primeicons$|primelocale$)/
const PRIME_PACKAGE_IMPORT_PATTERNS: RegExp[] = [
    /* `import X from 'primevue/x'` / `export … from` */
    /from\s+['"](?:primevue|@primevue|@primeuix|primeicons|primelocale)(?:\/[^'"]*)?['"]/u,
    /* 副作用 import / 动态 import / require */
    /(?:^|\n)\s*import\s+['"](?:primevue|@primevue|@primeuix|primeicons|primelocale)(?:\/[^'"]*)?['"]/u,
    /\bimport\s*\(\s*['"](?:primevue|@primevue|@primeuix|primeicons|primelocale)(?:\/[^'"]*)?['"]/u,
    /\brequire\s*\(\s*['"](?:primevue|@primevue|@primeuix|primeicons|primelocale)(?:\/[^'"]*)?['"]/u,
    /* CSS @import */
    /@import\s+(?:url\()?['"](?:primevue|@primevue|@primeuix|primeicons|primelocale)(?:\/[^'"]*)?['"]/u,
]
const PRIME_LAYER_PATTERN = /@layer\s+[^;{}]*\bprimevue\b/u
const USE_PRIMEVUE_PATTERN = /\busePrimeVue\s*\(/u
const V2_COMPONENT_PATTERN = /v2\.vue$/iu
const V2_SCAN_ROOTS = ['components', 'pages', 'layouts']

/** 过渡组件文件名守卫：迁移期 `*-v2.vue` / `*V2.vue` 已清零，不得回填。 */
async function collectV2ComponentFiles(root: string): Promise<string[]> {
    const hits: string[] = []

    async function walk(currentDir: string) {
        const entries = await readdir(currentDir, { withFileTypes: true })
        for (const entry of entries) {
            const absolutePath = path.join(currentDir, entry.name)
            if (entry.isDirectory()) {
                await walk(absolutePath)
                continue
            }
            if (V2_COMPONENT_PATTERN.test(entry.name)) {
                hits.push(path.relative(root, absolutePath).split(path.sep).join('/'))
            }
        }
    }

    for (const rootDir of V2_SCAN_ROOTS) {
        await walk(path.join(root, rootDir))
    }

    return hits.sort()
}

describe('PrimeVue 零残留守卫', () => {
    it('组件 / 图标 / token / class / 选择器为 0（含生产口径断言）', async () => {
        const report = await buildReport()

        expect(report.components.openTags).toBe(0)
        expect(report.components.kinds).toBe(0)
        expect(report.icons.total).toBe(0)
        expect(report.tokens.total).toBe(0)
        /* 生产口径：若脚本里的 `isProduction` 三元被移除，测试 fixture 的 `p-*` 会重新计入，
         * 这里必须失败，否则口径回退会静默通过。 */
        expect(report.primeVueClasses.total).toBe(0)
        expect(report.primeVueClasses.files).toBe(0)
        expect(report.primeVueClasses.selectorTotal).toBe(0)
    })

    it('生产源码无 p-* class 与 .p-* 选择器', async () => {
        const files = await collectFiles(projectRoot)
        const hits: { file: string, classes: string[], selectors: string[] }[] = []

        for (const file of files.filter(isProductionFile)) {
            const content: string = stripCommentsForClassScan(await readFile(path.join(projectRoot, file), 'utf8'))
            const classes = [...new Set(content.match(PRIME_CLASS_PATTERN) ?? [])]
            const selectors = [...new Set(content.match(PRIME_CLASS_SELECTOR_PATTERN) ?? [])]
            if (classes.length || selectors.length) {
                hits.push({ file, classes, selectors })
            }
        }

        expect(hits).toEqual([])
    })

    it('依赖与 Nuxt 配置无 PrimeVue 包', async () => {
        const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8')) as {
            dependencies?: Record<string, string>
            devDependencies?: Record<string, string>
            optionalDependencies?: Record<string, string>
        }
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.optionalDependencies,
        }

        expect(Object.keys(dependencies).filter((name) => PRIME_PACKAGE_NAME_PATTERN.test(name))).toEqual([])

        const nuxtConfig = stripCommentsForClassScan(await readFile(path.join(projectRoot, 'nuxt.config.ts'), 'utf8'))
        expect(nuxtConfig).not.toMatch(/primevue|@primeuix|primeicons|primelocale/iu)
    })

    it('生产源码无 PrimeVue 包引用 / @layer primevue / usePrimeVue', async () => {
        const files = await collectFiles(projectRoot)
        const hits: { file: string, kind: string }[] = []

        for (const file of files.filter(isProductionFile)) {
            const content: string = stripCommentsForClassScan(await readFile(path.join(projectRoot, file), 'utf8'))
            if (PRIME_PACKAGE_IMPORT_PATTERNS.some((pattern) => pattern.test(content))) {
                hits.push({ file, kind: 'package-import' })
            }
            if (PRIME_LAYER_PATTERN.test(content)) {
                hits.push({ file, kind: 'layer' })
            }
            if (USE_PRIMEVUE_PATTERN.test(content)) {
                hits.push({ file, kind: 'usePrimeVue' })
            }
        }

        expect(hits).toEqual([])
    })

    it('无迁移期过渡组件文件（*-v2.vue / *V2.vue）', async () => {
        expect(await collectV2ComponentFiles(projectRoot)).toEqual([])
    })

    /* 判别力自检：守卫的负向断言若扫描口径本身失效（正则写错 / 剥离过度）会静默通过。
     * 这里钉住「能识别真实残留」与「不误报同形包名 / 注释」。 */
    it('扫描口径能识别真实残留且不误报同形包名与注释', () => {
        expect('class="p-dialog"'.match(PRIME_CLASS_PATTERN)).toEqual(['p-dialog'])
        expect('.p-inputtext { }'.match(PRIME_CLASS_SELECTOR_PATTERN)).toEqual(['.p-inputtext'])
        expect('import PQueue from \'p-queue\''.match(PRIME_CLASS_PATTERN)).toBeNull()
        expect(stripCommentsForClassScan('// 迁移前为 p-dialog\n.a { color: red }')).not.toContain('p-dialog')

        const matchesImport = (source: string) => PRIME_PACKAGE_IMPORT_PATTERNS.some((pattern) => pattern.test(source))
        expect(matchesImport('import Dialog from \'primevue/dialog\'')).toBe(true)
        expect(matchesImport('import \'primeicons/primeicons.css\'')).toBe(true)
        expect(matchesImport('const dialog = await import(\'primevue/dialog\')')).toBe(true)
        expect(matchesImport('const dialog = require(\'primevue/dialog\')')).toBe(true)
        expect(matchesImport('@import \'primeicons/primeicons.css\';')).toBe(true)
        expect(matchesImport('import { useToast } from \'caomei-ui\'')).toBe(false)

        expect(PRIME_LAYER_PATTERN.test('@layer primevue, momei-base;')).toBe(true)
        expect(PRIME_LAYER_PATTERN.test('@layer momei-base, momei-overrides;')).toBe(false)
        expect(USE_PRIMEVUE_PATTERN.test('const pv = usePrimeVue()')).toBe(true)
        expect(PRIME_PACKAGE_NAME_PATTERN.test('primevue')).toBe(true)
        expect(PRIME_PACKAGE_NAME_PATTERN.test('@primer/octicons')).toBe(false)
    })
})
