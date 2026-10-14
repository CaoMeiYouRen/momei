import fs from 'node:fs'
import path from 'node:path'
import { type Page, type TestInfo, expect } from '@playwright/test'
import { dynamicMask } from '../helpers/visual'
/**
 * 视觉一致性门禁（visual parity gate）公共实现。
 *
 * 目的：在组件迁移（PrimeVue → caomei-ui）逐路由推进时，把「当前渲染」与
 * 「迁移前 PrimeVue 参考态」做逐像素比对，并按「页面受众分级」的预算判定，
 * 使观感偏差只能被显式归因（允许清单），不得静默增长。
 *
 * 依据：
 * - 迁移方案 §8.2「截图识别层」的阈值纪律与逐项归因要求；
 * - 用户口径：`reader`（面向读者 / 公开页）档极严、`admin`（面向管理员）档
 *   容许一定偏差但需「看起来差不多」；
 * - 偏差处置通道优先级 ①`--caomei-*` token → ②caomei 具名预设 → ③外层包装 +
 *   选择器级覆盖 → ④上游反馈。
 *
 * 实现纪律：
 * - 参考态采集与当前态比对使用**同一段渲染代码**（同一 spec），因此 mask /
 *   等待 / 截图选项天然一致，避免参考态与当前态渲染条件漂移；
 * - 像素差异算法与 Playwright 既用口径对齐（pixelmatch 的 YIQ 距离 +
 *   `threshold` 归一化），不使用第三方依赖；
 * - 允许清单按「区域 + 像素量」扣减，扣减上限即清单声明值，超出部分照常计入，
 *   从而保证「已接受偏差」一旦增长即被门禁捕获。
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

/** 与既有 `playwright.visual.config.ts` 的 `threshold` 保持一致的单像素容差。 */
export const PARITY_PIXEL_THRESHOLD = 0.2

/**
 * 宽松版渲染稳定等待：仅用于 `networkidle` 永不达成的路由（如持续轮询 / 长连接）。
 *
 * 以有界 `networkidle`（超时即放弃）替代无限等待，再等字体就绪与一个短稳定窗口，
 * 保证「参考态采集」与「当前态比对」使用同一段等待逻辑，从而仍可逐像素比对。
 */
export async function waitForVisualStableLenient(page: Page, settleMs = 800): Promise<void> {
    try {
        await page.waitForLoadState('networkidle', { timeout: 10000 })
    } catch {
        // 该路由存在持续网络活动，放弃 networkidle，改为有界稳定窗口。
    }
    await page.evaluate(async () => {
        await document.fonts?.ready
    })
    await page.waitForTimeout(settleMs)
}

const repoRoot = process.cwd()
const budgetFile = path.join(repoRoot, 'tests', 'visual', 'parity-budget.json')
export const parityReferenceDir = path.join(repoRoot, 'tests', 'visual', 'parity', 'reference')
const parityReportDir = path.join(repoRoot, 'test-results', 'visual-parity', 'report')

let cachedBudget: ParityBudgetFile | null = null

export function loadBudget(): ParityBudgetFile {
    if (!cachedBudget) {
        cachedBudget = JSON.parse(fs.readFileSync(budgetFile, 'utf8')) as ParityBudgetFile
    }
    return cachedBudget
}

export function getBudgetEntry(name: string): ParityBudgetEntry {
    const budget = loadBudget()
    const entry = budget.entries[name]
    if (entry) {
        return entry
    }

    const tier = name.includes('reader') ? 'reader' : 'admin'
    const fallback = budget.tiers[tier]
    return {
        tier,
        maxDiffPixels: fallback.maxDiffPixels,
        maxDiffPixelRatio: fallback.maxDiffPixelRatio,
        allowlist: [],
        note: '未在 parity-budget.json 显式声明，按 tier 默认口径回退',
    }
}

export function getReferencePath(name: string): string {
    return path.join(parityReferenceDir, `${name}.reference.png`)
}

/**
 * 当前是否处于「参考态采集」模式。
 *
 * 用显式环境变量而非 `config.updateSnapshots` 判定：Playwright 的默认值是 `'missing'`
 * （缺快照即写入），会与「采集」混淆，导致正常比对误入采集分支、覆盖迁移前参考态。
 * 采集入口（scripts/testing/capture-visual-reference.mjs）会设置 `PARITY_CAPTURE=1`。
 */
export function isCaptureMode(): boolean {
    return process.env.PARITY_CAPTURE === '1'
}

interface DiffProbeInput {
    actualB64: string
    referenceB64: string
    threshold: number
    allowlist: { x: number, y: number, width: number, height: number, pixels: number }[]
}

