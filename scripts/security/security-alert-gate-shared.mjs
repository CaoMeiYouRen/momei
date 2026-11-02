import { execFile, spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { parseCliOptions } from '../shared/cli.mjs'
import { assertSupportedAuditReport, parseAuditReport, readAllowlist } from './check-dependency-risk.mjs'
import {
    classifyAlert,
    evaluateSecurityAlertGate,
    mapAuditRiskToDependabotAlert,
    matchAllowlistEntry,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
    normalizeSeverity,
    severityAtLeast,
    toArray,
} from './security-alert-gate-policy.mjs'

const execFileAsync = promisify(execFile)

const DEFAULTS = {
    allowlist: '.github/security/dependency-risk-allowlist.json',
    exceptions: '.github/security/security-alert-exceptions.json',
    input: null,
    minSeverity: 'high',
    mode: 'error',
    outputJson: null,
    outputMd: null,
    owner: null,
    perPage: 100,
    registry: 'https://registry.npmjs.org/',
    repo: null,
    transitionMode: false,
}

const ALERT_STATES = ['open', 'dismissed']

async function readExceptionEntries(filePath) {
    const content = await readFile(path.resolve(filePath), 'utf8')
    return normalizeExceptionEntries(JSON.parse(content))
}

function parseArgs(argv) {
    const args = parseCliOptions(argv, {
        defaults: { ...DEFAULTS },
        flags: {
            '--transition-mode': { key: 'transitionMode', value: true },
        },
        values: {
            '--allowlist': { key: 'allowlist' },
            '--exceptions': { key: 'exceptions' },
            '--input': { key: 'input' },
            '--min-severity': { key: 'minSeverity' },
            '--mode': {
                key: 'mode',
                allowedValues: ['warn', 'error'],
                invalidMessage: (value) => `Unsupported mode: ${value}`,
            },
            '--output-json': { key: 'outputJson' },
            '--output-md': { key: 'outputMd' },
            '--owner': { key: 'owner' },
            '--per-page': { key: 'perPage', parse: (value) => Number(value) },
            '--registry': { key: 'registry' },
            '--repo': { key: 'repo' },
        },
    })

    if (!Number.isInteger(args.perPage) || args.perPage <= 0 || args.perPage > 100) {
        throw new Error(`Unsupported per-page value: ${args.perPage}`)
    }

    args.minSeverity = normalizeSeverity(args.minSeverity)
    return args
}

async function resolveRepository(args, repoRoot) {
    if (args.owner && args.repo) {
        return { owner: args.owner, repo: args.repo }
    }

    if (process.env.GITHUB_REPOSITORY) {
        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
        if (owner && repo) {
            return { owner, repo }
        }
    }

    try {
        const { stdout } = await execFileAsync('git', ['remote', 'get-url', 'origin'], { cwd: repoRoot })
        const remoteUrl = stdout.trim()
        const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/)
        if (match) {
            return { owner: match[1], repo: match[2] }
        }
    } catch {
        // ignore and fall through
    }

    throw new Error('Unable to resolve GitHub repository owner/repo. Use --owner and --repo.')
}

function normalizeSourceStatus(status) {
    return {
        detail: status?.detail || '',
        kind: status?.kind || 'unknown',
        sourceName: status?.sourceName || 'unknown',
    }
}

function resolveGitHubToken() {
    const candidates = [process.env.SECURITY_ALERTS_TOKEN, process.env.GH_TOKEN, process.env.GITHUB_TOKEN]
    return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || null
}

