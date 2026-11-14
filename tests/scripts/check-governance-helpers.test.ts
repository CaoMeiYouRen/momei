import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
    buildIssue,
    collectLocalLinkTargets,
    compareMirrorTrees,
    extractMarkdownLinks,
    findExtraRelativeFiles,
    findMissingRelativeFiles,
    isExternalLink,
    isReferenceIndexed,
    listDirectoriesRecursive,
    listFilesRecursive,
    listImmediateDirectories,
    normalizeLocalTarget,
    parseFrontmatter,
    pathExists,
    toPosixPath,
    unique,
    validateSkillReferences,
} from '@/scripts/ai/check-governance.mjs'

const projectRoot = process.cwd()
let tempDir = ''

async function writeFileIn(relativePath: string, content: string) {
    const absolutePath = resolve(tempDir, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content)
}

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'governance-helpers-'))
})

afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
})

describe('check-governance 文件与 frontmatter 工具', () => {
    it('规范化路径并判断存在性', async () => {
        expect(toPosixPath(resolve(projectRoot, 'docs/x.md'))).toBe('docs/x.md')
        await writeFileIn('a.md', 'x')
        expect(await pathExists(resolve(tempDir, 'a.md'))).toBe(true)
        expect(await pathExists(resolve(tempDir, 'missing.md'))).toBe(false)
    })

    it('递归列出文件与目录', async () => {
        await writeFileIn('root.md', 'x')
        await writeFileIn('nested/child.md', 'y')
        await writeFileIn('nested/skip.txt', 'z')

        expect(await listFilesRecursive(tempDir, (name: string) => name.endsWith('.md'))).toEqual(['nested/child.md', 'root.md'])
        expect(await listDirectoriesRecursive(tempDir)).toEqual(['nested'])
        expect(await listImmediateDirectories(tempDir)).toEqual(['nested'])
        expect(await listImmediateDirectories(resolve(tempDir, 'missing'))).toEqual([])
    })

    it('解析 frontmatter、键名与非法 YAML', () => {
        expect(parseFrontmatter('no frontmatter')).toBeNull()
        const parsed = parseFrontmatter('---\nname: demo\ndescription: hello\n---\nbody')
        expect(parsed?.keys).toEqual(['name', 'description'])
        expect(parsed?.data).toEqual({ name: 'demo', description: 'hello' })
        expect(parseFrontmatter('---\nname: [\n---\n')?.data).toBeNull()
    })

    it('提取链接并过滤外链与锚点', () => {
        const content = '[a](./a.md) [b](https://x.test) [c](#hash) [d](./b.md#frag)'
        expect(extractMarkdownLinks(content)).toEqual(['./a.md', 'https://x.test', '#hash', './b.md#frag'])
        expect(isExternalLink('https://x.test')).toBe(true)
        expect(isExternalLink('./a.md')).toBe(false)
        expect(normalizeLocalTarget('./a.md#frag')).toBe('./a.md')
        expect(collectLocalLinkTargets(content)).toEqual(['./a.md', './b.md'])
    })

    it('references 必须由入口文件的相对链接直接指向', async () => {
        await writeFileIn('entry.md', '[ref](./references/r.md)')
        await writeFileIn('references/r.md', 'x')
        expect(await isReferenceIndexed(resolve(tempDir, 'references/r.md'), [resolve(tempDir, 'entry.md')])).toBe(true)
        expect(await isReferenceIndexed(resolve(tempDir, 'references/other.md'), [resolve(tempDir, 'entry.md')])).toBe(false)
    })

    it('构建 issue、比较镜像树并求差集', async () => {
        expect(buildIssue('t', 'f', 'm')).toEqual({ type: 't', filePath: 'f', message: 'm', severity: 'error' })
        expect(buildIssue('t', 'f', 'm', 'warning').severity).toBe('warning')
        expect(unique(['b', 'a', 'b'])).toEqual(['a', 'b'])

        await writeFileIn('main/same.md', 'same')
        await writeFileIn('mirror/same.md', 'same')
        await writeFileIn('main/drift.md', 'main')
        await writeFileIn('mirror/drift.md', 'mirror')
        await writeFileIn('main/missing.md', 'missing')

        const issues: { type: string }[] = []
        await compareMirrorTrees(resolve(tempDir, 'main'), resolve(tempDir, 'mirror'), ['same.md', 'drift.md', 'missing.md'], issues, 'agent')
        expect(issues.map((issue) => issue.type)).toEqual(['mirror-drift', 'missing-mirror-file'])
    })

    it('差额集合计算', () => {
        expect(findMissingRelativeFiles(['a', 'b'], ['b'])).toEqual(['a'])
        expect(findExtraRelativeFiles(['a'], ['a', 'b'])).toEqual(['b'])
    })
})

describe('check-governance 引用索引', () => {
    it('validateSkillReferences 在入口与 agent 同名引用时通过', async () => {
        await writeFileIn('skills/demo/SKILL.md', '[ref](./references/r.md)')
        await writeFileIn('skills/demo/references/r.md', 'x')
        await writeFileIn('agents/demo.agent.md', 'agent')
        const issues: unknown[] = []
        await validateSkillReferences([resolve(tempDir, 'skills/demo/SKILL.md')], [resolve(tempDir, 'agents/demo.agent.md')], issues)
        expect(issues).toEqual([])
    })

    it('未被入口链接的 references 会产出 issue', async () => {
        await writeFileIn('skills/demo/SKILL.md', '[other](./references/other.md)')
        await writeFileIn('skills/demo/references/r.md', 'x')
        await writeFileIn('agents/demo.agent.md', 'agent')
        const issues: unknown[] = []
        await validateSkillReferences([resolve(tempDir, 'skills/demo/SKILL.md')], [resolve(tempDir, 'agents/demo.agent.md')], issues)
        expect(issues.length).toBeGreaterThan(0)
        expect(issues[0]).toMatchObject({ type: 'unindexed-skill-reference', filePath: expect.stringContaining('references/r.md') })
    })
})