interface DiffProbeResult {
    width: number
    height: number
    total: number
    diffPixels: number
    diffRatio: number
    sizeMismatch: boolean
    actualSize: string
    referenceSize: string
    regions: ParityRegion[]
    allowedPixels: number
    allowlistDetail: { index: number, count: number, allowed: number }[]
}

export interface ParityRow {
    name: string
    tier: ParityTier
    budget: { maxDiffPixels: number, maxDiffPixelRatio: number }
    measured: { diffPixels: number, diffRatio: number, total: number, width: number, height: number }
    allowlist: { entries: number, allowedPixels: number, detail: { index: number, count: number, allowed: number }[] }
    remaining: { pixels: number, ratio: number }
    regions: ParityRegion[]
    sizeMismatch: boolean
    mode: 'capture' | 'compare'
    pass: boolean
    timestamp: string
}

/**
 * 在浏览器内解码两张 PNG 并做像素差异统计。
 *
 * 复用已启动的 Chromium 的 canvas 能力完成 PNG 解码，不引入第三方图像依赖。
 * 差异判定对齐 pixelmatch：`|colorDelta(YIQ)| > 35215 * threshold^2`。
 */
async function probeDiff(page: Page, input: DiffProbeInput): Promise<DiffProbeResult> {
    const result = await page.evaluate(async (args) => {
        const toBytes = (b64: string) => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))

        const decode = async (b64: string) => {
            const bitmap = await createImageBitmap(new Blob([toBytes(b64)]))
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                throw new Error('无法获取 OffscreenCanvas 2D 上下文')
            }
            ctx.drawImage(bitmap, 0, 0)
            const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
            return { width: bitmap.width, height: bitmap.height, data: image.data }
        }

        const maxDelta = 35215 * args.threshold * args.threshold
        /**
         * 计算两个像素的 YIQ 感知色差（对齐 pixelmatch 口径）：
         * 返回的是 0.5053*y² + 0.299*i² + 0.1957*q² 的**平方值**（非开方），
         * 以 y 的正负编码明暗方向；35215 为该度量的理论最大值。
         */
        const colorDelta = (a: Uint8ClampedArray, b: Uint8ClampedArray, i: number) => {
            const r1 = a[i] ?? 0
            const g1 = a[i + 1] ?? 0
            const b1 = a[i + 2] ?? 0
            const a1 = a[i + 3] ?? 0
            const r2 = b[i] ?? 0
            const g2 = b[i + 1] ?? 0
            const b2 = b[i + 2] ?? 0
            const a2 = b[i + 3] ?? 0
            if (a1 === a2 && r1 === r2 && g1 === g2 && b1 === b2) {
                return 0
            }
            const dr = r1 - r2
            const dg = g1 - g2
            const db = b1 - b2
            const y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db
            const i2 = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db
            const q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db
            const delta = 0.5053 * y * y + 0.299 * i2 * i2 + 0.1957 * q * q
            return y > 0 ? -delta : delta
        }

        const actual = await decode(args.actualB64)
        const reference = await decode(args.referenceB64)

        if (actual.width !== reference.width || actual.height !== reference.height) {
            return {
                width: actual.width,
                height: actual.height,
                total: actual.width * actual.height,
                diffPixels: actual.width * actual.height,
                diffRatio: 1,
                sizeMismatch: true,
                actualSize: `${actual.width}x${actual.height}`,
                referenceSize: `${reference.width}x${reference.height}`,
                regions: [],
                allowedPixels: 0,
                allowlistDetail: [],
            }
        }

        const width = actual.width
        const height = actual.height
        const total = width * height
        const cell = 40
        const cols = Math.ceil(width / cell)
        const rows = Math.ceil(height / cell)
        const cellCounts = new Int32Array(cols * rows)
        let diffPixels = 0

        for (let y = 0; y < height; y++) {
            const rowOffset = y * width
            for (let x = 0; x < width; x++) {
                const index = (rowOffset + x) * 4
                if (Math.abs(colorDelta(actual.data, reference.data, index)) > maxDelta) {
                    diffPixels++
                    const cellIndex = Math.floor(y / cell) * cols + Math.floor(x / cell)
                    cellCounts[cellIndex] = (cellCounts[cellIndex] ?? 0) + 1
                }
            }
        }

        // 按 40px 网格做连通域聚类，输出「超差区域」包围盒。
        const visited = new Uint8Array(cols * rows)
        const regions: { x: number, y: number, width: number, height: number, pixels: number }[] = []
        for (let cy = 0; cy < rows; cy++) {
            for (let cx = 0; cx < cols; cx++) {
                const start = cy * cols + cx
                if (visited[start] || cellCounts[start] === 0) {
                    continue
                }
                const stack = [start]
                visited[start] = 1
                let minCx = cx
                let maxCx = cx
                let minCy = cy
                let maxCy = cy
                let pixels = 0
                while (stack.length > 0) {
                    const current = stack.pop() as number
                    const ccy = Math.floor(current / cols)
                    const ccx = current % cols
                    pixels += cellCounts[current] ?? 0
                    minCx = Math.min(minCx, ccx)
                    maxCx = Math.max(maxCx, ccx)
                    minCy = Math.min(minCy, ccy)
                    maxCy = Math.max(maxCy, ccy)
                    const neighbors = [current - 1, current + 1, current - cols, current + cols]
                    for (const neighbor of neighbors) {
                        if (neighbor < 0 || neighbor >= cols * rows || visited[neighbor] || cellCounts[neighbor] === 0) {
                            continue
                        }
                        const ncy = Math.floor(neighbor / cols)
                        const ncx = neighbor % cols
                        if (Math.abs(ncx - ccx) + Math.abs(ncy - ccy) !== 1) {
                            continue
                        }
                        visited[neighbor] = 1
                        stack.push(neighbor)
                    }
                }
                regions.push({
                    x: minCx * cell,
                    y: minCy * cell,
                    width: (maxCx - minCx + 1) * cell,
                    height: (maxCy - minCy + 1) * cell,
                    pixels,
                })
            }
        }
        regions.sort((a, b) => b.pixels - a.pixels)

        // 允许清单扣减：逐区域统计差异像素，扣减上限为该条目的声明像素量。
        let allowedPixels = 0
        const allowlistDetail: { index: number, count: number, allowed: number }[] = []
        for (let index = 0; index < args.allowlist.length; index++) {
            const entry = args.allowlist[index]
            if (!entry) {
                continue
            }
            const x0 = Math.max(0, entry.x)
            const y0 = Math.max(0, entry.y)
            const x1 = Math.min(width, entry.x + entry.width)
            const y1 = Math.min(height, entry.y + entry.height)
            let count = 0
            for (let y = y0; y < y1; y++) {
                const rowOffset = y * width
                for (let x = x0; x < x1; x++) {
                    const pixelIndex = (rowOffset + x) * 4
                    if (Math.abs(colorDelta(actual.data, reference.data, pixelIndex)) > maxDelta) {
                        count++
                    }
                }
            }
            const allowed = Math.min(count, entry.pixels)
            allowedPixels += allowed
            allowlistDetail.push({ index, count, allowed })
        }

        return {
            width,
            height,
            total,
            diffPixels,
            diffRatio: diffPixels / total,
            sizeMismatch: false,
            actualSize: `${width}x${height}`,
            referenceSize: `${reference.width}x${reference.height}`,
            regions: regions.slice(0, 8),
            allowedPixels,
            allowlistDetail,
        }
    }, input)

    return result as DiffProbeResult
}

