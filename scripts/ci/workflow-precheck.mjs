import { spawn } from 'node:child_process'
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const SEPARATOR = '─'.repeat(60)
const TRUTHY_ENVIRONMENT_VALUES = new Set(['1', 'true', 'yes'])

function isTruthyEnvironmentFlag(value) {
    return TRUTHY_ENVIRONMENT_VALUES.has(String(value || '').trim().toLowerCase())
}

function createNonEmptyEnvRequirement(name, error) {
    return {
        error,
        name,
        validate(value) {
            return typeof value === 'string' && value.trim().length > 0
        },
    }
}

function createTruthyEnvRequirement(name, error) {
    return {
        error,
        name,
        validate(value) {
            return isTruthyEnvironmentFlag(value)
        },
    }
}

function createFileCheckStep(label, files, options = {}) {
    return {
        files,
        label,
        required: options.required ?? true,
        type: 'file-check',
    }
}

function createEnvCheckStep(label, requirements, options = {}) {
    return {
        label,
        required: options.required ?? true,
        requirements,
        type: 'env-check',
    }
}

function createCommandStep(label, command, commandArgs, options = {}) {
    return {
        command,
        commandArgs,
        label,
        required: options.required ?? true,
        timeoutBudget: options.timeoutBudget ?? '10m',
        type: 'command',
    }
}

function dedupeItems(items) {
    return Array.from(new Set(items))
}

function getResultStatus(result) {
    if (result.skipped) {
        return 'DRY RUN'
    }

    return result.ok ? 'PASS' : 'FAIL'
}

function getResultIcon(result) {
    if (result.skipped) {
        return '○'
    }

    return result.ok ? '✓' : '✗'
}

function getOutputExcerpt(output) {
    const normalizedOutput = typeof output === 'string' ? output.trim() : ''

    if (!normalizedOutput) {
        return 'n/a'
    }

    return normalizedOutput
        .split(/\r?\n/u)
        .filter(Boolean)
        .slice(-8)
        .join('\n')
}

const COMMON_REQUIRED_FILES = [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'scripts/security/check-dependency-risk.mjs',
    '.github/security/dependency-risk-allowlist.json',
]

const COMMON_ENV_REQUIREMENTS = [
    createTruthyEnvRequirement('CI', 'must be truthy in GitHub Actions'),
    createTruthyEnvRequirement('GITHUB_ACTIONS', 'must be truthy in GitHub Actions'),
    createNonEmptyEnvRequirement('GITHUB_WORKFLOW', 'is required'),
    createNonEmptyEnvRequirement('GITHUB_SHA', 'is required'),
    createNonEmptyEnvRequirement('GITHUB_REF', 'is required'),
]

const RELEASE_PUBLISH_ENV_REQUIREMENTS = [
    createNonEmptyEnvRequirement('GITHUB_TOKEN', 'is required for release pre-check'),
    createNonEmptyEnvRequirement('DOCKER_USERNAME', 'is required for release pre-check'),
    createNonEmptyEnvRequirement('DOCKER_PASSWORD', 'is required for release pre-check'),
    createNonEmptyEnvRequirement('ALIYUN_USERNAME', 'is required for release pre-check'),
    createNonEmptyEnvRequirement('ALIYUN_PASSWORD', 'is required for release pre-check'),
]

const DOCKER_PUBLISH_ENV_REQUIREMENTS = [
    createNonEmptyEnvRequirement('GITHUB_TOKEN', 'is required for docker pre-check'),
    createNonEmptyEnvRequirement('DOCKER_USERNAME', 'is required for docker pre-check'),
    createNonEmptyEnvRequirement('DOCKER_PASSWORD', 'is required for docker pre-check'),
    createNonEmptyEnvRequirement('ALIYUN_USERNAME', 'is required for docker pre-check'),
    createNonEmptyEnvRequirement('ALIYUN_PASSWORD', 'is required for docker pre-check'),
]

