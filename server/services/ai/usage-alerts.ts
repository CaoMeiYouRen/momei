import { In, MoreThanOrEqual } from 'typeorm'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { User } from '@/server/entities/user'
import { getSetting } from '@/server/services/setting'
import {
    getPeriodStart,
    resolveAllAIQuotaPolicies,
    summarizeAIQuotaUsage,
    type AIUsageTaskSnapshot,
} from '@/server/services/ai/quota-governance'
import { normalizeTaskCategory } from '@/server/utils/ai/cost-governance'
import { aiAlertThresholdsSchema } from '@/utils/schemas/ai'
import { parseMaybeJson } from '@/utils/shared/coerce'
import { roundTo } from '@/utils/shared/number'
import { SettingKey } from '@/types/setting'
import type { AIAlertSeverity, AIUsageAlert } from '@/types/ai'

interface NormalizedAIAlertThresholdSettings {
    enabled: boolean
    quotaUsageRatios: number[]
    costUsageRatios: number[]
    failureBurst: {
        enabled: boolean
        windowMinutes: number
        maxFailures: number
        categories: ('all' | 'text' | 'image' | 'asr' | 'tts' | 'podcast')[]
    }
    dedupeWindowMinutes: number
    maxAlerts: number
}

const DEFAULT_ALERT_THRESHOLDS: NormalizedAIAlertThresholdSettings = {
    enabled: true,
    quotaUsageRatios: [0.5, 0.8, 1],
    costUsageRatios: [0.8, 1],
    failureBurst: {
        enabled: true,
        windowMinutes: 10,
        maxFailures: 3,
        categories: ['image', 'asr', 'tts', 'podcast'],
    },
    dedupeWindowMinutes: 1440,
    maxAlerts: 10,
}

function normalizeRatios(ratios: number[] | undefined, fallback: number[]) {
    return [...new Set((ratios && ratios.length > 0 ? ratios : fallback).filter((value) => Number.isFinite(value) && value > 0))]
        .sort((left, right) => right - left)
}

function findTriggeredThreshold(ratio: number, thresholds: number[]) {
    return thresholds.find((threshold) => ratio >= threshold)
}

function getThresholdSeverity(threshold: number): AIAlertSeverity {
    if (threshold >= 1) {
        return 'critical'
    }

    if (threshold >= 0.8) {
        return 'warning'
    }

    return 'info'
}

function getFailureBurstSeverity(failureCount: number, maxFailures: number): AIAlertSeverity {
    if (failureCount >= maxFailures * 2) {
        return 'critical'
    }

    return 'warning'
}

function buildAlertDedupeKey(alert: Omit<AIUsageAlert, 'dedupeKey'>) {
    if (alert.kind === 'failure_burst') {
        return [
            alert.kind,
            alert.subjectValue,
            alert.scope,
            alert.windowMinutes,
            alert.limitValue,
        ].join(':')
    }

    return [
        alert.kind,
        alert.subjectValue,
        alert.scope,
        alert.period,
        alert.threshold,
    ].join(':')
}

function dedupeAlerts(alerts: AIUsageAlert[]) {
    const deduped = new Map<string, AIUsageAlert>()

    alerts.forEach((alert) => {
        const current = deduped.get(alert.dedupeKey)
        if (!current || (alert.ratio || 0) > (current.ratio || 0) || alert.usedValue > current.usedValue) {
            deduped.set(alert.dedupeKey, alert)
        }
    })

    return Array.from(deduped.values())
}

function sortAlerts(alerts: AIUsageAlert[]) {
    const severityWeight: Record<AIAlertSeverity, number> = {
        info: 1,
        warning: 2,
        critical: 3,
    }

    return [...alerts].sort((left, right) => {
        const severityDelta = severityWeight[right.severity] - severityWeight[left.severity]
        if (severityDelta !== 0) {
            return severityDelta
        }

        const ratioDelta = (right.ratio || 0) - (left.ratio || 0)
        if (ratioDelta !== 0) {
            return ratioDelta
        }

        return right.usedValue - left.usedValue
    })
}

