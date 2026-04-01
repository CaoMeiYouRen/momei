import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { isDirectExecution } from '../shared/cli.mjs'
import { loadLocalEnvFile } from './load-local-env.mjs'

const DEFAULTS = {
    allowlist: '.github/security/dependency-risk-allowlist.json',
    minSeverity: 'high',
    mode: 'error',
    registry: 'https://registry.npmjs.org/',
}

const SEVERITY_RANK = {
    info: 0,
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
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

function toArray(value) {
    return Array.isArray(value) ? value : []
}

function uniqueStrings(values) {
    return [...new Set(values.filter((item) => typeof item === 'string' && item.trim()))]
}

function parseArgs(argv) {
    const args = {
        ...DEFAULTS,
        input: null,
    }

    for (let index = 2; index < argv.length; index++) {
        const item = argv[index]
        if (item.startsWith('--allowlist=')) {
            args.allowlist = item.slice('--allowlist='.length)
            continue
        }
        if (item.startsWith('--input=')) {
            args.input = item.slice('--input='.length)
            continue
        }
        if (item.startsWith('--min-severity=')) {
            args.minSeverity = item.slice('--min-severity='.length)
            continue
        }
        if (item.startsWith('--mode=')) {
            args.mode = item.slice('--mode='.length)
            continue
        }
        if (item.startsWith('--registry=')) {
            args.registry = item.slice('--registry='.length)
            continue
        }
        throw new Error(`Unsupported argument: ${item}`)
    }

    if (args.mode !== 'warn' && args.mode !== 'error') {
        throw new Error(`Unsupported mode: ${args.mode}`)
    }

    args.minSeverity = normalizeSeverity(args.minSeverity)
    return args
}

function resolveAdvisoryId(candidate) {
    if (candidate.github_advisory_id) {
        return candidate.github_advisory_id
    }
    if (Array.isArray(candidate.cves) && candidate.cves[0]) {
        return candidate.cves[0]
    }
    if (candidate.url) {
        return candidate.url
    }
    if (candidate.source) {
        return String(candidate.source)
    }
    if (candidate.id) {
        return String(candidate.id)
    }
    return 'unknown-advisory'
}

function resolvePatchedVersions(candidate, fixAvailable) {
    if (typeof candidate.patched_versions === 'string' && candidate.patched_versions.trim()) {
        return candidate.patched_versions.trim()
    }
    if (typeof fixAvailable === 'string' && fixAvailable.trim()) {
        return fixAvailable.trim()
    }
    if (fixAvailable && typeof fixAvailable === 'object' && typeof fixAvailable.name === 'string' && typeof fixAvailable.version === 'string') {
        return `${fixAvailable.name}@${fixAvailable.version}`
    }
    return 'unavailable'
}

function resolveRecommendation(candidate, recommendedVersion) {
    if (typeof candidate.recommendation === 'string' && candidate.recommendation.trim()) {
        return candidate.recommendation.trim()
    }
    if (typeof recommendedVersion === 'string' && recommendedVersion.trim()) {
        return `Upgrade to ${recommendedVersion.trim()}`
    }
    return 'No direct upgrade recommendation from audit source'
}

function buildLegacyActionMap(actions) {
    const actionMap = new Map()

    toArray(actions).forEach((action) => {
        const recommendation = action.action === 'update' && action.target
            ? `Upgrade ${action.module} to ${action.target}`
            : 'Manual review required'

        toArray(action.resolves).forEach((resolve) => {
            if (resolve?.id === undefined || resolve?.id === null) {
                return
            }
            actionMap.set(String(resolve.id), {
                patchedVersions: action.target || 'unavailable',
                recommendation,
            })
        })
    })

    return actionMap
}

function createRiskRecord({
    advisoryId,
    packageName,
    severity,
    source,
    title,
    paths,
    patchedVersions,
    recommendation,
}) {
    return {
        advisoryId,
        key: `${packageName}:${advisoryId}:${severity}`,
        packageName,
        severity,
        source,
        title,
        paths: uniqueStrings(paths).sort(),
        patchedVersions,
        recommendation,
    }
}

function parseLegacyAuditReport(report) {
    const risks = []
    const actionMap = buildLegacyActionMap(report?.actions)

    for (const advisory of Object.values(report?.advisories || {})) {
        const action = actionMap.get(String(advisory.id))
        risks.push(createRiskRecord({
            advisoryId: resolveAdvisoryId(advisory),
            packageName: advisory.module_name || 'unknown-package',
            severity: normalizeSeverity(advisory.severity),
            source: advisory.url || 'https://registry.npmjs.org/',
            title: advisory.title || advisory.overview || 'Untitled advisory',
            paths: toArray(advisory.findings).flatMap((finding) => toArray(finding.paths)),
            patchedVersions: resolvePatchedVersions(advisory, action?.patchedVersions),
            recommendation: resolveRecommendation(advisory, action?.patchedVersions),
        }))
    }

    return risks
}

function parseModernAuditReport(report) {
    const risks = []

    for (const vulnerability of Object.values(report?.vulnerabilities || {})) {
        const packageName = vulnerability?.name || 'unknown-package'
        const viaItems = toArray(vulnerability.via).filter((item) => item && typeof item === 'object')

        if (viaItems.length === 0 && vulnerability?.severity) {
            risks.push(createRiskRecord({
                advisoryId: resolveAdvisoryId(vulnerability),
                packageName,
                severity: normalizeSeverity(vulnerability.severity),
                source: vulnerability.url || 'https://registry.npmjs.org/',
                title: vulnerability.title || `${packageName} vulnerability`,
                paths: toArray(vulnerability.nodes),
                patchedVersions: resolvePatchedVersions(vulnerability, vulnerability.fixAvailable),
                recommendation: resolveRecommendation(vulnerability, null),
            }))
            continue
        }

        viaItems.forEach((advisory) => {
            risks.push(createRiskRecord({
                advisoryId: resolveAdvisoryId(advisory),
                packageName: advisory.name || packageName,
                severity: normalizeSeverity(advisory.severity || vulnerability.severity),
                source: advisory.url || 'https://registry.npmjs.org/',
                title: advisory.title || `${packageName} vulnerability`,
                paths: toArray(vulnerability.nodes),
                patchedVersions: resolvePatchedVersions(advisory, vulnerability.fixAvailable),
                recommendation: resolveRecommendation(advisory, null),
            }))
        })
    }

    return risks
}

function dedupeRisks(risks) {
    const result = new Map()

    risks.forEach((risk) => {
        const current = result.get(risk.key)
        if (!current) {
            result.set(risk.key, risk)
            return
        }

        result.set(risk.key, {
            ...current,
            paths: uniqueStrings([...current.paths, ...risk.paths]).sort(),
        })
    })

    return [...result.values()].sort((left, right) => {
        const severityDelta = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity]
        if (severityDelta !== 0) {
            return severityDelta
        }
        return left.packageName.localeCompare(right.packageName)
    })
}