export const WORKFLOW_PRECHECK_PROFILES = {
    release: {
        key: 'release',
        title: 'Release workflow pre-check',
        steps: [
            createFileCheckStep('release critical files', dedupeItems([
                ...COMMON_REQUIRED_FILES,
                'Dockerfile',
                'scripts/release/pre-release-check.mjs',
                'scripts/security/check-github-security-alerts.mjs',
            ])),
            createEnvCheckStep('release environment', [
                ...COMMON_ENV_REQUIREMENTS,
                ...RELEASE_PUBLISH_ENV_REQUIREMENTS,
            ]),
            createCommandStep('security:audit-deps', 'pnpm', ['run', 'security:audit-deps'], {
                timeoutBudget: '10m',
            }),
        ],
    },
    test: {
        key: 'test',
        title: 'Test workflow pre-check',
        steps: [
            createFileCheckStep('test critical files', dedupeItems([
                ...COMMON_REQUIRED_FILES,
                'playwright.config.ts',
                'scripts/perf/check-bundle-budget.mjs',
                'scripts/testing/run-e2e.mjs',
            ])),
            createEnvCheckStep('test environment', COMMON_ENV_REQUIREMENTS),
            createCommandStep('security:audit-deps', 'pnpm', ['run', 'security:audit-deps'], {
                timeoutBudget: '10m',
            }),
        ],
    },
    docker: {
        key: 'docker',
        title: 'Docker workflow pre-check',
        steps: [
            createFileCheckStep('docker critical files', dedupeItems([
                ...COMMON_REQUIRED_FILES,
                'Dockerfile',
                'scripts/testing/run-e2e.mjs',
            ])),
            createEnvCheckStep('docker environment', [
                ...COMMON_ENV_REQUIREMENTS,
                ...DOCKER_PUBLISH_ENV_REQUIREMENTS,
            ]),
            createCommandStep('security:audit-deps', 'pnpm', ['run', 'security:audit-deps'], {
                timeoutBudget: '10m',
            }),
        ],
    },
}

export function resolveWorkflowPrecheckProfile(profile) {
    const nextProfile = WORKFLOW_PRECHECK_PROFILES[profile]

    if (!nextProfile) {
        throw new Error(`Unsupported workflow pre-check profile: ${profile}`)
    }

    return nextProfile
}

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            dryRun: false,
            mode: 'error',
            profile: 'test',
        },
        flags: {
            '--dry-run': { key: 'dryRun' },
        },
        values: {
            '--mode': {
                key: 'mode',
                allowedValues: ['warn', 'error'],
                invalidMessage: (value) => `[workflow-precheck] 不支持的模式: ${value}`,
            },
            '--profile': {
                key: 'profile',
                allowedValues: Object.keys(WORKFLOW_PRECHECK_PROFILES),
                invalidMessage: (value) => `[workflow-precheck] 不支持的 profile: ${value}`,
            },
        },
    })
}

export async function checkRequiredFiles(files, { projectRoot = repoRoot } = {}) {
    const missingFiles = []
    const verifiedFiles = []

    for (const file of files) {
        try {
            await access(path.resolve(projectRoot, file))
            verifiedFiles.push(file)
        } catch {
            missingFiles.push(file)
        }
    }

    return {
        missingFiles,
        ok: missingFiles.length === 0,
        output: missingFiles.length === 0
            ? `Verified ${verifiedFiles.length} required files.`
            : `Missing required files: ${missingFiles.join(', ')}`,
        verifiedFiles,
    }
}

export function checkRequiredEnvironment(requirements, { env = process.env } = {}) {
    const failures = []
    const satisfied = []

    for (const requirement of requirements) {
        const value = env[requirement.name]

        if (!requirement.validate(value)) {
            failures.push(`${requirement.name}: ${requirement.error}`)
            continue
        }

        satisfied.push(requirement.name)
    }

    return {
        failures,
        ok: failures.length === 0,
        output: failures.length === 0
            ? `Verified ${satisfied.length} environment requirements.`
            : `Missing or invalid environment requirements: ${failures.join('; ')}`,
        satisfied,
    }
}