function formatRatio(value: number): string {
    return `${(value * 100).toFixed(3)}%`
}

function formatRegions(regions: ParityRegion[]): string {
    if (regions.length === 0) {
        return '-'
    }
    return regions
        .map((region) => `${region.x},${region.y} ${region.width}x${region.height}(${region.pixels}px)`)
        .join(' | ')
}

function writeReport(row: ParityRow): void {
    fs.mkdirSync(parityReportDir, { recursive: true })
    fs.writeFileSync(path.join(parityReportDir, `${row.name}.json`), `${JSON.stringify(row, null, 2)}\n`)
}

function printRow(row: ParityRow): void {
    const allowlistText = row.allowlist.entries === 0
        ? '无'
        : `命中 ${row.allowlist.detail.filter((item) => item.allowed > 0).length}/${row.allowlist.entries} 条，扣减 ${row.allowlist.allowedPixels}px`
    const lines = [
        '[parity] testName | tier | 预算 | 实测 | 允许清单 | 未归因 | 超差区域 | 结果',
        `[parity] ${row.name} | ${row.tier} | ${row.budget.maxDiffPixels}px / ${formatRatio(row.budget.maxDiffPixelRatio)}`
        + ` | ${row.measured.diffPixels}px / ${formatRatio(row.measured.diffRatio)}`
        + ` | ${allowlistText} | ${row.remaining.pixels}px / ${formatRatio(row.remaining.ratio)}`
        + ` | ${formatRegions(row.regions)} | ${row.pass ? 'PASS' : 'FAIL'}`,
    ]
    for (const line of lines) {
        console.info(line)
    }
}

/**
 * 门禁主入口：参考态采集（`--update-snapshots`）或当前态比对。
 *
 * @param page 已导航至目标路由且渲染稳定的页面
 * @param options.name testName，同时用于预算查表与参考快照命名
 */
