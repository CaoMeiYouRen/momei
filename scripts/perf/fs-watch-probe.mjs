import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { syncBuiltinESMExports } from 'node:module'

const outputPath = process.env.FS_WATCH_PROBE_OUTPUT
    ? path.resolve(process.cwd(), process.env.FS_WATCH_PROBE_OUTPUT)
    : path.resolve(process.cwd(), 'artifacts', 'fs-watch-probe.json')

const originalWatch = fs.watch
const watchCounts = new Map()
const watchStacks = new Map()
let flushTimer = null

function normalizeWatchPath(target) {
    if (target instanceof URL) {
        return target.pathname
    }

    if (Buffer.isBuffer(target)) {
        return target.toString('utf8')
    }

    return String(target)
}

function recordWatchTarget(target) {
    const normalized = normalizeWatchPath(target)
    const resolved = path.isAbsolute(normalized)
        ? path.normalize(normalized)
        : path.normalize(path.resolve(process.cwd(), normalized))

    watchCounts.set(resolved, (watchCounts.get(resolved) ?? 0) + 1)
    recordWatchStack(resolved)
    scheduleFlush()
}

function normalizeStackFrame(frame) {
    return frame
        .replace(/^\s*at\s+/, '')
        .trim()
}

function getRelevantStackFrames() {
    const stack = new Error().stack?.split('\n').slice(2) ?? []

    return stack
        .map(normalizeStackFrame)
        .filter((frame) => frame
            && !frame.includes('fs-watch-probe.mjs')
            && !frame.includes('patchedWatch')
            && !frame.includes('recordWatchTarget'))
        .slice(0, 12)
}

function recordWatchStack(watchedPath) {
    const frames = getRelevantStackFrames()
    const stackKey = frames.join(' | ')
    if (!stackKey) {
        return
    }

    const existing = watchStacks.get(stackKey)
    if (existing) {
        existing.count += 1
        existing.samplePaths.add(watchedPath)
        return
    }

    watchStacks.set(stackKey, {
        count: 1,
        frames,
        samplePaths: new Set([watchedPath]),
    })
}

function buildSummary() {
    const groupedByTopLevel = new Map()

    for (const [watchedPath, count] of watchCounts) {
        const relativePath = path.relative(process.cwd(), watchedPath)
        const topLevel = !relativePath || relativePath.startsWith('..')
            ? '<external>'
            : relativePath.split(path.sep)[0] || '.'

        groupedByTopLevel.set(topLevel, (groupedByTopLevel.get(topLevel) ?? 0) + count)
    }

    return {
        generatedAt: new Date().toISOString(),
        outputPath,
        topLevelCounts: [...groupedByTopLevel.entries()]
            .sort((left, right) => right[1] - left[1])
            .map(([segment, count]) => ({ count, segment })),
        totalUniquePaths: watchCounts.size,
        totalWatchRegistrations: [...watchCounts.values()].reduce((sum, count) => sum + count, 0),
        watcherStacks: [...watchStacks.values()]
            .sort((left, right) => right.count - left.count)
            .map((entry) => ({
                count: entry.count,
                frames: entry.frames,
                samplePaths: [...entry.samplePaths].slice(0, 10),
            })),
        watchedPaths: [...watchCounts.entries()]
            .sort((left, right) => right[1] - left[1])
            .map(([watchedPath, count]) => ({ count, watchedPath })),
    }
}

function flushSummary() {
    try {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        fs.writeFileSync(outputPath, `${JSON.stringify(buildSummary(), null, 2)}\n`, 'utf8')
    } catch (error) {
        console.error('[fs-watch-probe] Failed to write summary:', error)
    }
}

function scheduleFlush() {
    if (flushTimer) {
        return
    }

    flushTimer = setTimeout(() => {
        flushTimer = null
        flushSummary()
    }, 250)

    flushTimer.unref?.()
}

fs.watch = function patchedWatch(target, ...args) {
    recordWatchTarget(target)
    return originalWatch.call(this, target, ...args)
}

syncBuiltinESMExports()

for (const eventName of ['SIGINT', 'SIGTERM', 'beforeExit', 'exit']) {
    process.on(eventName, flushSummary)
}