async function getAlertThresholdSettings() {
    const rawThresholds = await getSetting(
        SettingKey.AI_ALERT_THRESHOLDS,
        JSON.stringify(DEFAULT_ALERT_THRESHOLDS),
    )
    const parsedThresholds = parseMaybeJson<Record<string, unknown> | null>(rawThresholds, null) || {}
    const validation = aiAlertThresholdsSchema.safeParse(parsedThresholds)

    if (!validation.success) {
        return DEFAULT_ALERT_THRESHOLDS
    }

    return {
        enabled: validation.data.enabled ?? DEFAULT_ALERT_THRESHOLDS.enabled,
        quotaUsageRatios: validation.data.quotaUsageRatios?.length
            ? validation.data.quotaUsageRatios
            : DEFAULT_ALERT_THRESHOLDS.quotaUsageRatios,
        costUsageRatios: validation.data.costUsageRatios?.length
            ? validation.data.costUsageRatios
            : DEFAULT_ALERT_THRESHOLDS.costUsageRatios,
        failureBurst: {
            enabled: validation.data.failureBurst?.enabled ?? DEFAULT_ALERT_THRESHOLDS.failureBurst.enabled,
            windowMinutes: validation.data.failureBurst?.windowMinutes ?? DEFAULT_ALERT_THRESHOLDS.failureBurst.windowMinutes,
            maxFailures: validation.data.failureBurst?.maxFailures ?? DEFAULT_ALERT_THRESHOLDS.failureBurst.maxFailures,
            categories: validation.data.failureBurst?.categories?.length
                ? validation.data.failureBurst.categories
                : DEFAULT_ALERT_THRESHOLDS.failureBurst.categories,
        },
        dedupeWindowMinutes: validation.data.dedupeWindowMinutes ?? DEFAULT_ALERT_THRESHOLDS.dedupeWindowMinutes,
        maxAlerts: validation.data.maxAlerts ?? DEFAULT_ALERT_THRESHOLDS.maxAlerts,
    }
}

