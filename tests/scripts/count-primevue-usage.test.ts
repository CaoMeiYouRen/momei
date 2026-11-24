import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
    buildReport,
    countComponentTags,
    isProductionFile,
    main,
    OVERLAY_FAMILY,
    resolveComposableOrigin,
    stripHtmlComments,
} from '@/scripts/governance/count-primevue-usage.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

describe('count-primevue-usage / 浮层族分桶', () => {
    it('识别浮层族组件标签（含 momei 自有共享壳 ConfirmDeleteDialog）', () => {
        const counts = countComponentTags(
            [
                '<Dialog v-model:visible="visible" />',
                '<Dialog title="second" />',
                '<ConfirmDeleteDialog ref="deleteDialog" />',
                '<Menu :model="items" />',
                '<MenuBar />',
            ].join('\n'),
            OVERLAY_FAMILY.components,
        )

        expect(counts.get('Dialog')).toBe(2)
        expect(counts.get('ConfirmDeleteDialog')).toBe(1)
        expect(counts.get('Menu')).toBe(1)
    })

    it('生产文件口径排除单测 / E2E 与 tests 目录', () => {
        expect(isProductionFile('components/app-header.vue')).toBe(true)
        expect(isProductionFile('composables/use-request-feedback.ts')).toBe(true)
        expect(isProductionFile('components/app-header.test.ts')).toBe(false)
        expect(isProductionFile('components/app-header.spec.ts')).toBe(false)
        expect(isProductionFile('tests/e2e/app.spec.ts')).toBe(false)
    })

    it('区分 caomei-ui / primevue / 自动导入三种 composable 来源', () => {
        expect(resolveComposableOrigin('import { useToast } from \'caomei-ui\'\nuseToast()', 'useToast')).toBe('caomei-ui')
        expect(resolveComposableOrigin('import { useToast } from \'primevue/usetoast\'\nuseToast()', 'useToast')).toBe('primevue')
        expect(resolveComposableOrigin('const toast = useToast()', 'useToast')).toBe('auto')
    })

    it('HTML 注释清洗循环收敛且不残留注释分隔符', () => {
        expect(stripHtmlComments('<!-- a v-tooltip --> v-tooltip')).toBe(' v-tooltip')

        const nested = stripHtmlComments('<!-<!--x-->-\nv-tooltip')
        expect(nested).not.toContain('<!--')
        expect(nested).not.toContain('-->')
        expect(nested).toContain('v-tooltip')

        expect(stripHtmlComments('<!--unclosed v-tooltip')).toBe('unclosed v-tooltip')
        expect(stripHtmlComments('a--!>b')).toBe('ab')
    })

    it('注释中的 v-tooltip 提及不计入指令用量', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'primevue-usage-comment-'))

        try {
            await writeProjectFile(
                directory,
                'scripts/governance/data/primevue-components.json',
                JSON.stringify({ source: 'test', version: '0', components: [] }),
            )
            await writeProjectFile(
                directory,
                'lib/mentions.ts',
                [
                    '/** 迁移备注：`v-tooltip` 后续改 CaomeiTooltip */',
                    'const label = \'v-tooltip\'',
                ].join('\n'),
            )
            await writeProjectFile(
                directory,
                'components/mentions.vue',
                [
                    '<template>',
                    '    <!-- 浮层族已迁移；v-tooltip 不再是调用点 -->',
                    '    <span>ok</span>',
                    '</template>',
                ].join('\n'),
            )

            const report = await buildReport({
                projectRoot: directory,
                componentListPath: resolve(directory, 'scripts/governance/data/primevue-components.json'),
            })

            expect(report.overlayFamily.directives.tooltip).toEqual({ total: 0, files: 0 })
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('汇总生产文件并集并把测试文件单独计数', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'primevue-usage-'))

        try {
            await writeProjectFile(
                directory,
                'scripts/governance/data/primevue-components.json',
                JSON.stringify({ source: 'test', version: '0', components: ['Dialog', 'Menu'] }),
            )
            await writeProjectFile(
                directory,
                'components/overlay-sample.vue',
                [
                    '<template>',
                    '    <Dialog v-model:visible="visible" />',
                    '    <Menu :model="items" />',
                    '</template>',
                    '<script setup lang="ts">',
                    'const visible = ref(false)',
                    'const { t } = useI18n()',
                    'const toast = useToast()',
                    '</script>',
                    '<template><span v-tooltip.bottom="t(\'x\')" /></template>',
                ].join('\n'),
            )
            await writeProjectFile(
                directory,
                'composables/notify.ts',
                [
                    'import { useConfirm } from \'caomei-ui\'',
                    'const confirm = useConfirm()',
                ].join('\n'),
            )
            await writeProjectFile(
                directory,
                'tests/e2e/overlay.spec.ts',
                [
                    'const dialog = page.locator(\'.p-dialog\')',
                    'useToast()',
                ].join('\n'),
            )

            const report = await buildReport({
                projectRoot: directory,
                componentListPath: resolve(directory, 'scripts/governance/data/primevue-components.json'),
            })

            expect(report.overlayFamily.tags.total).toBe(2)
            expect(report.overlayFamily.tags.files).toBe(1)
            expect(report.overlayFamily.tags.byComponent).toEqual([
                { name: 'Dialog', count: 1, files: 1 },
                { name: 'Menu', count: 1, files: 1 },
            ])
            expect(report.overlayFamily.directives.tooltip).toEqual({ total: 1, files: 1 })
            expect(report.overlayFamily.productionFiles).toBe(2)
            expect(report.overlayFamily.testFiles).toBe(1)
            expect(report.overlayFamily.fileParts).toEqual([
                { file: 'components/overlay-sample.vue', parts: ['Dialog', 'Menu', 'useToast', 'v-tooltip'] },
                { file: 'composables/notify.ts', parts: ['useConfirm'] },
            ])
            expect(report.overlayFamily.services.origins).toEqual([
                { origin: 'auto', total: 1, byName: [{ name: 'useToast', count: 1 }] },
                { origin: 'caomei-ui', total: 1, byName: [{ name: 'useConfirm', count: 1 }] },
            ])
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })
})

