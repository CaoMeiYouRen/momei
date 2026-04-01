import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawn, execSync } from 'node:child_process'

const repoRoot = process.cwd()
const authStatePath = path.join(repoRoot, 'tests', 'e2e', '.auth', 'admin.json')
const runCriticalScript = path.join(repoRoot, 'scripts', 'testing', 'run-e2e-critical.mjs')

function getArgValue(name) {
    const prefix = `${name}=`
    return process.argv.slice(2).find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null
}

function hasFlag(name) {
    return process.argv.slice(2).includes(name)
}

function sanitizeScope(value) {
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

function formatTimestamp(date) {
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

function buildEvidence({ scope, timestamp, runDir, outputDir, htmlDir, logPath, ok, failureSummary }) {
    const relativeRunDir = path.relative(repoRoot, runDir)
    const relativeOutputDir = path.relative(repoRoot, outputDir)
    const relativeHtmlDir = path.relative(repoRoot, htmlDir)
    const relativeLogPath = path.relative(repoRoot, logPath)

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
        `- test results: ${relativeOutputDir}`,
        `- html report: ${relativeHtmlDir}`,
        `- raw log: ${relativeLogPath}`,
        '',
        '## Layering',
        '',
        '- Stable script regression: use pnpm test:e2e:critical or pnpm test:e2e:review-gate as the reproducible baseline.',
        '- Exploratory validation: browser skills / manual UI probing may supplement diagnosis, but cannot replace script evidence in Review Gate.',
        '- Escalation: only upgrade to larger Playwright slices or full pnpm test:e2e when the critical baseline no longer covers the touched path.',
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
        '## Failure Attribution Template',
        '',
        '- Step 1: confirm whether the failure is boot/build related by checking playwright.log for missing .output rebuild, webServer startup failure, or Connection refused.',
        '- Step 2: confirm whether the failure is auth-state related by checking tests/e2e/global-setup.ts, tests/e2e/.auth/admin.json regeneration, and login redirect assertions.',
        '- Step 3: confirm whether the failure is scenario-specific:',
        '- auth-session-governance.e2e.test.ts: session refresh, logout sync, protected route redirect, blank draft language switch.',
        '- mobile-critical.e2e.test.ts: mobile login entry, admin navigation, editor title/content input.',
        '- Step 4: attach the failing project name, test title, first error line, and whether rerun on the same baseline reproduces.',
        '',
        '## Review Gate Notes',
        '',
        '- If this file records Pass, it is suitable as V3 browser evidence for the current critical baseline only.',
        '- If this file records Reject, do not substitute it with a skill-only exploratory result; fix or narrow the failure first.',
    ]

    return `${lines.join('\n')}\n`
}

async function main() {
    const now = new Date()
    const timestamp = formatTimestamp(now)
    const scope = sanitizeScope(getArgValue('--scope') ?? getCurrentBranch())
    const runDir = path.join(repoRoot, 'artifacts', 'testing', 'ui-regression', `${timestamp}-${scope}`)
    const outputDir = path.join(runDir, 'test-results')
    const htmlDir = path.join(runDir, 'playwright-report')
    const evidencePath = path.join(runDir, 'evidence.md')

    await mkdir(runDir, { recursive: true })

    if (!hasFlag('--keep-auth-state')) {
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

    const evidence = buildEvidence({
        scope,
        timestamp,
        runDir,
        outputDir,
        htmlDir,
        logPath: result.logPath,
        ok: result.ok,
        failureSummary,
    })

    await writeFile(evidencePath, evidence, 'utf8')

    console.info(`\n[ui-baseline] Evidence: ${path.relative(repoRoot, evidencePath)}`)
    console.info(`[ui-baseline] Log: ${path.relative(repoRoot, result.logPath)}`)
    console.info(`[ui-baseline] HTML report: ${path.relative(repoRoot, htmlDir)}`)

    if (!result.ok) {
        process.exitCode = typeof result.code === 'number' ? result.code : 1
    }
}

await main()