function buildAlertsUrl({ owner, perPage, repo, endpoint, state }) {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/${endpoint}`)
    url.searchParams.set('state', state)
    url.searchParams.set('per_page', String(perPage))
    // Dependabot alerts 不支持 `page` 参数，统一按 Link 头的 rel="next" 翻页。
    return url
}

function parseNextLink(linkHeader) {
    if (!linkHeader) {
        return null
    }

    for (const part of String(linkHeader).split(',')) {
        const match = part.match(/<([^>]+)>\s*;\s*rel="next"/u)
        if (match) {
            return match[1]
        }
    }

    return null
}

async function fetchGitHubApiPage({ token, url }) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2026-03-10',
        },
        signal: AbortSignal.timeout(30_000),
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null
    const nextUrl = parseNextLink(response.headers?.get?.('link'))

    return {
        nextUrl,
        ok: response.ok,
        payload,
        status: response.status,
    }
}

function resolveCodeScanningFailure(payload, status) {
    const message = String(payload?.message || '').trim() || `HTTP ${status}`

    if (status === 403 && /not enabled/i.test(message)) {
        return normalizeSourceStatus({ detail: message, kind: 'not-enabled', sourceName: 'github-api' })
    }

    if (status === 403) {
        return normalizeSourceStatus({ detail: message, kind: 'permission-denied', sourceName: 'github-api' })
    }

    if (status === 404) {
        return normalizeSourceStatus({ detail: message, kind: 'not-enabled', sourceName: 'github-api' })
    }

    return normalizeSourceStatus({ detail: message, kind: 'unavailable', sourceName: 'github-api' })
}

function resolveDependabotFailure(payload, status) {
    const message = String(payload?.message || '').trim() || `HTTP ${status}`

    if (status === 403) {
        return normalizeSourceStatus({ detail: message, kind: 'permission-denied', sourceName: 'github-api' })
    }

    if (status === 404) {
        return normalizeSourceStatus({ detail: message, kind: 'unavailable', sourceName: 'github-api' })
    }

    return normalizeSourceStatus({ detail: message, kind: 'unavailable', sourceName: 'github-api' })
}

async function fetchRepositoryAlerts({ owner, perPage, repo, token, endpoint, failureResolver, normalizer, states = ['open'] }) {
    if (!token) {
        return {
            alerts: [],
            sourceStatus: normalizeSourceStatus({
                detail: 'No GitHub token available; official repository alerts skipped.',
                kind: 'missing-token',
                sourceName: 'github-api',
            }),
        }
    }

    const alertMap = new Map()
    const stateCounts = []

    function partialFailure(failure, extra) {
        const partialAlerts = [...alertMap.values()]
        const detail = [
            failure.detail || 'GitHub API request failed',
            partialAlerts.length > 0 ? `kept ${partialAlerts.length} alerts read before failure` : null,
            extra || null,
        ].filter(Boolean).join('; ')

        return {
            alerts: partialAlerts,
            sourceStatus: normalizeSourceStatus({ ...failure, detail }),
        }
    }

    for (const state of states) {
        let stateCount = 0
        let nextUrl = buildAlertsUrl({ endpoint, owner, perPage, repo, state })

        while (nextUrl) {
            let result
            try {
                result = await fetchGitHubApiPage({ token, url: nextUrl })
            } catch (error) {
                return partialFailure({
                    detail: String(error?.message || 'GitHub API request failed'),
                    kind: 'unavailable',
                    sourceName: 'github-api',
                })
            }
            if (!result.ok) {
                return partialFailure(failureResolver(result.payload, result.status), `state=${state}`)
            }

            if (!Array.isArray(result.payload)) {
                return partialFailure({
                    detail: `Invalid response for state=${state}: expected an array`,
                    kind: 'invalid-response',
                    sourceName: 'github-api',
                })
            }

            const items = result.payload
            for (const item of items) {
                let normalized
                try {
                    normalized = normalizer(item)
                } catch (error) {
                    return partialFailure({
                        detail: `Invalid ${state} alert payload: ${error.message}`,
                        kind: 'invalid-response',
                        sourceName: 'github-api',
                    }, `state=${state}`)
                }
                alertMap.set(`${normalized.source}:${normalized.alertNumber}`, normalized)
            }
            stateCount += items.length

            // 防御 Link 头指向自身导致的死循环。
            nextUrl = result.nextUrl && result.nextUrl !== String(nextUrl) ? result.nextUrl : null
        }

        stateCounts.push(`${state}=${stateCount}`)
    }

    const alerts = [...alertMap.values()]
    const detail = states.length === 1
        ? `Fetched ${alerts.length} ${states[0]} alerts.`
        : `Fetched ${alerts.length} alerts (${stateCounts.join(', ')}).`

    return {
        alerts,
        sourceStatus: normalizeSourceStatus({
            detail,
            kind: 'ok',
            sourceName: 'github-api',
        }),
    }
}

function createPnpmAuditProcess(registry, repoRoot) {
    const auditArgs = ['audit', '--json', `--registry=${registry}`]

    if (process.platform === 'win32') {
        return spawn(process.env.comspec || 'cmd.exe', ['/d', '/s', '/c', `pnpm ${auditArgs.join(' ')}`], {
            cwd: repoRoot,
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
        })
    }

    return spawn('pnpm', auditArgs, {
        cwd: repoRoot,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
    })
}

async function loadPnpmAuditReport(registry, repoRoot) {
    return new Promise((resolve, reject) => {
        const child = createPnpmAuditProcess(registry, repoRoot)
        let stdout = ''
        let stderr = ''
        const timeout = setTimeout(() => {
            child.kill('SIGTERM')
            reject(new Error('pnpm audit timed out after 120s'))
        }, 120_000)

        const cleanup = () => clearTimeout(timeout)

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })
        child.on('error', (error) => {
            cleanup()
            reject(error)
        })
        child.on('close', () => {
            cleanup()

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

async function createDependabotFallbackAlerts(registry, repoRoot) {
    const report = await loadPnpmAuditReport(registry, repoRoot)
    const risks = parseAuditReport(report)

    return risks.map(mapAuditRiskToDependabotAlert)
}

async function loadInputSnapshot(inputPath) {
    const content = await readFile(path.resolve(inputPath), 'utf8')
    const payload = JSON.parse(content)
    const dependabotAlerts = payload?.dependabotAlerts
    const codeScanningAlerts = payload?.codeScanningAlerts

    if (!Array.isArray(dependabotAlerts) || !Array.isArray(codeScanningAlerts)) {
        throw new Error('Invalid snapshot: dependabotAlerts and codeScanningAlerts must be arrays')
    }

    const normalizeSnapshotStatus = (status) => normalizeSourceStatus(status || {
        detail: 'Snapshot missing source status',
        kind: 'missing-source-status',
        sourceName: 'input',
    })

    return {
        codeScanningAlerts: codeScanningAlerts.map(normalizeCodeScanningAlert),
        dependabotAlerts: dependabotAlerts.map(normalizeDependabotAlert),
        repository: payload?.repository || null,
        sourceStatuses: {
            codeScanning: normalizeSnapshotStatus(payload?.sourceStatuses?.codeScanning),
            dependabot: normalizeSnapshotStatus(payload?.sourceStatuses?.dependabot),
        },
    }
}

async function collectAlerts(args, repoRoot) {
    const repository = await resolveRepository(args, repoRoot)
    const token = await resolveGitHubToken(repoRoot)

    const [dependabotResult, codeScanningResult] = await Promise.all([
        fetchRepositoryAlerts({
            endpoint: 'dependabot/alerts',
            failureResolver: resolveDependabotFailure,
            normalizer: normalizeDependabotAlert,
            owner: repository.owner,
            perPage: args.perPage,
            repo: repository.repo,
            states: ALERT_STATES,
            token,
        }),
        fetchRepositoryAlerts({
            endpoint: 'code-scanning/alerts',
            failureResolver: resolveCodeScanningFailure,
            normalizer: normalizeCodeScanningAlert,
            owner: repository.owner,
            perPage: args.perPage,
            repo: repository.repo,
            states: ALERT_STATES,
            token,
        }),
    ])

    let dependabotAlerts = dependabotResult.alerts
    let dependabotStatus = dependabotResult.sourceStatus

    if (dependabotStatus.kind !== 'ok') {
        const partialAlerts = dependabotAlerts

        try {
            const fallbackAlerts = await createDependabotFallbackAlerts(args.registry, repoRoot)
            const merged = new Map()

            for (const alert of fallbackAlerts) {
                merged.set(`${alert.source}:${alert.alertNumber}`, alert)
            }
            for (const alert of partialAlerts) {
                merged.set(`${alert.source}:${alert.alertNumber}`, alert)
            }

            dependabotAlerts = [...merged.values()]

            if (dependabotStatus.kind === 'missing-token') {
                dependabotStatus = normalizeSourceStatus({
                    detail: `No GitHub token available; fell back to pnpm audit with ${fallbackAlerts.length} open risks.`,
                    kind: 'fallback',
                    sourceName: 'pnpm-audit',
                })
            } else {
                dependabotStatus = normalizeSourceStatus({
                    ...dependabotStatus,
                    detail: `${dependabotStatus.detail}${partialAlerts.length > 0 ? `; kept ${partialAlerts.length} partial alerts` : ''}; pnpm audit fallback supplied ${fallbackAlerts.length} open risks but does not cover dismissed state.`,
                })
            }
        } catch (error) {
            dependabotStatus = normalizeSourceStatus({
                ...dependabotStatus,
                detail: `${dependabotStatus.detail}; pnpm audit fallback failed: ${error.message}${partialAlerts.length > 0 ? `; kept ${partialAlerts.length} partial alerts` : ''}`,
            })
        }
    }

    return {
        codeScanningAlerts: codeScanningResult.alerts,
        dependabotAlerts,
        repository,
        sourceStatuses: {
            codeScanning: codeScanningResult.sourceStatus,
            dependabot: dependabotStatus,
        },
    }
}

function annotateAlerts(alerts) {
    return alerts.map((alert) => ({
        ...alert,
        classification: classifyAlert(alert),
    }))
}

function countByBucket(alerts) {
    return alerts.reduce((result, alert) => {
        result[alert.classification.bucket] = (result[alert.classification.bucket] || 0) + 1
        return result
    }, {
        defer: 0,
        'dismissed-critical': 0,
        'dismissed-high': 0,
        'immediate-fix': 0,
        observe: 0,
    })
}

function buildArtifactPaths(args, repoRoot) {
    const dateStr = new Date().toISOString().slice(0, 10)
    const baseDir = path.join(repoRoot, 'artifacts', 'review-gate')

    return {
        json: path.resolve(args.outputJson || path.join(baseDir, `${dateStr}-security-alerts.json`)),
        md: path.resolve(args.outputMd || path.join(baseDir, `${dateStr}-security-alerts.md`)),
    }
}

function printAlert(alert) {
    const label = alert.source === 'dependabot'
        ? `${alert.packageName || 'unknown-package'} ${alert.alertNumber}`
        : `${alert.ruleId || 'unknown-rule'} ${alert.alertNumber}`

    console.info(`- ${label} [${alert.severity}] -> ${alert.classification.bucket}`)
    console.info(`  reason: ${alert.classification.reason}`)
    if (alert.state && alert.state !== 'open') {
        console.info(`  state: ${alert.state}${alert.dismissedReason ? ` (${alert.dismissedReason})` : ''}`)
    }
    if (alert.htmlUrl) {
        console.info(`  url: ${alert.htmlUrl}`)
    }
    if (alert.locationPath) {
        console.info(`  location: ${alert.locationPath}`)
    }
    if (alert.patchedVersion) {
        console.info(`  patched: ${alert.patchedVersion}`)
    }
}

function buildMarkdownArtifact({ alerts, artifactPaths, effectiveBlocking, gateConclusion, repository, result, sourceStatuses, minSeverity, repoRoot, transitionMode }) {
    const counts = countByBucket(alerts)
    const openAlerts = alerts.filter((alert) => alert.state === 'open')
    const dismissedAlerts = alerts.filter((alert) => alert.state === 'dismissed')
    const dependabotStatus = sourceStatuses?.dependabot || { detail: '', kind: 'unknown', sourceName: 'unknown' }
    const codeScanningStatus = sourceStatuses?.codeScanning || { detail: '', kind: 'unknown', sourceName: 'unknown' }
    const effectiveItems = toArray(effectiveBlocking)
    const blockingItems = effectiveItems.length > 0 ? effectiveItems : toArray(result.blocking)
    const blockingAlerts = blockingItems.filter((item) => item?.classification)
    const blockingSourceFailures = blockingItems.filter((item) => !item?.classification)
    const sourceWarnings = toArray(result.sourceWarnings)
    const expiredExceptions = toArray(result.expiredExceptions)
    const staleExceptions = toArray(result.staleExceptions)
    const transitionBlocking = toArray(result.transitionBlocking)
    const sourceFailures = toArray(result.sourceFailures)
    const lines = [
        '# Review Gate Record — security-alerts',
        '',
        '- 范围: Dependabot / Code Scanning 安全告警闭环',
        '- 关联 Todo: 主线3 - Security 数据源接入与分类落点',
        '- 改动类型: 配置 / 脚本 / 安全治理',
        '- 风险等级: 高（发布前安全门禁）',
        `- 仓库: ${repository.owner}/${repository.repo}`,
        `- 记录路径: ${path.relative(repoRoot, artifactPaths.md)}`,
        `- 最低严重级别: ${minSeverity}`,
        `- 过渡模式: ${transitionMode ? 'on（dismissed / fail-closed 新检查仅报告）' : 'off'}`,
        `- 执行时间: ${new Date().toISOString()}`,
        '',
        '## 分类规则',
        '- 可立即修复: open Dependabot 且存在补丁版本；或 open 的高危 / 严重 Code Scanning 告警且不在测试路径。',
        '- 需延期: open 告警但当前缺少补丁、或属于需要业务 / 安全继续判断的低于 high 的告警；high+ 延期必须写入例外基线。',
        '- dismissed critical: 一律阻断，不允许任何豁免。',
        '- dismissed high+: 仅允许按 `false-positive` 登记（reason 必须写明原 dismiss 原因）；不得用 no-fix / hard-fix / allowlist 放行。',
        '- 仅观察: auto_dismissed / fixed / closed，或明确属于 tests 分类的 Code Scanning 告警。',
        '',
        '## 数据源状态',
        `- Dependabot: ${dependabotStatus.kind} (${dependabotStatus.sourceName}) - ${dependabotStatus.detail}`,
        `- Code Scanning: ${codeScanningStatus.kind} (${codeScanningStatus.sourceName}) - ${codeScanningStatus.detail}`,
        '',
        '## 已执行验证',
        '- 官方数据源优先读取 GitHub repository alerts API，并同时读取 open 与 dismissed 状态。',
        '- 仅缺少 Dependabot token 时，回退到 `pnpm audit --json --registry=https://registry.npmjs.org/` 并标记降级；权限 / 网络 / 响应异常保留 failure。',
        '- Code Scanning 若因权限或未启用不可访问，按 fail-closed 记录为阻断项；transition 模式下先降级为 warning。',
        '',
        '## Alerts Summary',
        `- alerts total: ${alerts.length}`,
        `- open total: ${openAlerts.length}`,
        `- dismissed total: ${dismissedAlerts.length}`,
        `- immediate-fix: ${counts['immediate-fix']}`,
        `- defer: ${counts.defer}`,
        `- dismissed-critical: ${counts['dismissed-critical']}`,
        `- dismissed-high: ${counts['dismissed-high']}`,
        `- observe: ${counts.observe}`,
        `- high+ relevant alerts: ${result.relevantAlerts.length}`,
        `- high+ deferred via baseline: ${result.excepted.length}`,
        `- high+ allowlisted via dependency-risk allowlist: ${toArray(result.allowlisted).length}`,
        `- high+ blocking alerts: ${blockingAlerts.length}`,
        `- transition findings: ${transitionBlocking.length}`,
        `- source failures: ${sourceFailures.length}`,
        '',
        '### blocker',
    ]

    if (blockingAlerts.length === 0 && blockingSourceFailures.length === 0) {
        lines.push('无')
    } else {
        blockingAlerts.forEach((alert, index) => {
            const subject = alert.source === 'dependabot'
                ? `${alert.packageName} (${alert.alertNumber})`
                : `${alert.ruleId} (${alert.alertNumber})`
            lines.push(`${index + 1}. ${subject} [${alert.severity}] -> ${alert.classification.bucket}`)
            lines.push(`   - 原因: ${alert.classification.reason}`)
            if (alert.state && alert.state !== 'open') {
                lines.push(`   - 状态: ${alert.state}${alert.dismissedReason ? ` (${alert.dismissedReason})` : ''}`)
            }
            if (alert.htmlUrl) {
                lines.push(`   - URL: ${alert.htmlUrl}`)
            }
        })
        blockingSourceFailures.forEach((failure) => {
            lines.push(`- 数据源 fail-closed: ${failure.source} -> ${failure.status.kind} (${failure.status.detail})`)
        })
    }

    lines.push('')
    lines.push('### warning')
    const allowlistedItems = toArray(result.allowlisted)
    const warningLines = []
    let seq = 0

    result.excepted.forEach((item) => {
        const subject = item.alert.source === 'dependabot'
            ? `${item.alert.packageName} (${item.alert.alertNumber})`
            : `${item.alert.ruleId} (${item.alert.alertNumber})`
        warningLines.push(`${++seq}. ${subject} [${item.alert.severity}] 通过例外基线放行`)
        warningLines.push(`   - category: ${item.exceptionEntry.category}`)
        warningLines.push(`   - reason: ${item.exceptionEntry.reason}`)
        warningLines.push(`   - review: ${item.exceptionEntry.review}`)
    })
    allowlistedItems.forEach((item) => {
        const subject = item.alert.source === 'dependabot'
            ? `${item.alert.packageName} (${item.alert.alertNumber})`
            : `${item.alert.ruleId} (${item.alert.alertNumber})`
        warningLines.push(`${++seq}. ${subject} [${item.alert.severity}] 通过 dependency-risk allowlist 豁免`)
        warningLines.push(`   - reason: ${item.allowlistEntry.reason}`)
        warningLines.push(`   - temporary exception: ${item.allowlistEntry.temporaryException}`)
    })
    sourceWarnings.forEach((warning) => {
        warningLines.push(`- 数据源降级: ${warning.source} -> ${warning.status.kind} (${warning.status.detail})`)
    })
    expiredExceptions.forEach((entry) => {
        warningLines.push(`- 例外已到期: ${entry.source}:${entry.alertNumber}（expiresAt=${entry.expiresAt}），不再放行。`)
    })
    staleExceptions.forEach((entry) => {
        warningLines.push(`- 例外未命中任何当前告警: ${entry.source}:${entry.alertNumber}，请复核并清理。`)
    })
    if (transitionMode) {
        transitionBlocking.forEach((item) => {
            const alert = item?.classification ? item : null
            if (alert) {
                const subject = alert.source === 'dependabot'
                    ? `${alert.packageName} (${alert.alertNumber})`
                    : `${alert.ruleId} (${alert.alertNumber})`
                warningLines.push(`- transition 待处理告警: ${subject} [${alert.severity}] -> ${alert.classification.bucket}`)
                return
            }
            warningLines.push(`- transition 数据源缺口: ${item.source} -> ${item.status.kind} (${item.status.detail})`)
        })
    }

    if (warningLines.length === 0) {
        lines.push('无')
    } else {
        lines.push(...warningLines)
    }

    lines.push('')
    lines.push('### suggest')
    lines.push('- 若需在 CI 中稳定读取 Dependabot 仓库级告警，建议提供具备 Dependabot alerts read 权限的专用令牌。')
    lines.push('- transition 模式只用于一个发布周期；到期后移除 `--transition-mode`，让 dismissed / fail-closed 检查恢复阻断。')
    lines.push('')
    lines.push('### Review Gate')
    lines.push(`- 结论: ${gateConclusion}`)
    lines.push(`- 失败原因或通过条件: ${gateConclusion === 'Pass' ? '当前 high+ 安全告警未形成未登记 blocker。' : '存在未登记的 high+ 安全告警 blocker，或数据源 fail-closed 触发。'}`)
    lines.push(`- 待复查问题: ${blockingAlerts.length + blockingSourceFailures.length}`)
    if (transitionMode && transitionBlocking.length > 0) {
        lines.push(`- transition 待处理: ${transitionBlocking.length}（本周期仅报告，不阻断）`)
    }
    lines.push('')
    lines.push('### 未覆盖边界')
    if (sourceFailures.length === 0) {
        lines.push('- 无')
    } else {
        sourceFailures.forEach((failure) => {
            lines.push(`- ${failure.source}: ${failure.status.kind} - ${failure.status.detail}`)
        })
    }
    lines.push('')
    lines.push('### 后续补跑计划')
    lines.push('- 每次发版前继续执行 `pnpm security:alerts`，同步刷新官方源与 fallback 证据。')
    lines.push(codeScanningStatus.kind === 'ok'
        ? '- 若出现新的 high+ Code Scanning 告警，优先修复或补录 false-positive / 延期基线。'
        : '- 配置具备安全告警读取权限的专用令牌后，补跑官方 Dependabot / Code Scanning 双源审计。')
    lines.push('')

    return lines.join('\n')
}

