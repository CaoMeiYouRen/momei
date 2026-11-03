import fs from 'node:fs'
import path from 'node:path'

/**
 * 视觉一致性门禁的预算与参考态路径解析。
 *
 * 从 `helpers.ts` 抽出的原因：`helpers.ts` 依赖 `@playwright/test`，而预算解析是**纯文件读取 +
 * 档位回退**，独立成模块后可在 Vitest 中直接单测（`tests/scripts/parity-budget.test.ts`），
 * 避免为了验证「reader 档回退是否生效」而加载 Playwright。
 *
 * 参见 `docs/design/governance/2026-10-13-visual-parity-gate.md` §3（分级严格度）。
 */

/** 页面受众分级：决定容差口径。 */
export type ParityTier = 'reader' | 'admin'

export interface ParityRegion {
    x: number
    y: number
    width: number
    height: number
    pixels: number
}

/** 允许清单条目：区域 + 像素量 + 归因 + 责任人。 */
export interface ParityAllowlistEntry {
    region: { x: number, y: number, width: number, height: number }
    /** 该区域允许被扣减的最大差异像素数（超出部分计入未归因差异）。 */
    pixels: number
    /** 归因：现象 + 处置通道（①~④）+ 依据指针。 */
    reason: string
    /** 责任人（本项目以 agent 角色标识）。 */
    owner: string
}

export interface ParityBudgetEntry {
    tier: ParityTier
    maxDiffPixels: number
    maxDiffPixelRatio: number
    allowlist: ParityAllowlistEntry[]
    /** 校准说明：校准时点 + 实测样值。 */
    note?: string
}

export interface ParityBudgetFile {
    meta: {
        updatedAt: string
        viewport: string
        pixelThreshold: number
        referenceDir: string
        note: string
    }
    tiers: Record<ParityTier, { maxDiffPixels: number, maxDiffPixelRatio: number, description: string }>
    entries: Record<string, ParityBudgetEntry>
}

const repoRoot = process.cwd()
const budgetFile = path.join(repoRoot, 'tests', 'visual', 'parity-budget.json')
export const parityReferenceDir = path.join(repoRoot, 'tests', 'visual', 'parity', 'reference')

let cachedBudget: ParityBudgetFile | null = null

export function loadBudget(): ParityBudgetFile {
    if (!cachedBudget) {
        cachedBudget = JSON.parse(fs.readFileSync(budgetFile, 'utf8')) as ParityBudgetFile
    }
    return cachedBudget
}

/**
 * 预算档位解析：**显式 tier 优先**（由 `routes.ts` 的路由定义传入），
 * 缺省时才回退到旧的名字启发式（testName 含 `reader` 即 reader 档）。
 *
 * 为什么不再只靠名字启发式：B3 起的 `reader` 档路由命名是 `auth-login` / `submit-page` /
 * `user-settings`，均不含 `reader` 字样；只靠启发式会让公开页**静默**落到 `admin` 档
 * （3000px / 0.35%），失去「公开页容差必须极严」的约束且不会报错。
 */
export function resolveBudgetTier(name: string, tier?: ParityTier): ParityTier {
    if (tier) {
        return tier
    }
    return name.includes('reader') ? 'reader' : 'admin'
}

export function getBudgetEntry(name: string, tier?: ParityTier): ParityBudgetEntry {
    const budget = loadBudget()
    const entry = budget.entries[name]
    if (entry) {
        return entry
    }

    const resolvedTier = resolveBudgetTier(name, tier)
    const fallback = budget.tiers[resolvedTier]
    return {
        tier: resolvedTier,
        maxDiffPixels: fallback.maxDiffPixels,
        maxDiffPixelRatio: fallback.maxDiffPixelRatio,
        allowlist: [],
        note: `未在 parity-budget.json 显式声明，按 ${resolvedTier} 档默认口径回退`,
    }
}

export function getReferencePath(name: string): string {
    return path.join(parityReferenceDir, `${name}.reference.png`)
}
