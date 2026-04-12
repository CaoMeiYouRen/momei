import { MoreThanOrEqual } from 'typeorm'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { User } from '@/server/entities/user'
import { getSetting } from '@/server/services/setting'
import { calculateQuotaUnits, normalizeTaskCategory } from '@/server/utils/ai/cost-governance'
import { fail } from '@/server/utils/response'
import { parseMaybeJson, toBoolean, toNumber } from '@/utils/shared/coerce'
import { aiQuotaPoliciesSchema } from '@/utils/schemas/ai'
import { hasRole } from '@/utils/shared/roles'
import { SettingKey } from '@/types/setting'
import type { AICategory, AIQuotaPolicy } from '@/types/ai'

const HEAVY_TASK_CATEGORIES = new Set<AICategory>(['image', 'asr', 'tts', 'podcast'])

interface AIQuotaCheckOptions {
    userId?: string
    userRole?: string | null
    category?: string | null
    type: string
    payload?: unknown
    estimatedQuotaUnits?: number
    estimatedCost?: number
}

export interface AIUsageSummary {
    requests: number
    quotaUnits: number
    actualCost: number
    concurrentHeavyTasks: number
}

export interface ResolvedAIQuotaPolicy {
    subjectType: AIQuotaPolicy['subjectType']
    subjectValue: string
    scope: AIQuotaPolicy['scope']
    period: AIQuotaPolicy['period']
    maxRequests?: number
    maxQuotaUnits?: number
    maxActualCost?: number
    maxConcurrentHeavyTasks?: number
    isExempt: boolean
}

export type AIUsageTaskSnapshot = Pick<AITask, 'actualCost' | 'category' | 'createdAt' | 'estimatedCost' | 'estimatedQuotaUnits' | 'quotaUnits' | 'status' | 'type'>

function normalizePolicyScope(scope: string): AIQuotaPolicy['scope'] {
    if (scope === 'all' || scope.startsWith('type:')) {
        return scope as AIQuotaPolicy['scope']
    }

    return normalizeTaskCategory(scope, scope)
}

function normalizePolicy(rawPolicy: Record<string, unknown>): AIQuotaPolicy {
    const subjectValue = typeof rawPolicy.subjectValue === 'string' ? rawPolicy.subjectValue : ''
    const scope = typeof rawPolicy.scope === 'string' ? rawPolicy.scope : 'all'
    const period = typeof rawPolicy.period === 'string' ? rawPolicy.period : 'day'

    return {
        subjectType: String(rawPolicy.subjectType) as AIQuotaPolicy['subjectType'],
        subjectValue,
        scope: normalizePolicyScope(scope),
        period: period as AIQuotaPolicy['period'],
        maxRequests: rawPolicy.maxRequests === undefined ? undefined : toNumber(rawPolicy.maxRequests, Number.NaN),
        maxQuotaUnits: rawPolicy.maxQuotaUnits === undefined ? undefined : toNumber(rawPolicy.maxQuotaUnits, Number.NaN),
        maxActualCost: rawPolicy.maxActualCost === undefined ? undefined : toNumber(rawPolicy.maxActualCost, Number.NaN),
        maxConcurrentHeavyTasks: rawPolicy.maxConcurrentHeavyTasks === undefined ? undefined : toNumber(rawPolicy.maxConcurrentHeavyTasks, Number.NaN),
        isExempt: toBoolean(rawPolicy.isExempt, false),
        enabled: toBoolean(rawPolicy.enabled, true),
    }
}

function isFiniteNumber(value: number | undefined): value is number {
    return value !== undefined && Number.isFinite(value)
}

function matchesScope(scope: AIQuotaPolicy['scope'], category: AICategory, type: string) {
    if (scope === 'all') {
        return true
    }

    if (scope.startsWith('type:')) {
        return scope.slice(5) === type
    }

    return scope === category
}

export function getPeriodStart(period: AIQuotaPolicy['period'], now = new Date()) {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    if (period === 'month') {
        start.setDate(1)
    }

    return start
}

function getPolicyPriority(policy: AIQuotaPolicy, userId: string, userRole: string | null | undefined) {
    if (policy.subjectType === 'user' && policy.subjectValue === userId) {
        return 3
    }

    if (policy.subjectType === 'role' && hasRole(userRole, policy.subjectValue)) {
        return 2
    }

    if (policy.subjectType === 'global') {
        return 1
    }

    return 0
}

async function resolveUserRole(userId: string, userRole?: string | null) {
    if (userRole || !dataSource.isInitialized) {
        return userRole || null
    }

    const userRepo = dataSource.getRepository(User)
    const user = await userRepo.findOne({
        where: { id: userId },
        select: {
            id: true,
            role: true,
        },
    })

    return user?.role || null
}