async function writeArtifacts({ alerts, artifactPaths, effectiveBlocking = [], gateConclusion, repository, result, sourceStatuses, minSeverity, repoRoot, transitionMode = false }) {
    await mkdir(path.dirname(artifactPaths.json), { recursive: true })
    await mkdir(path.dirname(artifactPaths.md), { recursive: true })

    const payload = {
        generatedAt: new Date().toISOString(),
        gateConclusion,
        minSeverity,
        repository,
        transitionMode,
        results: {
            allowlisted: toArray(result.allowlisted),
            blocking: result.blocking,
            dismissedBlocking: toArray(result.dismissedBlocking),
            effectiveBlocking: toArray(effectiveBlocking),
            excepted: result.excepted,
            expiredExceptions: toArray(result.expiredExceptions),
            observe: result.observe,
            relevantAlerts: result.relevantAlerts,
            sourceFailures: toArray(result.sourceFailures),
            sourceWarnings: toArray(result.sourceWarnings),
            staleExceptions: toArray(result.staleExceptions),
            transitionBlocking: toArray(result.transitionBlocking),
        },
        sourceStatuses,
        summary: countByBucket(alerts),
        alerts,
    }

    await writeFile(artifactPaths.json, JSON.stringify(payload, null, 2), 'utf8')
    await writeFile(artifactPaths.md, buildMarkdownArtifact({
        alerts,
        artifactPaths,
        effectiveBlocking,
        gateConclusion,
        minSeverity,
        repoRoot,
        repository,
        result,
        sourceStatuses,
        transitionMode,
    }), 'utf8')
}

export {
    annotateAlerts,
    buildArtifactPaths,
    classifyAlert,
    collectAlerts,
    countByBucket,
    evaluateSecurityAlertGate,
    fetchRepositoryAlerts,
    loadInputSnapshot,
    mapAuditRiskToDependabotAlert,
    matchAllowlistEntry,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
    normalizeSeverity,
    parseArgs,
    printAlert,
    readAllowlist,
    readExceptionEntries,
    resolveRepository,
    resolveGitHubToken,
    severityAtLeast,
    writeArtifacts,
}