export async function evaluateAIUsageAlerts(options: {
    now?: Date
} = {}) {
    if (!dataSource.isInitialized) {
        return [] as AIUsageAlert[]
    }

    const settings = await getAlertThresholdSettings()
    if (!settings.enabled) {
        return [] as AIUsageAlert[]
    }

    const now = options.now || new Date()
    const failureWindowMinutes = settings.failureBurst.enabled
        ? settings.failureBurst.windowMinutes
        : 0
    const failureWindowStart = new Date(now.getTime() - failureWindowMinutes * 60 * 1000)
    const earliestDate = new Date(Math.min(
        getPeriodStart('day', now).getTime(),
        getPeriodStart('month', now).getTime(),
        failureWindowMinutes > 0 ? failureWindowStart.getTime() : Number.MAX_SAFE_INTEGER,
    ))

    const taskRepo = dataSource.getRepository(AITask)
    const tasks = await taskRepo.find({
        where: {
            createdAt: MoreThanOrEqual(earliestDate),
        },
    })

    if (tasks.length === 0) {
        return [] as AIUsageAlert[]
    }

    const userIds = [...new Set(tasks.map((task) => task.userId).filter(Boolean))]
    const userRepo = dataSource.getRepository(User)
    const users = userIds.length > 0
        ? await userRepo.find({
            where: {
                id: In(userIds),
            },
            select: {
                id: true,
                name: true,
                role: true,
            },
        })
        : []

    const userMap = new Map(users.map((user) => [user.id, user]))
    const tasksByUser = new Map<string, AIUsageTaskSnapshot[]>()

    tasks.forEach((task) => {
        const current = tasksByUser.get(task.userId) || []
        current.push(task)
        tasksByUser.set(task.userId, current)
    })

    const quotaUsageRatios = normalizeRatios(settings.quotaUsageRatios, DEFAULT_ALERT_THRESHOLDS.quotaUsageRatios)
    const costUsageRatios = normalizeRatios(settings.costUsageRatios, DEFAULT_ALERT_THRESHOLDS.costUsageRatios)
    const selectedFailureCategories = new Set(
        settings.failureBurst.categories.length > 0
            ? settings.failureBurst.categories
            : DEFAULT_ALERT_THRESHOLDS.failureBurst.categories,
    )
    const alerts: AIUsageAlert[] = []

    for (const userId of userIds) {
        const userTasks = tasksByUser.get(userId) || []
        const user = userMap.get(userId)
        const resolvedPolicies = await resolveAllAIQuotaPolicies({
            userId,
            userRole: user?.role || null,
        })

        for (const policy of resolvedPolicies.policies) {
            if (policy.isExempt) {
                continue
            }

            const usage = summarizeAIQuotaUsage(userTasks, policy.scope, policy.period, now)

            if (typeof policy.maxQuotaUnits === 'number' && policy.maxQuotaUnits > 0) {
                const ratio = usage.quotaUnits / policy.maxQuotaUnits
                const triggeredThreshold = findTriggeredThreshold(ratio, quotaUsageRatios)

                if (triggeredThreshold) {
                    const alertBase = {
                        kind: 'quota_usage' as const,
                        severity: getThresholdSeverity(triggeredThreshold),
                        period: policy.period,
                        scope: policy.scope,
                        subjectType: 'user' as const,
                        subjectValue: userId,
                        subjectName: user?.name || undefined,
                        userRole: user?.role || null,
                        threshold: triggeredThreshold,
                        usedValue: roundTo(usage.quotaUnits, 2),
                        limitValue: policy.maxQuotaUnits,
                        ratio: roundTo(ratio, 4),
                        policySubjectType: policy.subjectType,
                        policySubjectValue: policy.subjectValue,
                    }

                    alerts.push({
                        ...alertBase,
                        dedupeKey: buildAlertDedupeKey(alertBase),
                    })
                }
            }

            if (typeof policy.maxActualCost === 'number' && policy.maxActualCost > 0) {
                const ratio = usage.actualCost / policy.maxActualCost
                const triggeredThreshold = findTriggeredThreshold(ratio, costUsageRatios)

                if (triggeredThreshold) {
                    const alertBase = {
                        kind: 'cost_usage' as const,
                        severity: getThresholdSeverity(triggeredThreshold),
                        period: policy.period,
                        scope: policy.scope,
                        subjectType: 'user' as const,
                        subjectValue: userId,
                        subjectName: user?.name || undefined,
                        userRole: user?.role || null,
                        threshold: triggeredThreshold,
                        usedValue: roundTo(usage.actualCost, 4),
                        limitValue: policy.maxActualCost,
                        ratio: roundTo(ratio, 4),
                        policySubjectType: policy.subjectType,
                        policySubjectValue: policy.subjectValue,
                    }

                    alerts.push({
                        ...alertBase,
                        dedupeKey: buildAlertDedupeKey(alertBase),
                    })
                }
            }
        }

        if (settings.failureBurst.enabled) {
            const categoryFailures = new Map<Exclude<AIUsageAlert['scope'], 'all'>, number>()

            userTasks.forEach((task) => {
                if (task.status !== 'failed' || task.createdAt < failureWindowStart) {
                    return
                }

                const category = normalizeTaskCategory(task.category, task.type)
                if (!selectedFailureCategories.has('all') && !selectedFailureCategories.has(category)) {
                    return
                }

                categoryFailures.set(category, (categoryFailures.get(category) || 0) + 1)
            })

            categoryFailures.forEach((count, category) => {
                const maxFailures = settings.failureBurst.maxFailures
                if (count < maxFailures) {
                    return
                }

                const alertBase = {
                    kind: 'failure_burst' as const,
                    severity: getFailureBurstSeverity(count, maxFailures),
                    period: 'rolling' as const,
                    scope: category,
                    subjectType: 'user' as const,
                    subjectValue: userId,
                    subjectName: user?.name || undefined,
                    userRole: user?.role || null,
                    threshold: maxFailures,
                    usedValue: count,
                    limitValue: maxFailures,
                    failureCount: count,
                    windowMinutes: failureWindowMinutes,
                }

                alerts.push({
                    ...alertBase,
                    dedupeKey: buildAlertDedupeKey(alertBase),
                })
            })
        }
    }

    return sortAlerts(dedupeAlerts(alerts)).slice(0, settings.maxAlerts)
}
