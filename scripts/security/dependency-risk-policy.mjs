import {
    isBlockingGuardFindingLevel,
    isGuardFindingAtLeast,
    normalizeGuardFindingLevel,
    resolveHighestGuardFindingLevel,
} from '../shared/guard-strategy.mjs'

const RAW_DEPENDENCY_RISK_POLICIES = {
    release: {
        defaultMode: 'error',
        findingLevels: {
            auditFailure: 'blocker',
            blockingRisk: 'blocker',
        },
        issueThreshold: 'none',
        key: 'release',
        minSeverity: 'high',
        title: 'Release dependency risk gate',
    },
    daily: {
        defaultMode: 'warn',
        findingLevels: {
            auditFailure: 'blocker',
            blockingRisk: 'blocker',
        },
        issueThreshold: 'blocker',
        key: 'daily',
        minSeverity: 'high',
        title: 'Daily dependency risk audit',
    },
}

export const DEPENDENCY_RISK_POLICY_KEYS = Object.keys(RAW_DEPENDENCY_RISK_POLICIES)

function normalizeDependencyRiskPolicy(policy) {
    return {
        ...policy,
        findingLevels: {
            auditFailure: normalizeGuardFindingLevel(policy.findingLevels.auditFailure),
            blockingRisk: normalizeGuardFindingLevel(policy.findingLevels.blockingRisk),
        },
        issueThreshold: normalizeGuardFindingLevel(policy.issueThreshold),
    }
}

function appendFinding(target, level, message) {
    const normalizedLevel = normalizeGuardFindingLevel(level)

    if (normalizedLevel === 'none') {
        return
    }

    if (normalizedLevel === 'blocker') {
        target.blockers.push(message)
        return
    }

    target.warnings.push(message)
}

export function resolveDependencyRiskPolicy(policyKey = 'release') {
    const policy = RAW_DEPENDENCY_RISK_POLICIES[policyKey]

    if (!policy) {
        throw new Error(`Unsupported dependency risk policy: ${policyKey}`)
    }

    return normalizeDependencyRiskPolicy(policy)
}

export function classifyDependencyRiskOutcome({
    auditFailed = false,
    blockingRiskCount = 0,
    policy,
}) {
    const resolvedPolicy = typeof policy === 'string'
        ? resolveDependencyRiskPolicy(policy)
        : normalizeDependencyRiskPolicy(policy)
    const findings = {
        blockers: [],
        warnings: [],
    }
    const findingLevels = []

    if (blockingRiskCount > 0) {
        findingLevels.push(resolvedPolicy.findingLevels.blockingRisk)
        appendFinding(
            findings,
            resolvedPolicy.findingLevels.blockingRisk,
            `dependency-risk gate matched ${blockingRiskCount} high+ risk(s)`,
        )
    }

    if (auditFailed) {
        findingLevels.push(resolvedPolicy.findingLevels.auditFailure)
        appendFinding(
            findings,
            resolvedPolicy.findingLevels.auditFailure,
            'dependency-risk audit execution failed',
        )
    }

    const findingLevel = resolveHighestGuardFindingLevel(findingLevels)
    const conclusion = isBlockingGuardFindingLevel(findingLevel) ? 'Reject' : 'Pass'

    return {
        blockers: findings.blockers,
        conclusion,
        findingLevel,
        requiresAttention: isBlockingGuardFindingLevel(findingLevel),
        shouldOpenIssue: findingLevel !== 'none' && isGuardFindingAtLeast(findingLevel, resolvedPolicy.issueThreshold),
        warnings: findings.warnings,
    }
}
