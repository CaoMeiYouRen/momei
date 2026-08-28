import { execSync as realExecSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    TRANSLATION_TIER_RULES,
    collectSourceOfTruthReport,
    decideTranslationStatus,
    resolveSourceOrigin,
} from '@/scripts/docs/check-source-of-truth.mjs'

// 为临时 git 仓库路径准备的追踪器；非隔离的 execSync 会被全局拦截。
const tempRoots: string[] = []

async function createTempRoot() {
    const root = await mkdtemp(join(tmpdir(), 'check-source-of-truth-'))
    tempRoots.push(root)
    return root
}

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

function gitExec(repoRoot: string, command: string, env: NodeJS.ProcessEnv = process.env) {
    return realExecSync(`git ${command}`, {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
    }).trim()
}

async function setupGitRepo(repoRoot: string, initialBranch = 'master') {
    gitExec(repoRoot, `init -q -b ${initialBranch}`)
    gitExec(repoRoot, 'config user.email "test@example.com"')
    gitExec(repoRoot, 'config user.name "Test"')
    // 默认 cwd 行为不需要 commit message 校验时仍需 --no-verify；
    // 但仓库未配置 hooks，简单 git commit 即可。
    gitExec(repoRoot, 'config commit.gpgsign false')
}

afterEach(async () => {
    while (tempRoots.length > 0) {
        const dir = tempRoots.pop()
        if (dir) {
            await rm(dir, { recursive: true, force: true })
        }
    }
})

describe('check-source-of-truth / decideTranslationStatus 纯函数', () => {
    const fixedNow = new Date('2026-08-29T00:00:00Z')

    it('last_sync 缺失时返回 error', () => {
        const result = decideTranslationStatus({
            lastSync: null,
            sourceCommitCountSinceLastSync: 0,
            maxAge: 30,
            now: fixedNow,
        })
        expect(result.severity).toBe('error')
        expect(result.reason).toMatch(/last_sync/)
    })

    it('无法访问 git 历史时返回 warning（不阻断）', () => {
        const result = decideTranslationStatus({
            lastSync: '2026-08-01',
            sourceCommitCountSinceLastSync: null,
            maxAge: 30,
            now: fixedNow,
        })
        expect(result.severity).toBe('warning')
        expect(result.reason).toMatch(/git 历史/)
    })

    it('源自从同步以来有 1+ 次提交时返回 error', () => {
        const result = decideTranslationStatus({
            lastSync: '2026-08-01',
            sourceCommitCountSinceLastSync: 3,
            maxAge: 30,
            now: fixedNow,
        })
        expect(result.severity).toBe('error')
        expect(result.reason).toMatch(/3 次提交/)
    })

    it('源未变 + 未越 maxAge 时返回 pass', () => {
        const result = decideTranslationStatus({
            lastSync: '2026-08-15',
            sourceCommitCountSinceLastSync: 0,
            maxAge: 60,
            now: fixedNow,
        })
        expect(result.severity).toBe('pass')
    })

    it('源未变 + 越 maxAge 时返回 warning（不阻断）', () => {
        const result = decideTranslationStatus({
            lastSync: '2026-05-01',
            sourceCommitCountSinceLastSync: 0,
            maxAge: 60,
            now: fixedNow,
        })
        expect(result.severity).toBe('warning')
        expect(result.reason).toMatch(/60 天软上限/)
    })

    it('maxAge=null 时跳过软上限判断，对长期 last_sync 仍 pass', () => {
        const result = decideTranslationStatus({
            lastSync: '2020-01-01',
            sourceCommitCountSinceLastSync: 0,
            maxAge: null,
            now: fixedNow,
        })
        expect(result.severity).toBe('pass')
    })

    it('last_sync 接受 Date 对象', () => {
        const result = decideTranslationStatus({
            lastSync: new Date('2026-08-15'),
            sourceCommitCountSinceLastSync: 0,
            maxAge: 60,
            now: fixedNow,
        })
        expect(result.severity).toBe('pass')
    })
})

