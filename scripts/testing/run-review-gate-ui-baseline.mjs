import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawn, execSync } from 'node:child_process'
import { getArgValue, getCliArgs, hasFlag, isDirectExecution } from '../shared/cli.mjs'

const repoRoot = process.cwd()
const authStatePath = path.join(repoRoot, 'tests', 'e2e', '.auth', 'admin.json')
const runCriticalScript = path.join(repoRoot, 'scripts', 'testing', 'run-e2e-critical.mjs')
const criticalProjects = ['chromium', 'firefox', 'webkit', 'mobile-chrome-critical', 'mobile-safari-critical']
const criticalScenarios = [
    'tests/e2e/auth-session-governance.e2e.test.ts',
    'tests/e2e/mobile-critical.e2e.test.ts',
]
const defaultBaseUrl = 'http://127.0.0.1:3001'

export function sanitizeScope(value) {
    return value
        .trim()
        .replace(/[^a-zA-Z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        || 'manual'
}

function getCurrentBranch() {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: repoRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
    } catch {
        return 'manual'
    }
}

export function formatTimestamp(date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hours = `${date.getHours()}`.padStart(2, '0')
    const minutes = `${date.getMinutes()}`.padStart(2, '0')
    const seconds = `${date.getSeconds()}`.padStart(2, '0')

    return `${year}${month}${day}-${hours}${minutes}${seconds}`
}

function quoteWindowsArg(arg) {
    if (/^[a-zA-Z0-9_./:=+-]+$/.test(arg)) {
        return arg
    }

    return `"${arg.replaceAll('"', '\\"')}"`
}

async function resetAuthState() {
    if (!existsSync(authStatePath)) {
        return
    }

    await rm(authStatePath, { force: true })
}

function uniq(items) {
    return [...new Set(items.filter(Boolean))]
}

function extractPlaywrightMatches(output) {
    const matches = []
    const patterns = [
        /\[(?<project>[^\]]+)\]\s+›\s+(?<file>tests\/e2e\/[^\s]+)\s+›\s+(?<title>.+)$/gm,
        /\d+\)\s+\[(?<project>[^\]]+)\]\s+›\s+(?<file>tests\/e2e\/[^\s]+)\s+›\s+(?<title>.+)$/gm,
    ]

    for (const pattern of patterns) {
        for (const match of output.matchAll(pattern)) {
            matches.push({
                project: match.groups?.project?.trim() ?? '',
                file: match.groups?.file?.trim() ?? '',
                title: match.groups?.title?.trim() ?? '',
            })
        }
    }

    return matches
}

function extractFirstErrorLine(output) {
    const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    return lines.find((line) => /^Error:/u.test(line) || /^Timed out/u.test(line) || /ERR_CONNECTION_REFUSED/u.test(line)) ?? null
}

export function classifyFailureOutput(output) {
    const normalizedOutput = output.trim()
    const lowerOutput = normalizedOutput.toLowerCase()
    const matches = extractPlaywrightMatches(normalizedOutput)
    const projects = uniq(matches.map((match) => match.project))
    const failingTests = uniq(matches.map((match) => `${match.file} :: ${match.title}`))
    const firstErrorLine = extractFirstErrorLine(normalizedOutput)
    const signals = []

    const isBootOrBuildFailure = [
        'building app before playwright',
        'missing build output',
        'source files changed after the last build',
        'webserver',
        'connection refused',
        'err_connection_refused',
        'could not connect',
        'timed out waiting',
        '.output/server/index.mjs',
    ].some((signal) => lowerOutput.includes(signal))

    if (isBootOrBuildFailure) {
        signals.push('boot-or-build')
        return {
            category: 'boot-or-build',
            categoryLabel: '服务启动 / 构建产物',
            failingProjects: projects,
            failingTests,
            firstErrorLine,
            matchingSignals: signals,
            probableCause: '测试服务未成功启动、.output 构建产物陈旧，或浏览器无法连到基线服务。',
            nextStep: '先检查 playwright.log 中的 build 判断、webServer 启动日志与 Connection refused，再决定是否重建 .output 并重跑。',
        }
    }

    const isAuthStateFailure = [
        'authentication state saved',
        'admin auth state not available',
        'login failed:',
        '/api/auth/sign-in/email',
        'storage state',
        '/login?redirect=',
        'tests/e2e/.auth/admin.json',
    ].some((signal) => lowerOutput.includes(signal))

    if (isAuthStateFailure) {
        signals.push('auth-state')
        return {
            category: 'auth-state',
            categoryLabel: '认证态 / 种子数据',
            failingProjects: projects,
            failingTests,
            firstErrorLine,
            matchingSignals: signals,
            probableCause: '测试管理员登录态未成功生成、认证 Cookie 失效，或 TEST_MODE 种子尚未就绪。',
            nextStep: '先检查 tests/e2e/global-setup.ts、tests/e2e/.auth/admin.json 的重建日志，以及登录或跳转断言是否提早落到 /login。',
        }
    }

    signals.push('scenario-assertion')
    return {
        category: 'scenario-assertion',
        categoryLabel: '具体场景断言',
        failingProjects: projects,
        failingTests,
        firstErrorLine,
        matchingSignals: signals,
        probableCause: '服务和认证态已基本就绪，失败集中在具体断言、页面行为或项目专属兼容性。',
        nextStep: '按 failing project 和 failing test 回到对应场景测试，结合失败附件、trace 与页面状态做定向复跑。',
    }
}

