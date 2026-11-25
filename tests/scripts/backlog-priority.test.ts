import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Backlog 双轴优先级守卫（规划规范 §3.5）。
 *
 * 校验 backlog.md 中两张候选表（延后保留池 + 待上收候选）：
 * 1. 每个候选行都有 1–5 整数的重要 / 紧急分（`3.5`、`4分`、空值都不合法）；
 * 2. 建议列与四象限规则一致；
 * 3. 说明列包含可复算依据（issue / PR / 快照日期 / 触发条件）；
 * 4. todo.md 不复制双轴分数。
 *
 * 关键纪律：候选行缺失或非法必须失败，不能静默跳过——否则「漏填分数」不会被门禁发现。
 */

const repoRoot = process.cwd()
const backlogPath = path.join(repoRoot, 'docs', 'plan', 'backlog.md')
const todoPath = path.join(repoRoot, 'docs', 'plan', 'todo.md')

export interface CandidateRow {
    line: number
    table: number
    important: string
    urgent: string
    advice: string
    rationale: string
}

export interface ParsedPriorityTables {
    rows: CandidateRow[]
    tableCount: number
}

const SCORE_PATTERN = /^[1-5]$/u
const EVIDENCE_PATTERN = /(#\d+|issue|PR|快照|触发条件|\d{4}-\d{2}-\d{2})/iu
const SCORE_TEXT_PATTERN = /重要\s*[:：]?\s*[1-5]/u
const URGENT_TEXT_PATTERN = /紧急\s*[:：]?\s*[1-5]/u

export function expectedAdvice(important: number, urgent: number): string {
    if (important >= 4 && urgent >= 4) {
        return '首排'
    }
    if (important >= 4) {
        return '排期'
    }
    if (urgent >= 4) {
        return '快速评估'
    }
    return '延后'
}

export function parsePriorityTables(markdown: string): ParsedPriorityTables {
    const lines = markdown.split('\n')
    const rows: CandidateRow[] = []
    let tableCount = 0
    let inTable = false
    let columns: string[] = []
    let tableIndex = 0

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? ''
        if (!line.trim().startsWith('|')) {
            inTable = false
            columns = []
            continue
        }

        const cells = line.trim().replace(/^\|/u, '').replace(/\|$/u, '').split('|').map((cell) => cell.trim())
        if (!inTable) {
            if (cells.includes('重要') && cells.includes('紧急') && cells.includes('建议')) {
                inTable = true
                columns = cells
                tableIndex = ++tableCount
            }
            continue
        }

        if (cells.every((cell) => /^:?-{2,}:?$/u.test(cell) || cell === '')) {
            continue
        }

        const importantIndex = columns.indexOf('重要')
        const urgentIndex = columns.indexOf('紧急')
        const adviceIndex = columns.indexOf('建议')
        const rationaleIndex = columns.findIndex((column) => column.startsWith('说明'))

        rows.push({
            line: index + 1,
            table: tableIndex,
            important: cells[importantIndex] ?? '',
            urgent: cells[urgentIndex] ?? '',
            advice: cells[adviceIndex] ?? '',
            rationale: rationaleIndex >= 0 ? cells[rationaleIndex] ?? '' : '',
        })
    }

    return { rows, tableCount }
}

function findRowProblems({ rows }: ParsedPriorityTables): string[] {
    const problems: string[] = []

    for (const row of rows) {
        if (!SCORE_PATTERN.test(row.important) || !SCORE_PATTERN.test(row.urgent)) {
            problems.push(`L${row.line}: 分数非法（重要 "${row.important}" / 紧急 "${row.urgent}"）`)
            continue
        }

        const important = Number(row.important)
        const urgent = Number(row.urgent)
        const expected = expectedAdvice(important, urgent)
        if (row.advice !== expected) {
            problems.push(`L${row.line}: 重要 ${important}/紧急 ${urgent} 应为 ${expected}，实际 ${row.advice}`)
        }
        if (!row.rationale || !EVIDENCE_PATTERN.test(row.rationale)) {
            problems.push(`L${row.line}: 说明缺少可复算依据（需 issue / PR / 快照日期 / 触发条件）`)
        }
    }

    return problems
}

function stripCodeBlocks(markdown: string): string {
    return markdown.replace(/```[\s\S]*?```/g, '')
}

describe('backlog 双轴优先级', () => {
    const backlog = fs.readFileSync(backlogPath, 'utf8')
    const todo = stripCodeBlocks(fs.readFileSync(todoPath, 'utf8'))
    const parsed = parsePriorityTables(backlog)

    it('识别到两张候选表且每行都被校验（无静默跳过）', () => {
        expect(parsed.tableCount).toBe(2)
        expect(parsed.rows.length).toBeGreaterThan(0)
        expect(findRowProblems(parsed)).toEqual([])
    })

    it('四象限建议映射覆盖四个分支', () => {
        expect(expectedAdvice(4, 4)).toBe('首排')
        expect(expectedAdvice(4, 3)).toBe('排期')
        expect(expectedAdvice(3, 4)).toBe('快速评估')
        expect(expectedAdvice(3, 3)).toBe('延后')
    })

    it('缺分数 / 非法分数 / 缺依据必须报错（判别性自测）', () => {
        const sample = `| # | 条目 | 重要 | 紧急 | 建议 | 说明 |
|:---|:---|:---:|:---:|:---|:---|
| 1 | 缺分数 |  | 2 | 排期 | 无依据 |
| 2 | 小数 | 3.5 | 2 | 延后 | issue #1 |
| 3 | 越界 | 6 | 0 | 延后 | issue #1 |
| 4 | 缺依据 | 3 | 2 | 延后 | 无依据 |
`
        const problems = findRowProblems(parsePriorityTables(sample))
        expect(problems.filter((problem) => problem.includes('分数非法')).length).toBeGreaterThanOrEqual(3)
        expect(problems.filter((problem) => problem.includes('说明缺少可复算依据')).length).toBeGreaterThanOrEqual(1)
    })

    it('todo.md 不复制双轴分数（含明细写法）', () => {
        const normalizedTodo = todo.replaceAll(/[*_]/gu, '')

        expect(normalizedTodo).not.toMatch(/\|\s*重要\s*\|/u)
        expect(normalizedTodo).not.toMatch(SCORE_TEXT_PATTERN)
        expect(normalizedTodo).not.toMatch(URGENT_TEXT_PATTERN)
        /* 正样本：确认正则确实能抓到实际写法，避免规则退化成永不命中。 */
        expect('重要 4 / 紧急 3 / 建议 排期').toMatch(SCORE_TEXT_PATTERN)
        expect('重要 4 / 紧急 3 / 建议 排期').toMatch(URGENT_TEXT_PATTERN)
    })
})
