import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    countTopLevelItems,
    extractLinkTarget,
    findSection,
    findTableAfterHeading,
    formatIssue,
    inspectArchiveIndex,
    inspectProgressTable,
    inspectV1Blocks,
    listTodoShards,
    main,
    normalizeCell,
    parseArgs,
    parseShardFileName,
    parseShardRange,
    runPlanningDocsCheck,
    splitLines,
    splitTableRow,
} from '@/scripts/docs/check-planning-docs.mjs'

const PROGRESS_HEADER = '| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |'
const PROGRESS_SEPARATOR = '| :--- | :--- | :--- | :--- | :--- | :--- |'
const INDEX_HEADER = '| 阶段 | 主题 | 归档文件 | 归档日期 |'
const INDEX_SEPARATOR = '| :--- | :--- | :--- | :--- |'

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'planning-docs-'))
    mkdirSync(join(root, 'docs', 'plan', 'archive'), { recursive: true })
    return root
}

function writeFixture(root, relativePath, content) {
    writeFileSync(join(root, relativePath), content, 'utf8')
}

function todoWith(rows, items = ['- [ ] **81.1 A**']) {
    return [
        '# todo',
        '',
        '## 当前进行中阶段',
        '',
        '### 第八十一阶段',
        '',
        PROGRESS_HEADER,
        PROGRESS_SEPARATOR,
        ...rows,
        '',
        ...items,
        '',
        '## 相关文档',
    ].join('\n')
}

function archiveWith(rows) {
    return [
        '# archive',
        '',
        '## 深度归档索引',
        '',
        '> 说明',
        '',
        INDEX_HEADER,
        INDEX_SEPARATOR,
        ...rows,
        '',
        '## 主窗口保留范围',
    ].join('\n')
}

function shardRow(phase, fileName, date = '2026-01-01', theme = '主题') {
    return `| ${phase} | ${theme} | [${fileName}](./archive/${fileName}) | ${date} |`
}