function mergePolicies(policies: AIQuotaPolicy[]) {
    const resolved: ResolvedAIQuotaPolicy = {
        subjectType: policies[0]?.subjectType || 'global',
        subjectValue: policies[0]?.subjectValue || 'default',
        scope: policies[0]?.scope || 'all',
        period: policies[0]?.period || 'day',
        isExempt: false,
    }

    const applyStrictest = (key: 'maxRequests' | 'maxQuotaUnits' | 'maxActualCost' | 'maxConcurrentHeavyTasks') => {
        const values = policies
            .map((policy) => policy[key])
            .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

        if (values.length > 0) {
            const strictestValue = Math.min(...values)

            switch (key) {
                case 'maxRequests':
                    resolved.maxRequests = strictestValue
                    break
                case 'maxQuotaUnits':
                    resolved.maxQuotaUnits = strictestValue
                    break
                case 'maxActualCost':
                    resolved.maxActualCost = strictestValue
                    break
                case 'maxConcurrentHeavyTasks':
                    resolved.maxConcurrentHeavyTasks = strictestValue
                    break
            }
        }
    }

    if (policies.some((policy) => policy.isExempt)) {
        resolved.isExempt = true
        return resolved
    }

    applyStrictest('maxRequests')
    applyStrictest('maxQuotaUnits')
    applyStrictest('maxActualCost')
    applyStrictest('maxConcurrentHeavyTasks')

    return resolved
}

async function getConfiguredQuotaPolicies() {
    const enabled = toBoolean(await getSetting(SettingKey.AI_QUOTA_ENABLED, 'false'))
    if (!enabled) {
        return { enabled: false, policies: [] as AIQuotaPolicy[] }
    }

    const rawPolicies = await getSetting(SettingKey.AI_QUOTA_POLICIES, '[]')
    const parsedPolicies = parseMaybeJson<unknown[]>(rawPolicies, [])
    const validation = aiQuotaPoliciesSchema.safeParse(parsedPolicies)

    if (!validation.success) {
        return { enabled: true, policies: [] as AIQuotaPolicy[] }
    }

    return {
        enabled: true,
        policies: validation.data.map((policy) => normalizePolicy(policy as Record<string, unknown>)),
    }
}

function estimateTaskQuotaUnits(task: Pick<AITask, 'status' | 'quotaUnits' | 'estimatedQuotaUnits'>) {
    if (task.status === 'pending' || task.status === 'processing') {
        return toNumber(task.estimatedQuotaUnits, 0)
    }

    return toNumber(task.quotaUnits, toNumber(task.estimatedQuotaUnits, 0))
}

function estimateTaskCost(task: Pick<AITask, 'status' | 'actualCost' | 'estimatedCost'>) {
    if (task.status === 'pending' || task.status === 'processing') {
        return toNumber(task.estimatedCost, 0)
    }

    return toNumber(task.actualCost, toNumber(task.estimatedCost, 0))
}

export function summarizeAIQuotaUsage(
    tasks: AIUsageTaskSnapshot[],
    scope: AIQuotaPolicy['scope'],
    period: AIQuotaPolicy['period'],
    now = new Date(),
) {
    const relevantTasks = tasks.filter((task) => {
        if (task.createdAt < getPeriodStart(period, now)) {
            return false
        }

        const taskCategory = normalizeTaskCategory(task.category, task.type)
        return matchesScope(scope, taskCategory, task.type)
    })

    const concurrentHeavyTasks = relevantTasks.filter((task) => {
        const taskCategory = normalizeTaskCategory(task.category, task.type)
        return HEAVY_TASK_CATEGORIES.has(taskCategory)
            && (task.status === 'pending' || task.status === 'processing')
    }).length

    return relevantTasks.reduce((acc, task) => {
        acc.requests += 1
        acc.quotaUnits += estimateTaskQuotaUnits(task)
        acc.actualCost += estimateTaskCost(task)
        acc.concurrentHeavyTasks = concurrentHeavyTasks
        return acc
    }, {
        requests: 0,
        quotaUnits: 0,
        actualCost: 0,
        concurrentHeavyTasks,
    })
}

async function getUsageSummary(userId: string, scope: AIQuotaPolicy['scope'], period: AIQuotaPolicy['period']) {
    if (!dataSource.isInitialized) {
        return {
            requests: 0,
            quotaUnits: 0,
            actualCost: 0,
            concurrentHeavyTasks: 0,
        } satisfies AIUsageSummary
    }

    const repo = dataSource.getRepository(AITask)
    const tasks = await repo.find({
        where: {
            userId,
            createdAt: MoreThanOrEqual(getPeriodStart(period)),
        },
    })

    return summarizeAIQuotaUsage(tasks, scope, period)
}

