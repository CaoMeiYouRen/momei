import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    annotateAlerts,
    collectAlerts,
    fetchRepositoryAlerts,
    parseArgs,
    printAlert,
    resolveGitHubToken,
    resolveRepository,
    writeArtifacts,
} from '../../scripts/security/security-alert-gate-shared.mjs'

/**
 * 安全告警门禁的「公共层」补充用例。
 *
 * 覆盖主流程用例之外的分支：参数解析、仓库解析、GitHub API 失败分级、分页与部分失败，
 * 以及控制台输出。这些分支决定门禁在「拿不到 token / 权限不足 / 响应异常」时的结论，
 * 若只测成功路径，失败态会退化成不可解释的空白。
 */

function jsonResponse(payload: unknown, init: { link?: string, status?: number } = {}) {
    return {
        headers: new Map(init.link ? [['link', init.link]] : []) as unknown as Headers,
        json: async () => payload,
        ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
        status: init.status ?? 200,
        text: async () => JSON.stringify(payload),
    }
}

const alertsParams = {
    endpoint: 'dependabot/alerts',
    failureResolver: (payload: { message?: string }, status: number) => ({ detail: payload?.message ?? `HTTP ${status}`, kind: status === 403 ? 'permission-denied' : 'unavailable', sourceName: 'github-api' }),
    normalizer: (alert: { number: number, severity?: string }) => ({ alertNumber: String(alert.number), severity: alert.severity ?? 'low', source: 'dependabot' }),
    owner: 'CaoMeiYouRen',
    perPage: 2,
    repo: 'momei',
    token: 'token-1',
}

describe('security-alert-gate-shared - parseArgs', () => {
    it('提供默认值与 transition-mode 开关', () => {
        expect(parseArgs([])).toMatchObject({
            minSeverity: 'high',
            mode: 'error',
            perPage: 100,
            transitionMode: false,
        })
        expect(parseArgs(['--transition-mode']).transitionMode).toBe(true)
    })

    it('拒绝非法 per-page 与 mode', () => {
        expect(() => parseArgs(['--per-page=0'])).toThrow(/per-page/u)
        expect(() => parseArgs(['--per-page=101'])).toThrow(/per-page/u)
        expect(() => parseArgs(['--per-page=1.5'])).toThrow(/per-page/u)
        expect(() => parseArgs(['--mode=block'])).toThrow(/Unsupported mode/u)
    })

    it('归一化最小严重级别', () => {
        expect(parseArgs(['--min-severity=critical']).minSeverity).toBe('critical')
        expect(parseArgs(['--min-severity=moderate']).minSeverity).toBe('moderate')
    })
})

describe('security-alert-gate-shared - resolveRepository', () => {
    const originalRepository = process.env.GITHUB_REPOSITORY

    beforeEach(() => {
        delete process.env.GITHUB_REPOSITORY
    })

    afterEach(() => {
        if (originalRepository === undefined) {
            delete process.env.GITHUB_REPOSITORY
            return
        }

        process.env.GITHUB_REPOSITORY = originalRepository
    })

    it('显式 owner/repo 优先于环境变量', async () => {
        process.env.GITHUB_REPOSITORY = 'env-owner/env-repo'

        await expect(resolveRepository({ owner: 'cli-owner', repo: 'cli-repo' }, process.cwd()))
            .resolves.toEqual({ owner: 'cli-owner', repo: 'cli-repo' })
    })

    it('回落到 GITHUB_REPOSITORY', async () => {
        process.env.GITHUB_REPOSITORY = 'env-owner/env-repo'

        await expect(resolveRepository({ owner: null, repo: null }, process.cwd()))
            .resolves.toEqual({ owner: 'env-owner', repo: 'env-repo' })
    })

    it('回落到 git remote 解析 owner/repo', async () => {
        await expect(resolveRepository({ owner: null, repo: null }, process.cwd()))
            .resolves.toEqual(expect.objectContaining({ owner: expect.any(String), repo: expect.any(String) }))
    })

    it('无法解析时抛出可操作错误', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-no-remote-'))

        try {
            await expect(resolveRepository({ owner: null, repo: null }, tempRoot))
                .rejects.toThrow(/Unable to resolve GitHub repository/u)
        } finally {
            await rm(tempRoot, { force: true, recursive: true })
        }
    })
})

