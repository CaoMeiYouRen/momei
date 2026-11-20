import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    findManagedEntryRange,
    resolveManagedInsertionIndex,
    resolveRegressionWindowPath,
    toPosixRelativePath,
    upsertRegressionWindowContent,
} from '@/scripts/shared/regression-window.mjs'

const HEADER = [
    '# 当前回归窗口',
    '',
    '> 说明',
    '',
].join('\n')

const FIRST_RECORD = [
    '## 2026-11-19 阶段收口前周期性回归（自动回填）',
    '',
    '- 结果摘要: Pass',
    '',
].join('\n')

function makeEntry(id, title, body = `${id} body`) {
    return { body, id, title }
}

function markerOrder(content) {
    return [...content.matchAll(/<!-- regression-window:(start|end):([^ ]+)/gu)].map((match) => `${match[1]}:${match[2]}`)
}

describe('regression-window 插入位置', () => {
    it('无历史记录时追加到末尾', () => {
        const next = upsertRegressionWindowContent(HEADER, makeEntry('a', '2026-11-19 A'))
        expect(next).toContain(HEADER.trimEnd())
        expect(markerOrder(next)).toEqual(['start:a', 'end:a'])
    })

    it('有首条日期标题时插在标题之前', () => {
        const next = upsertRegressionWindowContent(`${HEADER}${FIRST_RECORD}`, makeEntry('a', '2026-11-20 A'))
        expect(next.indexOf('start:a')).toBeLessThan(next.indexOf('## 2026-11-19'))
    })

    it('已有 managed block 时插在首个 start 之前，而不是嵌进旧块', () => {
        const withA = upsertRegressionWindowContent(`${HEADER}${FIRST_RECORD}`, makeEntry('a', '2026-11-19 A'))
        const next = upsertRegressionWindowContent(withA, makeEntry('b', '2026-11-20 B'))
        expect(markerOrder(next)).toEqual(['start:b', 'end:b', 'start:a', 'end:a'])
    })

    it('连续 upsert 保持顺次排列，不产生嵌套', () => {
        let content = upsertRegressionWindowContent(`${HEADER}${FIRST_RECORD}`, makeEntry('a', '2026-11-18 A'))
        content = upsertRegressionWindowContent(content, makeEntry('b', '2026-11-19 B'))
        content = upsertRegressionWindowContent(content, makeEntry('c', '2026-11-20 C'))
        expect(markerOrder(content)).toEqual([
            'start:c', 'end:c',
            'start:b', 'end:b',
            'start:a', 'end:a',
        ])
    })
})

describe('regression-window 既有块更新', () => {
    it('同 id 重 upsert 只替换自身，不重复、不删除其他块', () => {
        let content = upsertRegressionWindowContent(HEADER, makeEntry('a', '2026-11-18 A'))
        content = upsertRegressionWindowContent(content, makeEntry('b', '2026-11-19 B'))
        const next = upsertRegressionWindowContent(content, makeEntry('b', '2026-11-19 B updated', 'new body'))
        expect(markerOrder(next)).toEqual(['start:b', 'end:b', 'start:a', 'end:a'])
        expect(next.match(/start:b/gu)).toHaveLength(1)
        expect(next).toContain('new body')
        expect(next).not.toContain('b body')
        expect(next).toContain('a body')
    })

    it('嵌套旧块重 upsert 外层时抛错，避免删除内层记录', () => {
        const nested = [
            '<!-- regression-window:start:outer -->',
            '## 2026-11-18 outer',
            '',
            '<!-- regression-window:start:inner -->',
            '## 2026-11-19 inner',
            '',
            '<!-- regression-window:end:inner -->',
            '',
            '<!-- regression-window:end:outer -->',
        ].join('\n')
        expect(() => upsertRegressionWindowContent(nested, makeEntry('outer', '2026-11-20 outer'))).toThrow(/Nested regression window/u)
    })

    it('findManagedEntryRange 对缺失 id 返回 null', () => {
        expect(findManagedEntryRange(HEADER, 'missing')).toBeNull()
    })

    it('resolveManagedInsertionIndex 优先选择更早的 managed start', () => {
        const content = `${HEADER}${FIRST_RECORD}\n<!-- regression-window:start:a -->\n`
        const managedIndex = content.indexOf('<!-- regression-window:start:a -->')
        const headingIndex = content.indexOf('## 2026-11-19')
        expect(resolveManagedInsertionIndex(content)).toBe(Math.min(managedIndex, headingIndex))
    })
})

describe('regression-window 当前窗口顺序', () => {
    it('current.md 的 managed blocks 必须顺次排列，且 11-19 在 11-18 之前', () => {
        const content = readFileSync(resolve(process.cwd(), 'docs/reports/regression/current.md'), 'utf8')
        const markers = markerOrder(content)
        let open = false

        for (const marker of markers) {
            if (marker.startsWith('start:')) {
                expect(open).toBe(false)
                open = true
            } else {
                expect(open).toBe(true)
                open = false
            }
        }

        expect(open).toBe(false)
        expect(markers.findIndex((marker) => marker.includes('2026-11-19')))
            .toBeLessThan(markers.findIndex((marker) => marker.includes('2026-11-18')))
    })
})

describe('regression-window 路径工具', () => {
    it('解析当前窗口路径与相对路径', () => {
        expect(resolveRegressionWindowPath('/repo')).toBe('/repo/docs/reports/regression/current.md')
        expect(toPosixRelativePath('/repo/docs/reports/regression/current.md', '/repo/docs/reports/regression/archive/a.md'))
            .toBe('archive/a.md')
    })
})
