import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    buildGovernanceIndexReport,
    collectGovernanceIndex,
    DEFAULT_ALLOWLIST_PATH,
    DEFAULT_GOVERNANCE_DIR,
    DEFAULT_INDEX_PATH,
    evaluateGovernanceIndex,
    extractIndexedTargets,
    main as governanceIndexMain,
    normalizeAllowlist,
    parseArgs,
    renderMarkdownReport,
} from '@/scripts/governance/check-governance-index.mjs'

/**
 * 治理目录索引检查的三类判定（已索引 / 未索引 / allowlist 命中）与过期信号。
 *
 * 只用纯函数 + 临时目录构造夹具，不读真实仓库目录：真实目录的归零结论由
 * `pnpm governance:check:index` 的产物负责，用例只锁判定语义。
 */

describe('check-governance-index', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        process.exitCode = undefined
    })

    it('只把同目录兄弟链接算作索引目标', () => {
        const targets = extractIndexedTargets([
            '- [有扩展名](./2026-11-01-alpha.md)',
            '- [无扩展名](./2026-11-01-beta)',
            '- [带锚点](./2026-11-01-gamma.md#section)',
            '- [子目录](./archive/2026-11-01-archived.md)',
            '- [上级](../modules/index.md)',
            '- [外部](https://example.com/doc.md)',
            '- [纯锚点](#top)',
            '- [单引号 title](./2026-11-01-delta.md \'标题\')',
            '- ![示意图](./diagram.png)',
        ].join('\n'))

        expect([...targets].sort()).toEqual([
            '2026-11-01-alpha.md',
            '2026-11-01-beta.md',
            '2026-11-01-delta.md',
            '2026-11-01-gamma.md',
        ])
    })

    it('把目录文档分成已索引 / allowlist 命中 / 未登记三类', () => {
        const result = evaluateGovernanceIndex({
            allowlist: normalizeAllowlist({
                entries: [{ path: 'docs/design/governance/2026-11-01-allowlisted.md', reason: '一次性报告' }],
            }),
            files: ['2026-11-01-indexed.md', '2026-11-01-allowlisted.md', '2026-11-01-orphan.md'],
            indexedTargets: extractIndexedTargets('[已索引](./2026-11-01-indexed.md)'),
        })

        expect(result.indexed).toEqual(['2026-11-01-indexed.md'])
        expect(result.allowlisted).toEqual([{ path: '2026-11-01-allowlisted.md', reason: '一次性报告' }])
        expect(result.unregistered).toEqual(['2026-11-01-orphan.md'])
    })

    it('报出 allowlist 与索引里指向已不存在文件的过期登记', () => {
        const result = evaluateGovernanceIndex({
            allowlist: normalizeAllowlist({
                entries: [{ path: 'docs/design/governance/2026-11-01-deleted.md', reason: '已删除' }],
            }),
            files: ['2026-11-01-present.md'],
            indexedTargets: extractIndexedTargets([
                '[存在](./2026-11-01-present.md)',
                '[已删除](./2026-11-01-removed.md)',
            ]),
        })

        expect(result.staleAllowlist).toEqual(['docs/design/governance/2026-11-01-deleted.md'])
        expect(result.staleIndexLinks).toEqual(['2026-11-01-removed.md'])
    })

    it('allowlist 缺少理由时响亮失败', () => {
        expect(() => normalizeAllowlist({ entries: [{ path: 'docs/design/governance/2026-11-01-x.md' }] }))
            .toThrow(/missing reason/)
        expect(() => normalizeAllowlist({ entries: [{ reason: '没有路径' }] }))
            .toThrow(/missing path/)
    })

    it('报告结构稳定：未登记与 allowlist 分节列出，过期信号单独成节', () => {
        const report = buildGovernanceIndexReport({
            allowlist: normalizeAllowlist({
                entries: [
                    { path: 'docs/design/governance/beta.md', reason: '一次性报告' },
                    { path: 'docs/design/governance/gone.md', reason: '已删除' },
                ],
            }),
            directory: 'docs/design/governance',
            files: ['alpha.md', 'beta.md'],
            generatedAt: '2026-11-17T00:00:00.000Z',
            indexContent: '[已索引](./alpha.md)\n[已删除](./removed.md)\n',
            indexPath: 'docs/design/governance/index.md',
        })
        const markdown = renderMarkdownReport(report)

        expect(report.unregisteredCount).toBe(0)
        expect(report.allowlistedCount).toBe(1)
        expect(report.staleAllowlist).toEqual(['docs/design/governance/gone.md'])
        expect(report.staleIndexLinks).toEqual(['removed.md'])
        expect(markdown).toContain('# 治理目录索引检查')
        expect(markdown).toContain('## 未登记文档')
        expect(markdown).toContain('## allowlist 登记')
        expect(markdown).toContain('台账与索引的过期信号')
    })

    it('既被索引又留在 allowlist 的条目报为冗余登记', () => {
        const result = evaluateGovernanceIndex({
            allowlist: normalizeAllowlist({
                entries: [{ path: 'docs/design/governance/alpha.md', reason: '已补索引' }],
            }),
            files: ['alpha.md'],
            indexedTargets: extractIndexedTargets('[已索引](./alpha.md)'),
        })

        expect(result.redundantAllowlist).toEqual(['alpha.md'])
        expect(result.allowlisted).toEqual([])
    })

    it('在临时目录上按 --mode=error 对未登记文档判红', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'governance-index-'))
        const governanceDir = join(directory, 'governance')
        const originalArgv = process.argv
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        try {
            const { mkdir } = await import('node:fs/promises')
            await mkdir(governanceDir, { recursive: true })
            await writeFile(join(governanceDir, 'index.md'), '[已索引](./alpha.md)\n', 'utf8')
            await writeFile(join(governanceDir, 'alpha.md'), '# alpha\n', 'utf8')
            await writeFile(join(governanceDir, 'beta.md'), '# beta\n', 'utf8')
            await writeFile(join(directory, 'allowlist.json'), JSON.stringify({ entries: [] }), 'utf8')

            process.argv = [
                process.argv[0] || 'node',
                'check-governance-index.mjs',
                `--dir=${governanceDir}`,
                `--index=${join(governanceDir, 'index.md')}`,
                `--allowlist=${join(directory, 'allowlist.json')}`,
                `--output=${join(directory, 'report.json')}`,
                '--mode=error',
            ]
            process.exitCode = undefined

            const report = await governanceIndexMain()

            expect(report.unregistered).toEqual(['beta.md'])
            expect(process.exitCode).toBe(1)
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('未登记: 1'))
        } finally {
            process.argv = originalArgv
            process.exitCode = originalExitCode
            infoSpy.mockRestore()
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('默认按报告模式运行，不因未登记而失败', () => {
        expect(parseArgs(['node', 'check-governance-index.mjs'])).toMatchObject({
            allowlist: DEFAULT_ALLOWLIST_PATH,
            dir: DEFAULT_GOVERNANCE_DIR,
            index: DEFAULT_INDEX_PATH,
            mode: 'report',
        })
        expect(parseArgs(['node', 'check-governance-index.mjs', '--mode=error']).mode).toBe('error')
    })

    it('目录、索引或显式 allowlist 缺失时响亮失败', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'governance-index-missing-'))

        try {
            await expect(collectGovernanceIndex({
                governanceDir: join(directory, 'absent'),
                indexPath: join(directory, 'absent', 'index.md'),
            })).rejects.toThrow(/Governance directory not found/)

            const governanceDir = join(directory, 'governance')
            const { mkdir } = await import('node:fs/promises')
            await mkdir(governanceDir, { recursive: true })
            await writeFile(join(governanceDir, 'alpha.md'), '# alpha\n', 'utf8')

            await expect(collectGovernanceIndex({
                governanceDir,
                indexPath: join(governanceDir, 'missing-index.md'),
            })).rejects.toThrow(/Governance index not found/)

            await writeFile(join(governanceDir, 'index.md'), '[已索引](./alpha.md)\n', 'utf8')

            // 显式传入的 allowlist 不存在属配置错误，不得静默回退成空表
            await expect(collectGovernanceIndex({
                allowlistPath: join(directory, 'absent-allowlist.json'),
                governanceDir,
                indexPath: join(governanceDir, 'index.md'),
            })).rejects.toThrow(/Governance index allowlist not found/)
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })
})
