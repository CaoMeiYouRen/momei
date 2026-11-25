import { describe, expect, it } from 'vitest'
import { main } from '@/scripts/testing/run-visual-mobile.mjs'

describe('run-visual-mobile', () => {
    it('按「构建检查 → 浏览器准备 → 以移动独立 config 运行」顺序编排', async () => {
        const callOrder: string[] = []
        let capturedArgs: string[] | null = null
        let capturedEnv: Record<string, string> | null = null

        await main({
            getCliArgsFn: () => ['--grep', 'mobile-home'],
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
        // 必须显式指向移动独立 config，避免落到桌面基线 / e2e 的 testMatch
        expect(capturedArgs).toEqual([
            'exec',
            'playwright',
            'test',
            '--config=playwright.visual-mobile.config.ts',
            '--grep',
            'mobile-home',
        ])
        expect(capturedEnv).toMatchObject({
            FOO: 'bar',
            TEST_MODE: 'true',
        })
    })

    it('透传 --update-snapshots 且剔除 pnpm 透传的 -- 分隔符', async () => {
        let capturedArgs: string[] | null = null

        await main({
            getCliArgsFn: () => ['--', '--update-snapshots'],
            ensureBuildOutputFn: () => Promise.resolve(),
            ensurePlaywrightBrowsersFn: () => Promise.resolve(),
            runFn: (_command: string, args: string[]) => {
                capturedArgs = args
                return Promise.resolve()
            },
            runtimeEnv: {},
        })

        expect(capturedArgs).toEqual([
            'exec',
            'playwright',
            'test',
            '--config=playwright.visual-mobile.config.ts',
            '--update-snapshots',
        ])
    })
})