function isResolvedQuotaPolicy(policy: ResolvedAIQuotaPolicy | null): policy is ResolvedAIQuotaPolicy {
    if (!policy) {
        return false
    }

    return policy.isExempt
        || isFiniteNumber(policy.maxRequests)
        || isFiniteNumber(policy.maxQuotaUnits)
        || isFiniteNumber(policy.maxActualCost)
        || isFiniteNumber(policy.maxConcurrentHeavyTasks)
}

export async function resolveAllAIQuotaPolicies(options: Pick<AIQuotaCheckOptions, 'userId' | 'userRole'>) {
    if (!options.userId) {
        return { enabled: false, policies: [] as ResolvedAIQuotaPolicy[] }
    }

    const { enabled, policies } = await getConfiguredQuotaPolicies()
    if (!enabled) {
        return { enabled: false, policies: [] as ResolvedAIQuotaPolicy[] }
    }

    const effectiveUserRole = await resolveUserRole(options.userId, options.userRole)
    const matchedPolicies = policies.filter((policy) => policy.enabled)

    const groupedPolicies = new Map<string, AIQuotaPolicy[]>()
    matchedPolicies.forEach((policy) => {
        const groupKey = `${policy.scope}:${policy.period}`
        const group = groupedPolicies.get(groupKey) || []
        group.push(policy)
        groupedPolicies.set(groupKey, group)
    })

    const resolvedPolicies = Array.from(groupedPolicies.values()).map((group) => {
        const highestPriority = Math.max(...group.map((policy) => getPolicyPriority(policy, options.userId!, effectiveUserRole)))
        if (highestPriority <= 0) {
            return null
        }

        const highestPriorityPolicies = group.filter((policy) => getPolicyPriority(policy, options.userId!, effectiveUserRole) === highestPriority)

        return mergePolicies(highestPriorityPolicies)
    }).filter(isResolvedQuotaPolicy)

    return {
        enabled,
        policies: resolvedPolicies,
    }
}

export async function resolveAIQuotaPolicy(options: Pick<AIQuotaCheckOptions, 'userId' | 'userRole' | 'category' | 'type'>) {
    if (!options.userId) {
        return { enabled: false, policies: [] as ResolvedAIQuotaPolicy[] }
    }

    const category = normalizeTaskCategory(options.category, options.type)
    const resolved = await resolveAllAIQuotaPolicies({
        userId: options.userId,
        userRole: options.userRole,
    })

    return {
        enabled: resolved.enabled,
        policies: resolved.policies.filter((policy) => matchesScope(policy.scope, category, options.type)),
    }
}

export async function assertAIQuotaAllowance(options: AIQuotaCheckOptions) {
    if (!options.userId) {
        return
    }

    const category = normalizeTaskCategory(options.category, options.type)
    const estimatedQuotaUnits = options.estimatedQuotaUnits ?? calculateQuotaUnits({
        category,
        type: options.type,
        payload: options.payload,
    })

    const { enabled, policies } = await resolveAIQuotaPolicy({
        userId: options.userId,
        userRole: options.userRole,
        category,
        type: options.type,
    })

    if (!enabled || policies.length === 0) {
        return
    }

    for (const policy of policies) {
        if (policy.isExempt) {
            continue
        }

        const usage = await getUsageSummary(options.userId, policy.scope, policy.period)

        if (isFiniteNumber(policy.maxRequests) && usage.requests >= policy.maxRequests) {
            fail(`AI quota exceeded: ${policy.period} request limit reached`, 429)
        }

        if (isFiniteNumber(policy.maxQuotaUnits) && usage.quotaUnits + estimatedQuotaUnits > policy.maxQuotaUnits) {
            fail(`AI quota exceeded: ${policy.period} quota limit reached`, 429)
        }

        if (isFiniteNumber(policy.maxActualCost) && usage.actualCost + toNumber(options.estimatedCost, 0) > policy.maxActualCost) {
            fail(`AI quota exceeded: ${policy.period} cost limit reached`, 429)
        }

        if (HEAVY_TASK_CATEGORIES.has(category) && isFiniteNumber(policy.maxConcurrentHeavyTasks) && usage.concurrentHeavyTasks >= policy.maxConcurrentHeavyTasks) {
            fail('AI quota exceeded: concurrent heavy task limit reached', 429)
        }
    }
}
