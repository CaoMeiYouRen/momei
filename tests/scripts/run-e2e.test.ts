import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
    defaultIgnoredEntries,
    ensureBuildOutput,
    ensurePlaywrightBrowsers,
    getLatestMtimeMs,
    getMissingPlaywrightBrowsers,
    getPlaywrightInstallAttempts,
    isRecoverablePlaywrightDepsInstallError,
    main,
    quoteWindowsArg,
    shouldRebuildOutput,
} from '@/scripts/testing/run-e2e.mjs'

describe('run-e2e', () => {
    it('treats a complete playwright browser cache as reusable', () => {
        const installedDirs = [
            'chromium-1208',
            'chromium_headless_shell-1208',
            'ffmpeg-1011',
            'firefox-1509',
            'webkit-2248',
        ]

        expect(getMissingPlaywrightBrowsers(installedDirs)).toEqual([])
    })

    it('detects the missing chromium headless shell required by global setup', () => {
        const installedDirs = [
            'chromium-1208',
            'firefox-1509',
            'webkit-2248',
        ]

        expect(getMissingPlaywrightBrowsers(installedDirs)).toEqual(['chromium-headless-shell'])
    })

    it('fails closed when the browser cache is empty', () => {
        expect(getMissingPlaywrightBrowsers([])).toEqual([
            'chromium',
            'chromium-headless-shell',
            'firefox',
            'webkit',
        ])
    })

    it('retries without system deps by default on linux', () => {
        expect(getPlaywrightInstallAttempts({ env: {}, platform: 'linux' })).toEqual([
            ['install', '--with-deps'],
            ['install'],
        ])
    })

    it('uses plain install outside linux or when explicitly disabled', () => {
        expect(getPlaywrightInstallAttempts({ env: {}, platform: 'darwin' })).toEqual([
            ['install'],
        ])
        expect(getPlaywrightInstallAttempts({ env: { PLAYWRIGHT_INSTALL_DEPS: 'false' }, platform: 'linux' })).toEqual([
            ['install'],
        ])
    })

    it('keeps --with-deps when explicitly required', () => {
        expect(getPlaywrightInstallAttempts({ env: { PLAYWRIGHT_INSTALL_DEPS: 'true' }, platform: 'linux' })).toEqual([
            ['install', '--with-deps'],
        ])
    })

    it('recognizes recoverable apt-based install failures', () => {
        expect(isRecoverablePlaywrightDepsInstallError('E: The repository is not signed\nNO_PUBKEY 62D54FD4003F6525')).toBe(true)
        expect(isRecoverablePlaywrightDepsInstallError('Failed to install browsers\napt-get update failed')).toBe(true)
        expect(isRecoverablePlaywrightDepsInstallError('download timed out')).toBe(false)
    })

    it('quotes windows arguments only when necessary', () => {
        expect(quoteWindowsArg('pnpm')).toBe('pnpm')
        expect(quoteWindowsArg('playwright install')).toBe('"playwright install"')
        expect(quoteWindowsArg('path"with"quote')).toBe('"path\\"with\\"quote"')
    })

    it('detects missing build output before running playwright', async () => {
        const tempRepoRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-run-e2e-missing-output-'))

        try {
            await expect(shouldRebuildOutput({ repoRoot: tempRepoRoot })).resolves.toMatchObject({
                needsBuild: true,
                reason: 'missing build output',
            })
        } finally {
            await rm(tempRepoRoot, { force: true, recursive: true })
        }
    })

    it('marks build output stale when source files are newer', async () => {
        const tempRepoRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-run-e2e-stale-output-'))
        const outputPath = path.join(tempRepoRoot, '.output', 'server', 'index.mjs')
        const sourcePath = path.join(tempRepoRoot, 'components', 'sample.ts')

        await mkdir(path.dirname(outputPath), { recursive: true })
        await mkdir(path.dirname(sourcePath), { recursive: true })
        await writeFile(outputPath, 'export default {}\n', 'utf8')
        await writeFile(sourcePath, 'export const x = 1\n', 'utf8')
        await utimes(outputPath, new Date('2026-06-07T00:00:00.000Z'), new Date('2026-06-07T00:00:00.000Z'))
        await utimes(sourcePath, new Date('2026-06-08T00:00:00.000Z'), new Date('2026-06-08T00:00:00.000Z'))

        try {
            await expect(shouldRebuildOutput({ repoRoot: tempRepoRoot })).resolves.toMatchObject({
                needsBuild: true,
                reason: 'source files changed after the last build',
            })
        } finally {
            await rm(tempRepoRoot, { force: true, recursive: true })
        }
    })

    it('reuses build output when source tree is older than output and ignores excluded folders', async () => {
        const tempRepoRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-run-e2e-fresh-output-'))
        const outputPath = path.join(tempRepoRoot, '.output', 'server', 'index.mjs')
        const sourcePath = path.join(tempRepoRoot, 'pages', 'index.ts')
        const ignoredPath = path.join(tempRepoRoot, 'node_modules', 'some-package', 'index.js')

        await mkdir(path.dirname(outputPath), { recursive: true })
        await mkdir(path.dirname(sourcePath), { recursive: true })
        await mkdir(path.dirname(ignoredPath), { recursive: true })
        await writeFile(outputPath, 'export default {}\n', 'utf8')
        await writeFile(sourcePath, 'export const page = true\n', 'utf8')
        await writeFile(ignoredPath, 'module.exports = {}\n', 'utf8')

        await utimes(sourcePath, new Date('2026-06-07T00:00:00.000Z'), new Date('2026-06-07T00:00:00.000Z'))
        await utimes(outputPath, new Date('2100-01-01T00:00:00.000Z'), new Date('2100-01-01T00:00:00.000Z'))
        await utimes(ignoredPath, new Date('2026-06-09T00:00:00.000Z'), new Date('2026-06-09T00:00:00.000Z'))

        try {
            await expect(shouldRebuildOutput({ repoRoot: tempRepoRoot })).resolves.toMatchObject({
                needsBuild: false,
                reason: 'build output is fresh',
            })
        } finally {
            await rm(tempRepoRoot, { force: true, recursive: true })
        }
    })

    it('allows forcing rebuild through FORCE_E2E_BUILD', async () => {
        const tempRepoRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-run-e2e-force-build-'))
        const outputPath = path.join(tempRepoRoot, '.output', 'server', 'index.mjs')

        await mkdir(path.dirname(outputPath), { recursive: true })
        await writeFile(outputPath, 'export default {}\n', 'utf8')

        try {
            await expect(shouldRebuildOutput({
                repoRoot: tempRepoRoot,
                forceE2EBuild: 'true',
            })).resolves.toMatchObject({
                needsBuild: true,
                reason: 'FORCE_E2E_BUILD=true',
            })
        } finally {
            await rm(tempRepoRoot, { force: true, recursive: true })
        }
    })

    it('walks directories recursively while skipping ignored entries', async () => {
        const tempRepoRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-run-e2e-latest-mtime-'))
        const includedPath = path.join(tempRepoRoot, 'server', 'api', 'index.ts')
        const ignoredPath = path.join(tempRepoRoot, 'tests', 'e2e', 'sample.test.ts')

        await mkdir(path.dirname(includedPath), { recursive: true })
        await mkdir(path.dirname(ignoredPath), { recursive: true })
        await writeFile(includedPath, 'export const ok = true\n', 'utf8')
        await writeFile(ignoredPath, 'export const ignored = true\n', 'utf8')

        const includedTime = new Date('2026-06-08T00:00:00.000Z')
        const ignoredTime = new Date('2026-06-09T00:00:00.000Z')
        await utimes(includedPath, includedTime, includedTime)
        await utimes(ignoredPath, ignoredTime, ignoredTime)

        try {
            const withoutIgnore = await getLatestMtimeMs(tempRepoRoot, {
                ignoredEntries: new Set(),
            })
            const withIgnore = await getLatestMtimeMs(tempRepoRoot, {
                ignoredEntries: defaultIgnoredEntries,
            })

            expect(withoutIgnore).toBeGreaterThanOrEqual(ignoredTime.getTime())
            expect(withIgnore).toBeLessThanOrEqual(withoutIgnore)
            expect(withIgnore).toBeGreaterThanOrEqual(includedTime.getTime())
        } finally {
            await rm(tempRepoRoot, { force: true, recursive: true })
        }
    })

    it('falls back to plain install when --with-deps failure is recoverable', async () => {
        const runAndCaptureCalls: string[][] = []
        const runAndCaptureFn = (_command: string, args: string[]) => {
            runAndCaptureCalls.push(args)
            if (args.includes('--with-deps')) {
                throw new Error('NO_PUBKEY apt-get failed')
            }
            return Promise.resolve({ stderr: '', stdout: '' })
        }

        await ensurePlaywrightBrowsers({
            getInstalledBrowserDirsFn: () => Promise.resolve(['chromium-1208']),
            getPlaywrightInstallAttemptsFn: () => [['install', '--with-deps'], ['install']],
            isRecoverablePlaywrightDepsInstallErrorFn: () => true,
            runAndCaptureFn,
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        })

        expect(runAndCaptureCalls).toEqual([
            ['exec', 'playwright', 'install', '--with-deps'],
            ['exec', 'playwright', 'install'],
        ])
    })

    it('rethrows browser installation errors when they are not recoverable', async () => {
        await expect(ensurePlaywrightBrowsers({
            getInstalledBrowserDirsFn: () => Promise.resolve(['chromium-1208']),
            getPlaywrightInstallAttemptsFn: () => [['install', '--with-deps']],
            isRecoverablePlaywrightDepsInstallErrorFn: () => false,
            runAndCaptureFn: () => Promise.reject(new Error('download timed out')),
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        })).rejects.toThrow('download timed out')
    })

    it('uses direct install fallback when browser cache inspection fails', async () => {
        const runCalls: string[][] = []

        await ensurePlaywrightBrowsers({
            getInstalledBrowserDirsFn: () => {
                throw new Error('cache permission denied')
            },
            runFn: (_command: string, args: string[]) => {
                runCalls.push(args)
                return Promise.resolve()
            },
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        })

        expect(runCalls).toEqual([
            ['exec', 'playwright', 'install', '--with-deps'],
        ])
    })

    it('skips playwright installation when required browsers already exist', async () => {
        const runAndCaptureFn = () => {
            throw new Error('should not install when cache is complete')
        }

        await expect(ensurePlaywrightBrowsers({
            getInstalledBrowserDirsFn: () => Promise.resolve([
                'chromium-1208',
                'chromium_headless_shell-1208',
                'firefox-1509',
                'webkit-2248',
            ]),
            runAndCaptureFn,
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        })).resolves.toBeUndefined()
    })

    it('calls build command only when output is stale', async () => {
        const runCalls: string[][] = []

        await ensureBuildOutput({
            shouldRebuildOutputFn: () => Promise.resolve({
                needsBuild: true,
                reason: 'source files changed after the last build',
            }),
            runFn: (_command: string, args: string[]) => {
                runCalls.push(args)
                return Promise.resolve()
            },
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        })

        expect(runCalls).toEqual([['run', 'build']])
    })

    it('reuses build output when shouldRebuildOutput reports fresh build', async () => {
        const runCalls: string[][] = []

        await ensureBuildOutput({
            shouldRebuildOutputFn: () => Promise.resolve({
                needsBuild: false,
                reason: 'build output is fresh',
            }),
            runFn: (_command: string, args: string[]) => {
                runCalls.push(args)
                return Promise.resolve()
            },
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        })

        expect(runCalls).toEqual([])
    })

    it('throws the last installation error when all recoverable attempts are exhausted', async () => {
        await expect(ensurePlaywrightBrowsers({
            getInstalledBrowserDirsFn: () => Promise.resolve(['chromium-1208']),
            getPlaywrightInstallAttemptsFn: () => [['install', '--with-deps'], ['install', '--with-deps']],
            isRecoverablePlaywrightDepsInstallErrorFn: () => true,
            runAndCaptureFn: () => Promise.reject(new Error('NO_PUBKEY retry still failed')),
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        })).rejects.toThrow('NO_PUBKEY retry still failed')
    })

    it('orchestrates build, browser prep, and playwright test execution in main()', async () => {
        const callOrder: string[] = []
        let capturedEnv: Record<string, string> | null = null
        let capturedArgs: string[] | null = null

        await main({
            getCliArgsFn: () => ['--grep', 'critical'],
            ensureBuildOutputFn: () => {
                callOrder.push('build')
                return Promise.resolve()
            },
            ensurePlaywrightBrowsersFn: () => {
                callOrder.push('browsers')
                return Promise.resolve()
            },
            runFn: (_command: string, args: string[], env: Record<string, string>) => {
                callOrder.push('run')
                capturedArgs = args
                capturedEnv = env
                return Promise.resolve()
            },
            runtimeEnv: {
                FOO: 'bar',
            },
        })

        expect(callOrder).toEqual(['build', 'browsers', 'run'])
        expect(capturedArgs).toEqual(['exec', 'playwright', 'test', '--grep', 'critical'])
        expect(capturedEnv).toMatchObject({
            FOO: 'bar',
            TEST_MODE: 'true',
        })
    })

    it('forces TEST_MODE=true even when runtime env provides a different value', async () => {
        let capturedEnv: { TEST_MODE?: string } | null = null

        await main({
            getCliArgsFn: () => [],
            ensureBuildOutputFn: () => Promise.resolve(),
            ensurePlaywrightBrowsersFn: () => Promise.resolve(),
            runFn: (_command: string, _args: string[], env: Record<string, string | undefined>) => {
                capturedEnv = { TEST_MODE: env.TEST_MODE }
                return Promise.resolve()
            },
            runtimeEnv: {
                TEST_MODE: 'false',
            },
        })

        const testMode = (capturedEnv as { TEST_MODE?: string } | null)?.TEST_MODE
        expect(testMode).toBe('true')
    })
})
