/**
 * 安全告警策略：严重级归一、告警分类、豁免台账与门禁判定。
 * 数据源读取、证据产物与 CLI 编排留在 security-alert-gate-shared.mjs。
 */

const SEVERITY_RANK = {
    info: 0,
    note: 0,
    low: 1,
    warning: 1,
    moderate: 2,
    medium: 2,
    high: 3,
    error: 3,
    critical: 4,
}

const CODE_SCANNING_RULE_SEVERITY_MAP = {
    note: 'low',
    warning: 'medium',
    error: 'high',
}

const UNPATCHED_VERSION_SENTINELS = new Set([
    '',
    '<0.0.0',
    'manual review required',
    'none',
    'unavailable',
])

const EXCEPTION_CATEGORIES = new Set(['no-fix', 'hard-fix', 'false-positive'])
const EXCEPTION_SEVERITIES = new Set(['high'])

function toArray(value) {
    return Array.isArray(value) ? value : []
}

function normalizeSeverity(value) {
    const normalized = String(value || '').trim().toLowerCase()
    if (!(normalized in SEVERITY_RANK)) {
        throw new Error(`Unsupported severity: ${value}`)
    }
    return normalized
}

function severityAtLeast(left, right) {
    return SEVERITY_RANK[left] >= SEVERITY_RANK[right]
}

function normalizePatchedVersionValue(value) {
    const normalized = String(value || '').trim().toLowerCase()
    if (!normalized || UNPATCHED_VERSION_SENTINELS.has(normalized)) {
        return null
    }
    return String(value).trim()
}

function normalizeExceptionEntries(definition) {
    return toArray(definition?.entries).map((entry, index) => {
        const source = String(entry?.source || '').trim()
        const alertNumber = String(entry?.id ?? entry?.alertNumber ?? '').trim()
        const reason = String(entry?.reason || '').trim()
        const review = String(entry?.review ?? entry?.temporaryException ?? '').trim()
        const expiresAt = String(entry?.expiresAt ?? '').trim()
        const target = String(entry?.target ?? '').trim()
        const dependencyPath = String(entry?.path ?? '').trim()
        const location = String(entry?.location ?? '').trim()
        const tracking = String(entry?.tracking ?? '').trim()
        const approvedBy = String(entry?.approvedBy ?? '').trim()

        const severity = String(entry?.severity || '').trim().toLowerCase()
        const category = String(entry?.category || '').trim().toLowerCase()

        if (!source || !alertNumber || !reason || !review) {
            throw new Error(`Invalid security alert exception entry at index ${index}`)
        }

        if (!EXCEPTION_SEVERITIES.has(severity)) {
            throw new Error(`Invalid security alert exception entry at index ${index}: severity must be high`)
        }

        if (!EXCEPTION_CATEGORIES.has(category)) {
            throw new Error(`Invalid security alert exception entry at index ${index}: unsupported category ${category}`)
        }

        if (!target) {
            throw new Error(`Invalid security alert exception entry at index ${index}: missing target`)
        }

        if (!tracking) {
            throw new Error(`Invalid security alert exception entry at index ${index}: missing tracking`)
        }

        if (!expiresAt) {
            throw new Error(`Invalid security alert exception entry at index ${index}: missing expiresAt`)
        }

        if (source === 'code-scanning' && !location) {
            throw new Error(`Invalid security alert exception entry at index ${index}: missing location`)
        }

        if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
            throw new Error(`Invalid security alert exception entry at index ${index}: invalid expiresAt`)
        }

        return {
            alertNumber,
            approvedBy,
            category,
            dependencyPath,
            expiresAt,
            location,
            reason,
            review,
            severity,
            source,
            target,
            tracking,
        }
    })
}

function isExceptionEntryActive(entry, today = new Date()) {
    if (!entry.expiresAt) {
        return false
    }

    const todayIso = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-')

    return Date.parse(entry.expiresAt) >= Date.parse(todayIso)
}

