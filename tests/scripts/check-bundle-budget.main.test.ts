import { randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    collectFiles,
    extractImportedJsFiles,
    extractPrecomputedRouteChunkUsage,
    extractRouteChunkUsage,
    getGzipSize,
    isAdminRoutePath,
    isEntryLikeFile,
    isRuntimeShellChunk,
    isVendorChunk,
    main,
    parseArgs,
    rel,
    resolveManifestEntryPayload,
    toKBString,
} from '@/scripts/perf/check-bundle-budget.mjs'

const tempPrefix = 'bundle-budget-'
let originalCwd = process.cwd()
let tempDir = ''

async function writeFixture(relativePath: string, content: string | Buffer) {
    const absolutePath = resolve(tempDir, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content)
}

beforeEach(async () => {
    originalCwd = process.cwd()
    tempDir = await mkdtemp(join(tmpdir(), tempPrefix))
    process.chdir(tempDir)
})

afterEach(async () => {
    process.chdir(originalCwd)
    await rm(tempDir, { recursive: true, force: true })
    vi.restoreAllMocks()
    process.argv = ['node', 'vitest']
})

describe('check-bundle-budget 参数与文件工具', () => {
    it('解析默认参数与显式参数，并拒绝非法 mode', () => {
        expect(parseArgs(['node', 'script'])).toMatchObject({
            baseline: '.github/perf/bundle-baseline.json',
            mode: 'warn',
            output: '.lighthouseci/bundle-budget-report.json',
        })
        expect(parseArgs(['node', 'script', '--mode=error', '--output=x.json', '--baseline=y.json'])).toMatchObject({
            baseline: 'y.json',
            mode: 'error',
            output: 'x.json',
        })
        expect(() => parseArgs(['node', 'script', '--mode=strict'])).toThrow('Unsupported mode: strict')
    })

    it('递归收集 js / css 并跳过 map 与其它文件', async () => {
        await writeFixture('assets/a.js', 'a')
        await writeFixture('assets/nested/b.css', 'b')
        await writeFixture('assets/nested/c.js.map', '{}')
        await writeFixture('assets/readme.txt', 'x')

        const files = (await collectFiles(resolve(tempDir, 'assets'))).map((file) => file.replaceAll('\\', '/')).sort()
        expect(files).toHaveLength(2)
        expect(files[0]!.endsWith('/a.js')).toBe(true)
        expect(files[1]!.endsWith('/nested/b.css')).toBe(true)
    })

    it('计算 gzip 体积与展示口径', async () => {
        await writeFixture('a.js', 'hello world')
        expect(await getGzipSize(resolve(tempDir, 'a.js'))).toBeGreaterThan(0)
        expect(toKBString(1024)).toBe('1.00KB')
        expect(rel('a\\b.js')).toBe('a/b.js')
    })

    it('识别入口 / vendor / 运行时 shell / admin 路由', () => {
        expect(isEntryLikeFile('/x/entry.A1.js')).toBe(true)
        expect(isEntryLikeFile('/x/app.js')).toBe(false)
        expect(isVendorChunk('/x/vendor-abc.F6.js')).toBe(true)
        expect(isVendorChunk('/x/entry.A1.js')).toBe(false)
        expect(isRuntimeShellChunk('window.useNuxtApp||=1')).toBe(true)
        expect(isRuntimeShellChunk('plain')).toBe(false)
        expect(isAdminRoutePath('/admin/posts')).toBe(true)
        expect(isAdminRoutePath('/zh-CN/admin')).toBe(true)
        expect(isAdminRoutePath('/administration')).toBe(false)
        expect(isAdminRoutePath('/posts/admin')).toBe(false)
    })

    it('提取三种 JS 导入形式并去重', () => {
        const imports = extractImportedJsFiles('from"./a.js";import("./b.js");import"./a.js"')
        expect([...imports].sort()).toEqual(['a.js', 'b.js'])
    })

    it('解析运行时外壳与 precomputed 的路由 chunk 归属', () => {
        const routeUsage = extractRouteChunkUsage('path:"/admin/a" ... import("./admin.A1.js") path:"/blog" ... import("./public.B2.js")')
        expect([...routeUsage.keys()].sort()).toEqual(['admin.A1.js', 'public.B2.js'])
        expect([...routeUsage.get('admin.A1.js')!]).toEqual(['/admin/a'])

        const precomputed = extractPrecomputedRouteChunkUsage('file:"admin.A1.js",name:"x",src:"pages/admin/posts/index.vue",isDynamicEntry:true file:"public.B2.js",name:"y",src:"pages/index.vue",isDynamicEntry:true')
        expect([...precomputed.get('admin.A1.js')!]).toEqual(['/admin'])
        expect([...precomputed.get('public.B2.js')!]).toEqual(['/public'])
    })

    it('manifest 缺失时返回 unavailable', async () => {
        expect(await resolveManifestEntryPayload()).toEqual({ files: [], strategy: 'unavailable' })
    })
})

