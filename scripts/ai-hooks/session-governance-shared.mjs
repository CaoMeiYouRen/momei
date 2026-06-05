import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import path from 'node:path'
import yaml from 'js-yaml'

const SESSION_DIR_NAME = '.session'
const CURRENT_TASK_FILE_NAME = 'current-task.yaml'
const RUNTIME_STATE_FILE_NAME = 'runtime-state.json'
const WISDOM_FILE_NAME = 'wisdom.md'
const TODO_FILE_PATH = path.join('docs', 'plan', 'todo.md')

const MAX_COMMAND_HISTORY = 40
const MAX_FILE_EDITS = 40
const MAX_SUMMARY_LINES = 5
const MAX_BRIEFING_LINES = 8

const PATH_HINT_KEY = /(file(Path)?s?|paths?|path)$/iu
const PATCH_FILE_MARKER = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/gmu
const EDIT_LIKE_TOOLS = new Set(['create', 'create_file', 'edit', 'edit_notebook_file', 'multiedit', 'apply_patch', 'write'])

function execPromise(command, options) {
    return new Promise((resolve, reject) => {
        exec(command, { ...options, timeout: 120000 }, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                resolve({ stdout, stderr })
            }
        })
    })
}

function toTrimmedString(value) {
    return typeof value === 'string' ? value.trim() : ''
}

function toNullableString(value) {
    const text = toTrimmedString(value)
    return text || null
}

function toStringArray(value, limit = Number.POSITIVE_INFINITY) {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => toTrimmedString(item))
        .filter(Boolean)
        .slice(0, limit)
}

function toIsoTimestamp(value = Date.now()) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value).toISOString()
    }

    if (typeof value === 'string') {
        const parsed = new Date(value)

        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString()
        }
    }

    return new Date().toISOString()
}

function createDefaultRuntimeState() {
    return {
        session_id: null,
        total_tool_calls: 0,
        failure_count: 0,
        active_mode: '第一性原理',
        command_history: [],
        file_edits: [],
        last_verification: {
            lint: null,
            typecheck: null,
        },
        verification_state: {
            status: 'unknown',
            updated_at: null,
            reason: null,
        },
        hook_state: {
            last_event: null,
            last_event_at: null,
            last_platform: null,
            last_briefing_at: null,
            last_handoff_at: null,
        },
    }
}

function createDefaultCurrentTask(currentPhase, timestamp) {
    return {
        session: {
            id: `bootstrap-${timestamp.slice(0, 10)}`,
            started_at: timestamp,
            updated_at: timestamp,
        },
        current_phase: currentPhase,
        active_plan: {
            feature: '待初始化',
            summary: '等待首次会话补充当前任务摘要',
        },
        progress: {
            completed: [],
            in_progress: [],
            blocked_on: [],
        },
        next_steps: [],
        cognitive: {
            failure_count: 0,
            active_mode: '第一性原理',
            tried_approaches: [],
            switched_from: null,
        },
        auto_handoff: {
            generated_at: null,
            trigger: null,
            summary: [],
        },
    }
}

function createDefaultWisdomTemplate(timestamp) {
    return `# Session Wisdom (跨 Session 复用发现)\n\n> 仅在发现值得跨 session 复用的非平凡 pattern/bug/decision 时记录。\n> 无则保持空文件。不要为了填而填。\n\n## ${timestamp.slice(0, 10)}\n\n`
}

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

async function readTextIfExists(filePath, fallbackValue = '') {
    if (!await pathExists(filePath)) {
        return fallbackValue
    }

    return readFile(filePath, 'utf8')
}

async function readJsonIfExists(filePath, fallbackValue) {
    const content = await readTextIfExists(filePath)

    if (!content) {
        return fallbackValue
    }

    try {
        return JSON.parse(content)
    } catch {
        return fallbackValue
    }
}

async function readYamlIfExists(filePath, fallbackValue) {
    const content = await readTextIfExists(filePath)

    if (!content) {
        return fallbackValue
    }

    try {
        const parsed = yaml.load(content)
        return parsed && typeof parsed === 'object' ? parsed : fallbackValue
    } catch {
        return fallbackValue
    }
}

