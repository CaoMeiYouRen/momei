import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution } from '../shared/cli.mjs'
import {
    annotateAlerts,
    buildArtifactPaths,
    classifyAlert,
    collectAlerts,
    evaluateSecurityAlertGate,
    loadInputSnapshot,
    mapAuditRiskToDependabotAlert,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
    normalizeSeverity,
    parseArgs,
    printAlert,
    readAllowlist,
    readExceptionEntries,
    resolveGitHubToken,
    resolveRepository,
    severityAtLeast,
    writeArtifacts,
} from './security-alert-gate-shared.mjs'
import { loadLocalEnvFile } from './load-local-env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

async function main() {
    await loadLocalEnvFile(repoRoot)

    const args = parseArgs(process.argv)
    const artifactPaths = buildArtifactPaths(args, repoRoot)
    const exceptionEntries = await readExceptionEntries(args.exceptions)
    const allowlistEntries = args.allowlist
        ? await readAllowlist(args.allowlist)
        : []

    const snapshot = args.input
        ? await loadInputSnapshot(args.input)
        : await collectAlerts(args, repoRoot)

    const repository = snapshot.repository || await resolveRepository(args, repoRoot)
    const alerts = annotateAlerts([
        ...snapshot.dependabotAlerts,
        ...snapshot.codeScanningAlerts,
    ])
    const result = evaluateSecurityAlertGate({
        alerts,
        allowlistEntries,
        exceptionEntries,
        minSeverity: args.minSeverity,
        sourceStatuses: snapshot.sourceStatuses,
    })
    const alertBlockers = args.transitionMode
        ? result.blocking
        : [...result.blocking, ...result.dismissedBlocking]
    const sourceBlockers = args.transitionMode ? [] : result.sourceFailures
    const effectiveBlocking = [...alertBlockers, ...sourceBlockers]
    const gateConclusion = effectiveBlocking.length > 0 ? 'Reject' : 'Pass'

    console.info('Security Alert Gate')
    console.info(`- repository: ${repository.owner}/${repository.repo}`)
    console.info(`- min severity: ${args.minSeverity}`)
    console.info(`- transition mode: ${args.transitionMode ? 'on (dismissed / fail-closed checks report-only)' : 'off'}`)
    console.info(`- dependabot source: ${snapshot.sourceStatuses.dependabot.kind} (${snapshot.sourceStatuses.dependabot.sourceName})`)
    console.info(`- code-scanning source: ${snapshot.sourceStatuses.codeScanning.kind} (${snapshot.sourceStatuses.codeScanning.sourceName})`)
    console.info(`- alerts total: ${alerts.length} (open: ${alerts.filter((alert) => alert.state === 'open').length}, dismissed: ${alerts.filter((alert) => alert.state === 'dismissed').length})`)
    console.info(`- high+ relevant alerts: ${result.relevantAlerts.length}`)
    console.info(`- high+ excepted alerts: ${result.excepted.length}`)
    console.info(`- high+ allowlisted alerts: ${result.allowlisted.length}`)
    console.info(`- high+ blocking alerts: ${alertBlockers.length}`)
    console.info(`- transition findings: ${result.transitionBlocking.length}`)
    console.info(`- source failures: ${result.sourceFailures.length}`)

    if (result.allowlisted.length > 0) {
        console.info('\nAllowlisted alerts:')
        result.allowlisted.forEach((item) => {
            printAlert(item.alert)
            console.info(`  allowlist reason: ${item.allowlistEntry.reason}; temporary exception: ${item.allowlistEntry.temporaryException}`)
        })
    }

    if (result.excepted.length > 0) {
        console.info('\nExcepted alerts:')
        result.excepted.forEach((item) => {
            printAlert(item.alert)
            console.info(`  category: ${item.exceptionEntry.category}; review: ${item.exceptionEntry.review}`)
        })
    }

    if (alertBlockers.length > 0) {
        console.info('\nBlocking alerts:')
        alertBlockers.forEach(printAlert)
    }

    if (sourceBlockers.length > 0) {
        console.info('\nBlocking source failures:')
        sourceBlockers.forEach((failure) => {
            console.info(`- ${failure.source}: ${failure.status.kind} (${failure.status.detail})`)
        })
    }

    if (result.transitionBlocking.length > 0) {
        console.info(`\nTransition findings (${args.transitionMode ? 'report-only' : 'blocking'}):`)
        result.transitionBlocking.forEach((item) => {
            if (item?.classification) {
                printAlert(item)
                return
            }
            console.info(`- source ${item.source}: ${item.status.kind} (${item.status.detail})`)
        })
    }

    if (result.expiredExceptions.length > 0 || result.staleExceptions.length > 0 || result.sourceWarnings.length > 0) {
        console.info('\nWarnings:')
        result.expiredExceptions.forEach((entry) => console.info(`- expired exception: ${entry.source}:${entry.alertNumber} (expiresAt=${entry.expiresAt})`))
        result.staleExceptions.forEach((entry) => console.info(`- stale exception: ${entry.source}:${entry.alertNumber}`))
        result.sourceWarnings.forEach((warning) => console.info(`- degraded source: ${warning.source} -> ${warning.status.kind} (${warning.status.detail})`))
    }

    await writeArtifacts({
        alerts,
        artifactPaths,
        effectiveBlocking,
        gateConclusion,
        minSeverity: args.minSeverity,
        repoRoot,
        repository,
        result,
        sourceStatuses: snapshot.sourceStatuses,
        transitionMode: args.transitionMode,
    })

    console.info(`\nJSON artifact: ${path.relative(repoRoot, artifactPaths.json)}`)
    console.info(`Markdown artifact: ${path.relative(repoRoot, artifactPaths.md)}`)
    console.info(`Review Gate: ${gateConclusion}`)

    if (gateConclusion === 'Reject' && args.mode === 'error') {
        process.exitCode = 1
    }
}

export {
    classifyAlert,
    evaluateSecurityAlertGate,
    main,
    mapAuditRiskToDependabotAlert,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
    normalizeSeverity,
    parseArgs,
    readAllowlist,
    resolveGitHubToken,
    severityAtLeast,
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(`[security-alert-gate] ${error.message}`)
        process.exitCode = 1
    })
}
