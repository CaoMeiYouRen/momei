import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    collectSourceOfTruthReport,
    getFrontmatterDate,
    main,
    parseFrontmatter,
    printSourceOfTruthReport,
    resolveTranslationTier,
} from '@/scripts/docs/check-source-of-truth.mjs'

const tempRoots: string[] = []
const originalExitCode = process.exitCode

async function createTempRoot() {
    const root = await mkdtemp(join(tmpdir(), 'check-source-of-truth-failures-'))
    tempRoots.push(root)
    return root
}

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = join(baseDir, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

function isoDaysAgo(days: number) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function git(root: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
    execFileSync('git', args, {
        cwd: root,
        encoding: 'utf-8',
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
    })
}

async function initRepo(root: string) {
    git(root, ['init', '-q', '-b', 'master'])
    git(root, ['config', 'user.email', 'test@example.com'])
    git(root, ['config', 'user.name', 'Test'])
    git(root, ['config', 'commit.gpgsign', 'false'])
}

async function writeValidBase(root: string) {
    await writeProjectFile(root, 'CLAUDE.md', '# Claude\n\n见 AGENTS.md。\n')
    await writeProjectFile(root, 'docs/standards/documentation.md', '# 文档规范\n\n## 事实源收敛\n')
    await writeProjectFile(root, 'docs/index.md', '# 首页\n')
}

function translationDoc({ lastSync, sourceOrigin, tier }: { lastSync?: string, sourceOrigin?: string, tier?: string }) {
    const frontmatter = [
        '---',
        lastSync ? `last_sync: ${lastSync}` : null,
        tier ? `translation_tier: ${tier}` : null,
        sourceOrigin ? `source_origin: ${sourceOrigin}` : null,
        '---',
        '',
        'translated content',
    ].filter(Boolean)

    return `${frontmatter.join('\n')}\n`
}

afterEach(async () => {
    vi.restoreAllMocks()
    process.exitCode = originalExitCode

    while (tempRoots.length > 0) {
        await rm(tempRoots.pop()!, { force: true, recursive: true })
    }
})

describe('check-source-of-truth / resolveTranslationTier 映射', () => {
    it('en-US 覆盖 must-sync / summary-sync / source-only 三档', () => {
        expect(resolveTranslationTier('docs/i18n/en-US/index.md')).toBe('must-sync')
        expect(resolveTranslationTier('docs/i18n/en-US/plan/roadmap.md')).toBe('summary-sync')
        expect(resolveTranslationTier('docs/i18n/en-US/design/ui.md')).toBe('source-only')
        expect(resolveTranslationTier('docs/i18n/en-US/guide/comparison.md')).toBe('source-only')
        expect(resolveTranslationTier('docs/i18n/en-US/unknown/page.md')).toBeNull()
    })

    it('zh-TW / ko-KR 采用 summary-sync + source-only 两档', () => {
        expect(resolveTranslationTier('docs/i18n/zh-TW/index.md')).toBe('summary-sync')
        expect(resolveTranslationTier('docs/i18n/zh-TW/guide/development.md')).toBe('source-only')
        expect(resolveTranslationTier('docs/i18n/ko-KR/design/ui.md')).toBe('source-only')
        expect(resolveTranslationTier('docs/i18n/ko-KR/unknown/page.md')).toBeNull()
    })

    it('ja-JP 只映射 summary-sync，其余返回 null', () => {
        expect(resolveTranslationTier('docs/i18n/ja-JP/index.md')).toBe('summary-sync')
        expect(resolveTranslationTier('docs/i18n/ja-JP/design/ui.md')).toBeNull()
        expect(resolveTranslationTier('docs/standards/testing.md')).toBeNull()
    })
})

describe('check-source-of-truth / frontmatter 解析边界', () => {
    it('缺少 frontmatter 时返回空对象且没有 last_sync', () => {
        expect(parseFrontmatter('plain content')).toEqual({})
        expect(getFrontmatterDate('plain content')).toBeNull()
    })
})

describe('check-source-of-truth / collectSourceOfTruthReport 失败分支', () => {
    it('CLAUDE.md 缺少时基础规则判定失败', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'docs/standards/documentation.md', '事实源收敛')

        const report = collectSourceOfTruthReport({ root })

        expect(report.baseRuleResults.find((item) => item.file === 'CLAUDE.md')).toMatchObject({ pass: false })
        expect(report.hasErrors).toBe(true)
    })

    it('CLAUDE.md 定义层级或 PDTFC+ 时判红', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'CLAUDE.md', 'L0 是最高层级\nPDTFC+ 是开发流程\n')
        await writeProjectFile(root, 'docs/standards/documentation.md', '事实源收敛')

        const report = collectSourceOfTruthReport({ root })

        expect(report.baseRuleResults.find((item) => item.file === 'CLAUDE.md')).toMatchObject({
            pass: false,
            reason: expect.stringContaining('层级'),
        })
    })

    it('documentation.md 缺少事实源收敛关键词时判红', async () => {
        const root = await createTempRoot()
        await writeProjectFile(root, 'CLAUDE.md', '# Claude\n')
        await writeProjectFile(root, 'docs/standards/documentation.md', '# 文档规范\n')

        const report = collectSourceOfTruthReport({ root })

        expect(report.baseRuleResults.find((item) => item.file === 'docs/standards/documentation.md')).toMatchObject({
            pass: false,
            reason: expect.stringContaining('事实源'),
        })
    })

    it('CLAUDE.md 超过 90 天未更新时命中 maxAge 规则', async () => {
        const root = await createTempRoot()
        await writeValidBase(root)
        const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
        await utimes(join(root, 'CLAUDE.md'), old, old)

        const report = collectSourceOfTruthReport({ root })

        expect(report.baseRuleResults.find((item) => item.file === 'CLAUDE.md')).toMatchObject({
            pass: false,
            reason: expect.stringContaining('90 天'),
        })
    })

    it('未映射 tier、tier 不一致、source-only 缺声明、缺 last_sync、源缺失均逐条报错', async () => {
        const root = await createTempRoot()
        await writeValidBase(root)
        await writeProjectFile(root, 'docs/i18n/en-US/unknown/page.md', translationDoc({ lastSync: isoDaysAgo(1) }))
        await writeProjectFile(root, 'docs/i18n/en-US/standards/planning.md', translationDoc({
            lastSync: isoDaysAgo(1),
            sourceOrigin: 'docs/index.md',
            tier: 'source-only',
        }))
        await writeProjectFile(root, 'docs/i18n/en-US/design/ui.md', translationDoc({ lastSync: isoDaysAgo(1) }))
        await writeProjectFile(root, 'docs/i18n/en-US/guide/quick-start.md', translationDoc({ sourceOrigin: 'docs/index.md' }))
        await writeProjectFile(root, 'docs/i18n/en-US/guide/deploy.md', translationDoc({
            lastSync: isoDaysAgo(1),
            sourceOrigin: 'docs/missing-source.md',
        }))

        const report = collectSourceOfTruthReport({ root })
        const reasons = report.translationResults.map((item) => item.reason).join('\n')

        expect(reasons).toContain('未映射到 freshness tier')
        expect(reasons).toContain('translation_tier 与当前治理矩阵不一致')
        expect(reasons).toContain('source-only 页面必须显式声明 translation_tier')
        expect(reasons).toContain('source-only 页面必须提供 source_origin')
        expect(reasons).toContain('缺少 last_sync 元数据')
        expect(reasons).toContain('源文档不存在')
        expect(report.hasErrors).toBe(true)
    })

    it('源未变时产出 pass，长期未维护时降级为 warning', async () => {
        const root = await createTempRoot()
        await writeValidBase(root)
        await initRepo(root)
        // 源提交必须早于两条 last_sync：index 走 pass，roadmap 走「源未变但超软上限」。
        const commitDate = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString()
        const env = {
            ...process.env,
            GIT_AUTHOR_DATE: commitDate,
            GIT_COMMITTER_DATE: commitDate,
        }
        git(root, ['add', '.'], env)
        git(root, ['commit', '-q', '-m', 'init'], env)

        await writeProjectFile(root, 'docs/i18n/en-US/index.md', translationDoc({
            lastSync: isoDaysAgo(10),
            sourceOrigin: 'docs/index.md',
            tier: 'must-sync',
        }))
        await writeProjectFile(root, 'docs/i18n/en-US/plan/roadmap.md', translationDoc({
            lastSync: isoDaysAgo(200),
            sourceOrigin: 'docs/index.md',
            tier: 'summary-sync',
        }))

        const report = collectSourceOfTruthReport({ root })

        expect(report.hasErrors).toBe(false)
        expect(report.hasWarnings).toBe(true)
        expect(report.translationResults).toHaveLength(1)
        expect(report.translationResults[0]).toMatchObject({
            file: 'docs/i18n/en-US/plan/roadmap.md',
            severity: 'warning',
            pass: false,
        })
    })
})