describe('check-bundle-budget main', () => {
    it('manifest 不可用时按 entry-app-index 兜底生成报告并读取 baseline', async () => {
        await writeFixture('.output/public/_nuxt/entry.A1.js', 'import"./shared.B2.js";import("./admin.D4.js");window.useNuxtApp||=1;path:"/admin/posts"[^]*?import("./admin.D4.js")')
        await writeFixture('.output/public/_nuxt/shared.B2.js', 'shared')
        await writeFixture('.output/public/_nuxt/other.E5.js', 'import"./shared.B2.js"')
        await writeFixture('.output/public/_nuxt/admin.D4.js', 'admin')
        await writeFixture('.output/public/_nuxt/vendor-abc.F6.js', 'vendor')
        await writeFixture('.output/public/_nuxt/entry.C3.css', '.a{color:red}')
        await writeFixture('baseline.json', JSON.stringify({ metrics: { coreEntryJsGzipBytes: 1 } }))

        process.argv = ['node', 'script', '--baseline=baseline.json', '--output=out/report.json']
        await main()

        const report = JSON.parse(await readFile(resolve(tempDir, 'out/report.json'), 'utf8'))
        expect(report.baseline.used).toBe(true)
        // dynamic import of an out-of-root fixture is not resolved by Vitest; main 走 entry/app/index 兜底口径
        expect(report.metrics.entryCalculation.strategy).toBe('entry-app-index')
        expect(report.metrics.entryCalculation.files).toHaveLength(1)
        expect(report.metrics.coreEntryJsGzipBytes).toBeGreaterThan(0)
        expect(report.metrics.asyncChunkCalculation.excludedRuntimeShellChunks.length).toBeGreaterThan(0)
        expect(report.metrics.asyncChunkCalculation.excludedAdminOnlyRouteChunks).toContain('.output/public/_nuxt/admin.D4.js')
        expect(report.metrics.asyncChunkCalculation.excludedSharedChunks).toContain('.output/public/_nuxt/shared.B2.js')
        expect(report.checks.some((check: { key: string }) => check.key === 'prIncrementJsGzipBytes')).toBe(true)
    })

    it('manifest 不可用时回落到 entry/app/index 命名口径', async () => {
        await writeFixture('.output/public/_nuxt/entry.A1.js', 'entry')
        await writeFixture('.output/public/_nuxt/entry.C3.css', '.a{}')

        process.argv = ['node', 'script', '--output=out/fallback.json']
        await main()

        const report = JSON.parse(await readFile(resolve(tempDir, 'out/fallback.json'), 'utf8'))
        expect(report.metrics.entryCalculation.strategy).toBe('entry-app-index')
        expect(report.metrics.coreEntryJsGzipBytes).toBeGreaterThan(0)
        expect(report.checks.find((check: { key: string }) => check.key === 'prIncrementJsGzipBytes')).toBeUndefined()
    })

    it('入口不可度量时 warn 模式标记 skipped', async () => {
        await writeFixture('.output/public/_nuxt/only.C1.css', '.a{}')

        process.argv = ['node', 'script', '--output=out/skipped.json']
        await main()

        const report = JSON.parse(await readFile(resolve(tempDir, 'out/skipped.json'), 'utf8'))
        expect(report.metrics.coreEntryJsGzipBytes).toBeNull()
        const entryCheck = report.checks.find((check: { key: string }) => check.key === 'coreEntryJsGzipBytes')
        expect(entryCheck.skipped).toBe(true)
        expect(entryCheck.passed).toBeNull()
    })

    it('error 模式下不可度量必须失败', async () => {
        await writeFixture('.output/public/_nuxt/only.C1.css', '.a{}')
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        process.argv = ['node', 'script', '--mode=error', '--output=out/error.json']
        await main()
        expect(exitSpy).toHaveBeenCalledWith(1)
        expect(errorSpy.mock.calls.flat().join(' ')).toContain('could not be measured')
    })

    it('error 模式越线必须失败', async () => {
        await writeFixture('.output/public/_nuxt/entry.A1.js', randomBytes(400 * 1024).toString('latin1'))
        await writeFixture('.output/public/_nuxt/entry.C3.css', '.a{}')
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        process.argv = ['node', 'script', '--mode=error', '--output=out/over.json']
        await main()
        expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('缺少构建产物时抛出可读错误', async () => {
        process.argv = ['node', 'script']
        await expect(main()).rejects.toThrow('Cannot find .output/public/_nuxt')
    })
})