export async function runVisualParity(
    page: Page,
    options: { name: string, testInfo: TestInfo },
): Promise<void> {
    const { name } = options
    const entry = getBudgetEntry(name)
    const referencePath = getReferencePath(name)
    const screenshotOptions = {
        animations: 'disabled' as const,
        caret: 'hide' as const,
        mask: dynamicMask(page),
    }

    if (isCaptureMode()) {
        fs.mkdirSync(parityReferenceDir, { recursive: true })
        await page.screenshot({ ...screenshotOptions, path: referencePath })
        const row: ParityRow = {
            name,
            tier: entry.tier,
            budget: { maxDiffPixels: entry.maxDiffPixels, maxDiffPixelRatio: entry.maxDiffPixelRatio },
            measured: { diffPixels: 0, diffRatio: 0, total: 0, width: 0, height: 0 },
            allowlist: { entries: entry.allowlist.length, allowedPixels: 0, detail: [] },
            remaining: { pixels: 0, ratio: 0 },
            regions: [],
            sizeMismatch: false,
            mode: 'capture',
            pass: true,
            timestamp: new Date().toISOString(),
        }
        writeReport(row)
        console.info(`[parity] 已采集参考态：${name} -> ${path.relative(repoRoot, referencePath)}（ref=${process.env.PARITY_CAPTURE_REF ?? 'HEAD'}）`)
        return
    }

    if (!fs.existsSync(referencePath)) {
        const message = `缺少参考态快照 ${path.relative(repoRoot, referencePath)}；请先运行 pnpm test:visual:reference 采集参考基线`
        const row: ParityRow = {
            name,
            tier: entry.tier,
            budget: { maxDiffPixels: entry.maxDiffPixels, maxDiffPixelRatio: entry.maxDiffPixelRatio },
            measured: { diffPixels: -1, diffRatio: -1, total: 0, width: 0, height: 0 },
            allowlist: { entries: entry.allowlist.length, allowedPixels: 0, detail: [] },
            remaining: { pixels: -1, ratio: -1 },
            regions: [],
            sizeMismatch: false,
            mode: 'compare',
            pass: false,
            timestamp: new Date().toISOString(),
        }
        writeReport(row)
        printRow(row)
        expect(false, message).toBe(true)
        return
    }

    const actual = await page.screenshot(screenshotOptions)
    const reference = fs.readFileSync(referencePath)
    const stats = await probeDiff(page, {
        actualB64: actual.toString('base64'),
        referenceB64: reference.toString('base64'),
        threshold: PARITY_PIXEL_THRESHOLD,
        allowlist: entry.allowlist.map((item) => ({ ...item.region, pixels: item.pixels })),
    })

    const remainingPixels = stats.sizeMismatch ? stats.diffPixels : Math.max(0, stats.diffPixels - stats.allowedPixels)
    const remainingRatio = stats.total > 0 ? remainingPixels / stats.total : 1
    const pass = !stats.sizeMismatch
        && remainingPixels <= entry.maxDiffPixels
        && remainingRatio <= entry.maxDiffPixelRatio

    const row: ParityRow = {
        name,
        tier: entry.tier,
        budget: { maxDiffPixels: entry.maxDiffPixels, maxDiffPixelRatio: entry.maxDiffPixelRatio },
        measured: {
            diffPixels: stats.diffPixels,
            diffRatio: stats.diffRatio,
            total: stats.total,
            width: stats.width,
            height: stats.height,
        },
        allowlist: { entries: entry.allowlist.length, allowedPixels: stats.allowedPixels, detail: stats.allowlistDetail },
        remaining: { pixels: remainingPixels, ratio: remainingRatio },
        regions: stats.regions,
        sizeMismatch: stats.sizeMismatch,
        mode: 'compare',
        pass,
        timestamp: new Date().toISOString(),
    }
    writeReport(row)
    printRow(row)

    if (!pass && process.env.PARITY_REPORT_ONLY === '1') {
        console.info(`[parity] PARITY_REPORT_ONLY=1，仅报告不阻断：${name}`)
        return
    }

    const failureReason = stats.sizeMismatch
        ? `尺寸不一致（当前 ${stats.actualSize} / 参考 ${stats.referenceSize}）`
        : `未归因差异 ${remainingPixels}px（${formatRatio(remainingRatio)}）超出预算 ${entry.maxDiffPixels}px / ${formatRatio(entry.maxDiffPixelRatio)}`
    expect(pass, `${name} 视觉一致性门禁未通过：${failureReason}；超差区域 ${formatRegions(stats.regions)}`).toBe(true)
}