describe('count-primevue-usage / main', () => {
    it('写出 JSON 与 Markdown 产物并通过 logger 输出摘要', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'primevue-usage-main-'))
        const output = join(directory, 'nested', 'primevue-usage.json')
        const logger = { info: vi.fn() }

        try {
            await main({ argv: ['node', 'script', `--output=${output}`], logger })

            const report = JSON.parse(await readFile(output, 'utf8'))
            const markdown = await readFile(join(directory, 'nested', 'primevue-usage.md'), 'utf8')

            expect(report.generatedFrom.fileCount).toBeGreaterThan(0)
            expect(markdown).toContain('# PrimeVue 用量基线')
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('[primevue-usage] JSON:'))
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('[primevue-usage] 浮层族：'))
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })
})

describe('count-primevue-usage / 迁移面计数', () => {
    it('统计图标、token、PrimeVue class、选择器与 DataTable 耦合', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'primevue-usage-surface-'))
        // 守卫会扫描仓库内测试源码中的字面量，这里用拼接构造旧类名 / token，避免 live guard 误报。
        const p = 'p'
        const primeClass = (name: string) => `${p}-${name}`
        const token = (name: string) => `--${p}-${name}`
        const icon = (name: string) => `${p}i ${p}i-${name}`

        try {
            await writeProjectFile(
                directory,
                'scripts/governance/data/primevue-components.json',
                JSON.stringify({ source: 'test', version: '0', components: ['Column'] }),
            )
            await writeProjectFile(
                directory,
                'components/table-view.vue',
                [
                    '<template>',
                    '    <Column field="id" />',
                    `    <span class="${primeClass('dialog')}">x</span>`,
                    `    <i class="${icon('user')}" />`,
                    '    <div :class="{ slotProps }">{{ slotProps }}#body</div>',
                    '</template>',
                    '<style scoped>',
                    `.${primeClass('dialog')}:deep(.${primeClass('dialog-header')}) { color: var(${token('primary-color')}); }`,
                    `.wrapper:global(.${primeClass('overlay')}) { background: var(${token('surface-0')}); }`,
                    '</style>',
                ].join('\n'),
            )
            await writeProjectFile(
                directory,
                'styles/legacy.scss',
                [`.${primeClass('dialog')} .${primeClass('button')} { color: var(${token('primary-color')}); }`, `/* .${primeClass('ignored')} */`].join('\n'),
            )
            await writeProjectFile(
                directory,
                'composables/surface.ts',
                ['const toast = useToast()', 'const dialog = useDialog()', 'function toggle() { dropdown.toggle() }'].join('\n'),
            )
            await writeProjectFile(
                directory,
                'tests/e2e/migration.spec.ts',
                [`expect(await page.locator('.${primeClass('dialog')}')).toHaveCount(1)`, `expect('.${primeClass('button')}')`].join('\n'),
            )
            await writeProjectFile(
                directory,
                'tests/unit/primevue-mock.test.ts',
                ['vi.mock(\'primevue/dialog\', () => ({ default: {} }))'].join('\n'),
            )

            const report = await buildReport({
                projectRoot: directory,
                componentListPath: resolve(directory, 'scripts/governance/data/primevue-components.json'),
            })

            expect(report.components.openTags).toBe(1)
            expect(report.icons.total).toBe(1)
            expect(report.tokens.total).toBe(3)
            expect(report.tokens.varReferences).toBe(3)
            expect(report.primeVueClasses.files).toBe(2)
            expect(report.primeVueClasses.selectorStyleFiles).toBe(1)
            expect(report.primeVueClasses.selectorVueFiles).toBe(1)
            expect(report.styleCoupling.deepSelectors).toBe(1)
            expect(report.styleCoupling.globalSelectors).toBe(1)
            expect(report.dataTable.columnTags).toBe(1)
            expect(report.dataTable.bodySlots).toBe(1)
            expect(report.dataTable.slotProps).toBe(2)
            expect(report.commandApis.anchorToggleCalls).toBe(1)
            expect(report.commandApis.usage.map((entry) => entry.name)).toContain('useToast')
            expect(report.commandApis.usage.map((entry) => entry.name)).toContain('useDialog')
            expect(report.testCoupling.vitestPrimeVueMockFiles).toBe(1)
            expect(report.testCoupling.e2ePrimeClassAssertionFiles).toBe(1)
            expect(report.testCoupling.e2ePrimeClassAssertions).toBe(2)
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })
})