function runCommand(command, commandArgs, { env = process.env, projectRoot = repoRoot } = {}) {
    return new Promise((resolve) => {
        const start = Date.now()
        const isWin = process.platform === 'win32'
        const spawnCommand = isWin ? (process.env.comspec || 'cmd.exe') : command
        const spawnArgs = isWin
            ? ['/d', '/s', '/c', [command, ...commandArgs].join(' ')]
            : commandArgs
        const chunks = []
        const child = spawn(spawnCommand, spawnArgs, {
            cwd: projectRoot,
            env,
            stdio: ['inherit', 'pipe', 'pipe'],
        })

        child.stdout.on('data', (data) => {
            process.stdout.write(data)
            chunks.push(data)
        })

        child.stderr.on('data', (data) => {
            process.stderr.write(data)
            chunks.push(data)
        })

        child.on('error', (error) => {
            resolve({
                durationMs: Date.now() - start,
                ok: false,
                output: `运行错误: ${error.message}`,
            })
        })

        child.on('exit', (code) => {
            resolve({
                durationMs: Date.now() - start,
                ok: code === 0,
                output: Buffer.concat(chunks).toString('utf8').trim(),
            })
        })
    })
}

async function executeStep(step, options = {}) {
    const { dryRun = false, env = process.env, projectRoot = repoRoot } = options

    if (dryRun) {
        return {
            ...step,
            durationMs: 0,
            ok: true,
            output: 'Skipped in dry-run mode.',
            skipped: true,
        }
    }

    const start = Date.now()

    if (step.type === 'file-check') {
        const result = await checkRequiredFiles(step.files, { projectRoot })

        return {
            ...step,
            durationMs: Date.now() - start,
            missingFiles: result.missingFiles,
            ok: result.ok,
            output: result.output,
            skipped: false,
            verifiedFiles: result.verifiedFiles,
        }
    }

    if (step.type === 'env-check') {
        const result = checkRequiredEnvironment(step.requirements, { env })

        return {
            ...step,
            durationMs: Date.now() - start,
            failures: result.failures,
            ok: result.ok,
            output: result.output,
            satisfied: result.satisfied,
            skipped: false,
        }
    }

    if (step.type === 'command') {
        const result = await runCommand(step.command, step.commandArgs, { env, projectRoot })

        return {
            ...step,
            durationMs: result.durationMs,
            ok: result.ok,
            output: result.output,
            skipped: false,
        }
    }

    throw new Error(`Unsupported workflow pre-check step type: ${step.type}`)
}

export function summarizeWorkflowPrecheck({ dryRun = false, mode = 'error', results }) {
    const blockers = []
    const warnings = []

    for (const result of results) {
        if (result.ok || result.skipped) {
            continue
        }

        const summary = `${result.label} failed`

        if (result.required) {
            blockers.push(summary)
        } else {
            warnings.push(summary)
        }
    }

    let conclusion = 'Pass'

    if (dryRun) {
        conclusion = 'Prepared'
    } else if (blockers.length > 0 && mode === 'error') {
        conclusion = 'Reject'
    }

    return {
        blockers,
        conclusion,
        warnings,
    }
}

export function buildEvidence({
    artifactJsonPath,
    artifactMarkdownPath,
    dryRun = false,
    mode,
    profile,
    projectRoot = repoRoot,
    results,
    summary,
}) {
    const lines = [
        `# Review Gate Record — workflow precheck (${profile.key})`,
        '',
        `- 范围: ${profile.title}`,
        `- 调度入口: pnpm run ci:precheck -- --profile=${profile.key}`,
        '- 改动类型: CI / workflow / 守护脚本',
        '- 风险等级: 高（执行主体前的阻断入口）',
        `- 记录路径: ${path.relative(projectRoot, artifactMarkdownPath)}`,
        `- JSON 摘要: ${path.relative(projectRoot, artifactJsonPath)}`,
        `- 执行时间: ${new Date().toISOString()}`,
        `- 模式: ${mode}`,
        `- dry-run: ${dryRun ? '是' : '否'}`,
        '',
        '## Summary',
        '',
        `- 结论: ${summary.conclusion}`,
        `- blocker 数量: ${summary.blockers.length}`,
        `- warning 数量: ${summary.warnings.length}`,
        '',
        '## Step Results',
        '',
    ]

    for (const result of results) {
        const commandText = result.command ? [result.command, ...(result.commandArgs || [])].join(' ') : 'n/a'

        lines.push(`### ${result.label}`)
        lines.push(`- 结果: ${getResultStatus(result)}`)
        lines.push(`- required: ${result.required ? 'yes' : 'no'}`)
        lines.push(`- 类型: ${result.type}`)
        lines.push(`- 命令: ${commandText}`)
        lines.push(`- 耗时: ${(result.durationMs / 1000).toFixed(1)}s`)
        lines.push('')
        lines.push('```text')
        lines.push(getOutputExcerpt(result.output))
        lines.push('```')
        lines.push('')
    }

    lines.push('## Findings')
    lines.push('')
    lines.push('### blocker')

    if (summary.blockers.length === 0) {
        lines.push('- 无')
    } else {
        for (const blocker of summary.blockers) {
            lines.push(`- ${blocker}`)
        }
    }

    lines.push('')
    lines.push('### warning')

    if (summary.warnings.length === 0) {
        lines.push('- 无')
    } else {
        for (const warning of summary.warnings) {
            lines.push(`- ${warning}`)
        }
    }

    return lines.join('\n')
}