describe('security-alert-gate-shared - resolveGitHubToken', () => {
    const keys = ['SECURITY_ALERTS_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN']
    const originalValues = new Map<string, string | undefined>()

    beforeEach(() => {
        // 开发机常驻 GH_TOKEN：先保存原值再清空，保证用例不依赖宿主环境，也不污染后续用例。
        for (const key of keys) {
            originalValues.set(key, process.env[key])
            delete process.env[key]
        }
    })

    afterEach(() => {
        for (const key of keys) {
            const original = originalValues.get(key)

            if (original === undefined) {
                delete process.env[key]
                continue
            }

            process.env[key] = original
        }

        originalValues.clear()
    })

    it('按 SECURITY_ALERTS_TOKEN → GH_TOKEN → GITHUB_TOKEN 顺序取第一个非空值', () => {
        expect(resolveGitHubToken()).toBeNull()

        process.env.GITHUB_TOKEN = 'gh'
        expect(resolveGitHubToken()).toBe('gh')

        process.env.GH_TOKEN = ' gh-cli '
        expect(resolveGitHubToken()).toBe('gh-cli')

        process.env.SECURITY_ALERTS_TOKEN = 'security'
        expect(resolveGitHubToken()).toBe('security')
    })
})

describe('security-alert-gate-shared - fetchRepositoryAlerts', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('缺少 token 时跳过官方 API 并标记 missing-token', async () => {
        const result = await fetchRepositoryAlerts({ ...alertsParams, token: null })

        expect(result).toEqual({
            alerts: [],
            sourceStatus: expect.objectContaining({ kind: 'missing-token' }),
        })
    })

    it('按 Link 头翻页并去重', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse([{ number: 1 }, { number: 2 }], { link: '<https://api.github.com/next>; rel="next"' }))
            .mockResolvedValueOnce(jsonResponse([{ number: 2 }]))
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchRepositoryAlerts(alertsParams)

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(result.alerts.map((alert: { alertNumber: string }) => alert.alertNumber)).toEqual(['1', '2'])
        expect(result.sourceStatus.detail).toBe('Fetched 2 open alerts.')
    })

    it('Link 头指向自身时不进入死循环', async () => {
        const selfUrl = 'https://api.github.com/repos/CaoMeiYouRen/momei/dependabot/alerts?state=open&per_page=2'
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ number: 1 }], { link: `<${selfUrl}>; rel="next"` }))
        vi.stubGlobal('fetch', fetchMock)

        await fetchRepositoryAlerts(alertsParams)

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('HTTP 403 转成 permission-denied 并保留已读到的告警', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse([{ number: 1 }], { link: '<https://api.github.com/next>; rel="next"' }))
            .mockResolvedValueOnce(jsonResponse({ message: 'Resource not accessible' }, { status: 403 }))
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchRepositoryAlerts(alertsParams)

        expect(result.alerts).toHaveLength(1)
        expect(result.sourceStatus).toMatchObject({ kind: 'permission-denied' })
        expect(result.sourceStatus.detail).toContain('kept 1 alerts')
    })

    it('非数组响应判为 invalid-response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'oops' })))

        const result = await fetchRepositoryAlerts(alertsParams)

        expect(result.sourceStatus).toMatchObject({ detail: expect.stringContaining('expected an array'), kind: 'invalid-response' })
    })

    it('normalizer 抛错时判为 invalid-response 并带状态上下文', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([{ number: 1 }])))
        const result = await fetchRepositoryAlerts({
            ...alertsParams,
            normalizer: () => {
                throw new Error('bad payload')
            },
        })

        expect(result.sourceStatus).toMatchObject({ kind: 'invalid-response' })
        expect(result.sourceStatus.detail).toContain('state=open')
    })

    it('网络异常时返回 unavailable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

        const result = await fetchRepositoryAlerts(alertsParams)

        expect(result.sourceStatus).toMatchObject({ detail: 'network down', kind: 'unavailable' })
    })

    it('多状态时在详情里列出各状态计数', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse([{ number: 1 }]))
            .mockResolvedValueOnce(jsonResponse([{ number: 2 }, { number: 3 }]))
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchRepositoryAlerts({ ...alertsParams, states: ['open', 'dismissed'] })

        expect(result.sourceStatus.detail).toBe('Fetched 3 alerts (open=1, dismissed=2).')
    })
})

