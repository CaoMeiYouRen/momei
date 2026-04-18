import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import {
    evaluateDuplicateCodeGate,
    main as duplicateCodeMain,
    normalizeJscpdReport,
    parseArgs,
    previewFragment,
} from '@/scripts/review-gate/check-duplicate-code.mjs'

const execFileAsync = promisify(execFile)

const sampleReport = {
    statistics: {
        detectionDate: '2026-04-01T00:00:00.000Z',
        formats: {
            typescript: {
                sources: {
                    'utils/shared/string-list.ts': {
                        lines: 40,
                        tokens: 220,
                        sources: 1,
                        clones: 2,
                        duplicatedLines: 16,
                        duplicatedTokens: 90,
                        percentage: 40,
                        percentageTokens: 40.91,
                        newDuplicatedLines: 0,
                        newClones: 0,
                    },
                    'server/services/setting-audit.ts': {
                        lines: 80,
                        tokens: 500,
                        sources: 1,
                        clones: 1,
                        duplicatedLines: 12,
                        duplicatedTokens: 75,
                        percentage: 15,
                        percentageTokens: 15,
                        newDuplicatedLines: 0,
                        newClones: 0,
                    },
                },
            },
        },
        total: {
            lines: 120,
            tokens: 720,
            sources: 2,
            clones: 3,
            duplicatedLines: 28,
            duplicatedTokens: 165,
            percentage: 23.33,
            percentageTokens: 22.92,
            newDuplicatedLines: 0,
            newClones: 0,
        },
    },
    duplicates: [
        {
            format: 'typescript',
            lines: 12,
            tokens: 75,
            fragment: 'const value = input.trim()\nreturn value === "" ? null : value',
            firstFile: {
                name: 'utils/shared/string-list.ts',
                start: 10,
                end: 21,
                startLoc: { line: 10, column: 1 },
                endLoc: { line: 21, column: 1 },
            },
            secondFile: {
                name: 'server/services/setting-audit.ts',
                start: 42,
                end: 53,
                startLoc: { line: 42, column: 1 },
                endLoc: { line: 53, column: 1 },
            },
        },
    ],
}

describe('check-duplicate-code', () => {
    it('parses CLI args with warn mode by default', () => {
        expect(parseArgs(['node', 'script'])).toMatchObject({
            baseline: '.github/review-gate/duplicate-code-baseline.json',
            config: '.jscpd.json',
            mode: 'warn',
            scope: 'duplicate-code',
        })
    })

    it('normalizes jscpd report totals and top duplicates', () => {
        const report = normalizeJscpdReport(sampleReport)

        expect(report.total).toMatchObject({
            clones: 3,
            duplicatedLines: 28,
            percentage: 23.33,
            sources: 2,
        })
        expect(report.topDuplicates[0]).toMatchObject({
            format: 'typescript',
            lines: 12,
            firstFile: {
                name: 'utils/shared/string-list.ts',
                startLine: 10,
            },
            secondFile: {
                name: 'server/services/setting-audit.ts',
                startLine: 42,
            },
        })
    })

    it('marks baseline regressions as blockers in error mode', () => {
        const evaluation = evaluateDuplicateCodeGate({
            baseline: {
                clones: 1,
                toleranceClones: 0,
                tolerancePercentage: 0.1,
                totalPercentage: 10,
            },
            mode: 'error',
            normalizedReport: normalizeJscpdReport(sampleReport),
        })

        expect(evaluation).toMatchObject({
            exceededBaseline: true,
            gateConclusion: 'Reject',
        })
        expect(evaluation.findings[0]).toMatchObject({
            level: 'blocker',
            title: '重复代码统计超过基线容差',
        })
    })

    it('keeps warn mode pass when baseline is missing', () => {
        const evaluation = evaluateDuplicateCodeGate({
            baseline: null,
            mode: 'warn',
            normalizedReport: normalizeJscpdReport(sampleReport),
        })

        expect(evaluation).toMatchObject({
            gateConclusion: 'Pass',
            hasBaseline: false,
        })
        expect(evaluation.findings[0]).toMatchObject({
            level: 'warning',
            title: '缺少重复代码基线',
        })
    })

    it('trims fragment previews to a stable length', () => {
        expect(previewFragment('a'.repeat(200))).toHaveLength(160)
    })

    it('fails closed for unsupported mode values at the CLI boundary', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'duplicate-code-gate-'))
        const inputPath = resolve(directory, 'report.json')

        await writeFile(inputPath, JSON.stringify(sampleReport), 'utf8')

        try {
            await expect(execFileAsync('pnpm', ['exec', 'node',
                resolve(process.cwd(), 'scripts/review-gate/check-duplicate-code.mjs'),
                `--input=${inputPath}`,
                '--mode=strict',
            ])).rejects.toMatchObject({
                code: 1,
                stderr: expect.stringContaining('不支持的模式'),
            })
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('runs the main flow with an input report and writes review-gate artifacts', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'duplicate-code-main-'))
        const inputPath = resolve(directory, 'report.json')
        const configPath = resolve(directory, 'jscpd.json')
        const baselinePath = resolve(directory, 'baseline.json')
        const scope = `duplicate-code-test-${Date.now()}`
        const dateStr = new Date().toISOString().slice(0, 10)
        const artifactJsonPath = resolve(process.cwd(), 'artifacts', 'review-gate', `${dateStr}-${scope}.json`)
        const artifactMarkdownPath = resolve(process.cwd(), 'artifacts', 'review-gate', `${dateStr}-${scope}.md`)
        const originalArgv = process.argv
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

        await writeFile(inputPath, JSON.stringify(sampleReport), 'utf8')
        await writeFile(configPath, JSON.stringify({
            files: ['server/**/*.ts'],
            ignore: ['tests/**'],
            minLines: 5,
            minTokens: 40,
            path: ['server'],
        }), 'utf8')
        await writeFile(baselinePath, JSON.stringify({
            clones: 10,
            toleranceClones: 1,
            tolerancePercentage: 1,
            totalPercentage: 40,
            updatedAt: '2026-04-01T00:00:00.000Z',
        }), 'utf8')

        process.argv = [
            process.argv[0] || 'node',
            'check-duplicate-code.mjs',
            `--input=${inputPath}`,
            `--config=${configPath}`,
            `--baseline=${baselinePath}`,
            '--mode=warn',
            `--scope=${scope}`,
        ]
        process.exitCode = undefined

        try {
            await duplicateCodeMain()

            const artifact = JSON.parse(await readFile(artifactJsonPath, 'utf8'))
            const markdown = await readFile(artifactMarkdownPath, 'utf8')

            expect(artifact.gate.gateConclusion).toBe('Pass')
            expect(artifact.report.totalDuplicates).toBe(1)
            expect(markdown).toContain('Review Gate Record — duplicate-code')
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate Code Gate'))
        } finally {
            process.argv = originalArgv
            process.exitCode = originalExitCode
            infoSpy.mockRestore()
            await rm(directory, { force: true, recursive: true })
            await rm(artifactJsonPath, { force: true })
            await rm(artifactMarkdownPath, { force: true })
        }
    })
})
