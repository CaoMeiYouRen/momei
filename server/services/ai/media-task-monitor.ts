import { In, IsNull, LessThan } from 'typeorm'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { ImageService } from '@/server/services/ai/image'
import { TTSService } from '@/server/services/ai/tts'
import logger from '@/server/utils/logger'
import { acquireLock, releaseLock } from '@/server/utils/redis'
import { AI_HEAVY_TASK_TIMEOUT_MS } from '@/utils/shared/env'

const RECOVERABLE_MEDIA_TASK_TYPES = ['image_generation', 'podcast', 'tts'] as const
const RECOVERABLE_MEDIA_TASK_STATUSES = ['pending', 'processing'] as const
const MEDIA_TASK_MONITOR_LOCK_KEY = 'momei:lock:ai-media-compensation'
const MEDIA_TASK_MONITOR_LOCK_TTL = 60000
const MEDIA_TASK_COMPENSATION_LEASE_MS = AI_HEAVY_TASK_TIMEOUT_MS + 60000

export type MediaTaskCompensationOutcome = 'completed' | 'failed' | 'resumed' | 'skipped'

export interface MediaTaskCompensationSummary {
    scanned: number
    completed: number
    failed: number
    resumed: number
    skipped: number
    staleBefore: string
}

interface MediaTaskCompensationClaim {
    compensationClaimedAt: string
    compensationClaimToken: string
    compensationLeaseExpiresAt: string
}

interface ScanTimedOutMediaTaskOptions {
    taskId?: string
}

type RecoverableMediaTaskScanItem = Pick<AITask, 'id' | 'type' | 'status' | 'result' | 'startedAt' | 'progress' | 'error'>

function createEmptySummary(staleBefore: Date): MediaTaskCompensationSummary {
    return {
        scanned: 0,
        completed: 0,
        failed: 0,
        resumed: 0,
        skipped: 0,
        staleBefore: staleBefore.toISOString(),
    }
}

function applyOutcome(summary: MediaTaskCompensationSummary, outcome: MediaTaskCompensationOutcome) {
    switch (outcome) {
        case 'completed':
            summary.completed += 1
            return
        case 'failed':
            summary.failed += 1
            return
        case 'resumed':
            summary.resumed += 1
            return
        default:
            summary.skipped += 1
    }
}

function parseTaskResultRecord(taskResult: string | null | undefined): Record<string, unknown> | null {
    if (!taskResult) {
        return null
    }

    try {
        const parsed = JSON.parse(taskResult) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null
        }

        return parsed as Record<string, unknown>
    } catch {
        return null
    }
}

function hasActiveCompensationLease(task: Pick<AITask, 'result'>, now: Date) {
    const resultRecord = parseTaskResultRecord(task.result)
    const leaseExpiresAt = resultRecord?.compensationLeaseExpiresAt

    if (typeof leaseExpiresAt !== 'string') {
        return false
    }

    const leaseExpiresAtTimestamp = Date.parse(leaseExpiresAt)
    return Number.isFinite(leaseExpiresAtTimestamp) && leaseExpiresAtTimestamp > now.getTime()
}

async function claimTaskForCompensation(
    taskRepo: ReturnType<typeof dataSource.getRepository<AITask>>,
    task: RecoverableMediaTaskScanItem,
    now: Date,
) {
    if (hasActiveCompensationLease(task, now)) {
        return false
    }

    const currentResultRecord = parseTaskResultRecord(task.result)
    const claim: MediaTaskCompensationClaim = {
        compensationClaimedAt: now.toISOString(),
        compensationClaimToken: `${task.id}:${now.getTime()}`,
        compensationLeaseExpiresAt: new Date(now.getTime() + MEDIA_TASK_COMPENSATION_LEASE_MS).toISOString(),
    }
    const claimedResult = JSON.stringify({
        ...(currentResultRecord || {}),
        ...claim,
    })
    const updateResult = await taskRepo.update({
        id: task.id,
        status: task.status,
        result: task.result ? task.result : IsNull(),
    }, {
        status: 'processing',
        error: null,
        result: claimedResult,
        startedAt: task.startedAt || now,
        progress: Math.max(task.progress || 0, task.status === 'pending' ? 5 : task.progress || 0),
    })

    if (updateResult.affected !== 1) {
        return false
    }

    task.status = 'processing'
    task.error = null
    task.result = claimedResult
    task.startedAt = task.startedAt || now
    task.progress = Math.max(task.progress || 0, 5)

    return true
}

export async function scanAndCompensateTimedOutMediaTasks(
    now = new Date(),
    options: ScanTimedOutMediaTaskOptions = {},
): Promise<MediaTaskCompensationSummary> {
    const staleBefore = new Date(now.getTime() - AI_HEAVY_TASK_TIMEOUT_MS)
    const summary = createEmptySummary(staleBefore)
    const hasLock = await acquireLock(MEDIA_TASK_MONITOR_LOCK_KEY, MEDIA_TASK_MONITOR_LOCK_TTL)

    if (!hasLock) {
        logger.warn('[AIMediaMonitor] Failed to acquire compensation lock, skip this round.')
        return summary
    }

    const taskRepo = dataSource.getRepository(AITask)

    try {
        const staleTaskWhere = RECOVERABLE_MEDIA_TASK_STATUSES.map((status) => ({
            ...(options.taskId ? { id: options.taskId } : {}),
            type: In([...RECOVERABLE_MEDIA_TASK_TYPES]),
            status,
            updatedAt: LessThan(staleBefore),
        }))

        const staleTasks = await taskRepo.find({
            // 首轮 stale scan 只需要 claim 与补偿分发所需字段，
            // 避免把整行 AITask 记录拉进内存并拉宽热点查询。
            select: {
                id: true,
                type: true,
                status: true,
                result: true,
                startedAt: true,
                progress: true,
            },
            where: staleTaskWhere,
            order: {
                updatedAt: 'ASC',
            },
        })

        if (staleTasks.length === 0) {
            return summary
        }

        summary.scanned = staleTasks.length
        logger.warn(`[AIMediaMonitor] Found ${staleTasks.length} stale media task(s) before ${summary.staleBefore}`)

        for (const task of staleTasks) {
            try {
                let outcome: MediaTaskCompensationOutcome = 'skipped'
                const claimed = await claimTaskForCompensation(taskRepo, task, now)

                if (!claimed) {
                    applyOutcome(summary, outcome)
                    continue
                }

                if (task.type === 'image_generation') {
                    outcome = await ImageService.compensateStaleTask(task.id)
                } else if (task.type === 'podcast' || task.type === 'tts') {
                    outcome = await TTSService.compensateStaleTask(task.id)
                }

                applyOutcome(summary, outcome)
            } catch (error) {
                summary.failed += 1
                logger.error(`[AIMediaMonitor] Failed to compensate stale task ${task.id}:`, error)
            }
        }

        return summary
    } finally {
        await releaseLock(MEDIA_TASK_MONITOR_LOCK_KEY)
    }
}