describe('security-alert-gate-shared - 输出', () => {
    it('annotateAlerts 附加分类且不改动原对象', () => {
        const alert = {
            alertNumber: '1',
            patchedVersion: null,
            severity: 'critical',
            source: 'dependabot',
            state: 'open',
        }
        const [annotated] = annotateAlerts([alert])

        expect(annotated).not.toBe(alert)
        expect(annotated.classification.bucket).toBe('defer')
        expect(annotated.classification.reason).toEqual(expect.any(String))
        expect(alert).not.toHaveProperty('classification')
    })

    it('printAlert 覆盖 dependabot / code-scanning 与可选字段', () => {
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        printAlert({
            alertNumber: '1',
            classification: { bucket: 'observe', reason: 'no patch' },
            htmlUrl: 'https://example.com/1',
            locationPath: 'src/a.ts',
            packageName: 'vite',
            severity: 'low',
            source: 'dependabot',
        })
        printAlert({
            alertNumber: '2',
            classification: { bucket: 'defer', reason: 'below threshold' },
            dismissedReason: 'wont fix',
            ruleId: 'js/xss',
            severity: 'medium',
            source: 'code-scanning',
            state: 'dismissed',
        })

        const output = infoSpy.mock.calls.map((call) => String(call[0]))
        expect(output).toContain('- vite 1 [low] -> observe')
        expect(output).toContain('  url: https://example.com/1')
        expect(output).toContain('  location: src/a.ts')
        expect(output).toContain('- js/xss 2 [medium] -> defer')
        expect(output).toContain('  state: dismissed (wont fix)')

        infoSpy.mockRestore()
    })
})

describe('security-alert-gate-shared - collectAlerts', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        delete process.env.GITHUB_REPOSITORY
        delete process.env.SECURITY_ALERTS_TOKEN
    })

    it('双源双状态抓取后汇总仓库与来源状态', async () => {
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
        process.env.GITHUB_REPOSITORY = 'CaoMeiYouRen/momei'
        process.env.SECURITY_ALERTS_TOKEN = 'token-1'

        const dependabotAlert = {
            dependency: { package: { ecosystem: 'npm', name: 'vite' } },
            html_url: 'https://example.com/dep/1',
            number: 1,
            security_advisory: { severity: 'high', summary: 'vite issue' },
            security_vulnerability: { first_patched_version: { identifier: '7.3.9' }, package: { ecosystem: 'npm', name: 'vite' }, severity: 'high' },
            state: 'open',
        }
        const codeScanningAlert = {
            html_url: 'https://example.com/cs/1',
            most_recent_instance: { location: { path: 'src/a.ts' } },
            number: 1,
            rule: { id: 'js/xss', security_severity_level: 'critical' },
            state: 'open',
        }
        const fetchMock = vi.fn(async (url: URL) => {
            const target = String(url)

            if (target.includes('dependabot/alerts')) {
                return jsonResponse(target.includes('state=open') ? [dependabotAlert] : [])
            }

            return jsonResponse(target.includes('state=open') ? [codeScanningAlert] : [])
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await collectAlerts(parseArgs([]), process.cwd())

        expect(fetchMock).toHaveBeenCalledTimes(4)
        expect(result.repository).toEqual({ owner: 'CaoMeiYouRen', repo: 'momei' })
        expect(result.dependabotAlerts).toHaveLength(1)
        expect(result.codeScanningAlerts).toHaveLength(1)
        expect(result.sourceStatuses.dependabot.kind).toBe('ok')
        expect(result.sourceStatuses.codeScanning.kind).toBe('ok')

        infoSpy.mockRestore()
    })
})

