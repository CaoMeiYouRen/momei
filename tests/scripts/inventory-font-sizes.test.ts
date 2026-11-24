import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
    buildFontSizeInventory,
    collectFontSizeInventory,
    collectFontSizeScale,
    extractFontSizeDeclarations,
    main as inventoryMain,
    parseArgs,
    renderMarkdownReport,
    stripComments,
    toPosixPath,
} from '../../scripts/governance/inventory-font-sizes.mjs'

const SCALE_FIXTURE = `
    :root {
        --m-font-size-sm: 0.875rem;
        --m-font-size-md: 1rem;
        --m-font-size-xl: 1.25rem;
    }
`

describe('inventory-font-sizes - collectFontSizeScale', () => {
    it('按声明顺序抽取字阶并去除重复 token', () => {
        const scale = collectFontSizeScale(`
            --m-font-size-sm: 0.875rem;
            --m-font-size-md: 1rem;
            --m-font-size-sm: 0.875rem;
        `)

        expect(scale).toEqual([
            { name: 'sm', token: '--m-font-size-sm', value: '0.875rem' },
            { name: 'md', token: '--m-font-size-md', value: '1rem' },
        ])
    })

    it('忽略非字阶声明', () => {
        expect(collectFontSizeScale('--m-font-mono: monospace; font-size: 1rem;')).toEqual([])
    })
})

describe('inventory-font-sizes - extractFontSizeDeclarations', () => {
    const scale = collectFontSizeScale(SCALE_FIXTURE)

    it('分类 token / 字阶 / scss 变量 / 非字阶', () => {
        const declarations = extractFontSizeDeclarations(`
            .a { font-size: var(--m-font-size-sm); }
            .b { font-size: 1rem; }
            .c { font-size: $font-size-lg; }
            .d { font-size: 0.9rem; }
        `, '/repo/styles/demo.scss', scale, '/repo')

        expect(declarations.map((item) => item.category)).toEqual(['token', 'scale', 'scss-variable', 'off-scale'])
        expect(declarations.map((item) => item.value)).toEqual(['var(--m-font-size-sm)', '1rem', '$font-size-lg', '0.9rem'])
    })

    it('记录行号并归一化多余空白', () => {
        const declarations = extractFontSizeDeclarations(`
            .a {
                font-size:   1.25rem  ;
            }
        `, '/repo/styles/demo.scss', scale, '/repo')

        expect(declarations).toHaveLength(1)
        expect(declarations[0]?.line).toBe(3)
        expect(declarations[0]?.value).toBe('1.25rem')
        expect(declarations[0]?.token).toBe('--m-font-size-xl')
    })

    it('输出 posix 相对路径', () => {
        const declarations = extractFontSizeDeclarations('.a { font-size: 1rem; }', '/repo/styles/demo.scss', scale, '/repo')

        expect(declarations[0]?.filePath).toBe('styles/demo.scss')
    })
})

describe('inventory-font-sizes - buildFontSizeInventory', () => {
    it('汇总分类、取值与目录分桶并计算覆盖率', () => {
        const scale = collectFontSizeScale(SCALE_FIXTURE)
        const declarations = [
            ...extractFontSizeDeclarations(`.a { font-size: var(--m-font-size-sm); }`, '/repo/components/a.vue', scale, '/repo'),
            ...extractFontSizeDeclarations(`.b { font-size: 1rem; }`, '/repo/components/b.vue', scale, '/repo'),
            ...extractFontSizeDeclarations(`.c { font-size: 0.9rem; }`, '/repo/pages/c.vue', scale, '/repo'),
            ...extractFontSizeDeclarations(`.d { font-size: 0.9rem; }`, '/repo/pages/d.vue', scale, '/repo'),
        ]
        const inventory = buildFontSizeInventory(declarations, scale)

        expect(inventory.summary.declarationCount).toBe(4)
        expect(inventory.summary.fileCount).toBe(4)
        expect(inventory.summary.distinctValueCount).toBe(3)
        expect(inventory.summary.tokenDeclarationCount).toBe(1)
        expect(inventory.summary.tokenCoverage).toBe(25)
        expect(inventory.summary.scaleDeclarationCount).toBe(1)
        expect(inventory.summary.replaceableCount).toBe(2)
        expect(inventory.valueBuckets[0]).toEqual({ count: 2, value: '0.9rem' })
        expect(inventory.directoryBuckets.map((bucket) => bucket.directory)).toEqual(['components', 'pages'])
        expect(inventory.offScaleValues).toEqual([{ count: 2, value: '0.9rem' }])
    })

    it('空输入时覆盖率为 0 且不报错', () => {
        const inventory = buildFontSizeInventory([], [])

        expect(inventory.summary.declarationCount).toBe(0)
        expect(inventory.summary.tokenCoverage).toBe(0)
        expect(inventory.summary.replaceableCoverage).toBe(0)
        expect(inventory.files).toEqual([])
    })
})

