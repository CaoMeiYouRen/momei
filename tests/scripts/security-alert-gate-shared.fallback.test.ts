import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * GitHub 官方源不可用时的 pnpm audit 回退路径。
 *
 * 这里是门禁「拿不到官方数据也不静默放行」的关键分支：权限不足时 Dependabot 结论
 * 必须降级为 fallback（并说明不覆盖 dismissed），Code Scanning 保持 fail-closed。
 * 单独成文件是为了把 `node:child_process` 替换成可控进程，避免真的执行 `pnpm audit`。
 */

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }))

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>()

    return {
        ...actual,
        execFile: (command: string, args: string[], options: unknown, callback: (error: Error | null, result: { stderr: string, stdout: string }) => void) => {
            callback(null, { stderr: '', stdout: '' })
        },
        spawn: spawnMock,
    }
})

function createFakeAuditProcess(payload: unknown) {
    const child = new EventEmitter() as EventEmitter & {
        kill: () => void
        stderr: EventEmitter
        stdout: EventEmitter
    }
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    child.kill = vi.fn()

    setImmediate(() => {
        child.stdout.emit('data', Buffer.from(JSON.stringify(payload)))
        child.emit('close')
    })

    return child
}

const { collectAlerts, parseArgs } = await import('../../scripts/security/security-alert-gate-shared.mjs')

// CI 的 Test job 自带 GITHUB_TOKEN，开发机常驻 GH_TOKEN：任一残留都会让「无 token」
// 用例改走 GitHub API 分支。统一在模块级保存并清空三者，用例结束再还原，
// 避免用例依赖宿主环境，也不污染同文件其他用例。
const TOKEN_ENV_KEYS = ['SECURITY_ALERTS_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN'] as const
const originalTokenEnv = new Map<string, string | undefined>()

beforeEach(() => {
    for (const key of TOKEN_ENV_KEYS) {
        originalTokenEnv.set(key, process.env[key])
        delete process.env[key]
    }
})

afterEach(() => {
    for (const key of TOKEN_ENV_KEYS) {
        const original = originalTokenEnv.get(key)

        if (original === undefined) {
            delete process.env[key]
            continue
        }

        process.env[key] = original
    }

    originalTokenEnv.clear()
})

const auditReportWithRisk = {
    vulnerabilities: {
        vite: {
            fixAvailable: false,
            name: 'vite',
            nodes: ['node_modules/vite'],
            severity: 'high',
            title: 'vite vulnerability',
            url: 'https://example.com/advisory/vite',
        },
    },
}

function forbiddenResponse() {
    return {
        headers: new Map() as unknown as Headers,
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ message: 'Resource not accessible by integration' }),
    }
}

function serverErrorResponse() {
    return {
        headers: new Map() as unknown as Headers,
        ok: false,
        status: 500,
        text: async () => JSON.stringify({}),
    }
}

function okResponse() {
    return {
        headers: new Map() as unknown as Headers,
        ok: true,
        status: 200,
        text: async () => JSON.stringify([]),
    }
}