function parseAuditReport(report) {
    const legacyRisks = parseLegacyAuditReport(report)
    const modernRisks = parseModernAuditReport(report)
    return dedupeRisks([...legacyRisks, ...modernRisks])
}

function normalizeAllowlistDefinition(raw) {
    let entries = []

    if (Array.isArray(raw?.entries)) {
        entries = raw.entries
    } else if (Array.isArray(raw?.allowlist)) {
        entries = raw.allowlist
    }

    return entries.map((entry, index) => {
        const advisoryId = String(entry?.advisoryId || '').trim()
        const packageName = String(entry?.packageName || entry?.package || '').trim()
        const severity = normalizeSeverity(entry?.severity)
        const reason = String(entry?.reason || '').trim()
        const source = String(entry?.source || '').trim()
        const temporaryException = String(entry?.temporaryException || entry?.temporary_basis || '').trim()
        const approvedPaths = uniqueStrings(toArray(entry?.approvedPaths)).sort()

        if (!advisoryId || !packageName || !reason || !source || !temporaryException || approvedPaths.length === 0) {
            throw new Error(`Invalid allowlist entry at index ${index}`)
        }

        return {
            advisoryId,
            approvedPaths,
            packageName,
            reason,
            severity,
            source,
            temporaryException,
        }
    })
}

async function readAllowlist(filePath) {
    const content = await readFile(path.resolve(filePath), 'utf8')
    return normalizeAllowlistDefinition(JSON.parse(content))
}

function evaluateDependencyRiskGate({ risks, allowlistEntries, minSeverity }) {
    const relevantRisks = risks.filter((risk) => severityAtLeast(risk.severity, minSeverity))
    const allowlisted = []
    const blocking = []

    relevantRisks.forEach((risk) => {
        const allowlistEntry = allowlistEntries.find((entry) => (
            entry.advisoryId === risk.advisoryId
            && entry.packageName === risk.packageName
            && entry.severity === risk.severity
            && risk.paths.length > 0
            && risk.paths.every((riskPath) => entry.approvedPaths.includes(riskPath))
        ))

        if (allowlistEntry) {
            allowlisted.push({ risk, allowlistEntry })
            return
        }

        blocking.push(risk)
    })

    return {
        allowlisted,
        blocking,
        relevantRisks,
    }
}