function exceptionKey(entry) {
    return `${entry.source}:${entry.alertNumber}`
}

function findExceptionEntry(alert, exceptionEntries) {
    return exceptionEntries.find((entry) => {
        if (entry.source !== alert.source || entry.alertNumber !== alert.alertNumber || !isExceptionEntryActive(entry)) {
            return false
        }

        const expectedTarget = alert.source === 'dependabot' ? alert.packageName : alert.ruleId

        if (entry.target && expectedTarget && entry.target !== expectedTarget) {
            return false
        }

        if (alert.source === 'code-scanning') {
            if (!alert.locationPath) {
                return false
            }

            if (entry.location && entry.location !== alert.locationPath) {
                return false
            }
        }

        const alertPaths = toArray(alert.paths)
        if (entry.dependencyPath && (alertPaths.length === 0 || !alertPaths.some((riskPath) => riskPath.includes(entry.dependencyPath)))) {
            return false
        }

        if (alert.state === 'dismissed') {
            if (!alert.dismissedReason) {
                return false
            }

            const reason = String(entry.reason || '').toLowerCase()
            if (!reason.includes(String(alert.dismissedReason).toLowerCase())) {
                return false
            }
        }

        return true
    }) || null
}

function normalizeDependabotAlert(alert) {
    const advisory = alert?.security_advisory || {}
    const vulnerability = alert?.security_vulnerability || {}
    const firstPatchedVersion = vulnerability?.first_patched_version?.identifier
        || toArray(advisory.vulnerabilities)
            .map((item) => item?.first_patched_version?.identifier)
            .find(Boolean)
            || null

    return {
        advisoryId: advisory?.ghsa_id || null,
        alertNumber: String(alert?.number ?? 'unknown'),
        classification: null,
        createdAt: alert?.created_at || null,
        dismissedAt: alert?.dismissed_at || null,
        dismissedReason: alert?.dismissed_reason || null,
        ecosystem: alert?.dependency?.package?.ecosystem || vulnerability?.package?.ecosystem || 'npm',
        htmlUrl: alert?.html_url || null,
        manifestPath: alert?.dependency?.manifest_path || null,
        packageName: alert?.dependency?.package?.name || vulnerability?.package?.name || 'unknown-package',
        patchAvailable: Boolean(firstPatchedVersion),
        patchedVersion: firstPatchedVersion,
        severity: normalizeSeverity(advisory?.severity || vulnerability?.severity || 'medium'),
        source: 'dependabot',
        state: String(alert?.state || 'open').trim().toLowerCase(),
        summary: advisory?.summary || advisory?.description || `${vulnerability?.package?.name || 'dependency'} security alert`,
        updatedAt: alert?.updated_at || null,
    }
}

function normalizeCodeScanningAlert(alert) {
    const rawSeverity = alert?.rule?.security_severity_level
        || CODE_SCANNING_RULE_SEVERITY_MAP[String(alert?.rule?.severity || '').trim().toLowerCase()]
        || 'medium'

    return {
        alertNumber: String(alert?.number ?? 'unknown'),
        classification: null,
        createdAt: alert?.created_at || null,
        dismissedAt: alert?.dismissed_at || null,
        dismissedReason: alert?.dismissed_reason || null,
        htmlUrl: alert?.html_url || null,
        locationPath: alert?.most_recent_instance?.location?.path || null,
        packageName: null,
        patchAvailable: false,
        patchedVersion: null,
        ruleId: alert?.rule?.id || 'unknown-rule',
        ruleSeverity: String(alert?.rule?.severity || '').trim().toLowerCase() || null,
        severity: normalizeSeverity(rawSeverity),
        source: 'code-scanning',
        state: String(alert?.state || 'open').trim().toLowerCase(),
        summary: alert?.rule?.description || alert?.most_recent_instance?.message?.text || alert?.rule?.name || 'Code scanning alert',
        toolName: alert?.tool?.name || 'unknown-tool',
        updatedAt: alert?.updated_at || null,
        classifications: toArray(alert?.most_recent_instance?.classifications).map((item) => String(item).trim().toLowerCase()).filter(Boolean),
    }
}