describe('inventory-font-sizes - renderMarkdownReport', () => {
    it('输出摘要、字阶表与非字阶取值段', () => {
        const report = {
            generatedAt: '2026-11-13T00:00:00.000Z',
            scanRoots: ['styles'],
            scannedFileCount: 1,
            scalePath: 'styles/main.scss',
            ...buildFontSizeInventory(extractFontSizeDeclarations('.a { font-size: 0.9rem; }', '/repo/styles/a.scss', [], '/repo'), []),
        }
        const markdown = renderMarkdownReport(report, 'artifacts/governance/font-sizes-inventory-latest.md')

        expect(markdown).toContain('# Font Size Inventory')
        expect(markdown).toContain('- 产物路径: artifacts/governance/font-sizes-inventory-latest.md')
        expect(markdown).toContain('| `0.9rem` | 1 |')
        expect(markdown).toContain('## 非字阶取值（需另案归一）')
    })
})

describe('inventory-font-sizes - stripComments', () => {
    it('屏蔽块注释与整行行注释，保留行号与字符长度', () => {
        const content = [
            '/* a { font-size: 2rem; } */',
            '.a {',
            '    // font-size: 1rem;',
            '    font-size: 0.875rem;',
            '}',
        ].join('\n')
        const stripped = stripComments(content)
        const declarations = extractFontSizeDeclarations(content, '/repo/styles/demo.scss', [], '/repo')

        expect(stripped.length).toBe(content.length)
        expect(stripped.split('\n').length).toBe(content.split('\n').length)
        expect(declarations).toHaveLength(1)
        expect(declarations[0]?.line).toBe(4)
    })

    it('Vue 属性的 image/* 取值不吞后续块注释', () => {
        const content = [
            '<template>',
            '    <input accept="image/*" type="file" />',
            '</template>',
            '',
            '<style scoped>',
            '.a { font-size: 1rem; }',
            '/* .b { font-size: 2rem; } */',
            '.c { font-size: 1.25rem; }',
            '</style>',
        ].join('\n')
        const scale = collectFontSizeScale(SCALE_FIXTURE)
        const declarations = extractFontSizeDeclarations(content, '/repo/components/a.vue', scale, '/repo')

        expect(declarations.map((item) => item.value)).toEqual(['1rem', '1.25rem'])
        expect(stripComments(content)).toContain('accept="image/*"')
        expect(stripComments(content)).not.toContain('2rem')
    })

    it('MIME 纯通配属性取值同样不吞后续块注释', () => {
        const content = [
            '<template>',
            '    <input accept="*/*" type="file" />',
            '</template>',
            '<style scoped>',
            '.a { font-size: 1rem; }',
            '/* .b { font-size: 2rem; } */',
            '.c { font-size: 1.25rem; }',
            '</style>',
        ].join('\n')
        const declarations = extractFontSizeDeclarations(content, '/repo/components/b.vue', collectFontSizeScale(SCALE_FIXTURE), '/repo')

        expect(declarations.map((item) => item.value)).toEqual(['1rem', '1.25rem'])
        expect(stripComments(content)).not.toContain('2rem')
    })

    it('未闭合的块注释起始符不屏蔽到文件末尾', () => {
        const content = [
            'const mime = flag ? \'image/*\' : \'x\'',
            '.a { font-size: 1rem; }',
        ].join('\n')
        const declarations = extractFontSizeDeclarations(content, '/repo/components/c.vue', collectFontSizeScale(SCALE_FIXTURE), '/repo')

        expect(declarations.map((item) => item.value)).toEqual(['1rem'])
    })

    it('跨行不维持字符串状态，后续注释照常屏蔽', () => {
        const content = [
            '<p>',
            '    \'引号开头的散文行',
            '</p>',
            '.a { font-size: 1rem; }',
            '/* .b { font-size: 2rem; } */',
        ].join('\n')
        const declarations = extractFontSizeDeclarations(content, '/repo/components/d.vue', collectFontSizeScale(SCALE_FIXTURE), '/repo')

        expect(declarations.map((item) => item.value)).toEqual(['1rem'])
    })

    it('字符串外的块注释即使紧贴标识符也照常屏蔽', () => {
        const content = '.a { color: red/* font-size: 9rem; */; font-size: 1rem; }'
        const declarations = extractFontSizeDeclarations(content, '/repo/styles/demo.scss', collectFontSizeScale(SCALE_FIXTURE), '/repo')

        expect(declarations.map((item) => item.value)).toEqual(['1rem'])
    })

    it('不误伤 url 中的 //', () => {
        const declarations = extractFontSizeDeclarations(
            '.a { background: url(https://example.com/a.png); font-size: 1rem; }',
            '/repo/styles/demo.scss',
            [],
            '/repo',
        )

        expect(declarations).toHaveLength(1)
    })
})

describe('inventory-font-sizes - parseArgs / toPosixPath', () => {
    it('缺省使用产物与字阶事实源的默认路径', () => {
        expect(parseArgs(['node', 'script'])).toEqual({
            output: 'artifacts/governance/font-sizes-inventory-latest.json',
            scale: 'styles/main.scss',
        })
    })

    it('支持 --output 与 --scale 覆盖', () => {
        expect(parseArgs(['node', 'script', '--output=/tmp/inventory.json', '--scale=/tmp/main.scss'])).toEqual({
            output: '/tmp/inventory.json',
            scale: '/tmp/main.scss',
        })
    })

    it('同一路径归一为 . 并保留正斜杠相对路径', () => {
        expect(toPosixPath('/repo', '/repo')).toBe('.')
        expect(toPosixPath('/repo/styles/a.scss', '/repo')).toBe('styles/a.scss')
    })
})

