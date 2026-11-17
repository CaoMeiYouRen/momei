import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import type { CAC } from 'cac'
import { getParser, registerImportCommand } from './import-command'
import { parseHexoFiles } from './parser'
import { HugoParser } from './hugo-parser'
import { JekyllParser } from './jekyll-parser'
import { WordPressParser } from './wordpress-parser'

const { importPostsMock, migrateImagesMock, oraSpinner, parseHexoMock, validateImportPostMock } = vi.hoisted(() => {
    const spinnerStub = {
        fail: vi.fn(),
        start: () => spinnerStub,
        stop: vi.fn(),
        succeed: vi.fn(),
        text: '',
    }

    return {
        importPostsMock: vi.fn(),
        migrateImagesMock: vi.fn(),
        oraSpinner: spinnerStub,
        parseHexoMock: vi.fn(),
        validateImportPostMock: vi.fn(),
    }
})

vi.mock('./parser', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./parser')>()),
    parseHexoFiles: parseHexoMock,
}))

vi.mock('./import-image-migration', () => ({
    migrateImportEntriesLocalImages: (...args: unknown[]) => migrateImagesMock(...args),
}))

vi.mock('./api-client', () => ({
    MomeiApiClient: class {
        validateImportPost = validateImportPostMock
        importPosts = importPostsMock
        authorizeDirectUpload = vi.fn()
    },
}))

vi.mock('ora', () => ({
    default: () => oraSpinner,
}))

function createStubCac() {
    const options: Array<{ flags: string, description: string }> = []
    const chain = {
        command: () => chain,
        option: (flags: string, description: string) => {
            options.push({ flags, description })
            return chain
        },
        action: () => chain,
    }

    return {
        cli: chain as unknown as CAC,
        options,
    }
}

type ImportActionHandler = (source: string, options: Record<string, unknown>) => Promise<void>

/** 捕获 `registerImportCommand` 注册的 action，用于直接驱动 `runImport`。 */
function createActionCac() {
    let handler: ImportActionHandler | null = null
    const chain = {
        command: () => chain,
        option: () => chain,
        action: (fn: ImportActionHandler) => {
            handler = fn
            return chain
        },
    }

    return {
        cli: chain as unknown as CAC,
        getHandler: () => {
            if (!handler) {
                throw new Error('import action not registered')
            }

            return handler
        },
    }
}

function createOptions(overrides: Record<string, unknown> = {}) {
    return {
        apiUrl: 'http://api.test',
        concurrency: 2,
        confirmPathAliases: false,
        dryRun: true,
        format: undefined,
        maxRetries: 2,
        rateLimit: 5,
        uploadImages: false,
        verbose: false,
        ...overrides,
    }
}

function createParsedPost(index = 1) {
    return {
        content: `# Post ${index}`,
        file: `/source/post-${index}.md`,
        post: { content: `content ${index}`, title: `Post ${index}` },
        relativeFile: `post-${index}.md`,
    }
}

function createAliasReport(overrides: Record<string, unknown> = {}) {
    return {
        canImport: true,
        canonicalSlug: 'post-1',
        canonicalSource: 'slug',
        hasBlockingIssues: false,
        items: [],
        language: 'zh-CN',
        requiresConfirmation: false,
        summary: {
            accepted: 1,
            conflict: 0,
            fallback: 0,
            invalid: 0,
            'needs-confirmation': 0,
            repaired: 0,
            skipped: 0,
        },
        ...overrides,
    }
}

describe('import-command', () => {
    it('按 --format 选择对应解析器', () => {
        expect(getParser('jekyll')).toBeInstanceOf(JekyllParser)
        expect(getParser('hugo')).toBeInstanceOf(HugoParser)
        expect(getParser('wordpress')).toBeInstanceOf(WordPressParser)
    })

    it('未指定或未知 format 时回退到 Hexo 解析器', () => {
        expect(getParser(undefined).parse).toBe(parseHexoFiles)
        expect(getParser('unknown-format').parse).toBe(parseHexoFiles)
    })

    it('--format 帮助文本包含 jekyll', () => {
        const { cli, options } = createStubCac()
        registerImportCommand(cli)

        const formatOption = options.find((option) => option.flags.startsWith('--format'))

        expect(formatOption?.description).toContain('jekyll')
    })

})

