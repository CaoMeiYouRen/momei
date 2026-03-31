import { execFile, spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { assertSupportedAuditReport, parseAuditReport } from './check-dependency-risk.mjs'

const execFileAsync = promisify(execFile)

const DEFAULTS = {
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
}

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

function normalizePatchedVersionValue(value) {
    const normalized = String(value || '').trim().toLowerCase()
    if (!normalized || UNPATCHED_VERSION_SENTINELS.has(normalized)) {
        return null
    }
    return String(value).trim()
}

function parseArgs(argv) {
    const args = { ...DEFAULTS }

    for (let index = 2; index < argv.length; index++) {
        const item = argv[index]
        if (item.startsWith('--exceptions=')) {
            args.exceptions = item.slice('--exceptions='.length)
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
        if (item.startsWith('--output-json=')) {
            args.outputJson = item.slice('--output-json='.length)
            continue
        }
        if (item.startsWith('--output-md=')) {
            args.outputMd = item.slice('--output-md='.length)
            continue
        }
        if (item.startsWith('--owner=')) {
            args.owner = item.slice('--owner='.length)
            continue
        }
        if (item.startsWith('--per-page=')) {
            args.perPage = Number(item.slice('--per-page='.length))
            continue
        }
        if (item.startsWith('--registry=')) {
            args.registry = item.slice('--registry='.length)
            continue
        }
        if (item.startsWith('--repo=')) {
            args.repo = item.slice('--repo='.length)
            continue
        }
        throw new Error(`Unsupported argument: ${item}`)
    }

    if (args.mode !== 'warn' && args.mode !== 'error') {
        throw new Error(`Unsupported mode: ${args.mode}`)
    }

    if (!Number.isInteger(args.perPage) || args.perPage <= 0 || args.perPage > 100) {
        throw new Error(`Unsupported per-page value: ${args.perPage}`)
    }

    args.minSeverity = normalizeSeverity(args.minSeverity)
    return args
}

function normalizeExceptionEntries(raw) {
    const entries = Array.isArray(raw?.entries) ? raw.entries : []

    return entries.map((entry, index) => {
        const source = String(entry?.source || '').trim()
        const alertNumber = String(entry?.alertNumber || '').trim()
        const classification = String(entry?.classification || '').trim()
        const reason = String(entry?.reason || '').trim()
        const temporaryException = String(entry?.temporaryException || '').trim()
        const severity = entry?.severity ? normalizeSeverity(entry.severity) : null

        if (!source || !alertNumber || classification !== 'defer' || !reason || !temporaryException) {
            throw new Error(`Invalid security alert exception entry at index ${index}`)
        }

        return {
            alertNumber,
            classification,
            reason,
            severity,
            source,
            temporaryException,
        }
    })
}

async function readExceptionEntries(filePath) {
    const content = await readFile(path.resolve(filePath), 'utf8')
    return normalizeExceptionEntries(JSON.parse(content))
}

async function resolveGitHubToken(repoRoot) {
    const envToken = process.env.SECURITY_ALERTS_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN
    if (envToken) {
        return envToken.trim()
    }

    try {
        const { stdout } = await execFileAsync('gh', ['auth', 'token'], { cwd: repoRoot })
        const token = stdout.trim()
        return token || null
    } catch {
        return null
    }
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

function normalizeDependabotAlert(alert) {
    const advisory = alert?.security_advisory || {}
    const vulnerability = alert?.security_vulnerability || {}
    const firstPatchedVersion = vulnerability?.first_patched_version?.identifier
        || toArray(advisory.vulnerabilities)
            .map((item) => item?.first_patched_version?.identifier)
            .find(Boolean)
            || null

    return {
        alertNumber: String(alert?.number ?? 'unknown'),
        classification: null,
        createdAt: alert?.created_at || null,
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
        alertNumber: `audit:${risk.packageName}:${risk.advisoryId}`,
        classification: null,
        createdAt: null,
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

    return alert.classifications.includes('test') || alert.classifications.includes('tests')
}

function classifyAlert(alert) {
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

function evaluateSecurityAlertGate({ alerts, exceptionEntries, minSeverity }) {
    const relevantAlerts = alerts.filter((alert) => severityAtLeast(alert.severity, minSeverity))
    const blocking = []
    const excepted = []
    const observe = []

    relevantAlerts.forEach((alert) => {
        if (alert.classification.bucket === 'observe') {
            observe.push(alert)
            return
        }

        if (alert.classification.bucket === 'defer') {
            const exceptionEntry = exceptionEntries.find((entry) => entry.source === alert.source && entry.alertNumber === alert.alertNumber)
            if (exceptionEntry) {
                excepted.push({ alert, exceptionEntry })
                return
            }
        }

        blocking.push(alert)
    })

    return {
        blocking,
        excepted,
        observe,
        relevantAlerts,
    }
}

function normalizeSourceStatus(status) {
    return {
        detail: status?.detail || '',
        kind: status?.kind || 'unknown',
        sourceName: status?.sourceName || 'unknown',
    }
}

async function fetchGitHubApiPage({ owner, perPage, repo, token, endpoint, page }) {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/${endpoint}`)
    url.searchParams.set('state', 'open')
    url.searchParams.set('per_page', String(perPage))
    url.searchParams.set('page', String(page))

    const response = await fetch(url, {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2026-03-10',
        },
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null

    return {
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

async function fetchRepositoryAlerts({ owner, perPage, repo, token, endpoint, failureResolver, normalizer }) {
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

    const alerts = []
    let page = 1

    while (true) {
        const result = await fetchGitHubApiPage({ endpoint, owner, page, perPage, repo, token })
        if (!result.ok) {
            return {
                alerts: [],
                sourceStatus: failureResolver(result.payload, result.status),
            }
        }

        const items = toArray(result.payload)
        alerts.push(...items.map(normalizer))

        if (items.length < perPage) {
            return {
                alerts,
                sourceStatus: normalizeSourceStatus({
                    detail: `Fetched ${alerts.length} open alerts.`,
                    kind: 'ok',
                    sourceName: 'github-api',
                }),
            }
        }

        page += 1
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

async function createDependabotFallbackAlerts(registry, repoRoot) {
    const report = await loadPnpmAuditReport(registry, repoRoot)
    const risks = parseAuditReport(report)

    return risks.map(mapAuditRiskToDependabotAlert)
}

async function loadInputSnapshot(inputPath) {
    const content = await readFile(path.resolve(inputPath), 'utf8')
    const payload = JSON.parse(content)

    return {
        codeScanningAlerts: toArray(payload?.codeScanningAlerts).map(normalizeCodeScanningAlert),
        dependabotAlerts: toArray(payload?.dependabotAlerts).map(normalizeDependabotAlert),
        repository: payload?.repository || null,
        sourceStatuses: {
            codeScanning: normalizeSourceStatus(payload?.sourceStatuses?.codeScanning || { kind: 'ok', sourceName: 'input' }),
            dependabot: normalizeSourceStatus(payload?.sourceStatuses?.dependabot || { kind: 'ok', sourceName: 'input' }),
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
            token,
        }),
        fetchRepositoryAlerts({
            endpoint: 'code-scanning/alerts',
            failureResolver: resolveCodeScanningFailure,
            normalizer: normalizeCodeScanningAlert,
            owner: repository.owner,
            perPage: args.perPage,
            repo: repository.repo,
            token,
        }),
    ])

    let dependabotAlerts = dependabotResult.alerts
    let dependabotStatus = dependabotResult.sourceStatus

    if (dependabotStatus.kind !== 'ok') {
        dependabotAlerts = await createDependabotFallbackAlerts(args.registry, repoRoot)
        dependabotStatus = normalizeSourceStatus({
            detail: `GitHub API unavailable (${dependabotResult.sourceStatus.kind}); fell back to pnpm audit with ${dependabotAlerts.length} open risks.`,
            kind: 'fallback',
            sourceName: 'pnpm-audit',
        })
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
        const key = alert.classification.bucket
        result[key] = (result[key] || 0) + 1
        return result
    }, {
        defer: 0,
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

function buildMarkdownArtifact({ alerts, artifactPaths, gateConclusion, repository, result, sourceStatuses, minSeverity, repoRoot }) {
    const counts = countByBucket(alerts)
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
        `- 执行时间: ${new Date().toISOString()}`,
        '',
        '## 分类规则',
        '- 可立即修复: open Dependabot 且存在补丁版本；或 open 的高危 / 严重 Code Scanning 告警且不在测试路径。',
        '- 需延期: open 告警但当前缺少补丁、或属于需要业务 / 安全继续判断的低于 high 的告警；high+ 延期必须写入例外基线。',
        '- 仅观察: fixed / dismissed / auto_dismissed / closed，或明确属于 tests 分类的 Code Scanning 告警。',
        '',
        '## 数据源状态',
        `- Dependabot: ${sourceStatuses.dependabot.kind} (${sourceStatuses.dependabot.sourceName}) - ${sourceStatuses.dependabot.detail}`,
        `- Code Scanning: ${sourceStatuses.codeScanning.kind} (${sourceStatuses.codeScanning.sourceName}) - ${sourceStatuses.codeScanning.detail}`,
        '',
        '## 已执行验证',
        '- 官方数据源优先读取 GitHub repository alerts API。',
        '- Dependabot 仓库级接口不可用时，回退到 `pnpm audit --json --registry=https://registry.npmjs.org/`。',
        '- Code Scanning 若因权限或未启用不可访问，仅记录证据与回退限制，不伪造替代数据源。',
        '',
        '## Alerts Summary',
        `- open alerts total: ${alerts.length}`,
        `- immediate-fix: ${counts['immediate-fix']}`,
        `- defer: ${counts.defer}`,
        `- observe: ${counts.observe}`,
        `- high+ relevant alerts: ${result.relevantAlerts.length}`,
        `- high+ deferred via baseline: ${result.excepted.length}`,
        `- high+ blocking alerts: ${result.blocking.length}`,
        '',
        '### blocker',
    ]

    if (result.blocking.length === 0) {
        lines.push('无')
    } else {
        result.blocking.forEach((alert, index) => {
            const subject = alert.source === 'dependabot'
                ? `${alert.packageName} (${alert.alertNumber})`
                : `${alert.ruleId} (${alert.alertNumber})`
            lines.push(`${index + 1}. ${subject} [${alert.severity}] -> ${alert.classification.bucket}`)
            lines.push(`   - 原因: ${alert.classification.reason}`)
            if (alert.htmlUrl) {
                lines.push(`   - URL: ${alert.htmlUrl}`)
            }
        })
    }

    lines.push('')
    lines.push('### warning')
    if (result.excepted.length === 0 && sourceStatuses.codeScanning.kind === 'ok') {
        lines.push('无')
    } else {
        result.excepted.forEach((item, index) => {
            const subject = item.alert.source === 'dependabot'
                ? `${item.alert.packageName} (${item.alert.alertNumber})`
                : `${item.alert.ruleId} (${item.alert.alertNumber})`
            lines.push(`${index + 1}. ${subject} [${item.alert.severity}] 通过延期基线放行`)
            lines.push(`   - reason: ${item.exceptionEntry.reason}`)
            lines.push(`   - temporary exception: ${item.exceptionEntry.temporaryException}`)
        })
        if (sourceStatuses.codeScanning.kind !== 'ok') {
            lines.push(`- Code Scanning 官方源不可直接访问: ${sourceStatuses.codeScanning.detail}`)
        }
    }

    lines.push('')
    lines.push('### suggest')
    lines.push('- 若需在 CI 中稳定读取 Dependabot 仓库级告警，建议提供具备 Dependabot alerts read 权限的专用令牌。')
    lines.push('')
    lines.push('### Review Gate')
    lines.push(`- 结论: ${gateConclusion}`)
    lines.push(`- 失败原因或通过条件: ${gateConclusion === 'Pass' ? '当前 high+ 安全告警未形成未登记 blocker。' : '存在未登记的 high+ 安全告警 blocker。'}`)
    lines.push(`- 待复查问题: ${result.blocking.length}`)
    lines.push('')
    lines.push('### 未覆盖边界')
    lines.push(sourceStatuses.codeScanning.kind === 'ok'
        ? '- 无'
        : '- 当前环境未拿到可直接读取仓库级 Code Scanning alerts 的权限，证据中仅保留限制说明。')
    lines.push('')
    lines.push('### 后续补跑计划')
    lines.push('- 每次发版前继续执行 `pnpm security:alerts`，同步刷新官方源与 fallback 证据。')
    lines.push(sourceStatuses.codeScanning.kind === 'ok'
        ? '- 若出现新的 high+ Code Scanning 告警，优先修复或补录延期基线。'
        : '- 配置具备安全告警读取权限的专用令牌后，补跑官方 Dependabot / Code Scanning 双源审计。')
    lines.push('')

    return lines.join('\n')
}

async function writeArtifacts({ alerts, artifactPaths, gateConclusion, repository, result, sourceStatuses, minSeverity, repoRoot }) {
    await mkdir(path.dirname(artifactPaths.json), { recursive: true })
    await mkdir(path.dirname(artifactPaths.md), { recursive: true })

    const payload = {
        generatedAt: new Date().toISOString(),
        gateConclusion,
        minSeverity,
        repository,
        results: {
            blocking: result.blocking,
            excepted: result.excepted,
            observe: result.observe,
            relevantAlerts: result.relevantAlerts,
        },
        sourceStatuses,
        summary: countByBucket(alerts),
        alerts,
    }

    await writeFile(artifactPaths.json, JSON.stringify(payload, null, 2), 'utf8')
    await writeFile(artifactPaths.md, buildMarkdownArtifact({
        alerts,
        artifactPaths,
        gateConclusion,
        minSeverity,
        repoRoot,
        repository,
        result,
        sourceStatuses,
    }), 'utf8')
}

export {
    annotateAlerts,
    buildArtifactPaths,
    classifyAlert,
    collectAlerts,
    countByBucket,
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
    resolveRepository,
    severityAtLeast,
    writeArtifacts,
}