function mapAuditRiskToDependabotAlert(risk) {
    const patchedVersion = normalizePatchedVersionValue(risk.patchedVersions)

    return {
        advisoryId: String(risk.advisoryId || '').trim() || null,
        alertNumber: `audit:${risk.packageName}:${risk.advisoryId}`,
        classification: null,
        createdAt: null,
        dismissedAt: null,
        dismissedReason: null,
        ecosystem: 'npm',
        htmlUrl: risk.source,
        manifestPath: null,
        packageName: risk.packageName,
        patchAvailable: Boolean(patchedVersion),
        patchedVersion,
        severity: normalizeSeverity(risk.severity),
        source: 'dependabot',
        state: 'open',
        summary: risk.title,
        updatedAt: null,
        via: 'pnpm-audit-fallback',
        paths: toArray(risk.paths),
        recommendation: risk.recommendation,
    }
}

function isTestOnlyCodeScanningAlert(alert) {
    const pathValue = String(alert.locationPath || '').trim().toLowerCase()
    if (pathValue.startsWith('tests/') || pathValue.includes('.test.') || pathValue.includes('.spec.')) {
        return true
    }

    const classifications = toArray(alert.classifications)
    return classifications.includes('test') || classifications.includes('tests')
}

function classifyAlert(alert) {
    if (alert.state === 'dismissed') {
        if (alert.severity === 'critical') {
            return {
                bucket: 'dismissed-critical',
                reason: 'dismissed critical alert still blocks release',
            }
        }

        if (alert.source === 'code-scanning' && isTestOnlyCodeScanningAlert(alert)) {
            return {
                bucket: 'observe',
                reason: 'dismissed test-only code scanning alert',
            }
        }

        if (severityAtLeast(alert.severity, 'high')) {
            return {
                bucket: 'dismissed-high',
                reason: 'dismissed high+ alert requires false-positive baseline',
            }
        }

        return {
            bucket: 'observe',
            reason: `dismissed ${alert.severity} alert`,
        }
    }

    if (alert.state !== 'open') {
        return {
            bucket: 'observe',
            reason: `state=${alert.state}`,
        }
    }

    if (alert.source === 'dependabot') {
        if (alert.patchAvailable) {
            return {
                bucket: 'immediate-fix',
                reason: 'open Dependabot alert with patched version available',
            }
        }

        return {
            bucket: 'defer',
            reason: 'open Dependabot alert without patched version',
        }
    }

    if (alert.source === 'code-scanning') {
        if (alert.severity === 'critical') {
            return {
                bucket: 'immediate-fix',
                reason: 'critical code scanning alert cannot be treated as out of scope',
            }
        }

        if (isTestOnlyCodeScanningAlert(alert)) {
            return {
                bucket: 'observe',
                reason: 'test-only code scanning location or classification',
            }
        }

        if (severityAtLeast(alert.severity, 'high')) {
            return {
                bucket: 'immediate-fix',
                reason: 'open high+ code scanning alert on non-test path',
            }
        }

        return {
            bucket: 'defer',
            reason: 'open lower-severity code scanning alert requires triage',
        }
    }

    return {
        bucket: 'observe',
        reason: 'unknown source',
    }
}

// 与 evaluateDependencyRiskGate 共享豁免语义（advisoryId + packageName + severity + paths 覆盖校验）；
// GitHub API 源无依赖链 paths，alert 无 paths 时三元组匹配即豁免（数据源适配，非语义放宽）。
function matchAllowlistEntry(alert, allowlistEntries) {
    if (!alert.advisoryId || !alert.packageName) {
        return null
    }
    const alertPaths = toArray(alert.paths)
    return toArray(allowlistEntries).find((entry) => (
        entry.advisoryId === alert.advisoryId
        && entry.packageName === alert.packageName
        && entry.severity === alert.severity
        && (alertPaths.length === 0 || alertPaths.every((riskPath) => toArray(entry.approvedPaths).includes(riskPath)))
    )) || null
}

