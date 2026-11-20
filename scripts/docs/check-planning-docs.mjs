#!/usr/bin/env node
/**
 * 规划文档模型 v1 机检。
 *
 * 覆盖三类结构约束，判据见 `docs/standards/planning-docs.md`：
 * 1. `todo.md` 当前阶段进度表：6 列、行数 = 正文顶层大条目数、状态值合法；
 * 2. `todo-archive.md` 归档索引：4 列、按阶段倒序、覆盖全部分片、无重复且无正文残留；
 * 3. 带 `归档块模型: v1` 标记的归档块：6 项必填字段齐全（warning，不阻断）。
 *
 * 只读、无副作用；接入 `docs:build`、发版前检查与周级回归。
 * 用法：`node scripts/docs/check-planning-docs.mjs`（或 `pnpm docs:check:planning-docs`）。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const projectRoot = path.resolve(__dirname, '..', '..')

export const TODO_PATH = 'docs/plan/todo.md'
export const ARCHIVE_PATH = 'docs/plan/todo-archive.md'
export const ARCHIVE_DIR = 'docs/plan/archive'

export const PROGRESS_HEADINGS = ['大条目', '小条目', '状态', '提交', '审计', '容量']
export const INDEX_HEADINGS = ['阶段', '主题', '归档文件', '归档日期']
export const PROGRESS_STATUSES = ['未开始', '进行中', '已闭环', '已阻塞']
export const V1_BLOCK_MARKER = '归档块模型'
export const V1_BLOCK_MARKER_RE = /^\s*>\s*(?:\*\*)?归档块模型(?:\*\*)?\s*[:：]\s*v1\b/mu
export const V1_BLOCK_FIELDS = [
    '阶段名与时间',
    '大条目清单与状态',
    '提交清单',
    '质量门结果',
    'Review Gate 结论与轮次',
    '未覆盖边界',
]

const TABLE_SEPARATOR_CELL_RE = /^:?-{3,}:?$/u
const TOP_LEVEL_ITEM_RE = /^- \[([ x-])\]/u
const NESTED_ITEM_RE = /^\s{2,}- \[([ x-])\]/u
const MAX_LARGE_ITEMS = 8
const MAX_SMALL_ITEMS = 20
const PHASE_RANGE_RE = /^(\d{1,3})(?:-(\d{1,3}))?$/u
const SHARD_FILE_RE = /^todo-archive-phases-(\d{1,3})(?:-(\d{1,3}))?\.md$/u
const PLACEHOLDER_CELLS = new Set(['—', '-', '暂无'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/u

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            mode: 'error',
        },
        values: {
            '--mode': {
                allowedValues: ['error', 'warn'],
                key: 'mode',
            },
        },
    })
}

export function splitLines(content) {
    return String(content ?? '').split(/\r?\n/u)
}

export function normalizeCell(cell) {
    return String(cell ?? '')
        .trim()
        .replaceAll('**', '')
        .replaceAll('`', '')
        .replace(/\s+/gu, ' ')
}

export function splitTableRow(line) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) {
        return null
    }

    const body = trimmed.replace(/^\|/u, '').replace(/\|$/u, '')
    return body.split('|').map((cell) => normalizeCell(cell))
}

export function isTableSeparator(line) {
    const cells = splitTableRow(line)
    return Boolean(cells && cells.length > 0 && cells.every((cell) => TABLE_SEPARATOR_CELL_RE.test(cell)))
}

/**
 * 标记 fenced code block 所在行（含开闭 fence），供表格与勾选行解析跳过。
 * 只处理以 ``` / ~~~ 起始的围栏；未闭合时后续行全部视为围栏内。
 */
