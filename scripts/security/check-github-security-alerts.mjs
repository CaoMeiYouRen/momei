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
        exceptionEntries,
        minSeverity: args.minSeverity,
    })
    const gateConclusion = result.blocking.length > 0 ? 'Reject' : 'Pass'

    console.info('Security Alert Gate')
    console.info(`- repository: ${repository.owner}/${repository.repo}`)
    console.info(`- min severity: ${args.minSeverity}`)
    console.info(`- dependabot source: ${snapshot.sourceStatuses.dependabot.kind} (${snapshot.sourceStatuses.dependabot.sourceName})`)
    console.info(`- code-scanning source: ${snapshot.sourceStatuses.codeScanning.kind} (${snapshot.sourceStatuses.codeScanning.sourceName})`)
    console.info(`- open alerts: ${alerts.length}`)
    console.info(`- high+ relevant alerts: ${result.relevantAlerts.length}`)
    console.info(`- high+ excepted alerts: ${result.excepted.length}`)
    console.info(`- high+ blocking alerts: ${result.blocking.length}`)

    if (result.blocking.length > 0) {
        console.info('\nBlocking alerts:')
        result.blocking.forEach(printAlert)
    }

    await writeArtifacts({
        alerts,
        artifactPaths,
        gateConclusion,
        minSeverity: args.minSeverity,
        repoRoot,
        repository,
        result,
        sourceStatuses: snapshot.sourceStatuses,
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
    mapAuditRiskToDependabotAlert,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
    normalizeSeverity,
    parseArgs,
    resolveGitHubToken,
    severityAtLeast,
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(`[security-alert-gate] ${error.message}`)
        process.exitCode = 1
    })
}