describe('check-planning-docs 解析工具', () => {
    it('拆分表格行并归一化单元格', () => {
        expect(splitTableRow('| **大条目** | `3/4` | 进行中 |')).toEqual(['大条目', '3/4', '进行中'])
        expect(splitTableRow('不是表格')).toBeNull()
        expect(normalizeCell('  **a** `b`  ')).toBe('a b')
    })

    it('拆分行与提取链接目标', () => {
        expect(splitLines('a\r\nb')).toEqual(['a', 'b'])
        expect(extractLinkTarget('[x](./archive/todo-archive-phases-01-10.md)')).toBe('./archive/todo-archive-phases-01-10.md')
        expect(extractLinkTarget('无链接')).toBeNull()
    })

    it('定位区段与第一张表格', () => {
        const lines = todoWith(['| 81.1 A | 1/1 | 已闭环 | abc | Pass | 1 → 1 |'], ['- [x] **81.1 A**']).split('\n')
        expect(findSection(lines, /^##\s+当前进行中阶段/u)?.start).toBe(2)
        const table = findTableAfterHeading(lines, /^##\s+当前进行中阶段/u)
        expect(table?.header).toHaveLength(6)
        expect(table?.rows).toHaveLength(1)
    })

    it('统计顶层大条目时忽略取消项与嵌套项', () => {
        const result = countTopLevelItems([
            '- [ ] **1**',
            '    - [ ] 小条目',
            '- [x] **2**',
            '- [-] **3**',
        ])
        expect(result).toEqual({ active: 2, closed: 1 })
    })

    it('解析阶段区间与分片文件名', () => {
        expect(parseShardRange('65-68')).toEqual({ start: 65, end: 68 })
        expect(parseShardRange('69')).toEqual({ start: 69, end: 69 })
        expect(parseShardRange('68-65')).toBeNull()
        expect(parseShardRange('第 69 阶段')).toBeNull()
        expect(parseShardFileName('todo-archive-phases-01-10.md')).toEqual({ start: 1, end: 10 })
        expect(parseShardFileName('todo-archive-phases-69.md')).toEqual({ start: 69, end: 69 })
        expect(parseShardFileName('todo-archive-phases-100-105.md')).toEqual({ start: 100, end: 105 })
        expect(parseShardFileName('roadmap-phases-69.md')).toBeNull()
    })
})

describe('check-planning-docs 进度表', () => {
    it('空阶段允许占位行', () => {
        const content = todoWith(['| — | — | — | — | — | — |'], [])
        expect(inspectProgressTable({ content }).errors).toEqual([])
    })

    it('空阶段缺表也判红', () => {
        const content = ['# todo', '', '## 当前进行中阶段', '', '### 暂无进行中阶段'].join('\n')
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('缺少进度表')]),
        )
    })

    it('围栏内的示例表与勾选行不参与解析', () => {
        const content = todoWith(
            ['| 81.1 A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |'],
            [
                '```md',
                '| 示例 | 表 |',
                '| --- | --- |',
                '- [ ] **示例大条目**',
                '```',
                '- [ ] **81.1 A**',
            ],
        )
        expect(inspectProgressTable({ content }).errors).toEqual([])
    })

    it('大条目超过 8 个时判红', () => {
        const rows = Array.from({ length: 9 }, (_, index) => `| 81.${index + 1} A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |`)
        const items = Array.from({ length: 9 }, (_, index) => `- [ ] **81.${index + 1} A**`)
        const content = todoWith(rows, items)
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('超过单阶段上限 8')]),
        )
    })

    it('使用第 7-8 个大条目但未写不拆理由时判红', () => {
        const rows = Array.from({ length: 7 }, (_, index) => `| 81.${index + 1} A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |`)
        const items = Array.from({ length: 7 }, (_, index) => `- [ ] **81.${index + 1} A**`)
        const content = todoWith(rows, items)
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('为何不拆阶段')]),
        )
    })

    it('使用第 7-8 个大条目且写明理由时通过', () => {
        const rows = Array.from({ length: 7 }, (_, index) => `| 81.${index + 1} A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |`)
        const items = [
            '> 为何不拆阶段：七项共享同一契约，拆开会产生重复迁移。',
            ...Array.from({ length: 7 }, (_, index) => `- [ ] **81.${index + 1} A**`),
        ]
        const content = todoWith(rows, items)
        expect(inspectProgressTable({ content }).errors).toEqual([])
    })

    it('不拆理由写在正文条目之后不算阶段头', () => {
        const rows = Array.from({ length: 7 }, (_, index) => `| 81.${index + 1} A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |`)
        const items = [
            ...Array.from({ length: 7 }, (_, index) => `- [ ] **81.${index + 1} A**`),
            '> 为何不拆阶段：七项共享同一契约。',
        ]
        const content = todoWith(rows, items)
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('为何不拆阶段')]),
        )
    })

    it('取消项不计入首个大条目，其后理由仍算阶段头', () => {
        const rows = Array.from({ length: 7 }, (_, index) => `| 81.${index + 1} A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |`)
        const items = [
            '- [-] **81.0 已取消示例**',
            '> 为何不拆阶段：七项共享同一契约。',
            ...Array.from({ length: 7 }, (_, index) => `- [ ] **81.${index + 1} A**`),
        ]
        const content = todoWith(rows, items)
        expect(inspectProgressTable({ content }).errors).toEqual([])
    })

    it('围栏内的不拆理由不满足阶段头要求', () => {
        const rows = Array.from({ length: 7 }, (_, index) => `| 81.${index + 1} A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |`)
        const items = [
            '```md',
            '> 为何不拆阶段：示例',
            '```',
            ...Array.from({ length: 7 }, (_, index) => `- [ ] **81.${index + 1} A**`),
        ]
        const content = todoWith(rows, items)
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('为何不拆阶段')]),
        )
    })

    it('小条目超过 20 个时判红', () => {
        const items = [
            '- [ ] **81.1 A**',
            ...Array.from({ length: 21 }, (_, index) => `    - [ ] 小条目 ${index + 1}`),
        ]
        const content = todoWith(['| 81.1 A | 0/21 | 进行中 | 待提交 | — | 21 → 0 |'], items)
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('小条目')]),
        )
    })

    it('围栏内的 ## 标题不会截断阶段区段', () => {
        const content = todoWith(
            ['| 81.1 A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |'],
            ['```md', '## 示例标题', '```', '- [ ] **81.1 A**'],
        )
        expect(inspectProgressTable({ content }).errors).toEqual([])
    })

    it('占位行混入数据时判红', () => {
        const content = todoWith(['| — | 1/1 | 进行中 | 待提交 | — | 1 → 0 |'], ['- [ ] **81.1 A**'])
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('占位行')]),
        )
    })

    it('行数与正文大条目数一致时通过', () => {
        const content = todoWith(
            ['| 81.1 A | 2/2 | 已闭环 | `abc12345` | R1 Pass | 2 → 2 |'],
            ['- [x] **81.1 A**'],
        )
        expect(inspectProgressTable({ content }).errors).toEqual([])
    })

    it('状态值非法时判红', () => {
        const content = todoWith(
            ['| 81.1 A | 1/1 | 完成 | abc | Pass | 1 → 1 |'],
            ['- [ ] **81.1 A**'],
        )
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('状态')]),
        )
    })

    it('行数与正文不一致时判红', () => {
        const content = todoWith(
            ['| 81.1 A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |'],
            ['- [ ] **81.1 A**', '- [ ] **81.2 B**'],
        )
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('数据行')]),
        )
    })

    it('已闭环行数与 [x] 数量不一致时判红', () => {
        const content = todoWith(
            ['| 81.1 A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |'],
            ['- [x] **81.1 A**'],
        )
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('已闭环')]),
        )
    })

    it('有大条目但缺表时判红', () => {
        const content = ['# todo', '', '## 当前进行中阶段', '', '- [ ] **81.1 A**'].join('\n')
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('缺少进度表')]),
        )
    })

    it('缺少当前阶段区段时判红', () => {
        expect(inspectProgressTable({ content: '# todo' }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('缺少 `## 当前进行中阶段`')]),
        )
    })

    it('表头列名不符时判红', () => {
        const content = todoWith(
            ['| 81.1 A | 1/1 | 进行中 | 待提交 | — | 1 → 0 |'],
            ['- [ ] **81.1 A**'],
        ).replace('| 大条目 |', '| 条目 |')
        expect(inspectProgressTable({ content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('第 1 列')]),
        )
    })
})