function assertSupportedAuditReport(report) {
    if (!report || typeof report !== 'object' || Array.isArray(report)) {
        throw new Error('Unsupported pnpm audit payload: expected a JSON object')
    }

    if (report.error) {
        let message = JSON.stringify(report.error)

        if (typeof report.error === 'string') {
            message = report.error
        } else if (typeof report.error?.summary === 'string') {
            message = report.error.summary
        }

        throw new Error(`pnpm audit reported an error: ${message}`)
    }

    const hasLegacySchema = report.advisories && typeof report.advisories === 'object'
    const hasModernSchema = report.vulnerabilities && typeof report.vulnerabilities === 'object'

    if (!hasLegacySchema && !hasModernSchema) {
        throw new Error('Unsupported pnpm audit payload: missing advisories/vulnerabilities data')
    }
}

function printRisk(risk) {
    console.info(`- ${risk.packageName} [${risk.severity}] ${risk.advisoryId}`)
    console.info(`  title: ${risk.title}`)
    console.info(`  source: ${risk.source}`)
    console.info(`  patched: ${risk.patchedVersions}`)
    console.info(`  recommendation: ${risk.recommendation}`)
    if (risk.paths.length > 0) {
        console.info(`  paths: ${risk.paths.join(', ')}`)
    }
}

function printAllowlistedRisk(item) {
    printRisk(item.risk)
    console.info(`  allowlist reason: ${item.allowlistEntry.reason}`)
    console.info(`  temporary exception: ${item.allowlistEntry.temporaryException}`)
}

function resolvePnpmCommand() {
    return 'pnpm'
}

function createPnpmAuditProcess(args) {
    const auditArgs = ['audit', '--json', `--registry=${args.registry}`]

    if (process.platform === 'win32') {
        return spawn(process.env.comspec || 'cmd.exe', ['/d', '/s', '/c', `${resolvePnpmCommand()} ${auditArgs.join(' ')}`], {
            cwd: process.cwd(),
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
        })
    }

    return spawn(resolvePnpmCommand(), auditArgs, {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
    })
}

async function loadAuditReport(args) {
    if (args.input) {
        const content = await readFile(path.resolve(args.input), 'utf8')
        const report = JSON.parse(content)
        assertSupportedAuditReport(report)
        return report
    }

    return new Promise((resolve, reject) => {
        const child = createPnpmAuditProcess(args)

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })
        child.on('error', (error) => {
            reject(error)
        })
        child.on('close', () => {
            if (!stdout.trim()) {
                reject(new Error(`pnpm audit produced no JSON output. ${stderr.trim()}`.trim()))
                return
            }

            try {
                const report = JSON.parse(stdout)
                assertSupportedAuditReport(report)
                resolve(report)
            } catch (error) {
                reject(new Error(`Failed to parse pnpm audit JSON output: ${error.message}`))
            }
        })
    })
}

async function main() {
    await loadLocalEnvFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'))

    const args = parseArgs(process.argv)
    const [allowlistEntries, auditReport] = await Promise.all([
        readAllowlist(args.allowlist),
        loadAuditReport(args),
    ])

    const risks = parseAuditReport(auditReport)
    const result = evaluateDependencyRiskGate({
        risks,
        allowlistEntries,
        minSeverity: args.minSeverity,
    })

    console.info('Dependency Risk Gate')
    console.info(`- source: pnpm audit (${args.registry})`)
    console.info(`- min severity: ${args.minSeverity}`)
    console.info(`- allowlist: ${args.allowlist}`)
    console.info(`- relevant risks: ${result.relevantRisks.length}`)

    if (result.allowlisted.length > 0) {
        console.info('\nAllowlisted risks:')
        result.allowlisted.forEach((item) => {
            printAllowlistedRisk(item)
        })
    }

    if (result.blocking.length > 0) {
        console.info('\nBlocking risks:')
        result.blocking.forEach((risk) => {
            printRisk(risk)
        })
        if (args.mode === 'error') {
            process.exitCode = 1
        }
        return
    }

    console.info('\nNo blocking dependency risks found.')
}

export {
    assertSupportedAuditReport,
    evaluateDependencyRiskGate,
    normalizeAllowlistDefinition,
    parseArgs,
    parseAuditReport,
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(`[dependency-risk-gate] ${error.message}`)
        process.exitCode = 1
    })
}
