import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    blockquoteDepth,
    checkDocFile,
    collectDocFiles,
    collectFencedLineNumbers,
    findUnterminatedCommentLines,
    leadingIndentWidth,
    runCheckDocMarkers,
    skipFencedBlock,
    startsBlockComment,
    stripInlineCode,
    walk,
} from '@/scripts/docs/check-doc-markers.mjs'

const tempDirs: string[] = []

async function createTempRoot() {
    const root = await mkdtemp(join(tmpdir(), 'check-doc-markers-'))
    tempDirs.push(root)
    return root
}

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

function messagesOf(findings: { message: string }[]) {
    return findings.map((finding) => finding.message).join('\n')
}

afterEach(async () => {
    for (const dir of tempDirs.splice(0)) {
        await rm(dir, { recursive: true, force: true })
    }
})

describe('check-doc-markers: 行级标记判定', () => {
    it('leadingIndentWidth 把 Tab 计为 4 列', () => {
        expect(leadingIndentWidth('正文')).toBe(0)
        expect(leadingIndentWidth('  两列')).toBe(2)
        expect(leadingIndentWidth('\tTab')).toBe(4)
        expect(leadingIndentWidth('  \t混合')).toBe(6)
    })

    it('startsBlockComment 只认「块级注释开头」形态（含引用 / 列表前缀，排除缩进代码块）', () => {
        expect(startsBlockComment('普通正文')).toBe(false)
        expect(startsBlockComment('正文中的 <!-- 行内注释 -->')).toBe(false)
        expect(startsBlockComment('<!-- 块级开头 -->')).toBe(true)
        expect(startsBlockComment('  <!-- 两列缩进仍是块级开头')).toBe(true)
        expect(startsBlockComment('    <!-- 四列缩进属缩进代码块')).toBe(false)
        expect(startsBlockComment('\t<!-- Tab 缩进属缩进代码块')).toBe(false)
        expect(startsBlockComment('> <!-- 引用内块级开头')).toBe(true)
        expect(startsBlockComment('- <!-- 列表项内块级开头')).toBe(true)
    })

    it('stripInlineCode 剥离行内代码，避免把被转义的示例判为未闭合', () => {
        expect(stripInlineCode('示例 `<!--` 与 `-->` 写法')).toBe('示例  与  写法')
    })

    it('skipFencedBlock 跳到同字符且不短于开启长度的闭合 fence 之后，并受容器深度约束', () => {
        expect(skipFencedBlock(['```md', '<!-- 示例', '```', '正文'], 0)).toBe(3)
        expect(skipFencedBlock(['~~~', '正文'], 0)).toBe(2)
        // 4 字符 fence 不会被 3 字符行误判为闭合（CommonMark 要求不短于开启 fence）
        expect(skipFencedBlock(['````md', '```', '````', '正文'], 0)).toBe(3)
        // blockquote 内的 fence（容器深度一致）
        expect(skipFencedBlock(['> ```md', '> <!-- 示例', '> ```'], 0)).toBe(3)
        // 容器提前结束：引用内的 fence 不能被「未引用行」关闭，该行需继续按正文扫描
        expect(skipFencedBlock(['> ```md', '<!-- 示例', '> ```'], 0)).toBe(1)
        // 更深的引用形态行不关闭顶层 fence（仍属 fence 内容）
        expect(skipFencedBlock(['```md', '> ```', '正文', '```'], 0)).toBe(4)
    })

    it('blockquoteDepth 数出容器深度', () => {
        expect(blockquoteDepth('正文')).toBe(0)
        expect(blockquoteDepth('> 正文')).toBe(1)
        expect(blockquoteDepth('> > 正文')).toBe(2)
        expect(blockquoteDepth('    > 正文')).toBe(1)
    })

    it('collectFencedLineNumbers 标记 fenced 区块覆盖的行（供规则 2 / 3 豁免）', () => {
        const lines = ['正文', '```md', '<!-- 示例', '```', '正文', '````', '```', '````']
        expect([...collectFencedLineNumbers(lines)].sort((a, b) => a - b)).toEqual([2, 3, 4, 6, 7, 8])
    })

    it('findUnterminatedCommentLines 与 VitePress 实测语义一致（markdown-it 原样输出区块）', () => {
        // 本行闭合 / 合法多行注释 / 正文中段行内 `<!--`：编译通过，不报
        expect(findUnterminatedCommentLines(['<!-- 说明 -->', '正文'])).toEqual([])
        expect(findUnterminatedCommentLines(['<!-- 说明', '第二行', '-->', '正文'])).toEqual([])
        expect(findUnterminatedCommentLines(['正文 --> <!-- 未闭合'])).toEqual([])
        // 缩进 ≥4 列 / Tab 属缩进代码块，会被转义；`>` / 列表标记后的多余缩进同理
        expect(findUnterminatedCommentLines(['    <!-- 说明'])).toEqual([])
        expect(findUnterminatedCommentLines(['\t<!-- 说明'])).toEqual([])
        expect(findUnterminatedCommentLines(['    > <!-- 说明'])).toEqual([])
        expect(findUnterminatedCommentLines(['>     <!-- 说明'])).toEqual([])
        expect(findUnterminatedCommentLines(['-     <!-- 说明'])).toEqual([])
        // HTML5 空注释（`<!-->` / `<!--->`）合法，markdown-it 同样视为闭合
        expect(findUnterminatedCommentLines(['<!-->'])).toEqual([])
        expect(findUnterminatedCommentLines(['<!--->'])).toEqual([])
        // fenced code block 内的 `<!--`（含 4 字符 fence 与 blockquote 包裹的 fence）
        expect(findUnterminatedCommentLines(['```md', '<!-- 说明', '```'])).toEqual([])
        expect(findUnterminatedCommentLines(['````md', '```', '<!-- 说明', '````'])).toEqual([])
        expect(findUnterminatedCommentLines(['> ```md', '> <!-- 说明', '> ```'])).toEqual([])
        // 容器边界：引用内的 fence 被「未引用行」提前终止，该行按正文扫描（Vue 同样报错）
        expect(findUnterminatedCommentLines(['> ```md', '<!-- 说明', '> ```'])).toEqual([2])
        // 更深的引用形态行不关闭顶层 fence（整段仍属 fence 内容，Vue 编译通过）
        expect(findUnterminatedCommentLines(['```md', '<!-- 说明', '> ```', '', '<!-- 说明'])).toEqual([])
        // 块级注释延续到 EOF：VitePress 以 Unexpected EOF in comment 中断
        expect(findUnterminatedCommentLines(['# 标题', '', '<!-- 说明'])).toEqual([3])
        // 同行「先闭合、行尾又开一个」：整行原样输出，残留的 `<!--` 同样中断构建
        expect(findUnterminatedCommentLines(['<!-- a --> 之后 <!-- b'])).toEqual([1])
        // 引用 / 列表项内的块级开头同样成立
        expect(findUnterminatedCommentLines(['> <!-- 说明'])).toEqual([1])
        expect(findUnterminatedCommentLines(['- <!-- 说明'])).toEqual([1])
        expect(findUnterminatedCommentLines(['> > <!-- 说明'])).toEqual([1])
        expect(findUnterminatedCommentLines(['>   <!-- 说明'])).toEqual([1])
        // 首个未闭合块吞并后续行，只报该块内的未闭合行
        expect(findUnterminatedCommentLines(['<!-- 说明', '<!-- 第二个未闭合'])).toEqual([1])
        // 区块内的 `-->` 由原样输出决定（fenced / 行内代码中的 `-->` 同样闭合）
        expect(findUnterminatedCommentLines(['<!-- 说明', '```', 'a --> b', '```', '正文'])).toEqual([])
        expect(findUnterminatedCommentLines(['<!-- 说明', '示例 `a --> b`'])).toEqual([])
        // 区块闭合后，后续独立区块另行判定
        expect(findUnterminatedCommentLines(['<!-- a -->', '正文', '<!-- b'])).toEqual([3])
    })
})

