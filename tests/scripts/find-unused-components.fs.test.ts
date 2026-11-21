import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    buildComponentIndex,
    collectComponentFiles,
    collectUnusedComponents,
    main,
    matchesAllowlistEntry,
    normalizeAllowlist,
    parseArgs,
    toPosixPath,
} from '../../scripts/governance/find-unused-components.mjs'

const tempRoots: string[] = []
const originalExitCode = process.exitCode

async function writeProjectFile(projectRoot: string, relativePath: string, content: string) {
    const absolutePath = join(projectRoot, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

async function createFixtureProject() {
    const projectRoot = await mkdtemp(join(tmpdir(), 'momei-unused-components-'))
    tempRoots.push(projectRoot)

    await writeProjectFile(projectRoot, 'components/app-avatar.vue', '<template><div /></template>\n')
    await writeProjectFile(projectRoot, 'components/admin/posts/unused-card.vue', '<template><div /></template>\n')
    await writeProjectFile(projectRoot, 'components/admin/posts/allowlisted-widget.vue', '<template><div /></template>\n')
    await writeProjectFile(projectRoot, 'components/admin/posts/path-referenced-card.vue', '<template><div /></template>\n')
    await writeProjectFile(projectRoot, 'components/node_modules/skipped.vue', '<template><div /></template>\n')
    await writeProjectFile(projectRoot, 'components/notes.md', 'not a component\n')
    await writeProjectFile(projectRoot, 'pages/index.vue', [
        '<template><AppAvatar /></template>',
        '<script setup lang="ts">',
        'const PathReferencedCard = defineAsyncComponent(() => import(\'~/components/admin/posts/path-referenced-card.vue\'))',
        '</script>',
    ].join('\n'))
    await writeProjectFile(projectRoot, 'config/unused-allowlist.json', JSON.stringify({
        entries: [
            { component: 'components/admin/posts/allowlisted-widget.vue', reason: '批次删除' },
        ],
    }))

    return projectRoot
}

beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(vi.fn())
})

afterEach(async () => {
    vi.restoreAllMocks()
    process.exitCode = originalExitCode

    while (tempRoots.length > 0) {
        await rm(tempRoots.pop()!, { force: true, recursive: true })
    }
})

describe('find-unused-components - 文件系统扫描', () => {
    it('递归收集组件与引用面文件并跳过生成物目录', async () => {
        const projectRoot = await createFixtureProject()
        const { componentFiles, sourceFiles } = await collectComponentFiles(projectRoot)

        expect(componentFiles.map((file) => file.filePath).sort()).toEqual([
            'components/admin/posts/allowlisted-widget.vue',
            'components/admin/posts/path-referenced-card.vue',
            'components/admin/posts/unused-card.vue',
            'components/app-avatar.vue',
        ])
        expect(sourceFiles).toContain('pages/index.vue')
        expect(sourceFiles).not.toContain('components/notes.md')
        expect(sourceFiles).not.toContain('components/node_modules/skipped.vue')
    })

    it('按 allowlist 文件区分未登记与已登记零引用', async () => {
        const projectRoot = await createFixtureProject()
        const report = await collectUnusedComponents({
            allowlistPath: 'config/unused-allowlist.json',
            projectRoot,
        })

        expect(report.scannedComponentCount).toBe(4)
        expect(report.unregisteredCount).toBe(1)
        expect(report.unregistered[0]?.component).toBe('components/admin/posts/unused-card.vue')
        expect(report.allowlistedCount).toBe(1)
        expect(report.allowlisted[0]).toMatchObject({
            component: 'components/admin/posts/allowlisted-widget.vue',
            reason: '批次删除',
        })
        expect(report.allowlistPath).toBe('config/unused-allowlist.json')
        expect(report.sourceFileCount).toBeGreaterThanOrEqual(5)
        expect(report.referenceCoverage).toBe(50)
    })

    it('allowlist 文件缺失时返回空条目且保留路径', async () => {
        const projectRoot = await createFixtureProject()
        const report = await collectUnusedComponents({
            allowlistPath: 'config/missing-allowlist.json',
            projectRoot,
        })

        expect(report.allowlistPath).toBe('config/missing-allowlist.json')
        expect(report.allowlistedCount).toBe(0)
        expect(report.unregisteredCount).toBe(2)
    })

    it('直接传入 allowlist 条目时不再读取文件', async () => {
        const projectRoot = await createFixtureProject()
        const report = await collectUnusedComponents({
            allowlist: [{ pattern: 'components/admin/posts/*.vue', reason: '批次删除' }],
            allowlistPath: 'config/does-not-exist.json',
            projectRoot,
        })

        expect(report.allowlistPath).toBeNull()
        expect(report.allowlistedCount).toBe(2)
        expect(report.unregisteredCount).toBe(0)
    })
})

describe('find-unused-components - CLI 入口', () => {
    it('写出 JSON 与 Markdown 产物并在 error 模式标记失败', async () => {
        const projectRoot = await mkdtemp(join(tmpdir(), 'momei-unused-components-cli-'))
        tempRoots.push(projectRoot)
        const componentRoot = join(projectRoot, 'isolated-components')
        // main 的 projectRoot 固定为仓库根，组件名用运行期 UUID，
        // 保证它不会命中真实引用面，从而稳定落在未登记桶里。
        await writeProjectFile(componentRoot, `${randomUUID()}.vue`, '<template><div /></template>\n')
        const outputPath = join(projectRoot, 'artifacts/report.json')
        const report = await main([
            'node',
            'script',
            '--mode=error',
            `--output=${outputPath}`,
            '--allowlist=config/missing-allowlist.json',
            `--components=${componentRoot}`,
        ])

        expect(report.unregisteredCount).toBeGreaterThan(0)
        expect(process.exitCode).toBe(1)

        const json = JSON.parse(await readFile(outputPath, 'utf8'))
        const markdown = await readFile(join(projectRoot, 'artifacts/report.md'), 'utf8')

        expect(json.unregisteredCount).toBe(report.unregisteredCount)
        expect(markdown).toContain(`零引用未登记: ${report.unregisteredCount}`)
    })
})

describe('find-unused-components - 边界分支', () => {
    it('同一路径归一为 .', () => {
        expect(toPosixPath('/repo', '/repo')).toBe('.')
    })

    it('空 allowlist 条目不匹配任何组件', () => {
        expect(matchesAllowlistEntry('components/a.vue', null)).toBe(false)
    })

    it('缺少 entries 数组的 allowlist 归一为空数组', () => {
        expect(normalizeAllowlist({})).toEqual([])
    })

    it('无法生成候选名的组件不进入索引', () => {
        const index = buildComponentIndex([{ filePath: 'components/.vue' }])

        expect(index.pascalIndex.size).toBe(0)
        expect(index.kebabIndex.size).toBe(0)
    })

    it('默认参数解析仍为 report 模式', () => {
        expect(parseArgs([])).toMatchObject({ mode: 'report', components: 'components' })
    })
})
