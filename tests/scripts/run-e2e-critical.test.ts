import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const spawnMock = vi.fn()
const getCliArgsMock = vi.fn(() => [])

vi.mock('node:child_process', () => ({
    spawn: spawnMock,
    default: {
        spawn: spawnMock,
    },
}))

vi.mock('/workspaces/momei/scripts/shared/cli.mjs', () => ({
    getCliArgs: getCliArgsMock,
}))

function createMockChild({ code = 0, signal = null, emitError = null }: { code?: number | null, signal?: NodeJS.Signals | null, emitError?: Error | null } = {}) {
    const child = new EventEmitter()

    queueMicrotask(() => {
        if (emitError) {
            child.emit('error', emitError)
            return
        }

        child.emit('exit', code, signal)
    })

    return child
}

function hasSequence(args: string[], sequence: string[]) {
    let cursor = 0

    for (const arg of args) {
        if (arg === sequence[cursor]) {
            cursor += 1
            if (cursor === sequence.length) {
                return true
            }
        }
    }

    return false
}

describe('run-e2e-critical', () => {
    beforeEach(() => {
        spawnMock.mockReset()
        getCliArgsMock.mockReset()
        getCliArgsMock.mockReturnValue([])
    })

    afterEach(() => {
        vi.resetModules()
    })

    it('runs one critical step successfully', async () => {
        spawnMock.mockImplementation(() => createMockChild({ code: 0 }))

        const mod = await import('@/scripts/testing/run-e2e-critical.mjs')
        await expect(mod.runRunE2E(['tests/e2e/auth-session-governance.e2e.test.ts'])).resolves.toBeUndefined()

        expect(spawnMock).toHaveBeenCalledTimes(1)
        expect(spawnMock).toHaveBeenCalledWith(
            process.execPath,
            expect.arrayContaining([
                expect.stringContaining('scripts/testing/run-e2e.mjs'),
                'tests/e2e/auth-session-governance.e2e.test.ts',
            ]),
            expect.objectContaining({
                cwd: process.cwd(),
                env: process.env,
                stdio: 'inherit',
            }),
        )
    })

    it('surfaces non-zero exit code as a descriptive error', async () => {
        spawnMock.mockImplementation(() => createMockChild({ code: 1 }))

        const mod = await import('@/scripts/testing/run-e2e-critical.mjs')
        await expect(mod.runRunE2E(['--project=chromium'])).rejects.toThrow('Critical E2E step failed: --project=chromium')
    })

    it('runs desktop and mobile suites in order via main()', async () => {
        getCliArgsMock.mockReturnValue([])
        spawnMock.mockImplementation(() => createMockChild({ code: 0 }))

        const mod = await import('@/scripts/testing/run-e2e-critical.mjs')
        await expect(mod.main()).resolves.toBeUndefined()

        expect(spawnMock).toHaveBeenCalledTimes(2)

        const firstCallArgs = (spawnMock.mock.calls[0]?.[1] ?? []) as string[]
        const secondCallArgs = (spawnMock.mock.calls[1]?.[1] ?? []) as string[]

        expect(firstCallArgs[0]).toContain('scripts/testing/run-e2e.mjs')
        expect(firstCallArgs).toEqual(expect.arrayContaining([
            'tests/e2e/auth-session-governance.e2e.test.ts',
            '--project=chromium',
            '--project=firefox',
            '--project=webkit',
        ]))
        expect(secondCallArgs[0]).toContain('scripts/testing/run-e2e.mjs')
        expect(secondCallArgs).toEqual(expect.arrayContaining([
            'tests/e2e/mobile-critical.e2e.test.ts',
            '--project=mobile-chrome-critical',
            '--project=mobile-safari-critical',
        ]))

        // CLI extra args are optional; when present they should preserve relative order.
        if (firstCallArgs.includes('--grep')) {
            expect(hasSequence(firstCallArgs, ['--grep', 'critical'])).toBe(true)
        }
        if (secondCallArgs.includes('--grep')) {
            expect(hasSequence(secondCallArgs, ['--grep', 'critical'])).toBe(true)
        }
    })
})