describe('check-doc-markers: 文件级检查', () => {
    it('报出块级注释延续到 EOF 的截断标记（站点构建事故的原始形态）', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/archive/broken.md')
        await writeProjectFile(root, 'docs/reports/regression/archive/broken.md', [
            '<!-- regression-window:start:phase68-b2-posts:第六十八阶段-条目2-第十路由:2026-10-16 -->',
            '## 窗口正文',
            '<!-- regression-window:end:phase68-b2-posts:第六十',
            '',
        ].join('\n'))

        const findings = checkDocFile(file)
        const messages = messagesOf(findings)

        expect(findings.map((finding) => finding.line)).toEqual([3, 3, 1])
        expect(messages).toContain('块级 HTML 注释未闭合')
        expect(messages).toContain('缺少对应的 `regression-window:end` 标记')
        // 截断行同时命中「形态非法」，指向具体修法
        expect(messages).toContain('回归窗口标记格式不合法')
    })

    it('块级截断但后续行有闭合符时不报未闭合（对齐 VitePress：编译通过），仅由配对 / 形态判据暴露', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/archive/mid-file-truncated.md')
        await writeProjectFile(root, 'docs/reports/regression/archive/mid-file-truncated.md', [
            '<!-- regression-window:end:phase68-b2-friend-links:第六十',
            '',
            '<!-- regression-window:start:phase68-b2-posts:第六十八阶段-条目2-第十路由:2026-10-16 -->',
            '## 窗口正文',
            '',
        ].join('\n'))

        const findings = checkDocFile(file)

        expect(messagesOf(findings)).not.toContain('块级 HTML 注释未闭合')
        expect(messagesOf(findings)).toContain('回归窗口标记格式不合法')
        expect(messagesOf(findings)).toContain('缺少对应的 `regression-window:end` 标记')
    })

    it('报出孤立注释尾行（归档迁出窗口的残留）', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/current.md')
        await writeProjectFile(root, 'docs/reports/regression/current.md', [
            '## 正文',
            '-->',
            '',
        ].join('\n'))

        const findings = checkDocFile(file)

        expect(findings).toHaveLength(1)
        expect(findings.map((finding) => finding.line)).toEqual([2])
        expect(messagesOf(findings)).toContain('孤立注释尾行')
    })

    it('孤立尾行判据保持窄口径：`-->x` 与正文中的 `-->` 不报错', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/current.md')
        await writeProjectFile(root, 'docs/reports/regression/current.md', [
            '-->x 后面有字',
            '箭头写作 A --> B',
            '',
        ].join('\n'))

        expect(checkDocFile(file)).toEqual([])
    })

    it('报出成对性缺陷：end 无 start、id 错配、start 未闭合', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/current.md')
        await writeProjectFile(root, 'docs/reports/regression/current.md', [
            '<!-- regression-window:end:solo -->',
            '<!-- regression-window:start:a -->',
            '<!-- regression-window:end:b -->',
            '<!-- regression-window:start:tail -->',
            '',
        ].join('\n'))

        const findings = checkDocFile(file)
        const messages = messagesOf(findings)

        expect(findings.map((finding) => finding.line)).toEqual([1, 3, 4])
        expect(messages).toContain('没有对应的 `regression-window:start` 标记')
        expect(messages).toContain('与最近的 `regression-window:start` 标记（id=a，第 2 行）不一致')
        expect(messages).toContain('id=tail')
        expect(messages).toContain('缺少对应的 `regression-window:end` 标记')
    })

    it('标记 token 大小写变体仍参与配对判定与形态判定', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/current.md')
        await writeProjectFile(root, 'docs/reports/regression/current.md', [
            '<!-- regression-window:Start:a:2026-10-16 -->',
            '<!-- regression-window:End -->',
            '',
        ].join('\n'))

        const findings = checkDocFile(file)
        const messages = messagesOf(findings)

        expect(findings.map((finding) => finding.line)).toEqual([2, 1])
        expect(messages).toContain('缺少对应的 `regression-window:end` 标记')
        expect(messages).toContain('标记格式不合法')
    })

    it('接受嵌套窗口（既有归档分片的合法形态）', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/archive/nested.md')
        await writeProjectFile(root, 'docs/reports/regression/archive/nested.md', [
            '<!-- regression-window:start:outer:第四十阶段:2026-05-27 -->',
            '<!-- regression-window:start:inner:test:2026-05-27 -->',
            '<!-- regression-window:end:inner:test:2026-05-27 -->',
            '<!-- regression-window:end:outer:第四十阶段:2026-05-27 -->',
            '',
        ].join('\n'))

        expect(checkDocFile(file)).toEqual([])
    })

    it('跳过 fenced code block 与行内代码中的示例标记', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/guide/example.md')
        await writeProjectFile(root, 'docs/guide/example.md', [
            '## 示例',
            '',
            '```md',
            '<!-- regression-window:end:demo:示例 -->',
            '<!-- 未闭合示例',
            '-->',
            '```',
            '',
            '行内示例：`<!-- regression-window:end:demo -->` 与 `-->`。',
            '',
        ].join('\n'))

        expect(checkDocFile(file)).toEqual([])
    })

    it('报出无法解析的标记形态', async () => {
        const root = await createTempRoot()
        const file = resolve(root, 'docs/reports/regression/current.md')
        await writeProjectFile(root, 'docs/reports/regression/current.md', [
            '<!-- regression-window:start -->',
            '',
        ].join('\n'))

        const findings = checkDocFile(file)

        expect(findings).toHaveLength(1)
        expect(messagesOf(findings)).toContain('标记格式不合法')
    })
})

