import { describe, expect, it } from 'vitest'
import { getBudgetEntry, resolveBudgetTier } from '../visual/parity/budget'

/**
 * 预算档位解析的单元测试。
 *
 * 背景：`reader` 档从未启用（视觉门禁 17 条 admin / 0 条 reader），第七十阶段首次接入
 * `auth-login` / `submit-page` 这类**名字不含 `reader`** 的公开页。若仍只靠名字启发式，
 * 公开页会静默落到 `admin` 档（3000px / 0.35%）且不报错——本测试锁住「显式 tier 优先」。
 */
describe('parity 预算档位解析', () => {
    it('显式 tier 优先于名字启发式（公开页不被静默降级）', () => {
        expect(resolveBudgetTier('auth-login-light', 'reader')).toBe('reader')
        expect(resolveBudgetTier('auth-login-light')).toBe('admin')

        const entry = getBudgetEntry('auth-login-light', 'reader')
        expect(entry.tier).toBe('reader')
        expect(entry.note).toContain('reader')
    })

    it('显式 admin 不会因名字含 reader 被抬成读者档', () => {
        expect(resolveBudgetTier('my-reader-page-light', 'admin')).toBe('admin')
    })

    it('缺省时保留旧的名字启发式（向后兼容）', () => {
        expect(resolveBudgetTier('admin-reader-preview-light')).toBe('reader')
        expect(resolveBudgetTier('admin-comments-list-light')).toBe('admin')
    })

    it('parity-budget.json 中已声明的条目优先于任何档位参数', () => {
        const entry = getBudgetEntry('admin-comments-list-light', 'reader')
        expect(entry.tier).toBe('admin')
        expect(entry.allowlist.length).toBeGreaterThan(0)
    })
})
