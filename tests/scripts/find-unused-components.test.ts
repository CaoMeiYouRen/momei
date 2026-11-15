import { describe, expect, it } from 'vitest'
import {
    buildComponentIndex,
    buildUnusedComponentReport,
    collectReferenceTokens,
    componentNameCandidates,
    findComponentReferences,
    matchesAllowlistEntry,
    normalizeAllowlist,
    parseArgs,
    renderMarkdownReport,
} from '../../scripts/governance/find-unused-components.mjs'

type ComponentReferences = Map<string, { filePath: string, kind: 'name' | 'path' }[]>

const PANEL = 'components/admin/posts/post-editor-review-panel.vue'
const SHORT_PANEL = 'components/app-avatar.vue'

function buildSourcesFromFixtures(fixtures: Record<string, string>) {
    return Object.entries(fixtures).map(([filePath, content]) => ({
        content,
        filePath,
        tokens: collectReferenceTokens(content),
    }))
}

function referencesFor(componentPaths, fixtures) {
    const components = componentPaths.map((filePath) => ({ filePath }))
    const references = findComponentReferences({
        components,
        projectRoot: '/repo',
        sources: buildSourcesFromFixtures(fixtures),
    })

    return references
}

describe('find-unused-components - componentNameCandidates', () => {
    it('按目录前缀生成 PascalCase 与 kebab-case 名称', () => {
        expect(componentNameCandidates(PANEL)).toEqual({
            kebabName: 'admin-posts-post-editor-review-panel',
            pascalName: 'AdminPostsPostEditorReviewPanel',
            shortKebabName: 'post-editor-review-panel',
            shortPascalName: 'PostEditorReviewPanel',
        })
    })

    it('剥离 .client / .server / .global 等点号后缀', () => {
        expect(componentNameCandidates('components/admin/mavon-editor-client.client.vue')).toEqual({
            kebabName: 'admin-mavon-editor-client',
            pascalName: 'AdminMavonEditorClient',
            shortKebabName: 'mavon-editor-client',
            shortPascalName: 'MavonEditorClient',
        })
    })

    it('根目录组件不产生空名', () => {
        expect(componentNameCandidates('components/.vue')).toBeNull()
    })

    it('兼容反斜杠路径', () => {
        expect(componentNameCandidates('components\\app\\avatar.vue')?.pascalName).toBe('AppAvatar')
    })
})

describe('find-unused-components - collectReferenceTokens', () => {
    it('PascalCase 一律小写化，kebab-case 原样保留', () => {
        const tokens = collectReferenceTokens('<AdminPostsFooBar /><admin-posts-foo-bar />')

        expect(tokens.pascalTokens.has('adminpostsfoobar')).toBe(true)
        expect(tokens.kebabTokens.has('admin-posts-foo-bar')).toBe(true)
    })

    it('camelCase 写法与小写词同样进入 Pascal 索引', () => {
        const tokens = collectReferenceTokens('const x = adminPostsFooBar')

        expect(tokens.pascalTokens.has('adminpostsfoobar')).toBe(true)
    })
})

describe('find-unused-components - findComponentReferences', () => {
    it('动态 resolveComponent 字符串引用不误报零引用', () => {
        const references = referencesFor([PANEL], {
            'pages/admin/posts/edit.vue': '<component :is="resolveComponent(\'AdminPostsPostEditorReviewPanel\')" />',
        })

        expect(references.get(PANEL)).toHaveLength(1)
        expect(references.get(PANEL)?.[0]).toEqual({ filePath: 'pages/admin/posts/edit.vue', kind: 'name' })
    })

    it('模板 kebab-case 标签计入引用', () => {
        const references = referencesFor([PANEL], {
            'components/shell.vue': '<post-editor-review-panel />',
        })

        expect(references.get(PANEL)?.[0]?.kind).toBe('name')
    })

    it('显式导入后使用短名不被判定为零引用', () => {
        const references = referencesFor([PANEL], {
            'components/shell.vue': [
                'import Panel from \'~/components/admin/posts/post-editor-review-panel.vue\'',
                'const view = { components: { ReviewPanel: Panel } }',
                '<ReviewPanel />',
            ].join('\n'),
        })

        expect(references.get(PANEL)?.length).toBeGreaterThan(0)
    })

    it('Lazy 前缀写法计入引用', () => {
        const references = referencesFor([PANEL], {
            'components/shell.vue': '<LazyPostEditorReviewPanel />',
        })

        expect(references.get(PANEL)?.length).toBeGreaterThan(0)
    })

    it('大小学写差异不导致误报', () => {
        const references = referencesFor([PANEL], {
            'components/shell.vue': '<postEditorReviewPanel />',
        })

        expect(references.get(PANEL)?.length).toBeGreaterThan(0)
    })

    it('组件文件路径引用（defineAsyncComponent / import）计入引用', () => {
        const references = referencesFor([PANEL], {
            'components/shell.vue': 'const Panel = defineAsyncComponent(() => import(\'@/components/admin/posts/post-editor-review-panel.vue\'))',
        })

        expect(references.get(PANEL)?.[0]?.kind).toBe('path')
    })

    it('只有自身文件命中时仍视为零引用', () => {
        const references = referencesFor([PANEL], {
            [PANEL]: '<div class="post-editor-review-panel" />',
        })

        expect(references.get(PANEL)).toEqual([])
    })

    it('名字碰巧相同的非组件词不会掩盖零引用', () => {
        const references = referencesFor([SHORT_PANEL], {
            'components/shell.vue': '<div class="avatar-card" />',
        })

        expect(references.get(SHORT_PANEL)).toEqual([])
    })

    it('索引为同一组件登记全名、短名与 Lazy 变体', () => {
        const index = buildComponentIndex([{ filePath: PANEL }])

        expect(index.pascalIndex.has('adminpostsposteditorreviewpanel')).toBe(true)
        expect(index.pascalIndex.has('posteditorreviewpanel')).toBe(true)
        expect(index.pascalIndex.has('lazyposteditorreviewpanel')).toBe(true)
        expect(index.pascalIndex.has('lazyadminpostsposteditorreviewpanel')).toBe(true)
        expect(index.kebabIndex.has('post-editor-review-panel')).toBe(true)
        expect(index.kebabIndex.has('admin-posts-post-editor-review-panel')).toBe(true)
    })
})

