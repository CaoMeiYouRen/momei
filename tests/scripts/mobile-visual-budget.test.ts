import { describe, expect, it } from 'vitest'
import { getMobileBudgetEntry, readMobileBudget } from '../visual/mobile/budget'
import { MOBILE_LIST_STATE_CASES, MOBILE_READER_ROUTES, MOBILE_SKELETON_CASES } from '../visual/mobile/reader.routes'

/**
 * 移动视觉预算的单元测试。
 *
 * 锁住三件事：
 * 1. 每条移动基线都有显式预算条目，且没有孤儿键（新增 / 删除路由都会立即失败）；
 * 2. 预算不超过所属档位上限，防止某条目把阈值放大后 tier 仍写 reader；
 * 3. 未登记名称抛错，不静默回退到更宽阈值。
 */
describe('移动视觉预算', () => {
    const budget = readMobileBudget()
    const expectedNames = new Set([
        ...MOBILE_READER_ROUTES.flatMap((route) => [`${route.name}-light`, `${route.name}-dark`]),
        ...MOBILE_LIST_STATE_CASES,
        ...MOBILE_SKELETON_CASES,
    ])

    it('12 条路由 × 明暗两主题全部登记且无孤儿键', () => {
        expect(MOBILE_READER_ROUTES).toHaveLength(12)
        expect(new Set(Object.keys(budget.entries))).toEqual(expectedNames)

        for (const name of expectedNames) {
            expect(budget.entries[name]?.tier, name).toBe('reader')
        }
    })

    it('逐条预算不超过所属档位上限', () => {
        for (const [name, entry] of Object.entries(budget.entries)) {
            expect(entry.maxDiffPixels, name).toBeLessThanOrEqual(budget.tiers[entry.tier].maxDiffPixels)
        }
    })

    it('未登记名称抛错而不是回退', () => {
        expect(() => getMobileBudgetEntry('mobile-unregistered-light', budget)).toThrow(/缺少预算条目/u)
    })

    it('已登记条目原样返回', () => {
        expect(getMobileBudgetEntry('mobile-home-light', budget)).toBe(budget.entries['mobile-home-light'])
    })
})
