import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * CLI / 库入口拆分回归测试。
 *
 * 背景：`momei-mcp-server` 同时是库（`createMcpHttpServer` 供 Nitro 插件 inline 使用）
 * 与 CLI（stdio 入口）。历史上 `main()` 无守卫地写在库入口顶层，导致
 * Nuxt dev/生产启动时误执行 CLI，缺少 `MOMEI_API_KEY` 直接 `process.exit(1)`。
 */
describe('momei-mcp-server 入口拆分回归', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('import 库入口不应触发 CLI 副作用（不 process.exit、不打印错误）', async () => {
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit 不应在 import 库入口时被调用')
        }) as unknown as typeof process.exit)
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        const mod = await import('./index')

        expect(exitSpy).not.toHaveBeenCalled()
        expect(errorSpy).not.toHaveBeenCalled()
        expect(typeof mod.createMcpHttpServer).toBe('function')
        expect(typeof mod.loadConfig).toBe('function')
    })

    it('库入口不应导出 main，CLI 启动点应在 cli.ts', async () => {
        const mod = await import('./index') as Record<string, unknown>
        expect(mod).not.toHaveProperty('main')
    })

    it('package.json 的 bin/start 应指向 CLI 产物 dist/cli.mjs', () => {
        const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url))
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
            bin: Record<string, string>
            scripts: Record<string, string>
        }

        expect(pkg.bin['momei-mcp']).toBe('dist/cli.mjs')
        expect(pkg.scripts.start).toBe('node dist/cli.mjs')
    })
})