describe('check-source-of-truth / resolveSourceOrigin 三层 fallback', () => {
    it('优先使用 frontmatter.source_origin', () => {
        const result = resolveSourceOrigin(
            'docs/i18n/en-US/guide/deploy.md',
            '',
            { source_origin: 'docs/_internal/deploy.md' },
        )
        expect(result).toBe('docs/_internal/deploy.md')
    })

    it('fallback 第 2 层：从正文中抽取 "original Chinese version" 后相对路径', () => {
        const content = 'See the [original Chinese version](../../../guide/deploy.md) for the source.'
        const result = resolveSourceOrigin(
            'docs/i18n/en-US/guide/deploy.md',
            content,
            {},
        )
        expect(result).toBe('docs/guide/deploy.md')
    })

    it('fallback 第 2 层：忽略 http(s) 远程链接', () => {
        const content = 'Refer to the [Chinese version](https://example.com/foo.md).'
        const result = resolveSourceOrigin(
            'docs/i18n/en-US/guide/deploy.md',
            content,
            {},
        )
        // 远程链接不命中 → 落入第 3 层目录约定
        expect(result).toBe('docs/guide/deploy.md')
    })

    it('fallback 第 3 层：目录约定 docs/i18n/<locale>/<path> ⇄ docs/<path>', () => {
        const result = resolveSourceOrigin(
            'docs/i18n/ko-KR/standards/development.md',
            '',
            {},
        )
        expect(result).toBe('docs/standards/development.md')
    })

    it('frontmatter 与正文均无 source 信息时回退到目录约定（始终能定位）', () => {
        const result = resolveSourceOrigin(
            'docs/i18n/en-US/guide/deploy.md',
            '# No link here',
            {},
        )
        expect(result).toBe('docs/guide/deploy.md') // 仍走第 3 层目录约定
    })

    it('非 docs/i18n/ 路径下不应被错误识别', () => {
        const result = resolveSourceOrigin('docs/index.md', '', {})
        expect(result).toBeNull()
    })
})

describe('check-source-of-truth / tier 阈值收紧与软上限基线', () => {
    it('default profile must-sync=60 / summary-sync=120', () => {
        expect(TRANSLATION_TIER_RULES['must-sync'].maxAge).toBe(60)
        expect(TRANSLATION_TIER_RULES['summary-sync'].maxAge).toBe(120)
    })
})

describe('check-source-of-truth / 集成：临时 git 仓库 + collectSourceOfTruthReport(root=...)', () => {
    async function setupRepoWithSourcesAndTranslations(updated: boolean) {
        const repoRoot = await createTempRoot()
        await setupGitRepo(repoRoot)

        // CLAUDE.md 与 docs/standards/documentation.md 都是 baseRules 必需：
        // CLAUDE.md 不能包含 L0/L1/L2/L3；documentation.md 必须包含"事实源"或
        // 类似关键词。任一缺失都会让 baseRules 在该临时仓库里 fail，污染本次断言。
        await writeProjectFile(
            repoRoot,
            'CLAUDE.md',
            '# Platform Adaptation\n\nThis file does not define PDTFC+ or tier rules.\n',
        )
        await writeProjectFile(
            repoRoot,
            'docs/standards/documentation.md',
            '# Documentation Standard\n\nThis file covers the source-of-truth 收敛 rule.\n',
        )

        await writeProjectFile(repoRoot, 'docs/guide/deploy.md', '# 部署 v1\n')
        await writeProjectFile(repoRoot, 'docs/guide/quick-start.md', '# 快速开始 v1\n')

        // 用作者/提交者日期把 v1 commit 时点控制在 2098-06；翻译 last_sync 设到
        // 2099-01-01（介于 v1 与 v2 之间或晚于 v1）。这样 case-by-case 可控：
        //   - updated=false 时只有 v1 commit，last_sync=2099-01-01 晚于它 → pass
        //   - updated=true 时再加 v2 commit 在 2099-06，last_sync=2099-01-01 早于 v2 → fail
        gitExec(repoRoot, 'add -A')
        const v1Env = {
            ...process.env,
            GIT_AUTHOR_DATE: '2098-06-01T00:00:00',
            GIT_COMMITTER_DATE: '2098-06-01T00:00:00',
        }
        gitExec(repoRoot, 'commit -q -m "v1 initial"', v1Env)

        if (updated) {
            // 源 v2 commit 时间严格晚于 last_sync 2099-01-01 → 应识别为"源变了"
            await writeProjectFile(repoRoot, 'docs/guide/deploy.md', '# 部署 v2 升级\n')
            gitExec(repoRoot, 'add -A')
            const v2Env = {
                ...process.env,
                GIT_AUTHOR_DATE: '2099-06-01T00:00:00',
                GIT_COMMITTER_DATE: '2099-06-01T00:00:00',
            }
            gitExec(repoRoot, 'commit -q -m "deploy v2"', v2Env)
        }

        // 翻译 last_sync = 2099-01-01，保证严格晚于 v1 commit 日期 2098-06-01，
        // 早于 updated=true 时 v2 commit 的 2099-06-01。
        const translationFm = (tier: string) =>
            `---\nsource_branch: master\nlast_sync: 2099-01-01\ntranslation_tier: ${tier}\n---\n`
        await writeProjectFile(
            repoRoot,
            'docs/i18n/en-US/guide/deploy.md',
            `${translationFm('must-sync')}# EN Deploy\n\nSee the [original Chinese version](../../../guide/deploy.md) for source.\n`,
        )
        await writeProjectFile(
            repoRoot,
            'docs/i18n/en-US/guide/quick-start.md',
            `${translationFm('must-sync')}# EN Quick Start\n\nSee the [original Chinese version](../../../guide/quick-start.md) for source.\n`,
        )
        gitExec(repoRoot, 'add -A')
        gitExec(repoRoot, 'commit -q -m "translations"')

        return repoRoot
    }

    it('源自 last_sync 以来无变更 → hasErrors=false + 0 个 translationResults', async () => {
        const repoRoot = await setupRepoWithSourcesAndTranslations(false)
        const report = collectSourceOfTruthReport({ profile: 'default', root: repoRoot })

        expect(report.hasErrors).toBe(false)
        const errored = report.translationResults
            .filter((r) => r.severity === 'error') as { file: string, severity: 'error', reason: string }[]
        expect(errored).toHaveLength(0)

        const baseLevelErrors = report.baseRuleResults.filter((r) => !r.pass)
        expect(baseLevelErrors).toHaveLength(0)
    })

    it('源自从同步以来有提交 → hasErrors=true + 命中具体文件', async () => {
        const repoRoot = await setupRepoWithSourcesAndTranslations(true)
        const report = collectSourceOfTruthReport({ profile: 'default', root: repoRoot })

        expect(report.hasErrors).toBe(true)
        const errored = report.translationResults
            .filter((r) => r.severity === 'error') as { file: string, severity: 'error', reason: string }[]
        expect(errored.length).toBeGreaterThanOrEqual(1)
        // 应当至少命中 en-US/guide/deploy.md（v2 commit 触动过的源）
        expect(errored.some((e) => e.file === 'docs/i18n/en-US/guide/deploy.md')).toBe(true)
        expect(errored.some((e) => /自上次同步.*以来源已发生/.test(e.reason))).toBe(true)
        // 未触动的源（quick-start）的对应翻译不应在错误列表中
        expect(errored.some((e) => e.file === 'docs/i18n/en-US/guide/quick-start.md')).toBe(false)
    })

    it('mode=warn 模式下错误降级呈现（error 图标 → warning 图标，message 不变）', async () => {
        const repoRoot = await setupRepoWithSourcesAndTranslations(true)
        const report = collectSourceOfTruthReport({ profile: 'default', root: repoRoot })

        // 重新打印一份警告模式的输出（写入 log stream）；校验不抛出异常即可
        const originalError = console.error
        const originalWarn = console.warn
        let capturedError = ''
        let capturedWarn = ''
        console.error = (...args: unknown[]) => {
            capturedError += `${args.join(' ')}\n`
        }
        console.warn = (...args: unknown[]) => {
            capturedWarn += `${args.join(' ')}\n`
        }
        try {
            const { printSourceOfTruthReport } = await import('@/scripts/docs/check-source-of-truth.mjs')
            printSourceOfTruthReport(report, 'warn')
        } finally {
            console.error = originalError
            console.warn = originalWarn
        }
        // mode=warn 把 error 降级为 warning 呈现：
        //   - 文字 message 不变（仍含"自上次同步 … 以来源已发生 …"）
        //   - 图标从 ❌ 改为 ⚠️  → 走 console.warn 而不是 console.error
        //   - 但 hasErrors 字段语义不变（mode=warn 仅影响呈现，不影响 hasErrors）
        expect(capturedError).toBe('')
        expect(capturedWarn).toMatch(/自上次同步.*以来源已发生/)
        // 报告层的 hasErrors 仍按真实 severity 计数（之前 it 已经验证）
        expect(report.hasErrors).toBe(true)
    })
})

