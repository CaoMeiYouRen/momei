import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    checkFile,
    collectMdFiles,
    collectTitles,
    isLineAnchor,
    looseNorm,
    normAnchor,
    runCheckLinks,
    walk,
} from '@/scripts/docs/check-links.mjs'

const tempDirs: string[] = []

async function createTempRoot() {
    const root = await mkdtemp(join(tmpdir(), 'check-links-'))
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

describe('check-links: 宽松规范化与锚点', () => {
    it('looseNorm 移除标点、符号与空白', () => {
        expect(looseNorm('Hello, World!')).toBe('helloworld')
        expect(looseNorm('你好，世界！')).toBe('你好世界')
        expect(looseNorm('A 🚀 B')).toBe('ab')
        expect(looseNorm('Mixed_Case Title.')).toBe('mixedcasetitle')
    })

    it('normAnchor 兼容 URL 编码写法', () => {
        expect(normAnchor('my%20anchor')).toBe('myanchor')
        expect(normAnchor('中文%20标题')).toBe('中文标题')
        expect(normAnchor('%E6%B5%8B%E8%AF%95')).toBe('测试')
    })

    it('isLineAnchor 识别 GitHub 行号锚点', () => {
        expect(isLineAnchor('L215')).toBe(true)
        expect(isLineAnchor('L1')).toBe(true)
        expect(isLineAnchor('level-3')).toBe(false)
        expect(isLineAnchor('')).toBe(false)
    })

    it('collectTitles 跳过 fenced code block 并剥离行内格式', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'titles.md', [
            '# Hello, World!',
            '## 安装向导 (Installation Wizard)',
            '### `code` title',
            '#### [link](url) plain',
            '##### *italic* ~strike~ text',
            '```md',
            '# 代码块内的标题不算',
            '```',
            '```ts',
            '# another fake',
            '```',
            '正文 # 非标题行',
        ].join('\n'))
        const titles = collectTitles(join(root, 'titles.md'))
        expect(titles.has('helloworld')).toBe(true)
        expect(titles.has('安装向导installationwizard')).toBe(true)
        expect(titles.has('title')).toBe(true)
        expect(titles.has('plain')).toBe(true)
        expect(titles.has('italicstriketext')).toBe(true)
        expect(titles.has('代码块内的标题不算')).toBe(false)
        expect(titles.has('anotherfake')).toBe(false)
        expect(titles.has('正文非标题行')).toBe(false)
    })
})

describe('check-links: 链接检查', () => {
    it('有效相对链接、站内锚点与外链不报错', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '# Alpha\n\n## 子标题\n\n[跳转](./b.md#子标题) [站内](#子标题) [外链](https://example.com) [邮件](mailto:a@b.c)')
        await writeProjectFile(root, 'b.md', '# Beta\n\n## 子标题\n')
        expect(checkFile(join(root, 'a.md'), root)).toEqual([])
    })

    it('报告不存在的链接目标', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '[断链](./missing.md)')
        const errors = checkFile(join(root, 'a.md'), root)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('链接目标不存在')
    })

    it('报告本地绝对路径链接（POSIX / 盘符 / UNC）', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '[posix](/abs/path.md) [win](C:/abs.md) [unc](\\\\server\\share)')
        const errors = checkFile(join(root, 'a.md'), root)
        expect(errors).toHaveLength(3)
        for (const error of errors) {
            expect(error).toContain('本地绝对路径')
        }
    })

    it('报告路径穿越链接', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '[穿越](../../outside.md)')
        const errors = checkFile(join(root, 'a.md'), root)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('超出项目范围')
    })

    it('报告失效的站内锚点与文件锚点', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '# Alpha\n\n[站内](#不存在的标题)\n\n[文件锚点](./b.md#不存在的标题)')
        await writeProjectFile(root, 'b.md', '# Beta\n')
        const errors = checkFile(join(root, 'a.md'), root)
        expect(errors).toHaveLength(2)
        expect(errors[0]).toContain('站内锚点')
        expect(errors[1]).toContain('找不到对应标题')
    })

    it('放行 VitePress 省略扩展名的裸路径链接', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/a.md', '# A\n\n[跳转](./guide/deploy)')
        await writeProjectFile(root, 'docs/guide/deploy.md', '# Deploy\n')
        expect(checkFile(join(root, 'docs/a.md'), root)).toEqual([])
    })

    it('放行 GitHub 行号锚点（#Lxxx）', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '# A\n\n[源码](./lib/code.ts#L215)')
        await writeProjectFile(root, 'lib/code.ts', 'export const x = 1\n')
        expect(checkFile(join(root, 'a.md'), root)).toEqual([])
    })

    it('跳过 fenced code block 内的坏链接与正文路径', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', [
            '```md',
            '[断链](./missing.md) 文本 C:\\Users\\local',
            '```',
            '[断链](./missing.md)',
        ].join('\n'))
        const errors = checkFile(join(root, 'a.md'), root)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('链接目标不存在')
    })

    it('报告正文个人机器路径，放行 POSIX 概念路径', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', [
            '本地路径 C:\\Users\\me\\projects 需要报告',
            '概念路径 /etc/hosts 与 /tmp 不报',
        ].join('\n'))
        const errors = checkFile(join(root, 'a.md'), root)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toContain('正文包含本地绝对路径')
    })

    it('不把表格转义与符号文本误判为 UNC 路径', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', [
            '| a \\\\| b |',
            'sourcemap 引用 \\\\.map 不报',
        ].join('\n'))
        expect(checkFile(join(root, 'a.md'), root)).toEqual([])
    })

    it('跳过行内代码中的链接', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '`[行内](./missing.md)`')
        expect(checkFile(join(root, 'a.md'), root)).toEqual([])
    })
})

describe('check-links: 文件收集与聚合', () => {
    it('非 git 环境回退目录遍历并排除归档与生成物目录', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/a.md', '# A')
        await writeProjectFile(root, 'docs/archive/old.md', '# Old')
        await writeProjectFile(root, 'dist/generated.md', '# Gen')
        const files = walk(root)
        expect(files).toHaveLength(1)
        expect(files[0]).toContain(join('docs', 'a.md'))
    })

    it('runCheckLinks 聚合多文件错误', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'a.md', '[断链](./missing.md)')
        await writeProjectFile(root, 'b.md', '# B\n\n[站内](#缺失)')
        const { errors, files } = runCheckLinks({ root })
        expect(files).toHaveLength(2)
        expect(errors).toHaveLength(2)
    })

    it('collectMdFiles 在 git 仓库中返回受版本控制的 md 文件', () => {
        const files = collectMdFiles()
        expect(files.length).toBeGreaterThan(100)
        expect(files.some((file) => file.includes('docs'))).toBe(true)
    })
})
