import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    DEFAULT_GEOMETRY_PROBES,
    evaluateProbe,
    loadProbes,
    main,
    normalizeExpected,
    normalizeProbes,
    parseArgs,
    renderMarkdownReport,
    summarizeResults,
} from '@/scripts/testing/probe-build-geometry.mjs'

/**
 * 构建产物几何探针的纯逻辑与三类路径：
 * - 清单解析（数组 / `{ probes }` / 字段校验）；
 * - 缺元素 / 尺寸不符 / 全通过 的判定；
 * - `.output` 缺失时跳过（不判红）与 dry-run 落盘。
 *
 * 真实浏览器实测由 `pnpm probe:build-geometry` 的产物负责，单测不启动服务。
 */

const silentLog = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function tempWatcher() {
    let directory = ''

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'momei-geometry-'))
        vi.restoreAllMocks()
        process.exitCode = undefined
        silentLog.info.mockClear()
        silentLog.warn.mockClear()
        silentLog.error.mockClear()
    })

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true })
        process.exitCode = undefined
    })

    return { get: () => directory }
}

describe('probe-build-geometry 清单解析', () => {
    const temp = tempWatcher()

    it('默认清单覆盖 64 / 48 / 32 三档', () => {
        const probes = normalizeProbes(DEFAULT_GEOMETRY_PROBES)
        expect(probes.map((probe) => probe.expected.width)).toEqual([64, 32, 48])
        expect(probes.filter((probe) => probe.syntheticBox)).toHaveLength(1)
    })

    it('接受数组与 { probes } 两种配置形态', () => {
        const probe = { id: 'a', path: '/settings', selector: '.avatar', expected: { width: '64px', height: 64 } }

        expect(normalizeProbes([probe])[0]!.expected).toEqual({ width: 64, height: 64 })
        expect(normalizeProbes({ probes: [probe] })[0]!.id).toBe('a')
    })

    it('拒绝空清单 / 重复 id / 非法期望值', () => {
        expect(() => normalizeProbes([])).toThrow(/探针清单为空/u)
        expect(() => normalizeProbes([
            { id: 'dup', path: '/a', selector: '.a', expected: { width: 1, height: 1 } },
            { id: 'dup', path: '/b', selector: '.b', expected: { width: 1, height: 1 } },
        ])).toThrow(/id 重复/u)
        expect(() => normalizeExpected({ width: 'x', height: 1 })).toThrow(/width/u)
        expect(() => normalizeProbes([{ id: 'x', path: 'no-slash', selector: '.a', expected: { width: 1, height: 1 } }])).toThrow(/path/u)
    })

    it('从配置文件读取清单', async () => {
        const directory = temp.get()
        const configPath = join(directory, 'probes.json')
        await writeFile(configPath, JSON.stringify({
            probes: [{ id: 'from-file', path: '/admin/users', selector: '.app-avatar', expected: { width: 32, height: 32 } }],
        }), 'utf8')

        expect(loadProbes(configPath, directory)[0]!.id).toBe('from-file')
    })
})

describe('probe-build-geometry 判定', () => {
    const probe = normalizeProbes(DEFAULT_GEOMETRY_PROBES)[0]!

    it('命中且尺寸一致为通过', () => {
        const result = evaluateProbe(probe, { found: true, width: 64, height: 64 })
        expect(result.ok).toBe(true)
        expect(result.reason).toBe('')
    })

    it('尺寸不符判失败并给出实测值', () => {
        const result = evaluateProbe(probe, { found: true, width: 40, height: 40 })
        expect(result.ok).toBe(false)
        expect(result.reason).toContain('40x40')
    })

    it('缺元素判失败', () => {
        const result = evaluateProbe(probe, { found: false })
        expect(result.ok).toBe(false)
        expect(result.reason).toBe('未找到目标元素')
        expect(result.actual).toBeNull()
    })

    it('汇总只统计失败项', () => {
        const results = [
            evaluateProbe(probe, { found: true, width: 64, height: 64 }),
            evaluateProbe(probe, { found: false }),
        ]
        expect(summarizeResults(results)).toEqual({ total: 2, passed: 1, failed: 1, ok: false })
    })
})

describe('probe-build-geometry 入口', () => {
    const temp = tempWatcher()

    it('dry-run 只打印清单并落盘，不启动服务', async () => {
        const directory = temp.get()
        const report = await main({
            args: parseArgs(['node', 'script', '--dry-run', '--output=out/report.json']),
            log: silentLog,
            rootDir: directory,
        })

        expect(report.dryRun).toBe(true)
        expect(report.results).toHaveLength(3)
        const written = JSON.parse(await readFile(join(directory, 'out/report.json'), 'utf8'))
        expect(written.summary).toEqual({ total: 3, passed: 3, failed: 0, ok: true })
        expect(silentLog.info).toHaveBeenCalled()
    })

    it('构建产物缺失时跳过并写明原因，不判红', async () => {
        const directory = temp.get()
        const report = await main({
            args: parseArgs(['node', 'script', '--output=out/report.json']),
            log: silentLog,
            rootDir: directory,
        })

        expect(report.skipped).toBe(true)
        expect(report.skipReason).toContain('构建产物不存在')
        expect(process.exitCode).toBeUndefined()
        expect(renderMarkdownReport(report)).toContain('跳过')
    })

    it('跳过与 dry-run 的报告可读且含失败明细', () => {
        const markdown = renderMarkdownReport({
            generatedAt: '2026-11-18T00:00:00.000Z',
            dryRun: false,
            skipped: false,
            baseURL: 'http://127.0.0.1:3101',
            buildEntry: '.output/server/index.mjs',
            results: [evaluateProbe(normalizeProbes(DEFAULT_GEOMETRY_PROBES)[0]!, { found: true, width: 40, height: 40 })],
            summary: { total: 1, passed: 0, failed: 1, ok: false },
        })

        expect(markdown).toContain('| settings-avatar-xlarge |')
        expect(markdown).toContain('FAIL')
        expect(markdown).toContain('0/1 通过')
    })
})