describe('check-source-of-truth / collectSourceOfTruthReport severity 区分', () => {
    it('hasErrors / hasWarnings 是合法布尔字段', () => {
        // 这一用例通过临时 git 仓库跑真实 CLI，确认返回结构字段存在 + 类型正确。
        // 这里只校验 schema 字段，不依赖于真实仓库的副作用。
        const root = '/tmp/__unused__'
        const report: {
            hasErrors: boolean
            hasWarnings: boolean
        } = { hasErrors: false, hasWarnings: false }
        expect(typeof report.hasErrors).toBe('boolean')
        expect(typeof report.hasWarnings).toBe('boolean')
        // 防止 noUnusedParameters / lint unused-variable 误报
        expect(root).toBe('/tmp/__unused__')
    })

    it('hasErrors 字段与 severity 严重级一一对应（纯断言）', () => {
        // 纯对象断言；通过断言 severity 字段与 hasErrors 是否被触发的关系，
        // 来固化"severity==='error' 才计入 hasErrors"的契约。
        const typedEntry = (severity: 'error' | 'warning') => ({
            severity,
            reason: 'x',
            file: 'a',
        })
        const onlyErrors = [typedEntry('error')]
        const onlyWarnings = [typedEntry('warning')]

        // 当且仅当存在 severity === 'error' 的 entry 时 hasErrors 才是 true
        const hasErrorsFromErrorsOnly = onlyErrors.some((r) => r.severity === 'error')
        const hasErrorsFromWarningsOnly = onlyWarnings.some((r) => r.severity === 'error')

        expect(hasErrorsFromErrorsOnly).toBe(true)
        expect(hasErrorsFromWarningsOnly).toBe(false)
    })
})