describe('security-alert-gate-shared - markdown 分支', () => {
    it('覆盖 blocker / 例外 / allowlist / 到期 / 降级 / transition 全部段落', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-alert-md-'))
        const artifactPaths = {
            json: path.join(tempRoot, 'artifacts', 'alerts.json'),
            md: path.join(tempRoot, 'artifacts', 'alerts.md'),
        }
        const blockingDependabot = {
            alertNumber: '1',
            classification: { bucket: 'immediate-fix', reason: 'patched version available' },
            htmlUrl: 'https://example.com/1',
            packageName: 'vite',
            severity: 'high',
            source: 'dependabot',
        }
        const blockingCodeScanning = {
            alertNumber: '2',
            classification: { bucket: 'dismissed-critical', reason: 'dismissed as won\'t fix' },
            dismissedReason: 'wont fix',
            ruleId: 'js/xss',
            severity: 'critical',
            source: 'code-scanning',
            state: 'dismissed',
        }
        const exceptionEntry = { category: 'risk-accepted', reason: 'no patch upstream', review: '2026-12-01' }
        const allowlistEntry = { reason: 'unreachable code path', temporaryException: true }
        const status = { detail: 'detail', kind: 'ok', sourceName: 'github-api' }

        try {
            await writeArtifacts({
                alerts: annotateAlerts([blockingDependabot]),
                artifactPaths,
                effectiveBlocking: [annotateAlerts([blockingDependabot])[0], blockingCodeScanning] as never,
                gateConclusion: 'Reject',
                minSeverity: 'high',
                repoRoot: tempRoot,
                repository: { owner: 'CaoMeiYouRen', repo: 'momei' },
                result: {
                    allowlisted: [{ alert: blockingDependabot, allowlistEntry }],
                    blocking: [blockingDependabot],
                    dismissedBlocking: [blockingCodeScanning],
                    excepted: [{ alert: blockingDependabot, exceptionEntry }],
                    expiredExceptions: [{ alertNumber: '9', expiresAt: '2026-01-01', source: 'dependabot' }],
                    observe: [],
                    relevantAlerts: [blockingDependabot, blockingCodeScanning],
                    sourceFailures: [{ source: 'codeScanning', status: { detail: 'denied', kind: 'permission-denied' } }],
                    sourceWarnings: [{ source: 'dependabot', status: { detail: 'degraded', kind: 'fallback' } }],
                    staleExceptions: [{ alertNumber: '10', source: 'dependabot' }],
                    transitionBlocking: [blockingDependabot, { source: 'dependabot', status: { detail: 'gap', kind: 'unavailable' } }],
                },
                sourceStatuses: { codeScanning: { ...status, kind: 'permission-denied' }, dependabot: status },
                transitionMode: true,
            })

            const markdown = await readFile(artifactPaths.md, 'utf8')

            expect(markdown).toContain('1. vite (1) [high] -> ')
            expect(markdown).toContain('状态: dismissed (wont fix)')
            expect(markdown).toContain('通过例外基线放行')
            expect(markdown).toContain('通过 dependency-risk allowlist 豁免')
            expect(markdown).toContain('数据源降级')
            expect(markdown).toContain('例外已到期')
            expect(markdown).toContain('例外未命中任何当前告警')
            expect(markdown).toContain('transition 待处理告警')
            expect(markdown).toContain('transition 数据源缺口')
            expect(markdown).toContain('数据源 fail-closed')
            expect(markdown).toContain('- 结论: Reject')
        } finally {
            await rm(tempRoot, { force: true, recursive: true })
        }
    })
})

describe('security-alert-gate-shared - markdown 空态分支', () => {
    it('无 blocker / 无 warning 时输出「无」并区分 Code Scanning 状态文案', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-alert-md-empty-'))
        const artifactPaths = { json: path.join(tempRoot, 'a.json'), md: path.join(tempRoot, 'a.md') }
        const status = { detail: 'ok detail', kind: 'ok', sourceName: 'github-api' }

        try {
            await writeArtifacts({
                alerts: [],
                artifactPaths,
                effectiveBlocking: [],
                gateConclusion: 'Pass',
                minSeverity: 'high',
                repoRoot: tempRoot,
                repository: { owner: 'CaoMeiYouRen', repo: 'momei' },
                result: {
                    allowlisted: [],
                    blocking: [],
                    dismissedBlocking: [],
                    excepted: [],
                    expiredExceptions: [],
                    observe: [],
                    relevantAlerts: [],
                    sourceFailures: [],
                    sourceWarnings: [],
                    staleExceptions: [],
                    transitionBlocking: [],
                },
                sourceStatuses: { codeScanning: status, dependabot: status },
            })

            const markdown = await readFile(artifactPaths.md, 'utf8')

            expect(markdown).toContain('- 结论: Pass')
            expect(markdown).toMatch(/### blocker\n+无/u)
            expect(markdown).toMatch(/### warning\n+无/u)
            expect(markdown).toMatch(/### 未覆盖边界\n- 无/u)
            expect(markdown).toContain('若出现新的 high+ Code Scanning 告警')
        } finally {
            await rm(tempRoot, { force: true, recursive: true })
        }
    })
})
