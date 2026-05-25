import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    WORKFLOW_PRECHECK_PROFILES,
    buildEvidence,
    checkRequiredEnvironment,
    checkRequiredFiles,
    parseArgs,
    resolveWorkflowPrecheckProfile,
    runWorkflowPrecheck,
    summarizeWorkflowPrecheck,
} from '@/scripts/ci/workflow-precheck.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

describe('workflow-precheck', () => {
    it('parses CLI args with test profile by default', () => {
        expect(parseArgs(['node', 'workflow-precheck.mjs'])).toMatchObject({
            dryRun: false,
            mode: 'error',
            profile: 'test',
        })
    })

    it('exposes release, test and docker profiles', () => {
        expect(Object.keys(WORKFLOW_PRECHECK_PROFILES)).toEqual([
            'release',
            'test',
            'docker',
        ])

        expect(resolveWorkflowPrecheckProfile('release').steps.map((step) => step.label)).toEqual([
            'release critical files',
            'release environment',
            'security:audit-deps',
        ])
        expect(resolveWorkflowPrecheckProfile('docker').steps.at(-1)).toMatchObject({
            command: 'pnpm',
            label: 'security:audit-deps',
        })
    })

    it('reports missing required files relative to project root', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'workflow-precheck-files-'))

        try {
            await writeProjectFile(directory, 'package.json', '{}\n')

            const result = await checkRequiredFiles([
                'package.json',
                'scripts/security/check-dependency-risk.mjs',
            ], {
                projectRoot: directory,
            })

            expect(result.ok).toBe(false)
            expect(result.missingFiles).toEqual(['scripts/security/check-dependency-risk.mjs'])
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('reports missing or invalid environment requirements', () => {
        const result = checkRequiredEnvironment([
            {
                error: 'must be truthy in GitHub Actions',
                name: 'CI',
                validate(value: string | undefined) {
                    return value === 'true'
                },
            },
            {
                error: 'is required',
                name: 'GITHUB_SHA',
                validate(value: string | undefined) {
                    return Boolean(value)
                },
            },
        ], {
            env: {
                CI: 'false',
            },
        })

        expect(result.ok).toBe(false)
        expect(result.failures).toEqual([
            'CI: must be truthy in GitHub Actions',
            'GITHUB_SHA: is required',
        ])
    })

    it('marks required failures as blockers and dry-run as prepared', () => {
        const summary = summarizeWorkflowPrecheck({
            mode: 'error',
            results: [
                {
                    failureLevel: 'blocker',
                    label: 'release environment',
                    ok: false,
                    required: true,
                    skipped: false,
                },
                {
                    failureLevel: 'warning',
                    label: 'optional warning',
                    ok: false,
                    required: false,
                    skipped: false,
                },
            ],
        })

        const dryRunSummary = summarizeWorkflowPrecheck({
            dryRun: true,
            mode: 'error',
            results: [
                {
                    label: 'security:audit-deps',
                    ok: true,
                    required: true,
                    skipped: true,
                },
            ],
        })

        expect(summary).toMatchObject({
            blockers: ['release environment failed'],
            conclusion: 'Reject',
            warnings: ['optional warning failed'],
        })
        expect(dryRunSummary.conclusion).toBe('Prepared')
    })

    it('builds markdown evidence with command and conclusion details', () => {
        const profile = resolveWorkflowPrecheckProfile('test')
        const evidence = buildEvidence({
            artifactJsonPath: '/tmp/test.json',
            artifactMarkdownPath: '/tmp/test.md',
            dryRun: true,
            mode: 'warn',
            profile,
            results: [
                {
                    command: 'pnpm',
                    commandArgs: ['run', 'security:audit-deps'],
                    durationMs: 0,
                    failureLevel: 'blocker',
                    label: 'security:audit-deps',
                    ok: true,
                    output: 'Skipped in dry-run mode.',
                    required: true,
                    skipped: true,
                    type: 'command',
                },
            ],
            summary: {
                blockers: [],
                conclusion: 'Prepared',
                warnings: [],
            },
        })

        expect(evidence).toContain('Review Gate Record — workflow precheck (test)')
        expect(evidence).toContain('- 调度入口: pnpm run ci:precheck -- --profile=test')
        expect(evidence).toContain('- 结论: Prepared')
        expect(evidence).toContain('- finding level: blocker')
        expect(evidence).toContain('- 结果: DRY RUN')
    })

    it('runs docker profile in dry-run mode and writes artifact files', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'workflow-precheck-main-'))

        await writeProjectFile(directory, 'docs/reports/regression/current.md', [
            '# 当前回归窗口',
            '',
            '## 说明',
            '',
            '- 测试窗口。',
        ].join('\n'))

        const result = await runWorkflowPrecheck({
            dryRun: true,
            mode: 'warn',
            profile: 'docker',
            projectRoot: directory,
        })

        expect(result.summary.conclusion).toBe('Prepared')
        expect(result.results.every((item) => item.skipped)).toBe(true)
        await expect(access(result.artifacts.artifactMarkdownPath)).resolves.toBeUndefined()
        await expect(access(result.artifacts.artifactJsonPath)).resolves.toBeUndefined()

        const regressionWindow = await readFile(resolve(directory, 'docs/reports/regression/current.md'), 'utf8')
        expect(regressionWindow).toContain('workflow pre-check（docker，自动回填）')
        expect(regressionWindow).toContain('pnpm run ci:precheck -- --profile=docker --dry-run')

        await rm(result.artifacts.artifactMarkdownPath, { force: true })
        await rm(result.artifacts.artifactJsonPath, { force: true })
        await rm(directory, { force: true, recursive: true })
    })
})
