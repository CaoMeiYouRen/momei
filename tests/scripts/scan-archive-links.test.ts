import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    classifyBrokenLink,
    groupOf,
    renderReport,
    scanArchiveLinks,
} from '@/scripts/docs/scan-archive-links.mjs'

const tempDirs: string[] = []

async function createTempRoot() {
    const root = await mkdtemp(join(tmpdir(), 'scan-archive-links-'))
    tempDirs.push(root)
    return root
}

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

afterEach(async () => {
    for (const dir of tempDirs.splice(0)) {
        await rm(dir, { recursive: true, force: true })
    }
})

describe('scan-archive-links: 分组与分类', () => {
    it('groupOf 按三个扫描目录归组，目录外返回 null', () => {
        expect(groupOf('docs/plan/archive/roadmap-phases-01-10.md')).toBe('plan')
        expect(groupOf('docs/reports/regression/archive/2026-05-01-to-2026-05-02.md')).toBe('regression')
        expect(groupOf('docs/design/governance/archive/post-sharing.md')).toBe('governance')
        expect(groupOf('docs/design/governance/post-sharing.md')).toBe('governance')
        expect(groupOf('docs/plan/todo.md')).toBeNull()
    })

    it('classifyBrokenLink 区分同级上跳、已迁移或已删除、代码路径与其余', () => {
        const alwaysExists = () => true
        const neverExists = () => false

        expect(classifyBrokenLink({
            file: 'docs/plan/archive/a.md',
            pathPart: './backlog.md',
            candidates: [],
            exists: alwaysExists,
        })).toBe('siblingJump')

        expect(classifyBrokenLink({
            file: 'docs/plan/archive/a.md',
            pathPart: './missing.md',
            candidates: ['docs/plan/backlog.md'],
            exists: neverExists,
        })).toBe('movedOrDeleted')

        expect(classifyBrokenLink({
            file: 'docs/plan/archive/a.md',
            pathPart: '../../server/utils/logger.ts',
            candidates: ['server/utils/logger.ts'],
            exists: neverExists,
        })).toBe('codePath')

        expect(classifyBrokenLink({
            file: 'docs/plan/archive/a.md',
            pathPart: './missing.md',
            candidates: [],
            exists: neverExists,
        })).toBe('other')
    })
})

describe('scan-archive-links: 扫描口径', () => {
    it('统计缺失链接，跳过外链与站内锚点，并把 fenced / 行内代码标记为门禁不可见', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/plan/archive/ok.md', '# OK\n')
        await writeProjectFile(
            root,
            'docs/plan/archive/sample.md',
            [
                '# Sample',
                '',
                '[有效](./ok.md)',
                '[外链](https://example.com/a.md)',
                '[站内](#sample)',
                '[缺失](./missing.md)',
                '`[行内](./inline-missing.md)`',
                '```markdown',
                '[示例](./fenced-missing.md)',
                '```',
            ].join('\n'),
        )

        const report = scanArchiveLinks({ root })

        expect(report.brokenCount).toBe(3)
        expect(report.scanOnlyCount).toBe(2)
        expect(report.gateVisibleCount).toBe(1)
        expect(report.items.map((item) => item.target).sort()).toEqual([
            './fenced-missing.md',
            './inline-missing.md',
            './missing.md',
        ])
        expect(report.items.find((item) => item.target === './missing.md')?.gateVisible).toBe(true)
    })

    it('相对链接可通过祖先目录重解命中，裸路径回退 .md 扩展名', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/plan/backlog.md', '# Backlog\n')
        await writeProjectFile(root, 'docs/plan/archive/page.md', '# Page\n')
        await writeProjectFile(
            root,
            'docs/reports/regression/archive/log.md',
            '[backlog](../../plan/backlog.md)\n[page](../../../plan/archive/page)\n',
        )

        const report = scanArchiveLinks({ root })

        // `../../plan/backlog.md` 从 archive 出发少一级，按存在性口径仍算缺失；
        // 裸路径 `../../../plan/archive/page` 补 `.md` 后存在，因此不计缺失。
        expect(report.items.map((item) => item.target)).toEqual(['../../plan/backlog.md'])
    })

    it('仓库根之外的兄弟目录不被误判为仓库内命中', async () => {
        const root = await createTempRoot()
        const baseName = basename(root)
        const sibling = `${root}-other`
        await mkdir(join(sibling, 'docs'), { recursive: true })
        await writeFile(join(sibling, 'docs', 'a.md'), '# A', 'utf8')
        // 仓库内同名相对路径存在，用于确认越界判定不是「恰好不存在」
        await writeProjectFile(root, 'other/docs/a.md', '# inner\n')
        // 从 docs/plan/archive/ 出发必须上跳 4 级才越过仓库根
        await writeProjectFile(
            root,
            'docs/plan/archive/a.md',
            `[越界](../../../../${baseName}-other/docs/a.md)\n`,
        )

        try {
            const report = scanArchiveLinks({ root })

            expect(report.items.map((item) => item.target)).toEqual([`../../../../${baseName}-other/docs/a.md`])
        } finally {
            await rm(sibling, { recursive: true, force: true })
        }
    })

    it('本地绝对路径与正文机器路径分别计入 absolute / bodyPath', async () => {
        const root = await createTempRoot()
        await writeProjectFile(
            root,
            'docs/design/governance/archive/machine.md',
            ['[绝对](/opt/project/file.md)', '记录：`D:\\Projects\\probe\\sample`', ''].join('\n'),
        )

        const report = scanArchiveLinks({ root })

        expect(report.byClass.absolute).toBe(1)
        expect(report.byClass.bodyPath).toBe(1)
        expect(report.brokenCount).toBe(1)
        expect(report.bodyPathCount).toBe(1)
        // 分组与文件数只统计链接项，正文机器路径单列，保证合计可复算
        expect(report.byGroup.governance).toBe(1)
        expect(report.brokenFileCount).toBe(1)
    })

    it('注入的文件清单与存在性探针可脱离 git 与文件系统工作', async () => {
        const report = scanArchiveLinks({
            files: ['docs/plan/archive/a.md', 'docs/plan/todo.md', 'docs/plan/archive/b.md'],
            exists: (path) => path === 'docs/plan/todo.md',
            read: () => '# empty\n',
        })

        expect(report.scannedFileCount).toBe(2)
        expect(report.items).toEqual([])
    })

    it('renderReport 输出申报差量与门禁可见拆分', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/plan/archive/a.md', '[缺失](./missing.md)\n')
        const text = renderReport(scanArchiveLinks({ root }))

        expect(text).toContain('扫描目录')
        expect(text).toContain('与申报基数差量')
        expect(text).toContain('门禁可见')
    })
})
