import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getBudgetEntry, resolveBudgetTier } from '../visual/parity/budget'
import { MIGRATED_ROUTES, PENDING_ROUTES } from '../visual/parity/routes'

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

describe('parity 路由台账防退化', () => {
    const routes = [...MIGRATED_ROUTES, ...PENDING_ROUTES]

    it('路由名唯一（避免同名覆盖导致用例数静默减少）', () => {
        const names = routes.map((route) => route.name)
        expect(new Set(names).size).toBe(names.length)
    })

    it('每条路由都具备浅色 / 深色参考态（删条目时响亮失败）', () => {
        const referenceDir = path.join(process.cwd(), 'tests/visual/parity/reference')

        for (const route of routes) {
            for (const theme of ['light', 'dark']) {
                const file = path.join(referenceDir, `${route.name}-${theme}.reference.png`)
                expect(fs.existsSync(file), `缺少参考态：${file}`).toBe(true)
            }
        }
    })

    it('参考态文件与路由台账一一对应（不多不少）', () => {
        const referenceDir = path.join(process.cwd(), 'tests/visual/parity/reference')
        const files = fs.readdirSync(referenceDir).filter((file) => file.endsWith('.reference.png'))

        expect(files.length).toBe(routes.length * 2)
    })

    it('路由台账与 reference-manifest 的条目一致（防止路由与快照被一起删掉）', () => {
        const manifestPath = path.join(process.cwd(), 'tests/visual/parity/reference-manifest.json')
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { captures: Record<string, unknown> }
        const manifestNames = Object.keys(manifest.captures)
        const routeNames = routes.flatMap((route) => [`${route.name}-light`, `${route.name}-dark`])

        expect(manifestNames.length).toBe(routeNames.length)
        expect(new Set(manifestNames)).toEqual(new Set(routeNames))
    })
})