async function writeJsonFile(filePath, value) {
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function writeYamlFile(filePath, value) {
    const content = yaml.dump(value, {
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
        quotingType: '"',
    })

    await writeFile(filePath, content, 'utf8')
}

function extractCurrentPhase(todoContent) {
    const directMatch = todoContent.match(/^>\s+(第[^\n]+?阶段)/mu)

    if (directMatch) {
        return directMatch[1]
    }

    const headingMatch = todoContent.match(/^###\s+(第[^\n]+?阶段)/mu)

    if (headingMatch) {
        return headingMatch[1]
    }

    return '未识别阶段'
}

function normalizeCurrentTask(currentTask, fallbackPhase, timestamp) {
    const source = currentTask && typeof currentTask === 'object'
        ? currentTask
        : createDefaultCurrentTask(fallbackPhase, timestamp)

    return {
        session: {
            id: toTrimmedString(source.session?.id) || `bootstrap-${timestamp.slice(0, 10)}`,
            started_at: toTrimmedString(source.session?.started_at) || timestamp,
            updated_at: toTrimmedString(source.session?.updated_at) || timestamp,
        },
        current_phase: toTrimmedString(source.current_phase) || fallbackPhase,
        active_plan: {
            feature: toTrimmedString(source.active_plan?.feature) || '待初始化',
            summary: toTrimmedString(source.active_plan?.summary) || '等待首次会话补充当前任务摘要',
        },
        progress: {
            completed: toStringArray(source.progress?.completed),
            in_progress: toStringArray(source.progress?.in_progress, 1),
            blocked_on: toStringArray(source.progress?.blocked_on),
        },
        next_steps: toStringArray(source.next_steps, 3),
        cognitive: {
            failure_count: Number.isFinite(source.cognitive?.failure_count)
                ? Number(source.cognitive.failure_count)
                : 0,
            active_mode: toTrimmedString(source.cognitive?.active_mode) || '第一性原理',
            tried_approaches: toStringArray(source.cognitive?.tried_approaches),
            switched_from: toNullableString(source.cognitive?.switched_from),
        },
        auto_handoff: {
            generated_at: toNullableString(source.auto_handoff?.generated_at),
            trigger: toNullableString(source.auto_handoff?.trigger),
            summary: toStringArray(source.auto_handoff?.summary, MAX_SUMMARY_LINES),
        },
    }
}

function normalizeRuntimeState(runtimeState) {
    const source = runtimeState && typeof runtimeState === 'object'
        ? runtimeState
        : createDefaultRuntimeState()

    return {
        session_id: toNullableString(source.session_id),
        total_tool_calls: Number.isFinite(source.total_tool_calls)
            ? Number(source.total_tool_calls)
            : 0,
        failure_count: Number.isFinite(source.failure_count)
            ? Number(source.failure_count)
            : 0,
        active_mode: toTrimmedString(source.active_mode) || '第一性原理',
        command_history: toStringArray(source.command_history, MAX_COMMAND_HISTORY),
        file_edits: toStringArray(source.file_edits, MAX_FILE_EDITS),
        last_verification: {
            lint: source.last_verification?.lint ?? null,
            typecheck: source.last_verification?.typecheck ?? null,
        },
        verification_state: {
            status: toTrimmedString(source.verification_state?.status) || 'unknown',
            updated_at: toNullableString(source.verification_state?.updated_at),
            reason: toNullableString(source.verification_state?.reason),
        },
        hook_state: {
            last_event: toNullableString(source.hook_state?.last_event),
            last_event_at: toNullableString(source.hook_state?.last_event_at),
            last_platform: toNullableString(source.hook_state?.last_platform),
            last_briefing_at: toNullableString(source.hook_state?.last_briefing_at),
            last_handoff_at: toNullableString(source.hook_state?.last_handoff_at),
        },
    }
}

function extractWisdomHighlights(wisdomContent) {
    return wisdomContent
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .slice(-2)
}

function appendUnique(list, entries, limit) {
    const next = [...list]

    for (const entry of entries) {
        const value = toTrimmedString(entry)

        if (!value || next.includes(value)) {
            continue
        }

        next.push(value)
    }

    return next.slice(-limit)
}

function summarizeVerification(runtimeState) {
    const verificationParts = []

    for (const [name, value] of Object.entries(runtimeState.last_verification)) {
        const result = value && typeof value === 'object'
            ? toTrimmedString(value.result)
            : ''

        verificationParts.push(`${name}=${result || 'none'}`)
    }

    if (runtimeState.verification_state.status === 'stale') {
        verificationParts.push('state=stale')
    }

    return verificationParts.join(', ')
}

function buildBriefing(currentTask, runtimeState, wisdomContent) {
    const completedText = currentTask.progress.completed.length > 0
        ? currentTask.progress.completed.slice(-2).join('；')
        : '暂无已记录完成项'
    const nextStepsText = currentTask.next_steps.length > 0
        ? currentTask.next_steps.join('；')
        : '暂无下一步记录'
    const wisdomHighlights = extractWisdomHighlights(wisdomContent)

    const lines = [
        'Session Briefing',
        `- 当前阶段: ${currentTask.current_phase}`,
        `- 当前任务: ${currentTask.active_plan.feature}`,
        `- 任务摘要: ${currentTask.active_plan.summary}`,
        `- 已完成: ${completedText}`,
        `- 下一步: ${nextStepsText}`,
        `- 认知状态: failure_count=${runtimeState.failure_count}, mode=${runtimeState.active_mode}`,
        `- 最近验证: ${summarizeVerification(runtimeState)}`,
    ]

    if (wisdomHighlights.length > 0) {
        lines.push(`- 最近 wisdom: ${wisdomHighlights.join('；')}`)
    }

    return lines.slice(0, MAX_BRIEFING_LINES).join('\n')
}

function buildHandoffSummary(currentTask, runtimeState) {
    const recentFiles = runtimeState.file_edits.length > 0
        ? runtimeState.file_edits.slice(-3).join('，')
        : '无文件改动记录'
    const nextStepsText = currentTask.next_steps.length > 0
        ? currentTask.next_steps.join('；')
        : '暂无下一步记录'

    return [
        `当前阶段: ${currentTask.current_phase}`,
        `当前任务: ${currentTask.active_plan.feature}`,
        `最近文件: ${recentFiles}`,
        `验证状态: ${summarizeVerification(runtimeState)}`,
        `下一步: ${nextStepsText}`,
    ].slice(0, MAX_SUMMARY_LINES)
}

function buildCompactionContext(currentTask, runtimeState) {
    return [
        'Session Continuity Context',
        `- 当前阶段: ${currentTask.current_phase}`,
        `- 当前任务: ${currentTask.active_plan.feature}`,
        `- 任务摘要: ${currentTask.active_plan.summary}`,
        `- 最近文件: ${runtimeState.file_edits.slice(-5).join('，') || '无文件改动记录'}`,
        `- 下一步: ${currentTask.next_steps.join('；') || '暂无下一步记录'}`,
        `- 验证状态: ${summarizeVerification(runtimeState)}`,
    ].join('\n')
}

function getTimestampFromPayload(payload) {
    return payload?.timestamp
        ?? payload?.time
        ?? payload?.createdAt
        ?? payload?.created_at
        ?? Date.now()
}

function getSessionIdFromPayload(payload, timestamp) {
    const candidate = toTrimmedString(
        payload?.sessionId
        ?? payload?.session_id
        ?? payload?.id,
    )

    if (candidate) {
        return candidate
    }

    return `session-${timestamp.slice(0, 19).replaceAll(':', '').replace('T', '-')}`
}

function getToolNameFromPayload(payload) {
    return toTrimmedString(
        payload?.toolName
        ?? payload?.tool_name
        ?? payload?.tool
        ?? payload?.name,
    )
}

function normalizeFilePath(candidate, projectRoot) {
    const raw = toTrimmedString(candidate).replace(/^['"]|['"]$/gu, '')

    if (!raw || raw.includes('\n')) {
        return null
    }

    const absolutePath = path.isAbsolute(raw)
        ? raw
        : path.resolve(projectRoot, raw)
    const relativePath = path.relative(projectRoot, absolutePath)

    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return null
    }

    return relativePath.replaceAll('\\', '/')
}

function collectPathCandidates(value, projectRoot, bucket, parentKey = '', depth = 0) {
    if (depth > 4 || value === null || value === undefined) {
        return
    }

    if (typeof value === 'string') {
        if (!PATH_HINT_KEY.test(parentKey)) {
            return
        }

        const normalizedPath = normalizeFilePath(value, projectRoot)

        if (normalizedPath) {
            bucket.add(normalizedPath)
        }

        return
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectPathCandidates(item, projectRoot, bucket, parentKey, depth + 1)
        }

        return
    }

    if (typeof value !== 'object') {
        return
    }

    for (const [key, nestedValue] of Object.entries(value)) {
        collectPathCandidates(nestedValue, projectRoot, bucket, key, depth + 1)
    }
}

function collectPatchCandidates(value, projectRoot, bucket, depth = 0) {
    if (depth > 4 || value === null || value === undefined) {
        return
    }

    if (typeof value === 'string') {
        for (const match of value.matchAll(PATCH_FILE_MARKER)) {
            const normalizedPath = normalizeFilePath(match[1], projectRoot)

            if (normalizedPath) {
                bucket.add(normalizedPath)
            }
        }

        return
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectPatchCandidates(item, projectRoot, bucket, depth + 1)
        }

        return
    }

    if (typeof value !== 'object') {
        return
    }

    for (const nestedValue of Object.values(value)) {
        collectPatchCandidates(nestedValue, projectRoot, bucket, depth + 1)
    }
}

function extractFileEdits(payload, projectRoot) {
    const bucket = new Set()
    const candidates = [
        payload,
        payload?.toolInput,
        payload?.tool_input,
        payload?.toolArgs,
        payload?.tool_args,
        payload?.args,
        payload?.outputArgs,
        payload?.toolOutput?.args,
        payload?.tool_output?.args,
    ]

    for (const candidate of candidates) {
        collectPathCandidates(candidate, projectRoot, bucket)
        collectPatchCandidates(candidate, projectRoot, bucket)
    }

    return Array.from(bucket)
}

export async function ensureSessionState(projectRoot) {
    const sessionDir = path.join(projectRoot, SESSION_DIR_NAME)
    const currentTaskPath = path.join(sessionDir, CURRENT_TASK_FILE_NAME)
    const runtimeStatePath = path.join(sessionDir, RUNTIME_STATE_FILE_NAME)
    const wisdomPath = path.join(sessionDir, WISDOM_FILE_NAME)
    const timestamp = toIsoTimestamp()
    const todoContent = await readTextIfExists(path.join(projectRoot, TODO_FILE_PATH), '')
    const currentPhase = extractCurrentPhase(todoContent)

    await mkdir(sessionDir, { recursive: true })

    if (!await pathExists(currentTaskPath)) {
        await writeYamlFile(currentTaskPath, createDefaultCurrentTask(currentPhase, timestamp))
    }

    if (!await pathExists(runtimeStatePath)) {
        await writeJsonFile(runtimeStatePath, createDefaultRuntimeState())
    }

    if (!await pathExists(wisdomPath)) {
        await writeFile(wisdomPath, createDefaultWisdomTemplate(timestamp), 'utf8')
    }

    const currentTask = normalizeCurrentTask(
        await readYamlIfExists(currentTaskPath, null),
        currentPhase,
        timestamp,
    )
    const runtimeState = normalizeRuntimeState(
        await readJsonIfExists(runtimeStatePath, null),
    )
    const wisdomContent = await readTextIfExists(wisdomPath, createDefaultWisdomTemplate(timestamp))

    return {
        sessionDir,
        currentPhase,
        currentTaskPath,
        runtimeStatePath,
        wisdomPath,
        currentTask,
        runtimeState,
        wisdomContent,
    }
}

async function persistSessionState(sessionState) {
    await writeYamlFile(sessionState.currentTaskPath, sessionState.currentTask)
    await writeJsonFile(sessionState.runtimeStatePath, sessionState.runtimeState)
}

function syncCognitiveState(currentTask, runtimeState) {
    runtimeState.failure_count = currentTask.cognitive.failure_count
    runtimeState.active_mode = currentTask.cognitive.active_mode
}

function updateHookState(runtimeState, platform, eventName, timestamp) {
    runtimeState.hook_state.last_event = eventName
    runtimeState.hook_state.last_event_at = timestamp
    runtimeState.hook_state.last_platform = platform
}

export async function handleSessionGovernanceEvent({ eventName, payload = {}, platform, projectRoot }) {
    const sessionState = await ensureSessionState(projectRoot)
    const timestamp = toIsoTimestamp(getTimestampFromPayload(payload))
    const sessionId = getSessionIdFromPayload(payload, timestamp)
    const toolName = getToolNameFromPayload(payload)

    sessionState.currentTask.current_phase = sessionState.currentPhase
    syncCognitiveState(sessionState.currentTask, sessionState.runtimeState)
    updateHookState(sessionState.runtimeState, platform, eventName, timestamp)

    if (eventName === 'session-start') {
        sessionState.currentTask.session.id = sessionId
        sessionState.currentTask.session.started_at = timestamp
        sessionState.currentTask.session.updated_at = timestamp
        sessionState.runtimeState.session_id = sessionId
        sessionState.runtimeState.hook_state.last_briefing_at = timestamp

        const additionalContext = buildBriefing(
            sessionState.currentTask,
            sessionState.runtimeState,
            sessionState.wisdomContent,
        )

        await persistSessionState(sessionState)

        return {
            additionalContext,
            compactionContext: null,
        }
    }

    if (eventName === 'post-tool-use') {
        sessionState.runtimeState.total_tool_calls += 1
        const historyLabel = toolName || 'unknown-tool'

        sessionState.runtimeState.command_history = appendUnique(
            sessionState.runtimeState.command_history,
            [historyLabel],
            MAX_COMMAND_HISTORY,
        )

        const fileEdits = extractFileEdits(payload, projectRoot)

        if (fileEdits.length > 0) {
            sessionState.runtimeState.file_edits = appendUnique(
                sessionState.runtimeState.file_edits,
                fileEdits,
                MAX_FILE_EDITS,
            )
        }

        if (fileEdits.length > 0 || EDIT_LIKE_TOOLS.has(historyLabel.toLowerCase())) {
            sessionState.runtimeState.verification_state = {
                status: 'stale',
                updated_at: timestamp,
                reason: historyLabel,
            }
        }

        sessionState.currentTask.session.updated_at = timestamp
        sessionState.currentTask.auto_handoff = {
            generated_at: timestamp,
            trigger: eventName,
            summary: buildHandoffSummary(sessionState.currentTask, sessionState.runtimeState),
        }
        sessionState.runtimeState.hook_state.last_handoff_at = timestamp

        await persistSessionState(sessionState)

        return {
            additionalContext: null,
            compactionContext: null,
        }
    }

    if (eventName === 'pre-compact' || eventName === 'session-compacted' || eventName === 'session-end' || eventName === 'session-idle') {
        sessionState.currentTask.session.updated_at = timestamp
        sessionState.currentTask.auto_handoff = {
            generated_at: timestamp,
            trigger: eventName,
            summary: buildHandoffSummary(sessionState.currentTask, sessionState.runtimeState),
        }
        sessionState.runtimeState.hook_state.last_handoff_at = timestamp

        await persistSessionState(sessionState)

        return {
            additionalContext: null,
            compactionContext: buildCompactionContext(sessionState.currentTask, sessionState.runtimeState),
        }
    }

    if (eventName === 'post-verify') {
        if (sessionState.runtimeState.verification_state.status !== 'stale') {
            return { additionalContext: null, compactionContext: null }
        }

        const changedFiles = sessionState.runtimeState.file_edits
            .filter((f) => /\\.(ts|vue|js|mjs)$/iu.test(f))
            .join(' ')

        let lintResult = null
        let typecheckResult = null
        let allPassed = true

        // Run lint on changed files (or full lint if no specific files tracked)
        if (changedFiles) {
            try {
                await execPromise(`pnpm exec eslint ${changedFiles} --quiet --max-warnings 0`, { cwd: projectRoot })
                lintResult = 'pass'
            } catch {
                lintResult = 'fail'
                allPassed = false
            }
        }

        // Run typecheck
        try {
            await execPromise('pnpm run typecheck', { cwd: projectRoot })
            typecheckResult = 'pass'
        } catch {
            typecheckResult = 'fail'
            allPassed = false
        }

        sessionState.runtimeState.last_verification = {
            lint: lintResult ? { result: lintResult, timestamp } : sessionState.runtimeState.last_verification.lint,
            typecheck: typecheckResult ? { result: typecheckResult, timestamp } : sessionState.runtimeState.last_verification.typecheck,
        }

        sessionState.runtimeState.verification_state = {
            status: allPassed ? 'verified' : 'stale',
            updated_at: timestamp,
            reason: allPassed ? null : 'post-verify-failed',
        }

        await persistSessionState(sessionState)

        const contextParts = []
        if (lintResult) {
            contextParts.push(`lint=${lintResult}`)
        }
        if (typecheckResult) {
            contextParts.push(`typecheck=${typecheckResult}`)
        }

        return {
            additionalContext: allPassed
                ? null
                : `[hooks] post-verify failed: ${contextParts.join(', ')}. Please fix before proceeding.`,
            compactionContext: null,
        }
    }

    if (eventName === 'pre-stop-check') {
        if (sessionState.runtimeState.verification_state.status !== 'stale') {
            return { additionalContext: null, compactionContext: null }
        }

        return {
            additionalContext: '[hooks] WARNING: verification_state is stale. Please run `pnpm lint && pnpm typecheck` before ending this session.',
            compactionContext: null,
        }
    }

    await persistSessionState(sessionState)

    return {
        additionalContext: null,
        compactionContext: null,
    }
}
