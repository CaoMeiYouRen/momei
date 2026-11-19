import { createHash } from 'node:crypto'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import type { ParsedPost } from './types'

/**
 * 迁移状态文件：记录每篇源文件的路径、内容哈希、状态与结果，
 * 供 `momei import --resume` 跳过已成功项并只重试失败 / 待处理项。
 */
export const DEFAULT_IMPORT_STATE_FILE = '.momei-migration-state.json'
export const IMPORT_STATE_VERSION = 1

export type ImportEntryStatus = 'failed' | 'pending' | 'skipped' | 'success'

export interface ImportStateEntry {
    error?: string
    /** 解析后内容（front-matter + 正文）的 sha256 前缀，用于识别内容变更 */
    hash: string
    path: string
    postId?: number | string
    status: ImportEntryStatus
    updatedAt: string
}

export interface ImportState {
    entries: Record<string, ImportStateEntry>
    sourceDir: string
    updatedAt: string
    version: number
}

export interface ImportStateLoadResult {
    /** 状态文件是否存在；缺失属于首次运行的正常情况 */
    existed: boolean
    state: ImportState
    stateFile: string
    /** 损坏 / 不可读时的可读降级提示 */
    warning?: string
}

const ENTRY_STATUSES = new Set<ImportEntryStatus>(['failed', 'pending', 'skipped', 'success'])

export function resolveImportStateFile(sourceDir: string, stateFile?: string): string {
    if (!stateFile) {
        return resolve(sourceDir, DEFAULT_IMPORT_STATE_FILE)
    }

    return isAbsolute(stateFile) ? stateFile : resolve(process.cwd(), stateFile)
}

export function normalizeEntryPath(relativeFile: string): string {
    return relativeFile.replaceAll('\\', '/')
}

/** 对「解析后的条目」取哈希：front-matter 与正文任一变化都会改变哈希。 */
export function computeImportEntryHash(entry: Pick<ParsedPost, 'content' | 'post' | 'relativeFile'>): string {
    const payload = JSON.stringify({
        content: entry.content,
        post: entry.post,
        relativeFile: normalizeEntryPath(entry.relativeFile),
    })

    return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

export function createImportState(sourceDir: string, now = new Date()): ImportState {
    return {
        entries: {},
        sourceDir,
        updatedAt: now.toISOString(),
        version: IMPORT_STATE_VERSION,
    }
}

function isImportStateEntry(value: unknown): value is ImportStateEntry {
    if (!value || typeof value !== 'object') {
        return false
    }

    const entry = value as Partial<ImportStateEntry>

    return typeof entry.path === 'string'
        && typeof entry.hash === 'string'
        && typeof entry.status === 'string'
        && ENTRY_STATUSES.has(entry.status as ImportEntryStatus)
        && typeof entry.updatedAt === 'string'
}

/**
 * 宽松解析：版本不符、字段缺失或损坏的条目一律丢弃，
 * 只保留可识别部分，避免一次坏写入阻断整轮迁移。
 */
export function parseImportState(raw: string, sourceDir: string, now = new Date()): { state: ImportState, warning?: string } {
    let parsed: unknown

    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)

        return {
            state: createImportState(sourceDir, now),
            warning: `状态文件无法解析（${reason}），已按空状态继续`,
        }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
            state: createImportState(sourceDir, now),
            warning: '状态文件结构不是对象，已按空状态继续',
        }
    }

    const candidate = parsed as Partial<ImportState>
    const warnings: string[] = []

    if (candidate.version !== IMPORT_STATE_VERSION) {
        warnings.push(`状态文件版本为 ${String(candidate.version)}，期望 ${IMPORT_STATE_VERSION}，已按空状态继续`)

        return {
            state: createImportState(sourceDir, now),
            warning: warnings.join('；'),
        }
    }

    const entries: Record<string, ImportStateEntry> = {}
    const rawEntries = candidate.entries && typeof candidate.entries === 'object' && !Array.isArray(candidate.entries)
        ? candidate.entries as Record<string, unknown>
        : {}

    let dropped = 0

    for (const [key, value] of Object.entries(rawEntries)) {
        if (!isImportStateEntry(value)) {
            dropped += 1
            continue
        }

        entries[key] = value
    }

    if (dropped > 0) {
        warnings.push(`状态文件有 ${dropped} 条记录不可识别，已丢弃`)
    }

    return {
        state: {
            entries,
            sourceDir: typeof candidate.sourceDir === 'string' ? candidate.sourceDir : sourceDir,
            updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now.toISOString(),
            version: IMPORT_STATE_VERSION,
        },
        warning: warnings.length > 0 ? warnings.join('；') : undefined,
    }
}