export async function runWorkflowPrecheck(options = {}) {
    const dryRun = options.dryRun ?? false
    const mode = options.mode ?? 'error'
    const profile = resolveWorkflowPrecheckProfile(options.profile ?? 'test')
    const env = options.env ?? process.env
    const projectRoot = options.projectRoot ?? repoRoot

    console.info(`\n${SEPARATOR}`)
    console.info(`  墨梅博客 - workflow pre-check (${profile.key})`)
    console.info(`  模式: ${mode.toUpperCase()}  |  dry-run: ${dryRun ? '是' : '否'}`)
    console.info(`  时间: ${new Date().toISOString()}`)
    console.info(`${SEPARATOR}\n`)

    const results = []

    for (const step of profile.steps) {
        console.info(`▶ [${step.label}]`)
        const result = await executeStep(step, {
            dryRun,
            env,
            projectRoot,
        })
        results.push(result)

        const duration = (result.durationMs / 1000).toFixed(1)
        console.info(`${getResultIcon(result)} ${getResultStatus(result)}  ${step.label}  (${duration}s)`)

        if (!dryRun && !result.ok && step.required && mode === 'error') {
            console.error(`[workflow-precheck] 致命错误: ${step.label} 失败，阻断后续检查。`)
            break
        }

        console.info('')
    }

    const summary = summarizeWorkflowPrecheck({
        dryRun,
        mode,
        results,
    })

    console.info(SEPARATOR)
    console.info('  workflow pre-check 汇总')
    console.info(SEPARATOR)

    for (const result of results) {
        const duration = (result.durationMs / 1000).toFixed(1)
        console.info(`  ${getResultIcon(result)} ${result.label.padEnd(32)} ${duration}s`)
    }

    console.info(SEPARATOR)
    console.info(`  结论: ${summary.conclusion}`)
    console.info(`  blockers: ${summary.blockers.length}  warnings: ${summary.warnings.length}`)
    console.info(SEPARATOR)

    const artifactDirectory = path.join(projectRoot, 'artifacts', 'review-gate')
    const dateStr = new Date().toISOString().slice(0, 10)
    const artifactMarkdownPath = path.join(artifactDirectory, `${dateStr}-ci-precheck-${profile.key}.md`)
    const artifactJsonPath = path.join(artifactDirectory, `${dateStr}-ci-precheck-${profile.key}.json`)
    const evidence = buildEvidence({
        artifactJsonPath,
        artifactMarkdownPath,
        dryRun,
        mode,
        profile,
        projectRoot,
        results,
        summary,
    })

    await mkdir(artifactDirectory, { recursive: true })
    await writeFile(artifactMarkdownPath, evidence, 'utf8')
    await writeFile(artifactJsonPath, JSON.stringify({
        dryRun,
        mode,
        profile: profile.key,
        results,
        summary,
    }, null, 2), 'utf8')

    return {
        artifacts: {
            artifactJsonPath,
            artifactMarkdownPath,
        },
        profile,
        results,
        summary,
    }
}

export async function main(argv = process.argv) {
    const options = parseArgs(argv)
    const result = await runWorkflowPrecheck(options)

    if (result.summary.conclusion === 'Reject') {
        process.exitCode = 1
    }

    return result
}

if (isDirectExecution(import.meta.url)) {
    await main()
}