describe('check-doc-markers: 扫描面', () => {
    it('collectDocFiles 限定 docs/ 前缀（非 git 环境回退目录遍历）', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/guide/a.md', '# a\n')
        await writeProjectFile(root, 'docs/reports/regression/archive/b.md', '# b\n')
        await writeProjectFile(root, 'docs/.vitepress/dist/generated.md', '# dist\n')
        await writeProjectFile(root, 'README.md', '# root\n')

        const files = collectDocFiles(root).map((file) => file.replace(`${root}/`, ''))

        expect(files).toEqual([
            'docs/guide/a.md',
            'docs/reports/regression/archive/b.md',
        ])
    })

    it('walk 不排除 archive 目录（归档分片是本检查的重点扫描面）', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/reports/regression/archive/c.md', '# c\n')
        await writeProjectFile(root, 'docs/.vitepress/dist/generated.md', '# dist\n')

        const files = walk(resolve(root, 'docs')).map((file) => file.replace(`${root}/`, ''))

        expect(files).toEqual(['docs/reports/regression/archive/c.md'])
    })
})

describe('check-doc-markers: 真实仓库回归锁', () => {
    it('仓库现有文档全部通过标记完整性检查', () => {
        const { errors, files } = runCheckDocMarkers()

        expect(errors).toEqual([])
        expect(files.length).toBeGreaterThan(200)
    })
})
