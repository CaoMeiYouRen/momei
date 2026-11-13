import { describe, expect, it } from 'vitest'
import {
    buildFontSizeInventory,
    collectFontSizeScale,
    extractFontSizeDeclarations,
    renderMarkdownReport,
    stripComments,
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
