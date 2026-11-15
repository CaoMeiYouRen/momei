import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

describe('security-alert-gate-shared - pnpm audit 回退', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        spawnMock.mockReset()
        delete process.env.GITHUB_REPOSITORY
        delete process.env.SECURITY_ALERTS_TOKEN
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
        delete process.env.SECURITY_ALERTS_TOKEN
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