describe('inventory-font-sizes - collectFontSizeInventory', () => {
    it('递归扫描目录、跳过非样式扩展名与不存在的根', async () => {
        const projectRoot = await mkdtemp(join(tmpdir(), 'momei-font-inventory-'))

        try {
            await mkdir(join(projectRoot, 'styles'), { recursive: true })
            await mkdir(join(projectRoot, 'components', 'nested'), { recursive: true })
            await mkdir(join(projectRoot, 'pages'), { recursive: true })
            await writeFile(join(projectRoot, 'styles', 'main.scss'), ':root { --m-font-size-sm: 0.875rem; --m-font-size-md: 1rem; }', 'utf8')
            await writeFile(join(projectRoot, 'components', 'a.vue'), '<style>.a { font-size: 0.875rem; }</style>', 'utf8')
            await writeFile(join(projectRoot, 'components', 'nested', 'c.vue'), '<style>.c { font-size: 1rem; }</style>', 'utf8')
            await writeFile(join(projectRoot, 'pages', 'b.scss'), '.b { font-size: 0.9rem; }', 'utf8')
            await writeFile(join(projectRoot, 'pages', 'skip.txt'), '.x { font-size: 2rem; }', 'utf8')

            const report = await collectFontSizeInventory({
                projectRoot,
                scanRoots: ['components', 'pages', 'missing-dir'],
                scale: 'styles/main.scss',
            })

            expect(report.scalePath).toBe('styles/main.scss')
            expect(report.scannedFileCount).toBe(3)
            expect(report.summary.declarationCount).toBe(3)
            expect(report.summary.scaleDeclarationCount).toBe(2)
            expect(report.offScaleValues).toEqual([{ count: 1, value: '0.9rem' }])
        } finally {
            await rm(projectRoot, { force: true, recursive: true })
        }
    })

    it('根为单文件时按扩展名判定，非样式文件返回空清单', async () => {
        const projectRoot = await mkdtemp(join(tmpdir(), 'momei-font-inventory-'))

        try {
            await mkdir(join(projectRoot, 'styles'), { recursive: true })
            await mkdir(join(projectRoot, 'pages'), { recursive: true })
            await writeFile(join(projectRoot, 'styles', 'main.scss'), '.a { font-size: 1rem; }', 'utf8')
            await writeFile(join(projectRoot, 'pages', 'b.scss'), '.b { font-size: 1rem; }', 'utf8')
            await writeFile(join(projectRoot, 'pages', 'skip.txt'), '.x { font-size: 2rem; }', 'utf8')

            const styleFile = await collectFontSizeInventory({
                projectRoot,
                scanRoots: ['pages/b.scss'],
                scale: 'styles/main.scss',
            })
            const nonStyleFile = await collectFontSizeInventory({
                projectRoot,
                scanRoots: ['pages/skip.txt'],
                scale: 'styles/main.scss',
            })

            expect(styleFile.scannedFileCount).toBe(1)
            expect(styleFile.summary.declarationCount).toBe(1)
            expect(nonStyleFile.scannedFileCount).toBe(0)
            expect(nonStyleFile.summary.declarationCount).toBe(0)
        } finally {
            await rm(projectRoot, { force: true, recursive: true })
        }
    })
})

describe('inventory-font-sizes - renderMarkdownReport 空值分支', () => {
    it('无产物路径与无非字阶取值时输出占位行', () => {
        const report = {
            generatedAt: '2026-11-22T00:00:00.000Z',
            scanRoots: [],
            scannedFileCount: 0,
            scalePath: 'styles/main.scss',
            ...buildFontSizeInventory([], []),
        }
        const markdown = renderMarkdownReport(report)

        expect(markdown).not.toContain('- 产物路径:')
        expect(markdown).toContain('| - | 0 |')
    })
})

describe('inventory-font-sizes - main', () => {
    it('写出 JSON 与 Markdown 产物并返回报告', async () => {
        const projectRoot = await mkdtemp(join(tmpdir(), 'momei-font-inventory-'))
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        try {
            const outputPath = join(projectRoot, 'nested', 'inventory.json')
            const report = await inventoryMain(['node', 'script', `--output=${outputPath}`, '--scale=styles/main.scss'])

            const json = JSON.parse(await readFile(outputPath, 'utf8'))
            const markdown = await readFile(join(projectRoot, 'nested', 'inventory.md'), 'utf8')

            expect(report.summary.declarationCount).toBeGreaterThan(0)
            expect(json.summary.declarationCount).toBe(report.summary.declarationCount)
            expect(markdown).toContain('# Font Size Inventory')
            expect(infoSpy).toHaveBeenCalledWith('Font size inventory completed.')
        } finally {
            infoSpy.mockRestore()
            await rm(projectRoot, { force: true, recursive: true })
        }
    })
})