describe('check-planning-docs 归档索引', () => {
    it('倒序、全覆盖、区间一致时通过', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01.md', '# 01')
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-02-03.md', '# 02-03')
        const content = archiveWith([
            shardRow('02-03', 'todo-archive-phases-02-03.md'),
            shardRow('01', 'todo-archive-phases-01.md'),
        ])
        const result = inspectArchiveIndex({
            archiveDir: join(root, 'docs/plan/archive'),
            content,
        })
        expect(result.errors).toEqual([])
        expect(result.stats).toEqual({ rows: 2, shards: 2 })
    })

    it('缺少索引区段或表格时判红', () => {
        const root = createFixture()
        const noSection = inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content: '# archive' })
        expect(noSection.errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('缺少 `## 深度归档索引`')]),
        )

        const noTable = inspectArchiveIndex({
            archiveDir: join(root, 'docs/plan/archive'),
            content: ['# archive', '', '## 深度归档索引', '', '> 暂无'].join('\n'),
        })
        expect(noTable.errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('缺少 4 列表格')]),
        )
    })

    it('缺分片时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01.md', '# 01')
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-02.md', '# 02')
        const content = archiveWith([shardRow('01', 'todo-archive-phases-01.md')])
        expect(inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('缺少归档分片')]),
        )
    })

    it('重复登记、倒序错误、日期非法时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01.md', '# 01')
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-02.md', '# 02')
        const content = archiveWith([
            shardRow('01', 'todo-archive-phases-01.md', '2026/01/01'),
            shardRow('02', 'todo-archive-phases-02.md', '2026-01-02'),
            shardRow('02', 'todo-archive-phases-02.md', '2026-01-02'),
        ])
        const messages = inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)
        expect(messages).toEqual(expect.arrayContaining([
            expect.stringContaining('倒序'),
            expect.stringContaining('重复登记'),
            expect.stringContaining('YYYY-MM-DD'),
        ]))
    })

    it('链接越界时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01.md', '# 01')
        const content = archiveWith([
            '| 01 | A | [todo-archive-phases-01.md](../elsewhere/todo-archive-phases-01.md) | 2026-01-01 |',
        ])
        expect(inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('指向')]),
        )
    })

    it('日期非法时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01.md', '# 01')
        const content = archiveWith([shardRow('01', 'todo-archive-phases-01.md', '2026-13-45')])
        expect(inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('合法')]),
        )
    })

    it('区间不连续时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01-10.md', '# 01-10')
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-12-20.md', '# 12-20')
        const content = archiveWith([
            shardRow('12-20', 'todo-archive-phases-12-20.md'),
            shardRow('01-10', 'todo-archive-phases-01-10.md'),
        ])
        expect(inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('不连续')]),
        )
    })

    it('阶段与文件名区间不一致时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01-02.md', '# 01-02')
        const content = archiveWith([shardRow('01-03', 'todo-archive-phases-01-02.md')])
        expect(inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('区间不一致')]),
        )
    })

    it('索引表前残留正文时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01.md', '# 01')
        const content = archiveWith([shardRow('01', 'todo-archive-phases-01.md')]).replace(
            INDEX_HEADER,
            `- 正文残留\n\n${INDEX_HEADER}`,
        )
        expect(inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('残留归档正文')]),
        )
    })

    it('索引区残留正文时判红', () => {
        const root = createFixture()
        writeFixture(root, 'docs/plan/archive/todo-archive-phases-01.md', '# 01')
        const content = archiveWith([shardRow('01', 'todo-archive-phases-01.md')]).replace(
            '## 主窗口保留范围',
            '- 正文残留\n\n## 主窗口保留范围',
        )
        expect(inspectArchiveIndex({ archiveDir: join(root, 'docs/plan/archive'), content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('残留归档正文')]),
        )
    })

    it('分片目录不存在时把索引登记判为缺失', () => {
        const content = archiveWith([shardRow('01', 'todo-archive-phases-01.md')])
        expect(inspectArchiveIndex({ archiveDir: '/tmp/__not_exists_planning_docs__', content }).errors.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('不存在的归档分片')]),
        )
        expect(listTodoShards('/tmp/__not_exists_planning_docs__')).toEqual([])
    })
})