/**
 * @param {{
 *   alerts: object[],
 *   exceptionEntries: object[],
 *   allowlistEntries?: Array<{ advisoryId: string, packageName: string, severity: string, approvedPaths: string[], source?: string, reason?: string, temporaryException?: string }>,
 *   minSeverity: string,
 *   sourceStatuses?: { dependabot?: object, codeScanning?: object } | null,
 * }} params
 */
function evaluateSecurityAlertGate({ alerts, exceptionEntries, allowlistEntries = [], minSeverity, sourceStatuses = null }) {
    const relevantAlerts = alerts.filter((alert) => severityAtLeast(alert.severity, minSeverity))
    const allowlisted = []
    const blocking = []
    const dismissedBlocking = []
    const excepted = []
    const observe = []
    const matchedExceptionKeys = new Set()

    relevantAlerts.forEach((alert) => {
        const bucket = alert.classification.bucket

        if (bucket === 'observe') {
            observe.push(alert)
            return
        }

        // critical 为发布红线：exception 与 allowlist 均不生效，dismissed 同样阻断。
        if (alert.severity === 'critical' || bucket === 'dismissed-critical') {
            blocking.push(alert)
            return
        }

        // dismissed high+ 只接受 false-positive 登记；allowlist / no-fix / hard-fix 均不放行。
        if (bucket === 'dismissed-high') {
            const exceptionEntry = findExceptionEntry(alert, exceptionEntries)
            if (exceptionEntry && exceptionEntry.category === 'false-positive') {
                matchedExceptionKeys.add(exceptionKey(exceptionEntry))
                excepted.push({ alert, exceptionEntry })
                return
            }

            dismissedBlocking.push(alert)
            return
        }

        const allowlistEntry = matchAllowlistEntry(alert, allowlistEntries)
        if (allowlistEntry) {
            allowlisted.push({ alert, allowlistEntry })
            return
        }

        if (bucket === 'defer') {
            const exceptionEntry = findExceptionEntry(alert, exceptionEntries)
            if (exceptionEntry && ['no-fix', 'hard-fix'].includes(exceptionEntry.category)) {
                matchedExceptionKeys.add(exceptionKey(exceptionEntry))
                excepted.push({ alert, exceptionEntry })
                return
            }
        }

        blocking.push(alert)
    })

    const staleExceptions = exceptionEntries.filter((entry) => (
        isExceptionEntryActive(entry) && !matchedExceptionKeys.has(exceptionKey(entry))
    ))
    const expiredExceptions = exceptionEntries.filter((entry) => !isExceptionEntryActive(entry))
    const sourceFailures = []
    const sourceWarnings = []

    if (sourceStatuses) {
        for (const [source, status] of [['dependabot', sourceStatuses.dependabot], ['codeScanning', sourceStatuses.codeScanning]]) {
            if (!status || status.kind === 'ok') {
                continue
            }

            if (status.kind === 'fallback') {
                sourceWarnings.push({ source, status })
                continue
            }

            sourceFailures.push({ source, status })
        }
    }

    return {
        allowlisted,
        blocking,
        dismissedBlocking,
        excepted,
        observe,
        relevantAlerts,
        sourceFailures,
        sourceWarnings,
        staleExceptions,
        expiredExceptions,
        transitionBlocking: [...dismissedBlocking, ...sourceFailures],
    }
}

export {
    classifyAlert,
    evaluateSecurityAlertGate,
    isExceptionEntryActive,
    mapAuditRiskToDependabotAlert,
    matchAllowlistEntry,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
    normalizeSeverity,
    severityAtLeast,
    toArray,
}