export function buildArtifactManifest({
    scope,
    timestamp,
    runDir,
    outputDir,
    htmlDir,
    logPath,
    evidencePath,
    status,
    branch,
    keepAuthState,
    attribution,
}) {
    return {
        schemaVersion: 1,
        scope,
        timestamp,
        status,
        reviewGateConclusion: status === 'pass' ? 'Pass' : 'Reject',
        command: `pnpm test:e2e:review-gate --scope=${scope}`,
        baselineCommand: 'pnpm test:e2e:critical',
        branch,
        platform: process.platform,
        nodeVersion: process.version,
        environment: {
            baseURL: process.env.NUXT_PUBLIC_SITE_URL || defaultBaseUrl,
            testMode: process.env.TEST_MODE || 'true',
            authStatePolicy: keepAuthState
                ? 'reuse-existing-auth-state'
                : 'reset-stale-auth-state-before-run',
            seedPolicy: 'tests/e2e/global-setup.ts waits for install seed and regenerates admin auth state for the current run',
            cleanupPolicy: 'run-scoped artifacts are isolated under artifacts/testing/ui-regression/<timestamp>-<scope>/; no post-run destructive cleanup is performed by this script',
            criticalProjects,
            criticalScenarios,
        },
        artifactNaming: {
            root: path.relative(repoRoot, runDir),
            evidence: path.relative(repoRoot, evidencePath),
            manifest: path.relative(repoRoot, path.join(runDir, 'manifest.json')),
            log: path.relative(repoRoot, logPath),
            testResults: path.relative(repoRoot, outputDir),
            htmlReport: path.relative(repoRoot, htmlDir),
        },
        attribution,
    }
}

async function runBaseline({ runDir, htmlDir, outputDir, scope }) {
    return new Promise((resolve, reject) => {
        const commandArgs = [
            runCriticalScript,
            `--output=${outputDir}`,
        ]
        const child = spawn(process.execPath, commandArgs, {
            cwd: repoRoot,
            env: {
                ...process.env,
                PLAYWRIGHT_HTML_OUTPUT_DIR: htmlDir,
                PLAYWRIGHT_HTML_OPEN: 'never',
                TEST_MODE: 'true',
                MOMEI_UI_BASELINE_SCOPE: scope,
            },
            stdio: ['inherit', 'pipe', 'pipe'],
        })

        const chunks = []

        child.stdout.on('data', (chunk) => {
            process.stdout.write(chunk)
            chunks.push(Buffer.from(chunk))
        })

        child.stderr.on('data', (chunk) => {
            process.stderr.write(chunk)
            chunks.push(Buffer.from(chunk))
        })

        child.on('error', reject)
        child.on('exit', async (code, signal) => {
            const logPath = path.join(runDir, 'playwright.log')
            const output = Buffer.concat(chunks).toString('utf8')
            await writeFile(logPath, output, 'utf8')

            resolve({
                ok: code === 0,
                code,
                signal,
                logPath,
                output,
            })
        })
    })
}