export function markFencedLines(lines) {
    const marks = new Array(lines.length).fill(false)
    let fence = null

    lines.forEach((line, index) => {
        const match = line.match(/^\s*(`{3,}|~{3,})/u)
        if (!fence) {
            if (match) {
                fence = { char: match[1][0], length: match[1].length }
                marks[index] = true
            }
            return
        }

        marks[index] = true
        if (match && match[1][0] === fence.char && match[1].length >= fence.length) {
            fence = null
        }
    })

    return marks
}

/**
 * 在指定标题之后查找第一张 Markdown 表格。
 * 返回 `null` 表示该区段没有表格。
 */
export function findTableAfterHeading(lines, headingPattern) {
    const headingIndex = lines.findIndex((line) => headingPattern.test(line))
    if (headingIndex < 0) {
        return null
    }

    const fenced = markFencedLines(lines)
    let cursor = headingIndex + 1
    while (cursor < lines.length) {
        const line = lines[cursor]
        if (!fenced[cursor] && /^##\s+/u.test(line)) {
            return null
        }
        if (!fenced[cursor] && !fenced[cursor + 1] && splitTableRow(line) && isTableSeparator(lines[cursor + 1] ?? '')) {
            const header = splitTableRow(line)
            const rows = []
            let rowCursor = cursor + 2
            while (rowCursor < lines.length) {
                const row = splitTableRow(lines[rowCursor])
                if (!row) {
                    break
                }
                rows.push({
                    cells: row,
                    line: rowCursor + 1,
                })
                rowCursor += 1
            }
            return {
                endIndex: rowCursor - 1,
                header,
                headingIndex,
                rows,
                startIndex: cursor,
            }
        }
        cursor += 1
    }

    return null
}

export function findSection(lines, headingPattern) {
    const fenced = markFencedLines(lines)
    const start = lines.findIndex((line, index) => !fenced[index] && headingPattern.test(line))
    if (start < 0) {
        return null
    }

    let end = start + 1
    while (end < lines.length && (fenced[end] || !/^##\s+/u.test(lines[end]))) {
        end += 1
    }

    return {
        end,
        lines: lines.slice(start + 1, end),
        start,
    }
}

export function countNestedItems(sectionLines, fenced = []) {
    let total = 0
    sectionLines.forEach((line, index) => {
        if (!fenced[index] && NESTED_ITEM_RE.test(line)) {
            total += 1
        }
    })
    return total
}

export function countTopLevelItems(sectionLines, fenced = []) {
    let active = 0
    let closed = 0

    sectionLines.forEach((line, index) => {
        if (fenced[index]) {
            return
        }
        const match = line.match(TOP_LEVEL_ITEM_RE)
        if (!match || match[1] === '-') {
            return
        }
        if (match[1] === 'x') {
            closed += 1
        }
        active += 1
    })

    return { active, closed }
}

function isPlaceholderRow(cells) {
    return PLACEHOLDER_CELLS.has(cells[0] ?? '')
}

function pushIssue(target, file, line, message) {
    target.push({ file, line, message })
}

export function inspectProgressTable({ content, file = TODO_PATH }) {
    const errors = []
    const lines = splitLines(content)
    const section = findSection(lines, /^##\s+当前进行中阶段/u)

    if (!section) {
        pushIssue(errors, file, 1, '缺少 `## 当前进行中阶段` 区段')
        return { errors, stats: { closed: 0, rows: 0, items: 0 } }
    }

    const fenced = markFencedLines(lines).slice(section.start + 1, section.end)
    const { active, closed } = countTopLevelItems(section.lines, fenced)
    const smallItems = countNestedItems(section.lines, fenced)
    const table = findTableAfterHeading(lines, /^##\s+当前进行中阶段/u)

    if (active > MAX_LARGE_ITEMS) {
        pushIssue(errors, file, section.start + 1, `当前阶段有 ${active} 个大条目，超过单阶段上限 ${MAX_LARGE_ITEMS}`)
    }
    const firstItemIndex = section.lines.findIndex((line, index) => {
        if (fenced[index]) {
            return false
        }
        const match = line.match(TOP_LEVEL_ITEM_RE)
        return Boolean(match && match[1] !== '-')
    })
    const headerLines = section.lines
        .slice(0, firstItemIndex < 0 ? undefined : firstItemIndex)
        .filter((line, index) => !fenced[index])
    if (active >= 7 && active <= MAX_LARGE_ITEMS && !/不拆(?:成两个)?阶段|为何不拆/u.test(headerLines.join('\n'))) {
        pushIssue(errors, file, section.start + 1, '使用第 7-8 个大条目时必须在阶段头写明“为何不拆阶段”')
    }
    if (smallItems > MAX_SMALL_ITEMS) {
        pushIssue(errors, file, section.start + 1, `当前阶段有 ${smallItems} 个小条目，超过单阶段上限 ${MAX_SMALL_ITEMS}`)
    }

    if (!table) {
        pushIssue(errors, file, section.start + 1, '缺少进度表；无进行中阶段时也需保留空表头或整行占位行')
        return { errors, stats: { closed, rows: 0, items: active } }
    }

    if (table.header.length < PROGRESS_HEADINGS.length) {
        pushIssue(errors, file, table.startIndex + 1, `进度表至少需要 ${PROGRESS_HEADINGS.length} 列：${PROGRESS_HEADINGS.join(' / ')}`)
    }

    PROGRESS_HEADINGS.forEach((heading, index) => {
        const actual = table.header[index] ?? ''
        const matched = index === PROGRESS_HEADINGS.length - 1
            ? actual.startsWith(heading)
            : actual === heading
        if (!matched) {
            pushIssue(errors, file, table.startIndex + 1, `进度表第 ${index + 1} 列应为“${heading}”，实际为“${actual || '空'}”`)
        }
    })

    for (const row of table.rows) {
        if (isPlaceholderRow(row.cells) && !row.cells.every((cell) => PLACEHOLDER_CELLS.has(cell))) {
            pushIssue(errors, file, row.line, '占位行必须整行使用 `—`，不得混入数据')
        }
    }

    const dataRows = table.rows.filter((row) => !isPlaceholderRow(row.cells))
    const largeItemIds = new Set()
    let closedRows = 0

    for (const row of dataRows) {
        const [largeItem, smallItems, status, commit] = row.cells
        if (!largeItem) {
            pushIssue(errors, file, row.line, '进度表“大条目”列不能为空')
        } else {
            const id = largeItem.split(/\s+/u)[0]
            if (largeItemIds.has(id)) {
                pushIssue(errors, file, row.line, `进度表大条目 ID 重复：${id}`)
            }
            largeItemIds.add(id)
        }

        if (!/^\d+\/\d+$/u.test(smallItems ?? '')) {
            pushIssue(errors, file, row.line, `“小条目”列应为 N/M 形式，实际为“${smallItems || '空'}”`)
        }

        if (!PROGRESS_STATUSES.includes(status)) {
            pushIssue(errors, file, row.line, `“状态”列只能是 ${PROGRESS_STATUSES.join(' / ')}，实际为“${status || '空'}”`)
        }
        if (status === '已闭环') {
            closedRows += 1
        }

        if (!commit) {
            pushIssue(errors, file, row.line, '“提交”列不能为空（未提交写 `待提交`）')
        }
    }

    if (dataRows.length !== active) {
        pushIssue(errors, file, table.startIndex + 1, `进度表有 ${dataRows.length} 个数据行，正文有 ${active} 个大条目`)
    }

    if (closedRows !== closed) {
        pushIssue(errors, file, table.startIndex + 1, `进度表标记“已闭环” ${closedRows} 行，正文有 ${closed} 个 [x] 大条目`)
    }

    return { errors, stats: { closed, rows: dataRows.length, items: active } }
}

export function parseShardRange(value) {
    const match = String(value ?? '').trim().match(PHASE_RANGE_RE)
    if (!match) {
        return null
    }

    const start = Number(match[1])
    const end = match[2] === undefined ? start : Number(match[2])
    if (end < start) {
        return null
    }

    return { end, start }
}

export function parseShardFileName(fileName) {
    const match = String(fileName ?? '').match(SHARD_FILE_RE)
    if (!match) {
        return null
    }

    const start = Number(match[1])
    const end = match[2] === undefined ? start : Number(match[2])
    if (end < start) {
        return null
    }

    return { end, start }
}

export function extractLinkTarget(cell) {
    const match = String(cell ?? '').match(/\]\(([^)]+)\)/u)
    return match?.[1]?.trim() ?? null
}

export function isValidDate(value) {
    if (!DATE_RE.test(String(value ?? ''))) {
        return false
    }
    const [year, month, day] = String(value).split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function listTodoShards(archiveDir) {
    if (!existsSync(archiveDir)) {
        return []
    }

    return readdirSync(archiveDir)
        .filter((entry) => SHARD_FILE_RE.test(entry))
        .sort()
}

export function inspectArchiveIndex({ archiveDir, content, file = ARCHIVE_PATH }) {
    const errors = []
    const lines = splitLines(content)
    const section = findSection(lines, /^##\s+深度归档索引/u)

    if (!section) {
        pushIssue(errors, file, 1, '缺少 `## 深度归档索引` 区段')
        return { errors, stats: { rows: 0, shards: 0 } }
    }

    const table = findTableAfterHeading(lines, /^##\s+深度归档索引/u)
    if (!table) {
        pushIssue(errors, file, section.start + 1, '深度归档索引缺少 4 列表格')
        return { errors, stats: { rows: 0, shards: 0 } }
    }

    if (table.header.length !== INDEX_HEADINGS.length) {
        pushIssue(errors, file, table.startIndex + 1, `索引表必须为 4 列：${INDEX_HEADINGS.join(' / ')}`)
    }
    INDEX_HEADINGS.forEach((heading, index) => {
        const actual = table.header[index] ?? ''
        if (actual !== heading) {
            pushIssue(errors, file, table.startIndex + 1, `索引表第 ${index + 1} 列应为“${heading}”，实际为“${actual || '空'}”`)
        }
    })

    const seen = new Set()
    const ordered = []
    for (const row of table.rows) {
        const [phaseCell, , fileCell, dateCell] = row.cells
        const range = parseShardRange(phaseCell)
        if (!range) {
            pushIssue(errors, file, row.line, `“阶段”列应为 <起> 或 <起>-<止>，实际为“${phaseCell || '空'}”`)
            continue
        }

        const target = extractLinkTarget(fileCell)
        const normalizedTarget = (target ?? '').replace(/^\.\//u, '')
        if (!normalizedTarget.startsWith('archive/') && !normalizedTarget.startsWith('docs/plan/archive/')) {
            pushIssue(errors, file, row.line, `“归档文件”列必须指向 ./archive/ 或 docs/plan/archive/，实际为“${fileCell || '空'}”`)
            continue
        }
        const fileName = path.posix.basename(normalizedTarget.split('#')[0].split('?')[0])
        const fileRange = parseShardFileName(fileName)
        if (!fileRange) {
            pushIssue(errors, file, row.line, `“归档文件”列必须链接 todo-archive-phases-<起>[-<止>].md，实际为“${fileCell || '空'}”`)
            continue
        }
        if (fileRange.start !== range.start || fileRange.end !== range.end) {
            pushIssue(errors, file, row.line, `阶段 ${phaseCell} 与归档文件 ${fileName} 的区间不一致`)
        }

        if (seen.has(fileName)) {
            pushIssue(errors, file, row.line, `归档文件重复登记：${fileName}`)
        }
        seen.add(fileName)

        if (!isValidDate(dateCell)) {
            pushIssue(errors, file, row.line, `“归档日期”列应为合法的 YYYY-MM-DD，实际为“${dateCell || '空'}”`)
        }

        ordered.push({ line: row.line, range })
    }

    for (let index = 1; index < ordered.length; index += 1) {
        if (ordered[index - 1].range.start <= ordered[index].range.start) {
            pushIssue(errors, file, ordered[index].line, '索引表必须按阶段倒序排列')
        }
    }

    const ascending = [...ordered].sort((left, right) => left.range.start - right.range.start)
    for (let index = 1; index < ascending.length; index += 1) {
        if (ascending[index].range.start !== ascending[index - 1].range.end + 1) {
            pushIssue(errors, file, ascending[index].line, `归档分片区间不连续：${ascending[index - 1].range.end} 与 ${ascending[index].range.start} 之间缺阶段`)
        }
    }

    const expectedShards = listTodoShards(archiveDir)
    for (const shard of expectedShards) {
        if (!seen.has(shard)) {
            pushIssue(errors, file, table.startIndex + 1, `索引表缺少归档分片：${shard}`)
        }
    }
    for (const shard of seen) {
        if (!expectedShards.includes(shard)) {
            pushIssue(errors, file, table.startIndex + 1, `索引表登记了不存在的归档分片：${shard}`)
        }
    }

    for (let index = section.start + 1; index < section.end; index += 1) {
        if (index >= table.startIndex && index <= table.endIndex) {
            continue
        }
        const line = lines[index].trim()
        if (!line || line.startsWith('>')) {
            continue
        }
        pushIssue(errors, file, index + 1, '索引区只允许表格与说明性引用，疑似残留归档正文')
    }

    return { errors, stats: { rows: ordered.length, shards: expectedShards.length } }
}

export function inspectV1Blocks({ content, file = ARCHIVE_PATH }) {
    const warnings = []
    const lines = splitLines(content)
    const fenced = markFencedLines(lines)
    const blocks = []
    let count = 0

    lines.forEach((line, index) => {
        if (!fenced[index] && /^##\s+/u.test(line)) {
            blocks.push({ line: index + 1, title: line.replace(/^##\s+/u, '').trim() })
        }
    })

    blocks.forEach((block, index) => {
        const end = index + 1 < blocks.length ? blocks[index + 1].line - 1 : lines.length
        const body = lines.slice(block.line, end).join('\n')
        if (!V1_BLOCK_MARKER_RE.test(body)) {
            return
        }

        count += 1
        for (const field of V1_BLOCK_FIELDS) {
            if (!body.includes(field)) {
                pushIssue(warnings, file, block.line, `v1 归档块缺少必填字段：“${field}”`)
            }
        }
    })

    return { count, warnings }
}

export function runPlanningDocsCheck({ root = projectRoot } = {}) {
    const errors = []
    const warnings = []
    const stats = {}

    const todoContent = readFileSync(path.join(root, TODO_PATH), 'utf8')
    const progress = inspectProgressTable({ content: todoContent, file: TODO_PATH })
    errors.push(...progress.errors)
    stats.progress = progress.stats

    const archiveContent = readFileSync(path.join(root, ARCHIVE_PATH), 'utf8')
    const archive = inspectArchiveIndex({
        archiveDir: path.join(root, ARCHIVE_DIR),
        content: archiveContent,
        file: ARCHIVE_PATH,
    })
    errors.push(...archive.errors)
    stats.index = archive.stats

    const blocks = inspectV1Blocks({ content: archiveContent, file: ARCHIVE_PATH })
    warnings.push(...blocks.warnings)
    stats.v1Blocks = blocks.count

    return { errors, stats, warnings }
}

export function formatIssue(issue) {
    return `${issue.file}:${issue.line} ${issue.message}`
}

export function main(argv = process.argv, check = runPlanningDocsCheck) {
    const options = parseArgs(argv)
    const { errors, stats, warnings } = check()

    for (const warning of warnings) {
        console.warn(`[planning-docs] warning: ${formatIssue(warning)}`)
    }

    if (errors.length > 0) {
        console.error(`[planning-docs] ${errors.length} 个结构问题:`)
        for (const error of errors) {
            console.error(`  - ${formatIssue(error)}`)
        }
        if (options.mode === 'error') {
            process.exitCode = 1
        }
        return
    }

    console.info(`[planning-docs] ok: 进度表 ${stats.progress.rows}/${stats.progress.items} 行、归档索引 ${stats.index.rows}/${stats.index.shards} 个分片、v1 归档块 ${stats.v1Blocks} 个`)
}

if (isDirectExecution(import.meta.url)) {
    main()
}
