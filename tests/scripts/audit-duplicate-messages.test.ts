import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    computeGroupId,
    validateAllowlistCoverage,
} from '../../scripts/i18n/audit-duplicate-messages.mjs'

function createGroup(keys: string[]) {
    return {
        crossModule: true,
        keyCount: keys.length,
        keys: keys.map((key) => ({ key, moduleName: 'common' })),
        modules: ['common'],
        values: { 'zh-CN': '值' },
    }
}

function createAllowlistEntry(id: string, keys: string[] = []) {
    return {
        id,
        keys,
        reason: '测试理由',
        reviewAt: '2027-05-12',
    }
}

describe('audit-duplicate-messages - computeGroupId', () => {
    it('对同一组 key 生成稳定 id，且与 key 顺序无关', () => {
        const first = computeGroupId(createGroup(['common.b', 'common.a']))
        const second = computeGroupId(createGroup(['common.a', 'common.b']))

        expect(first).toBe(second)
        expect(first).toMatch(/^g-[a-f0-9]{12}$/u)
    })

    it('不同 key 组合生成不同 id', () => {
        expect(computeGroupId(createGroup(['common.a', 'common.b'])))
            .not.toBe(computeGroupId(createGroup(['common.a', 'common.c'])))
    })
})

describe('audit-duplicate-messages - validateAllowlistCoverage', () => {
    const groups = [
        createGroup(['common.a', 'common.b']),
        createGroup(['common.c', 'common.d']),
    ]
    const ids = groups.map((group) => computeGroupId(group))
    const keysOf = (index: number) => groups[index]!.keys.map((item) => item.key)

    it('allowlist 与当前组完全对齐时通过', () => {
        const allowlist = {
            groups: groups.map((group, index) => createAllowlistEntry(ids[index]!, keysOf(index))),
        }

        expect(validateAllowlistCoverage(groups, allowlist)).toEqual({
            duplicateIds: [],
            expired: [],
            incomplete: [],
            keyMismatch: [],
            ok: true,
            stale: [],
            unlisted: [],
        })
    })

    it('未登记的新组判红', () => {
        const allowlist = {
            groups: [createAllowlistEntry(ids[0]!, keysOf(0))],
        }
        const result = validateAllowlistCoverage(groups, allowlist)

        expect(result.ok).toBe(false)
        expect(result.unlisted.map((item) => item.id)).toEqual([ids[1]])
        expect(result.stale).toEqual([])
    })

    it('已不存在的 allowlist 条目按误报判红', () => {
        const allowlist = {
            groups: [
                ...groups.map((group, index) => createAllowlistEntry(ids[index]!, keysOf(index))),
                createAllowlistEntry('g-deadbeefcafe', ['common.removed']),
            ],
        }
        const result = validateAllowlistCoverage(groups, allowlist)

        expect(result.ok).toBe(false)
        expect(result.stale).toEqual([{ id: 'g-deadbeefcafe', keys: ['common.removed'] }])
        expect(result.unlisted).toEqual([])
    })

    it('重复 id 判红', () => {
        const allowlist = {
            groups: [
                createAllowlistEntry(ids[0]!, keysOf(0)),
                createAllowlistEntry(ids[0]!, keysOf(0)),
                createAllowlistEntry(ids[1]!, keysOf(1)),
            ],
        }
        const result = validateAllowlistCoverage(groups, allowlist)

        expect(result.ok).toBe(false)
        expect(result.duplicateIds).toEqual([ids[0]])
    })

    it('缺 reason 或 reviewAt 非法判红', () => {
        const missingReason = {
            id: ids[0]!,
            keys: keysOf(0),
            reviewAt: '2027-05-12',
        }
        const invalidDate = {
            id: ids[1]!,
            keys: keysOf(1),
            reason: '测试理由',
            reviewAt: '2027/05/12',
        }
        const result = validateAllowlistCoverage(groups, {
            groups: [missingReason, invalidDate],
        })

        expect(result.ok).toBe(false)
        expect(result.incomplete).toEqual([ids[0], ids[1]])
        expect(result.expired).toEqual([])
    })

    it('合法 reviewAt 已到期判红', () => {
        const result = validateAllowlistCoverage(groups, {
            groups: [
                { ...createAllowlistEntry(ids[0]!, keysOf(0)), reviewAt: '2020-01-01' },
                createAllowlistEntry(ids[1]!, keysOf(1)),
            ],
        }, { today: '2026-11-12' })

        expect(result.ok).toBe(false)
        expect(result.expired).toEqual([ids[0]])
        expect(result.incomplete).toEqual([])
    })

    it('allowlist 记录 keys 与 live 组漂移或缺失时判红', () => {
        const allowlist = {
            groups: [
                createAllowlistEntry(ids[0]!, ['common.stale']),
                { id: ids[1]!, reason: '测试理由', reviewAt: '2027-05-12' },
            ],
        }
        const result = validateAllowlistCoverage(groups, allowlist)

        expect(result.ok).toBe(false)
        expect(result.keyMismatch).toEqual(ids)
    })
})

describe('audit-duplicate-messages - CLI gate', () => {
    const scriptPath = resolve(process.cwd(), 'scripts/i18n/audit-duplicate-messages.mjs')

    it('组数超过预算时以非零退出并输出原因', () => {
        const result = spawnSync(process.execPath, [scriptPath, '--gate', '--max-groups=1'], {
            cwd: process.cwd(),
            encoding: 'utf8',
        })

        expect(result.status).not.toBe(0)
        expect(result.stderr).toContain('exceed budget 1')
    })

    it('allowlist keys 漂移时以非零退出并输出原因', () => {
        const directory = mkdtempSync(join(tmpdir(), 'momei-dup-audit-'))
        const allowlistPath = join(directory, 'allowlist.json')

        try {
            const allowlist = JSON.parse(readFileSync('scripts/i18n/duplicate-group-allowlist.json', 'utf8'))
            allowlist.groups[0].keys = ['common.stale']
            writeFileSync(allowlistPath, JSON.stringify(allowlist), 'utf8')

            const result = spawnSync(process.execPath, [scriptPath, '--gate', `--allowlist=${allowlistPath}`], {
                cwd: process.cwd(),
                encoding: 'utf8',
            })

            expect(result.status).not.toBe(0)
            expect(result.stderr).toContain('keys drifted from live groups')
        } finally {
            unlinkSync(allowlistPath)
            rmdirSync(directory)
        }
    })

    it('--output 直接写入 UTF-8 报告', () => {
        const directory = mkdtempSync(join(tmpdir(), 'momei-dup-report-'))
        const outputPath = join(directory, 'report.json')

        try {
            execFileSync(process.execPath, [scriptPath, '--format=json', '--limit=0', `--output=${outputPath}`], {
                cwd: process.cwd(),
                encoding: 'utf8',
            })

            const report = JSON.parse(readFileSync(outputPath, 'utf8'))
            expect(report.filters.limit).toBe(0)
            expect(report.summary.duplicateGroupCount).toBeGreaterThan(0)
        } finally {
            unlinkSync(outputPath)
            rmdirSync(directory)
        }
    })

    it('--format=json --limit=0 保留完整组列表契约', () => {
        const output = execFileSync(process.execPath, [scriptPath, '--format=json', '--limit=0'], {
            cwd: process.cwd(),
            encoding: 'utf8',
        })
        const report = JSON.parse(output)

        expect(report.filters.limit).toBe(0)
        expect(report.summary.shownGroupCount).toBe(report.summary.duplicateGroupCount)
    })
})
