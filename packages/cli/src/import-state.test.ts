import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    clearImportState,
    computeImportEntryHash,
    createImportState,
    createImportStateWriter,
    DEFAULT_IMPORT_STATE_FILE,
    IMPORT_STATE_VERSION,
    isStateFileInsideSource,
    loadImportState,
    normalizeEntryPath,
    parseImportState,
    recordImportStateEntry,
    resolveImportStateFile,
    saveImportState,
    shouldResumeSkip,
    summarizeImportState,
    type ImportState,
} from './import-state'

function createEntry(overrides: Record<string, unknown> = {}) {
    return {
        content: '# Post',
        post: { content: 'body', title: 'Post' },
        relativeFile: 'posts/post-1.md',
        ...overrides,
    }
}

describe('import-state 路径与哈希', () => {
    it('默认状态文件位于源目录内', () => {
        expect(resolveImportStateFile('/source')).toBe(`/source/${DEFAULT_IMPORT_STATE_FILE}`)
        expect(isStateFileInsideSource(`/source/${DEFAULT_IMPORT_STATE_FILE}`, '/source')).toBe(true)
    })

    it('--state-file 相对路径按当前工作目录解析，绝对路径原样返回', () => {
        expect(resolveImportStateFile('/source', '/tmp/custom.json')).toBe('/tmp/custom.json')
        expect(resolveImportStateFile('/source', 'custom.json')).toBe(join(process.cwd(), 'custom.json'))
    })

    it('Windows 分隔符归一为 posix', () => {
        expect(normalizeEntryPath('posts\\nested\\post.md')).toBe('posts/nested/post.md')
    })

    it('内容变化会改变哈希，仅正文相同不算同一条目', () => {
        const base = computeImportEntryHash(createEntry())
        expect(base).toHaveLength(16)
        expect(computeImportEntryHash(createEntry())).toBe(base)
        expect(computeImportEntryHash(createEntry({ content: '# Changed' }))).not.toBe(base)
        expect(computeImportEntryHash(createEntry({ relativeFile: 'posts/post-2.md' }))).not.toBe(base)
        expect(computeImportEntryHash(createEntry({ post: { content: 'body', title: 'Renamed' } }))).not.toBe(base)
    })
})

describe('import-state 解析与降级', () => {
    it('损坏的 JSON 降级为空状态并给出可读提示', () => {
        const { state, warning } = parseImportState('{ not json', '/source')

        expect(state.entries).toEqual({})
        expect(state.version).toBe(IMPORT_STATE_VERSION)
        expect(warning).toContain('无法解析')
    })

    it('版本不符时降级为空状态并提示期望版本', () => {
        const { state, warning } = parseImportState(JSON.stringify({ entries: {}, version: 0 }), '/source')

        expect(state.entries).toEqual({})
        expect(warning).toContain(`期望 ${IMPORT_STATE_VERSION}`)
    })

    it('丢弃不可识别条目但保留合法条目', () => {
        const valid = {
            hash: 'abcdef0123456789',
            path: 'a.md',
            status: 'success',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }
        const { state, warning } = parseImportState(JSON.stringify({
            entries: { 'a.md': valid, 'b.md': { path: 'b.md' } },
            sourceDir: '/source',
            updatedAt: '2026-01-01T00:00:00.000Z',
            version: IMPORT_STATE_VERSION,
        }), '/source')

        expect(Object.keys(state.entries)).toEqual(['a.md'])
        expect(warning).toContain('1 条记录不可识别')
    })

    it('缺少状态文件视为首次运行，不产生警告', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'momei-state-'))
        const result = await loadImportState(join(directory, 'missing.json'), directory)

        expect(result.existed).toBe(false)
        expect(result.warning).toBeUndefined()
        expect(result.state.entries).toEqual({})

        await rm(directory, { recursive: true, force: true })
    })
})