describe('check-source-of-truth / 报告输出与 CLI', () => {
    it('warn 模式把 error 降级展示且不改变 hasErrors', () => {
        const info = vi.spyOn(console, 'info').mockImplementation(vi.fn())
        const warn = vi.spyOn(console, 'warn').mockImplementation(vi.fn())
        const error = vi.spyOn(console, 'error').mockImplementation(vi.fn())
        const report = {
            baseRuleResults: [{ file: 'CLAUDE.md', pass: false, reason: '层级错误' }],
            hasErrors: true,
            hasWarnings: false,
            translationResults: [
                { file: 'docs/i18n/en-US/index.md', severity: 'error', reason: '需要重新同步' },
                { file: 'docs/i18n/en-US/design/ui.md', severity: 'warning', reason: '长期未维护' },
                { file: 'docs/i18n/en-US/guide/features.md', severity: 'pass', reason: '' },
            ],
        }

        printSourceOfTruthReport(report, 'warn')

        expect(info).toHaveBeenCalledWith(expect.stringContaining('翻译文档时效性检查'))
        expect(info).toHaveBeenCalledWith(expect.stringContaining('❌ CLAUDE.md'))
        expect(error).toHaveBeenCalledWith(expect.stringContaining('层级错误'))
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('候选 profile'))
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('⚠️'))
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('✅'))

        // error 模式下同一报告应使用 ❌ 图标与 error 输出流。
        printSourceOfTruthReport(report, 'error')
        expect(error).toHaveBeenCalledWith(expect.stringContaining('❌'))
    })

    it('仅有 warning 时提示 soft warning，无结果时提示全部通过', () => {
        const info = vi.spyOn(console, 'info').mockImplementation(vi.fn())

        printSourceOfTruthReport({
            baseRuleResults: [{ file: 'CLAUDE.md', pass: true }],
            hasErrors: false,
            hasWarnings: true,
            translationResults: [{ file: 'docs/i18n/en-US/index.md', severity: 'warning', reason: '长期未维护' }],
        }, 'error')
        expect(info).toHaveBeenCalledWith(expect.stringContaining('soft warning'))

        printSourceOfTruthReport({
            baseRuleResults: [],
            hasErrors: false,
            hasWarnings: false,
            translationResults: [],
        }, 'error')
        expect(info).toHaveBeenCalledWith(expect.stringContaining('所有翻译文档均通过'))
        expect(info).toHaveBeenCalledWith(expect.stringContaining('所有检查通过'))
    })

    it('main 在 warn 模式读取 candidate profile 且不设置退出码', () => {
        const info = vi.spyOn(console, 'info').mockImplementation(vi.fn())
        vi.spyOn(console, 'warn').mockImplementation(vi.fn())
        vi.spyOn(console, 'error').mockImplementation(vi.fn())

        main(['node', 'script', '--mode=warn', '--profile=candidate'])

        expect(process.exitCode).toBeUndefined()
        expect(info).toHaveBeenCalled()
    })
})