export function buildEvidence({ scope, timestamp, runDir, outputDir, htmlDir, logPath, evidencePath, manifestPath, ok, failureSummary, attribution }) {
    const relativeRunDir = path.relative(repoRoot, runDir)
    const relativeOutputDir = path.relative(repoRoot, outputDir)
    const relativeHtmlDir = path.relative(repoRoot, htmlDir)
    const relativeLogPath = path.relative(repoRoot, logPath)
    const relativeEvidencePath = path.relative(repoRoot, evidencePath)
    const relativeManifestPath = path.relative(repoRoot, manifestPath)

    const lines = [
        '# UI Real Environment Baseline Record',
        '',
        `- scope: ${scope}`,
        `- timestamp: ${timestamp}`,
        `- command: pnpm test:e2e:review-gate --scope=${scope}`,
        `- baseline script: pnpm test:e2e:critical`,
        `- auth state policy: run-scoped reuse via tests/e2e/.auth/admin.json; stale file removed before execution and recreated by tests/e2e/global-setup.ts`,
        `- seed policy: TEST_MODE=true with install seed handled by tests/e2e/global-setup.ts`,
        `- artifact root: ${relativeRunDir}`,
        `- evidence record: ${relativeEvidencePath}`,
        `- manifest: ${relativeManifestPath}`,
        `- test results: ${relativeOutputDir}`,
        `- html report: ${relativeHtmlDir}`,
        `- raw log: ${relativeLogPath}`,
        '',
        '## Artifact Naming Convention',
        '',
        `- run directory: artifacts/testing/ui-regression/${timestamp}-${scope}/`,
        '- canonical files: evidence.md, manifest.json, playwright.log, playwright-report/, test-results/',
        '- failure attachments: preserve Playwright-generated screenshots, traces, and videos under test-results/ without renaming them manually.',
        '',
        '## Layering',
        '',
        '- Stable script regression: use pnpm test:e2e:critical or pnpm test:e2e:review-gate as the reproducible baseline.',
        '- Exploratory validation: browser skills / manual UI probing may supplement diagnosis, but cannot replace script evidence in Review Gate.',
        '- Escalation: only upgrade to larger Playwright slices or full pnpm test:e2e when the critical baseline no longer covers the touched path.',
        '',
        '## Environment Preparation',
        '',
        '- auth state preparation: stale tests/e2e/.auth/admin.json is removed by default before the run unless --keep-auth-state is explicitly passed.',
        '- seed data preparation: tests/e2e/global-setup.ts waits for install seed readiness in TEST_MODE=true and regenerates admin auth state for the same run.',
        '- cleanup boundary: this script isolates artifacts per run directory and does not perform destructive post-run data cleanup beyond stale auth-state removal.',
        '',
        '## Covered Scenarios',
        '',
        '- Desktop auth session governance: Chromium / Firefox / WebKit.',
        '- Mobile admin editor smoke: mobile-chrome-critical / mobile-safari-critical.',
        '',
        '## Result Summary',
        '',
        `- result: ${ok ? 'Pass' : 'Reject'}`,
        `- failure summary: ${failureSummary}`,
        '',
        '## Failure Attribution',
        '',
        `- category: ${attribution.categoryLabel}`,
        `- probable cause: ${attribution.probableCause}`,
        `- next step: ${attribution.nextStep}`,
        `- failing projects: ${attribution.failingProjects.join(', ') || 'none'}`,
        `- failing tests: ${attribution.failingTests.join(' | ') || 'none'}`,
        `- first error line: ${attribution.firstErrorLine ?? 'none'}`,
        '- attribution order: build/service -> auth-state/seed -> scenario assertion.',
        '- auth-session-governance.e2e.test.ts focus: session refresh, logout sync, protected route redirect, blank draft language switch.',
        '- mobile-critical.e2e.test.ts focus: mobile login entry, admin navigation, editor title/content input.',
        '',
        '## Review Gate Notes',
        '',
        '- If this file records Pass, it is suitable as V3 browser evidence for the current critical baseline only.',
        '- If this file records Reject, do not substitute it with a skill-only exploratory result; fix or narrow the failure first.',
    ]

    return `${lines.join('\n')}\n`
}

async function main() {
    const cliArgs = getCliArgs()
    const now = new Date()
    const timestamp = formatTimestamp(now)
    const scope = sanitizeScope(getArgValue(cliArgs, '--scope') ?? getCurrentBranch())
    const runDir = path.join(repoRoot, 'artifacts', 'testing', 'ui-regression', `${timestamp}-${scope}`)
    const outputDir = path.join(runDir, 'test-results')
    const htmlDir = path.join(runDir, 'playwright-report')
    const evidencePath = path.join(runDir, 'evidence.md')
    const manifestPath = path.join(runDir, 'manifest.json')
    const keepAuthState = hasFlag(cliArgs, '--keep-auth-state')
    const branch = getCurrentBranch()

    await mkdir(runDir, { recursive: true })

    if (!keepAuthState) {
        await resetAuthState()
    }

    const result = await runBaseline({
        runDir,
        htmlDir,
        outputDir,
        scope,
    })

    const failureSummary = result.ok
        ? 'critical baseline passed; use artifacts under the run directory for Review Gate evidence.'
        : `critical baseline failed; inspect ${path.relative(repoRoot, result.logPath)} and Playwright attachments under ${path.relative(repoRoot, outputDir)}.`

    const attribution = result.ok
        ? {
            category: 'pass',
            categoryLabel: '无失败',
            failingProjects: [],
            failingTests: [],
            firstErrorLine: null,
            matchingSignals: [],
            probableCause: 'critical baseline passed without recorded browser failures.',
            nextStep: 'Use this run directory as the V3 baseline evidence for Review Gate.',
        }
        : classifyFailureOutput(result.output)

    const manifest = buildArtifactManifest({
        scope,
        timestamp,
        runDir,
        outputDir,
        htmlDir,
        logPath: result.logPath,
        evidencePath,
        status: result.ok ? 'pass' : 'fail',
        branch,
        keepAuthState,
        attribution,
    })

    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

    const evidence = buildEvidence({
        scope,
        timestamp,
        runDir,
        outputDir,
        htmlDir,
        logPath: result.logPath,
        evidencePath,
        manifestPath,
        ok: result.ok,
        failureSummary,
        attribution,
    })

    await writeFile(evidencePath, evidence, 'utf8')

    console.info(`\n[ui-baseline] Evidence: ${path.relative(repoRoot, evidencePath)}`)
    console.info(`[ui-baseline] Manifest: ${path.relative(repoRoot, manifestPath)}`)
    console.info(`[ui-baseline] Log: ${path.relative(repoRoot, result.logPath)}`)
    console.info(`[ui-baseline] HTML report: ${path.relative(repoRoot, htmlDir)}`)

    if (!result.ok) {
        process.exitCode = typeof result.code === 'number' ? result.code : 1
    }
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
