import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    main,
    parseArgs,
    pruneParityAllowlist,
    renderSummary,
    resolveDateKey,
} from '@/scripts/testing/prune-parity-allowlist.mjs'

/**
 * parity 允许清单清零脚本：命中 / 未命中 / 幂等三类契约，以及 dry-run 与 note 历史保留。
 */

function createBudget() {
    return {
        meta: { updatedAt: '2026-11-12' },
        tiers: { admin: { maxDiffPixels: 3000, maxDiffPixelRatio: 0.0035 } },
        entries: {
            'user-settings-light': {
                tier: 'admin',
                maxDiffPixels: 3000,
                maxDiffPixelRatio: 0.0035,
                allowlist: [
                    { region: { x: 440, y: 280, width: 640, height: 440 }, pixels: 13133, reason: 'xlarge 修复后下移', owner: '@full-stack-master' },
                    { region: { x: 240, y: 760, width: 960, height: 160 }, pixels: 9800, reason: '页脚下移', owner: '@full-stack-master' },
                ],
                note: '历史校准记录：保持不变',
            },
            'home-light': {
                tier: 'reader',
                allowlist: [],
                note: '',
            },
        },
    }
}

const silentLog = { info: vi.fn() }

describe('prune-parity-allowlist', () => {
    let directory = ''

    beforeEach(async () => {
        vi.restoreAllMocks()
        silentLog.info.mockClear()
        directory = await mkdtemp(join(tmpdir(), 'momei-prune-parity-'))
    })

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true })
    })

    it('按 testName 命中并保留 note 历史、只在末尾追加清零记录', () => {
        const result = pruneParityAllowlist(createBudget(), {
            date: '2026-11-18',
            testNames: ['user-settings-light'],
        })

        expect(result.changed).toEqual([{ name: 'user-settings-light', cleared: 2, description: '440,280 640x440 (13133px)；240,760 960x160 (9800px)' }])
        expect(result.budget.entries['user-settings-light'].allowlist).toEqual([])
        expect(result.budget.entries['user-settings-light'].note).toContain('历史校准记录：保持不变')
        expect(result.budget.entries['user-settings-light'].note).toContain('【允许清单清零 2026-11-18】')
        expect(result.budget.entries['home-light']).toEqual(createBudget().entries['home-light'])
        // 预算阈值与 tiers 一律不动
        expect(result.budget.tiers).toEqual(createBudget().tiers)
        expect(result.budget.entries['user-settings-light'].maxDiffPixels).toBe(3000)
    })

    it('未命中 / 已是空清单时保持不变（幂等）', () => {
        const budget = createBudget()
        const result = pruneParityAllowlist(budget, { date: '2026-11-18', testNames: ['home-light'] })

        expect(result.changed).toEqual([])
        expect(result.budget.entries['home-light'].allowlist).toEqual([])
        expect(result.budget.entries['user-settings-light'].allowlist).toHaveLength(2)
        expect(renderSummary(result)).toContain('没有需要清零')

        const second = pruneParityAllowlist(result.budget, { date: '2026-11-18' })
        expect(second.changed.map((item) => item.name)).toEqual(['user-settings-light'])
        const third = pruneParityAllowlist(second.budget, { date: '2026-11-18' })
        expect(third.changed).toEqual([])
    })

    it('缺省的 testName 视为不存在，并给出可读错误', async () => {
        const result = pruneParityAllowlist(createBudget(), { date: '2026-11-18', testNames: ['unknown-test'] })

        expect(result.missing).toEqual(['unknown-test'])
        expect(renderSummary(result)).toContain('未找到的 testName：unknown-test')
    })

    it('日期格式校验', () => {
        expect(resolveDateKey('2026-11-18')).toBe('2026-11-18')
        expect(() => resolveDateKey('2026/11/18')).toThrow(/YYYY-MM-DD/u)
    })

    it('dry-run 不写盘，正式运行只改 allowlist 与 note', async () => {
        const budgetPath = join(directory, 'parity-budget.json')
        await writeFile(budgetPath, JSON.stringify(createBudget(), null, 4), 'utf8')

        const dry = await main({
            args: parseArgs(['node', 'script.mjs', '--dry-run', `--budget=${budgetPath}`]),
            log: silentLog,
            rootDir: directory,
        })
        expect(dry.written).toBe(false)
        expect(JSON.parse(await readFile(budgetPath, 'utf8')).entries['user-settings-light'].allowlist).toHaveLength(2)

        const applied = await main({
            args: parseArgs(['node', 'script.mjs', `--budget=${budgetPath}`, '--date=2026-11-18', '--test-name=user-settings-light']),
            log: silentLog,
            rootDir: directory,
        })
        expect(applied.written).toBe(true)
        const written = JSON.parse(await readFile(budgetPath, 'utf8'))
        expect(written.entries['user-settings-light'].allowlist).toEqual([])
        expect(written.entries['user-settings-light'].note).toContain('【允许清单清零 2026-11-18】')
        expect(written.entries['home-light'].note).toBe('')
    })
})
