import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildHeadCaptureGrepArgs, getProtectedTestNames } from '@/scripts/testing/capture-visual-reference.mjs'

/**
 * `capture-visual-reference.mjs` 的「参考态覆盖保护」契约。
 *
 * 背景（2026-10-14 `/admin/waitlist` 分区二审计 W3）：历史实现只保护 `source` 以
 * `worktree` 开头的清单条目，故**就地（in-place）采集的待迁移路由**在迁移落地后会被
 * 下一次 HEAD 全量采集覆盖成「迁移后渲染」，门禁退化为自比自。现口径为：
 * 磁盘上已存在 `<name>.reference.png` 的 testName 一律排除。
 */

const REFERENCE_DIR = path.join('tests', 'visual', 'parity', 'reference')
const MANIFEST_REL = path.join('tests', 'visual', 'parity', 'reference-manifest.json')

let root = ''

function writeReference(name: string) {
    const dir = path.join(root, REFERENCE_DIR)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, `${name}.reference.png`), '')
}

function writeManifest(captures: Record<string, { source: string }>) {
    const file = path.join(root, MANIFEST_REL)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify({ generatedAt: null, environment: null, captures }, null, 4))
}

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'momei-capture-ref-'))
})

afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
})

describe('参考态覆盖保护', () => {
    it('保护磁盘上已存在的参考态（含 in-place 采集的待迁移路由）', () => {
        writeReference('admin-waitlist-list-light')
        writeReference('admin-posts-list-dark')

        expect(getProtectedTestNames({ root })).toEqual(['admin-posts-list-dark', 'admin-waitlist-list-light'])
    })

    it('保护清单中 worktree（--revert）来源的条目，即使快照不在磁盘上', () => {
        writeManifest({ 'admin-comments-list-light': { source: 'worktree-revert' } })

        expect(getProtectedTestNames({ root })).toEqual(['admin-comments-list-light'])
    })

    it('in-place 来源的清单条目不单独作为保护依据（以磁盘快照为准，避免空目录误保护）', () => {
        writeManifest({ 'admin-posts-list-light': { source: 'in-place' } })

        expect(getProtectedTestNames({ root })).toEqual([])
    })

    it('结果去重并排序（磁盘与清单重叠时只出现一次）', () => {
        writeReference('admin-comments-list-light')
        writeManifest({ 'admin-comments-list-light': { source: 'worktree-revert' } })

        expect(getProtectedTestNames({ root })).toEqual(['admin-comments-list-light'])
    })

    it('无任何参考态与清单时返回空数组，不进 --grep-invert 分支', () => {
        expect(getProtectedTestNames({ root })).toEqual([])
        expect(buildHeadCaptureGrepArgs([], { root })).toEqual([])
    })

    it('HEAD 全量采集时以 --grep-invert 排除全部受保护用例', () => {
        writeReference('admin-posts-list-light')
        writeReference('admin-waitlist-list-light')

        expect(buildHeadCaptureGrepArgs([], { root })).toEqual([
            '--grep-invert',
            'admin-posts-list-light|admin-waitlist-list-light',
        ])
    })

    it('显式 --only 入口不参与排除（用于专门刷新单条参考态）', () => {
        writeReference('admin-waitlist-list-light')

        expect(buildHeadCaptureGrepArgs(['admin-waitlist-list-light'], { root })).toEqual([
            '--grep',
            'admin-waitlist-list-light',
        ])
        expect(buildHeadCaptureGrepArgs(['a', 'b'], { root })).toEqual(['--grep', '(a|b)'])
    })
})

describe('HEAD 就地采集：无待采目标时的退出语义', () => {
    it('就地采集必须声明 --pass-with-no-tests（参考态齐备后全量采集不应硬失败）', () => {
        // 保护口径排除「磁盘上已有参考态」的全部用例；当迁移批次清空待迁移路由（`PENDING_ROUTES`
        // 为空）时，HEAD 全量采集不再有任何候选用例，Playwright 默认以 `No tests found` 退出码 1
        // 使 `pnpm test:visual:reference` 硬失败。该断言把「无待采目标 = 成功」的口径钉在
        // **就地采集块**内，避免后续重构静默移除该 flag。
        const source = fs.readFileSync(
            path.join(process.cwd(), 'scripts', 'testing', 'capture-visual-reference.mjs'),
            'utf8',
        )
        const start = source.indexOf('async function captureInPlace')
        const end = source.indexOf('async function', start + 10)
        const block = source.slice(start, end === -1 ? undefined : end)

        expect(start).toBeGreaterThan(-1)
        expect(block).toContain('--update-snapshots')
        expect(block).toContain('--pass-with-no-tests')
    })
})