describe('import-state 读写与续传判定', () => {
    let directory: string
    let stateFile: string

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'momei-state-'))
        stateFile = join(directory, DEFAULT_IMPORT_STATE_FILE)
    })

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true })
    })

    it('保存后可读回同一份记录', async () => {
        let state: ImportState = createImportState(directory)
        state = recordImportStateEntry(state, {
            hash: 'hash-1',
            path: 'posts/a.md',
            postId: 42,
            status: 'success',
        })
        await saveImportState(stateFile, state)

        const loaded = await loadImportState(stateFile, directory)

        expect(loaded.existed).toBe(true)
        expect(loaded.warning).toBeUndefined()
        expect(loaded.state.entries['posts/a.md']).toMatchObject({
            hash: 'hash-1',
            path: 'posts/a.md',
            postId: 42,
            status: 'success',
        })
        expect(JSON.parse(await readFile(stateFile, 'utf8')).version).toBe(IMPORT_STATE_VERSION)
    })

    it('只有「已成功且哈希一致」才跳过；失败项与内容变更都会重试', () => {
        let state = createImportState('/source')
        state = recordImportStateEntry(state, { hash: 'hash-1', path: 'a.md', status: 'success' })
        state = recordImportStateEntry(state, { error: 'boom', hash: 'hash-2', path: 'b.md', status: 'failed' })

        expect(shouldResumeSkip(state, 'a.md', 'hash-1')).toBe(true)
        expect(shouldResumeSkip(state, 'a.md', 'hash-changed')).toBe(false)
        expect(shouldResumeSkip(state, 'b.md', 'hash-2')).toBe(false)
        expect(shouldResumeSkip(state, 'c.md', 'hash-1')).toBe(false)
    })

    it('成功项重复记录时保留既有 postId，失败记录可覆盖错误', () => {
        let state = createImportState('/source')
        state = recordImportStateEntry(state, { hash: 'hash-1', path: 'a.md', postId: 7, status: 'success' })
        state = recordImportStateEntry(state, { hash: 'hash-1', path: 'a.md', status: 'success' })

        expect(state.entries['a.md']!.postId).toBe(7)

        state = recordImportStateEntry(state, { error: 'timeout', hash: 'hash-1', path: 'a.md', status: 'failed' })

        expect(state.entries['a.md']!).toMatchObject({ error: 'timeout', status: 'failed' })
    })

    it('--clean-state 删除单个状态文件，缺失时视为已清理', async () => {
        await saveImportState(stateFile, createImportState(directory))
        await clearImportState(stateFile)

        await expect(readFile(stateFile, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
        await expect(clearImportState(stateFile)).resolves.toBeUndefined()
    })

    it('状态汇总按四种状态计数', () => {
        let state = createImportState('/source')
        state = recordImportStateEntry(state, { hash: 'h', path: 'a.md', status: 'success' })
        state = recordImportStateEntry(state, { hash: 'h', path: 'b.md', status: 'failed' })
        state = recordImportStateEntry(state, { hash: 'h', path: 'c.md', status: 'pending' })
        state = recordImportStateEntry(state, { hash: 'h', path: 'd.md', status: 'skipped' })

        expect(summarizeImportState(state)).toEqual({ failed: 1, pending: 1, skipped: 1, success: 1 })
    })
})

describe('import-state 串行落盘', () => {
    let directory: string
    let stateFile: string

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'momei-state-'))
        stateFile = join(directory, DEFAULT_IMPORT_STATE_FILE)
    })

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true })
    })

    it('连续记录后 flush 落盘为最后一次状态', async () => {
        const writer = createImportStateWriter(stateFile, createImportState(directory))

        writer.record({ hash: 'h1', path: 'a.md', status: 'success' })
        writer.record({ hash: 'h2', path: 'b.md', status: 'failed', error: 'boom' })
        await writer.flush()

        const loaded = await loadImportState(stateFile, directory)

        expect(loaded.state.entries['a.md']!.status).toBe('success')
        expect(loaded.state.entries['b.md']!).toMatchObject({ error: 'boom', status: 'failed' })
        expect(writer.state().entries['b.md']!.status).toBe('failed')
    })

    it('写盘失败交给回调而不抛出，flush 仍可完成', async () => {
        const onWriteError = vi.fn()
        const writer = createImportStateWriter(join(directory, 'missing', 'state.json'), createImportState(directory), onWriteError)

        writer.record({ hash: 'h1', path: 'a.md', status: 'success' })

        await expect(writer.flush()).resolves.toBeUndefined()
        expect(onWriteError).toHaveBeenCalledTimes(1)
    })

    it('后续写入覆盖前一次的内容', async () => {
        await writeFile(stateFile, '{"broken":true}', 'utf8')

        const writer = createImportStateWriter(stateFile, createImportState(directory))
        writer.record({ hash: 'h1', path: 'a.md', status: 'success' })
        await writer.flush()

        expect(JSON.parse(await readFile(stateFile, 'utf8')).entries['a.md'].hash).toBe('h1')
    })
})