describe('find-unused-components - allowlist', () => {
    it('支持精确路径与通配模式', () => {
        expect(matchesAllowlistEntry(PANEL, { component: PANEL })).toBe(true)
        expect(matchesAllowlistEntry(PANEL, { pattern: 'components/admin/posts/*.vue' })).toBe(true)
        expect(matchesAllowlistEntry(PANEL, { pattern: 'components/**/*panel.vue' })).toBe(true)
        expect(matchesAllowlistEntry(PANEL, { pattern: 'components/pages/*.vue' })).toBe(false)
    })

    it('字符串条目与缺省理由被归一化', () => {
        expect(normalizeAllowlist(['components/a.vue', null, { reason: '无路径' }])).toEqual([
            { component: 'components/a.vue', reason: null },
        ])
        expect(normalizeAllowlist({ entries: [{ component: 'x', reason: 'r' }] })).toEqual([
            { component: 'x', pattern: null, reason: 'r' },
        ])
        expect(normalizeAllowlist(null)).toEqual([])
    })
})

describe('find-unused-components - buildUnusedComponentReport', () => {
    const components = [{ filePath: PANEL }, { filePath: SHORT_PANEL }]

    it('区分未登记与已登记零引用', () => {
        const references: ComponentReferences = new Map([
            [PANEL, []],
            [SHORT_PANEL, []],
        ])
        const report = buildUnusedComponentReport({
            allowlist: [{ component: SHORT_PANEL, reason: '另案删除' }],
            components,
            projectRoot: '/repo',
            references,
            scanRoots: ['components'],
        })

        expect(report.unregisteredCount).toBe(1)
        expect(report.allowlistedCount).toBe(1)
        expect(report.unusedCount).toBe(2)
        expect(report.unregistered[0]?.component).toBe(PANEL)
        expect(report.allowlisted[0]?.reason).toBe('另案删除')
        expect(report.referenceCoverage).toBe(0)
    })

    it('全部被引用时零未登记', () => {
        const references: ComponentReferences = new Map([
            [PANEL, [{ filePath: 'pages/a.vue', kind: 'name' }]],
            [SHORT_PANEL, [{ filePath: 'tests/a.test.ts', kind: 'name' }]],
        ])
        const report = buildUnusedComponentReport({ components, projectRoot: '/repo', references, scanRoots: [] })

        expect(report.unregisteredCount).toBe(0)
        expect(report.referenceCoverage).toBe(100)
    })

    it('Markdown 报告标注未登记与已登记', () => {
        const report = buildUnusedComponentReport({
            allowlist: [{ component: SHORT_PANEL, reason: '另案删除' }],
            components,
            projectRoot: '/repo',
            references: new Map<string, { filePath: string, kind: 'name' | 'path' }[]>([
                [PANEL, []],
                [SHORT_PANEL, []],
            ]),
            scanRoots: [],
        })
        const markdown = renderMarkdownReport(report, 'artifacts/x.md')

        expect(markdown).toContain('零引用未登记: 1')
        expect(markdown).toContain(PANEL)
        expect(markdown).toContain('另案删除')
    })

    it('无未登记项时 Markdown 明确写「无。」', () => {
        const report = buildUnusedComponentReport({ components: [], projectRoot: '/repo', references: new Map(), scanRoots: [] })
        const markdown = renderMarkdownReport(report, null)

        expect(markdown).toContain('## 未登记零引用组件')
        expect(markdown).toContain('无。')
    })
})

describe('find-unused-components - parseArgs', () => {
    it('默认报告模式', () => {
        expect(parseArgs([])).toMatchObject({ mode: 'report' })
    })

    it('拒绝未知模式', () => {
        expect(() => parseArgs(['--mode=block'])).toThrow(/不支持的模式/u)
    })
})