export async function loadImportState(
    stateFile: string,
    sourceDir: string,
    now = new Date(),
): Promise<ImportStateLoadResult> {
    let raw: string

    try {
        raw = await readFile(stateFile, 'utf8')
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code

        if (code === 'ENOENT') {
            return { existed: false, state: createImportState(sourceDir, now), stateFile }
        }

        return {
            existed: false,
            state: createImportState(sourceDir, now),
            stateFile,
            warning: `状态文件不可读（${error instanceof Error ? error.message : String(error)}），已按空状态继续`,
        }
    }

    const { state, warning } = parseImportState(raw, sourceDir, now)

    return { existed: true, state, stateFile, warning }
}

export async function saveImportState(stateFile: string, state: ImportState, now = new Date()): Promise<ImportState> {
    const next: ImportState = { ...state, updatedAt: now.toISOString() }
    await writeFile(stateFile, `${JSON.stringify(next, null, 2)}\n`, 'utf8')

    return next
}

/** `--clean-state`：删除单个状态文件；文件不存在视为已清理。 */
export async function clearImportState(stateFile: string): Promise<void> {
    await rm(stateFile, { force: true })
}

/**
 * `--resume` 的跳过判定：仅「已成功且内容哈希未变」才跳过。
 * 内容变更（哈希不同）会重新导入，避免误跳过。
 */
export function shouldResumeSkip(state: ImportState, relativeFile: string, hash: string): boolean {
    const entry = state.entries[normalizeEntryPath(relativeFile)]

    return Boolean(entry && entry.status === 'success' && entry.hash === hash)
}

export interface RecordImportStateInput {
    error?: string
    hash: string
    path: string
    postId?: number | string
    status: ImportEntryStatus
}

export function recordImportStateEntry(
    state: ImportState,
    input: RecordImportStateInput,
    now = new Date(),
): ImportState {
    const key = normalizeEntryPath(input.path)
    const previous = state.entries[key]
    const entry: ImportStateEntry = {
        hash: input.hash,
        path: key,
        status: input.status,
        updatedAt: now.toISOString(),
    }

    if (input.postId !== undefined) {
        entry.postId = input.postId
    } else if (input.status === 'success' && previous?.postId !== undefined) {
        entry.postId = previous.postId
    }

    if (input.error !== undefined) {
        entry.error = input.error
    }

    return {
        ...state,
        entries: { ...state.entries, [key]: entry },
    }
}

export function summarizeImportState(state: ImportState): Record<ImportEntryStatus, number> {
    const summary: Record<ImportEntryStatus, number> = { failed: 0, pending: 0, skipped: 0, success: 0 }

    for (const entry of Object.values(state.entries)) {
        summary[entry.status] += 1
    }

    return summary
}

export interface ImportStateWriter {
    flush: () => Promise<void>
    record: (input: RecordImportStateInput) => void
    state: () => ImportState
}

/**
 * 串行化落盘：每个结果都会排队写一次状态文件，
 * 保证进程在导入中途被中断时已完成项不丢失。
 * 写盘失败不改变退出码语义，由 `onWriteError` 交给调用方提示。
 */
export function createImportStateWriter(
    stateFile: string,
    initialState: ImportState,
    onWriteError?: (error: unknown) => void,
): ImportStateWriter {
    let state = initialState
    let queue: Promise<void> = Promise.resolve()

    return {
        flush: () => queue,
        record: (input) => {
            state = recordImportStateEntry(state, input)
            const snapshot = state
            queue = queue
                .then(() => saveImportState(stateFile, snapshot))
                .then(() => undefined)
                .catch((error: unknown) => {
                    onWriteError?.(error)
                })
        },
        state: () => state,
    }
}

/** 默认状态文件与源目录同级，避免写进被迁移仓库的版本库；提示由调用方输出。 */
export function isStateFileInsideSource(stateFile: string, sourceDir: string): boolean {
    return dirname(stateFile) === resolve(sourceDir)
}