describe('security-alert-gate-shared - pnpm audit 回退', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        spawnMock.mockReset()
        delete process.env.GITHUB_REPOSITORY
    })

    it('专用 SECURITY_ALERTS_TOKEN 可访问官方源时标记 ok 且不触发 fallback', async () => {
        process.env.GITHUB_REPOSITORY = 'CaoMeiYouRen/momei'
        process.env.SECURITY_ALERTS_TOKEN = 'token-1'
        vi.stubGlobal('fetch', vi.fn(async () => okResponse()))

        const result = await collectAlerts(parseArgs([]), process.cwd())

        expect(result.sourceStatuses.dependabot).toMatchObject({ kind: 'ok', sourceName: 'github-api' })
        expect(result.sourceStatuses.codeScanning).toMatchObject({ kind: 'ok', sourceName: 'github-api' })
        expect(spawnMock).not.toHaveBeenCalled()
    })

    it('官方源 403 时改用 pnpm audit 并标记 fallback', async () => {
        process.env.GITHUB_REPOSITORY = 'CaoMeiYouRen/momei'
        process.env.SECURITY_ALERTS_TOKEN = 'token-1'
        spawnMock.mockReturnValue(createFakeAuditProcess({ vulnerabilities: {} }))
        vi.stubGlobal('fetch', vi.fn(async (url: URL) => (
            String(url).includes('dependabot') ? forbiddenResponse() : serverErrorResponse()
        )))

        const result = await collectAlerts(parseArgs([]), process.cwd())

        expect(spawnMock).toHaveBeenCalledWith('pnpm', ['audit', '--json', '--registry=https://registry.npmjs.org/'], expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] }))
        expect(result.sourceStatuses.dependabot).toMatchObject({ kind: 'permission-denied', sourceName: 'github-api' })
        expect(result.sourceStatuses.dependabot.detail).toContain('pnpm audit fallback supplied 0 open risks')
        expect(result.sourceStatuses.dependabot.detail).toContain('does not cover dismissed state')
        expect(result.sourceStatuses.codeScanning).toMatchObject({ kind: 'unavailable' })
        expect(result.dependabotAlerts).toEqual([])
    })

    it('pnpm audit 无输出时降级为带失败原因的 fallback 结论', async () => {
        process.env.GITHUB_REPOSITORY = 'CaoMeiYouRen/momei'
        process.env.SECURITY_ALERTS_TOKEN = 'token-1'
        spawnMock.mockReturnValue(createFakeAuditProcess({ vulnerabilities: {} }))
        // 空输出 + 报错文本：loadPnpmAuditReport 必须把 stderr 带进错误
        spawnMock.mockImplementationOnce(() => {
            const child = new EventEmitter() as EventEmitter & { kill: () => void, stderr: EventEmitter, stdout: EventEmitter }
            child.stdout = new EventEmitter()
            child.stderr = new EventEmitter()
            child.kill = vi.fn()
            setImmediate(() => {
                child.stderr.emit('data', Buffer.from('registry unavailable'))
                child.emit('close')
            })
            return child
        })
        vi.stubGlobal('fetch', vi.fn(async () => forbiddenResponse()))

        const result = await collectAlerts(parseArgs([]), process.cwd())

        expect(result.sourceStatuses.dependabot.detail).toContain('pnpm audit fallback failed')
        expect(result.sourceStatuses.dependabot.detail).toContain('registry unavailable')
    })
})

describe('security-alert-gate-shared - 缺 token 时的 fallback', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        spawnMock.mockReset()
        delete process.env.GITHUB_REPOSITORY
    })

    it.each(['GITHUB_TOKEN', 'GH_TOKEN'])('仅 %s 时仍访问官方 API 并按 403 降级', async (tokenKey) => {
        process.env.GITHUB_REPOSITORY = 'CaoMeiYouRen/momei'
        process.env[tokenKey] = 'token-1'
        spawnMock.mockReturnValue(createFakeAuditProcess(auditReportWithRisk))
        vi.stubGlobal('fetch', vi.fn(async () => forbiddenResponse()))

        const result = await collectAlerts(parseArgs([]), process.cwd())

        expect(result.sourceStatuses.dependabot).toMatchObject({ kind: 'permission-denied', sourceName: 'github-api' })
        expect(result.sourceStatuses.dependabot.detail).toContain('pnpm audit fallback supplied 1 open risks')
        expect(result.dependabotAlerts).toHaveLength(1)
    })

    it('无 GitHub token 时用 pnpm audit 结果作为 Dependabot 来源', async () => {
        process.env.GITHUB_REPOSITORY = 'CaoMeiYouRen/momei'
        spawnMock.mockReturnValue(createFakeAuditProcess(auditReportWithRisk))
        // 无 token 时不会发请求；这里仍兜底 stub，避免未来改动意外触网。
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('unexpected network call')
        }))

        const result = await collectAlerts(parseArgs([]), process.cwd())

        expect(result.sourceStatuses.dependabot).toMatchObject({ kind: 'fallback', sourceName: 'pnpm-audit' })
        expect(result.sourceStatuses.dependabot.detail).toContain('fell back to pnpm audit with 1 open risks')
        expect(result.dependabotAlerts).toHaveLength(1)
        expect(result.dependabotAlerts[0]).toMatchObject({ packageName: 'vite', severity: 'high', source: 'dependabot' })
    })
})
