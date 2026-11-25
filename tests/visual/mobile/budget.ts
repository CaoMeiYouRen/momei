import fs from 'node:fs'
import path from 'node:path'

/**
 * 移动视觉层的「按路由分档」预算解析。
 *
 * 与桌面 parity 预算（`tests/visual/parity-budget.json`）同结构（meta / tiers / entries），
 * 但阈值独立：移动层是基线自比对（当前渲染 ↔ 仓库基线），路由集合与桌面 parity 不同，
 * 合并到同一文件会让「桌面参考态」与「移动基线」两套语义混在一起。
 *
 * 只使用绝对像素上限：比例阈值在 390×844 下恒小于绝对上限（Playwright 取 `Math.min`），
 * 配置它会制造「双阈值都在守门」的假象（同一陷阱见测试规范 §7.1）。
 *
 * 与 `tests/visual/parity/budget.ts` 相同，这里保持纯文件读取，不依赖 `@playwright/test`，
 * 便于 Vitest 直接单测。
 */

export type MobileVisualTier = 'reader'

export interface MobileBudgetEntry {
    tier: MobileVisualTier
    maxDiffPixels: number
}

export interface MobileBudgetFile {
    meta: {
        updatedAt: string
        viewport: string
        pixelThreshold: number
        referenceDir: string
        note: string
    }
    tiers: Record<MobileVisualTier, { maxDiffPixels: number, description: string }>
    entries: Record<string, MobileBudgetEntry>
}

const repoRoot = process.cwd()
const budgetFile = path.join(repoRoot, 'tests', 'visual', 'mobile', 'parity-budget.json')

export function readMobileBudget(budgetPath = budgetFile): MobileBudgetFile {
    return JSON.parse(fs.readFileSync(budgetPath, 'utf8')) as MobileBudgetFile
}

/**
 * 按 testName 取预算；未登记即抛错。
 *
 * 不用「回退默认档」：当前只有 reader 一档，回退值与登记值完全相同，回退会让
 * 「漏登记新路由」静默通过；未来新增更宽的档位时，回退还会把漏登记项带到更宽的阈值上。
 */
export function getMobileBudgetEntry(name: string, budget = readMobileBudget()): MobileBudgetEntry {
    const entry = budget.entries[name]
    if (!entry) {
        throw new Error(`[mobile-visual] 缺少预算条目：${name}（请在 tests/visual/mobile/parity-budget.json 登记）`)
    }
    return entry
}