describe('check-planning-docs v1 归档块', () => {
    const validBlock = [
        '## 第八十一阶段：模型（已审计归档）',
        '',
        '> **归档块模型**: v1',
        '',
        '- **阶段名与时间**: 第八十一阶段 · 2026-12-01',
        '- **大条目清单与状态**: 1. A（[x]）',
        '- **提交清单**: `abc12345`',
        '- **质量门结果**: lint / typecheck',
        '- **Review Gate 结论与轮次**: R1 Pass',
        '- **未覆盖边界**: 无',
    ].join('\n')

    it('6 项齐全时不产生 warning', () => {
        expect(inspectV1Blocks({ content: validBlock })).toEqual({ count: 1, warnings: [] })
    })

    it('缺字段时产生 warning', () => {
        const content = validBlock.replace('- **未覆盖边界**: 无', '')
        const result = inspectV1Blocks({ content })
        expect(result.count).toBe(1)
        expect(result.warnings.map((item) => item.message)).toEqual(
            expect.arrayContaining([expect.stringContaining('未覆盖边界')]),
        )
    })

    it('未标记 v1 的存量块不参与断言', () => {
        const content = validBlock.replace('> **归档块模型**: v1\n', '')
        expect(inspectV1Blocks({ content })).toEqual({ count: 0, warnings: [] })
    })

    it('围栏内的 ## 不切分 v1 归档块', () => {
        const content = validBlock.replace(
            '- **质量门结果**: lint / typecheck',
            '```md\n## 示例标题\n```\n\n- **质量门结果**: lint / typecheck',
        )
        expect(inspectV1Blocks({ content })).toEqual({ count: 1, warnings: [] })
    })

    it('正文只提及归档块模型 v1 但无标记行时不参与断言', () => {
        const content = validBlock.replace(
            '> **归档块模型**: v1',
            '> 本块为存量归档块，未按归档块模型 v1 的 6 项填写，按规范冻结。',
        )
        expect(inspectV1Blocks({ content })).toEqual({ count: 0, warnings: [] })
    })
})

describe('check-planning-docs 入口', () => {
    beforeEach(() => {
        process.exitCode = undefined
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        process.exitCode = undefined
    })

    it('默认 mode=error，支持 --mode=warn', () => {
        expect(parseArgs(['node', 'script'])).toEqual({ mode: 'error' })
        expect(parseArgs(['node', 'script', '--mode=warn'])).toEqual({ mode: 'warn' })
        expect(() => parseArgs(['node', 'script', '--mode=loud'])).toThrow(/Unsupported value/u)
    })

    it('无问题时打印 ok 且不置退出码', () => {
        main(['node', 'script'], () => ({
            errors: [],
            stats: { index: { rows: 1, shards: 1 }, progress: { closed: 0, items: 0, rows: 0 }, v1Blocks: 0 },
            warnings: [],
        }))
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('[planning-docs] ok'))
        expect(process.exitCode).toBeUndefined()
    })

    it('error 模式有问题时置退出码 1', () => {
        main(['node', 'script'], () => ({
            errors: [{ file: 'todo.md', line: 1, message: 'boom' }],
            stats: { index: { rows: 0, shards: 0 }, progress: { closed: 0, items: 0, rows: 0 }, v1Blocks: 0 },
            warnings: [],
        }))
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('boom'))
        expect(process.exitCode).toBe(1)
    })

    it('warn 模式有问题时只报告不置退出码', () => {
        main(['node', 'script', '--mode=warn'], () => ({
            errors: [{ file: 'todo.md', line: 1, message: 'boom' }],
            stats: { index: { rows: 0, shards: 0 }, progress: { closed: 0, items: 0, rows: 0 }, v1Blocks: 0 },
            warnings: [{ file: 'todo.md', line: 1, message: 'careful' }],
        }))
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('careful'))
        expect(process.exitCode).toBeUndefined()
    })

    it('formatIssue 输出文件:行号 信息', () => {
        expect(formatIssue({ file: 'a.md', line: 3, message: 'x' })).toBe('a.md:3 x')
    })

    it('仓库当前规划文档通过机检', () => {
        const result = runPlanningDocsCheck()
        expect(result.errors).toEqual([])
    })
})
