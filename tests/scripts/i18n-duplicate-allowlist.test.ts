import { accessSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { i18nRuntimeTestFiles } from '../../vitest.shared'
import { computeGroupId } from '@/scripts/i18n/audit-duplicate-messages.mjs'

const root = process.cwd()
const allowlist = JSON.parse(readFileSync(resolve(root, 'scripts/i18n/duplicate-group-allowlist.json'), 'utf8')) as {
    reviewedAt: string
    reviewDueAt: string
    groups: { id: string, keys: string[], reason: string, reviewAt: string }[]
}

function daysBetween(from: string, to: string) {
    return (Date.parse(to) - Date.parse(from)) / 86_400_000
}

describe('i18n 重复组 allowlist 治理', () => {
    it('每条都有唯一 id、至少两个 key、理由与复核日期', () => {
        const ids = new Set<string>()
        for (const group of allowlist.groups) {
            expect(ids.has(group.id), `${group.id} 重复`).toBe(false)
            ids.add(group.id)
            expect(group.keys.length).toBeGreaterThanOrEqual(2)
            expect(group.reason.trim().length).toBeGreaterThanOrEqual(10)
            expect(group.reviewAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
        }
    })

    it('每条 id 与当前 keys 的哈希一致（allowlist 未脱节）', () => {
        for (const group of allowlist.groups) {
            expect(computeGroupId({ keys: group.keys.map((key) => ({ key })) })).toBe(group.id)
        }
    })

    it('复核周期不超过 6 个月且未过期', () => {
        expect(daysBetween(allowlist.reviewedAt, allowlist.reviewDueAt)).toBeLessThanOrEqual(183)
        expect(Date.parse(allowlist.reviewedAt)).toBeLessThanOrEqual(Date.parse(allowlist.reviewDueAt))
        expect(Date.parse(allowlist.reviewDueAt)).toBeGreaterThan(Date.now())
        for (const group of allowlist.groups) {
            expect(Date.parse(group.reviewAt)).toBeLessThanOrEqual(Date.parse(allowlist.reviewDueAt))
        }
    })

    it('三类复核口径按组互斥分类且都有落点', () => {
        const categories = allowlist.groups.map((group) => {
            if (/动态|拼接|\$\{/u.test(group.reason)) {
                return 'dynamic'
            }
            return group.reason.includes('跨模块') ? 'cross-module' : 'intra-module'
        })
        for (const category of ['dynamic', 'cross-module', 'intra-module']) {
            expect(categories.filter((item) => item === category).length, `${category} 为空`).toBeGreaterThan(0)
        }
    })

    it('公开列表页已纳入 i18n runtime 验证面', () => {
        for (const relativePath of ['pages/archives/index.test.ts', 'pages/categories/index.test.ts', 'pages/tags/index.test.ts']) {
            expect(i18nRuntimeTestFiles).toContain(relativePath)
            expect(() => accessSync(resolve(root, relativePath))).not.toThrow()
        }
    })
})
