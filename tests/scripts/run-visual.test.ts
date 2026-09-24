import { describe, expect, it } from 'vitest'
import { main } from '@/scripts/testing/run-visual.mjs'

describe('run-visual', () => {
    it('按「构建检查 → 浏览器准备 → 以独立 config 运行」顺序编排', async () => {
        const callOrder: string[] = []
        let capturedArgs: string[] | null = null
        let capturedEnv: Record<string, string> | null = null

        await main({
            getCliArgsFn: () => ['--grep', 'admin-posts'],
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
        // 必须显式指向独立 config，避免落到 e2e 的 testMatch
        expect(capturedArgs).toEqual([
            'exec',
            'playwright',
            'test',
            '--config=playwright.visual.config.ts',
            '--grep',
            'admin-posts',
        ])
        expect(capturedEnv).toMatchObject({
            FOO: 'bar',
            TEST_MODE: 'true',
        })
    })

    it('透传 --update-snapshots 且强制 TEST_MODE=true', async () => {
        let capturedArgs: string[] | null = null
        let capturedEnv: { TEST_MODE?: string } | null = null

        await main({
            getCliArgsFn: () => ['--update-snapshots'],
            ensureBuildOutputFn: () => Promise.resolve(),
            ensurePlaywrightBrowsersFn: () => Promise.resolve(),
            runFn: (_command: string, args: string[], env: Record<string, string | undefined>) => {
                capturedArgs = args
                capturedEnv = { TEST_MODE: env.TEST_MODE }
                return Promise.resolve()
            },
            runtimeEnv: {
                TEST_MODE: 'false',
            },
        })

        expect(capturedArgs).toContain('--update-snapshots')
        const testMode = (capturedEnv as { TEST_MODE?: string } | null)?.TEST_MODE
        expect(testMode).toBe('true')
    })
})