describe('import-command runImport', () => {
    let originalExitCode: typeof process.exitCode
    let consoleLogSpy: MockInstance<(...args: unknown[]) => void>
    let consoleErrorSpy: MockInstance<(...args: unknown[]) => void>

    beforeEach(() => {
        originalExitCode = process.exitCode
        process.exitCode = undefined
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        parseHexoMock.mockReset()
        migrateImagesMock.mockReset()
        validateImportPostMock.mockReset()
        importPostsMock.mockReset()
        oraSpinner.fail.mockClear()
        oraSpinner.stop.mockClear()
    })

    afterEach(() => {
        process.exitCode = originalExitCode
        consoleLogSpy.mockRestore()
        consoleErrorSpy.mockRestore()
    })

    it('缺少 --api-key 且非 dry-run 时直接判失败', async () => {
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions({ dryRun: false }))

        expect(parseHexoMock).not.toHaveBeenCalled()
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--api-key is required'))
        expect(process.exitCode).toBe(1)
    })

    it('解析结果为空时提示并正常退出', async () => {
        parseHexoMock.mockResolvedValue([])
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions())

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No posts found'))
        expect(process.exitCode).toBe(0)
    })

    it('dry-run 无 api-key 时只做本地解析', async () => {
        parseHexoMock.mockResolvedValue([createParsedPost()])
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions({ verbose: true }))

        expect(parseHexoMock).toHaveBeenCalledWith(expect.stringContaining('source'), true)
        expect(validateImportPostMock).not.toHaveBeenCalled()
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run completed with local parsing only'))
        expect(process.exitCode).toBe(0)
    })

    it('dry-run 带 api-key 时校验别名并写出报告文件', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'momei-import-report-'))
        const reportPath = join(directory, 'report.json')
        parseHexoMock.mockResolvedValue([createParsedPost(1), createParsedPost(2)])
        validateImportPostMock.mockResolvedValue({ data: createAliasReport() })
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        try {
            await getHandler()('source', createOptions({ apiKey: 'key', reportFile: reportPath }))

            expect(validateImportPostMock).toHaveBeenCalledTimes(2)
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Import Validation Summary'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Saved report to'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run completed. No posts were imported.'))

            const report = JSON.parse(await readFile(reportPath, 'utf8'))
            expect(report).toMatchObject({
                dryRun: true,
                items: [
                    { action: 'import', file: 'post-1.md' },
                    { action: 'import', file: 'post-2.md' },
                ],
            })
            expect(process.exitCode).toBe(0)
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('上传图片分支：dry-run 下扫描本地图片并打印汇总', async () => {
        parseHexoMock.mockResolvedValue([createParsedPost()])
        migrateImagesMock.mockResolvedValue({
            enabled: true,
            items: [],
            summary: { failed: 0, replaced: 2, scanned: 2, skipped: 0, uploaded: 0 },
        })
        validateImportPostMock.mockResolvedValue({ data: createAliasReport() })
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions({ apiKey: 'key', uploadImages: true }))

        expect(migrateImagesMock).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({
            dryRun: true,
            sourceDir: expect.stringContaining('source'),
            uploadPrefix: 'migrations/image/',
        }))
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Local Image Migration Summary'))
    })

    it('全部候选被跳过时不发起导入', async () => {
        parseHexoMock.mockResolvedValue([createParsedPost()])
        validateImportPostMock.mockResolvedValue({
            data: createAliasReport({ canImport: false, hasBlockingIssues: true }),
        })
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions({ apiKey: 'key', dryRun: false }))

        expect(importPostsMock).not.toHaveBeenCalled()
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No posts passed validation'))
        expect(process.exitCode).toBe(0)
    })

    it('导入分支：回调累计成功 / 失败并打印汇总', async () => {
        parseHexoMock.mockResolvedValue([createParsedPost(1), createParsedPost(2)])
        validateImportPostMock.mockResolvedValue({ data: createAliasReport() })
        importPostsMock.mockImplementation(async (posts: unknown[], options: { onProgress?: (current: number, total: number, result: unknown) => void }) => {
            options.onProgress?.(1, posts.length, { file: 'post-1.md', postId: 'id-1', success: true })
            options.onProgress?.(2, posts.length, { error: 'boom', file: 'post-2.md', success: false })

            return [
                { file: 'post-1.md', postId: 'id-1', success: true },
                { error: 'boom', file: 'post-2.md', success: false },
            ]
        })
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions({ apiKey: 'key', dryRun: false, verbose: true }))

        expect(importPostsMock).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ concurrency: 2 }))
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Import Summary'))
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Some posts failed to import'))
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('post-2.md: boom'))
        expect(process.exitCode).toBeUndefined()
    })

    it('导入全部成功时打印成功汇总', async () => {
        parseHexoMock.mockResolvedValue([createParsedPost()])
        validateImportPostMock.mockResolvedValue({ data: createAliasReport() })
        importPostsMock.mockImplementation(async (posts: unknown[], options: { onProgress?: (current: number, total: number, result: unknown) => void }) => {
            options.onProgress?.(1, posts.length, { file: 'post-1.md', postId: 'id-1', success: true })

            return [{ file: 'post-1.md', postId: 'id-1', success: true }]
        })
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions({ apiKey: 'key', dryRun: false }))

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All posts imported successfully'))
        expect(oraSpinner.stop).toHaveBeenCalledTimes(1)
    })

    it('解析抛错时打印错误并判失败', async () => {
        parseHexoMock.mockRejectedValue(new Error('parse failed'))
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions({ verbose: true }))

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('parse failed'))
        expect(oraSpinner.fail).toHaveBeenCalledTimes(1)
        expect(process.exitCode).toBe(1)
    })

    it('解析抛非 Error 时只打印失败标题', async () => {
        parseHexoMock.mockRejectedValue('string failure')
        const { cli, getHandler } = createActionCac()
        registerImportCommand(cli)

        await getHandler()('source', createOptions())

        expect(consoleErrorSpy).not.toHaveBeenCalled()
        expect(process.exitCode).toBe(1)
    })
})
