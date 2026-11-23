import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    evaluateDuplicateCodeGate,
    main as duplicateCodeMain,
    normalizeJscpdReport,
    parseArgs,
    previewFragment,
} from '@/scripts/review-gate/check-duplicate-code.mjs'

const baseTotal = {
    clones: 3,
    duplicatedLines: 28,
    duplicatedTokens: 165,
    lines: 120,
    newClones: 0,
    newDuplicatedLines: 0,
    percentage: 23.33,
    percentageTokens: 22.92,
    sources: 2,
    tokens: 720,
}

const duplicateEntry = {
    firstFile: { end: 21, name: 'a\\utils\\one.ts', start: 10 },
    format: undefined,
    fragment: `  ${'fragment '.repeat(30)}  `,
    lines: 12,
    secondFile: { endLoc: { line: 53 }, name: 'b/two.ts', startLoc: { line: 42 } },
    tokens: 75,
}

const originalArgv = process.argv
const originalExitCode = process.exitCode

const artifactPaths = (scope: string) => {
    const dateStr = new Date().toISOString().slice(0, 10)
    const base = resolve(process.cwd(), 'artifacts', 'review-gate', `${dateStr}-${scope}`)

    return { json: `${base}.json`, markdown: `${base}.md` }
}

afterEach(() => {
    process.argv = originalArgv
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
})

describe('check-duplicate-code branches', () => {
    it('sanitizes scope values and rejects unsupported modes', () => {
        expect(parseArgs(['node', 'script', '--scope=dup scope / one']).scope).toBe('dup-scope-one')
        expect(() => parseArgs(['node', 'script', '--mode=strict'])).toThrow('不支持的模式')
    })

    it('normalizes legacy entries, skips unusable format buckets and sorts by lines', () => {
        const report = normalizeJscpdReport({
            duplicates: [
                { ...duplicateEntry, lines: 4 },
                duplicateEntry,
            ],
            statistics: {
                detectionDate: '2026-11-23T00:00:00.000Z',
                formats: {
                    javascript: {
                        sources: {
                            'zero/clone.ts': { clones: 0, duplicatedLines: 0, percentage: 0 },
                        },
                    },
                    typescript: {
                        sources: 'not-an-object',
                    },
                },
                total: baseTotal,
            },
        })

        expect(report.topDuplicates).toHaveLength(2)
        expect(report.topDuplicates[0]).toMatchObject({ format: 'unknown', lines: 12 })
        expect(report.topDuplicates[0]?.firstFile.name).toBe('a/utils/one.ts')
        expect(report.topDuplicates[0]?.fragmentPreview.endsWith('...')).toBe(true)
        expect(report.topDuplicates[1]).toMatchObject({ lines: 4 })

        const tieReport = normalizeJscpdReport({
            duplicates: [
                { ...duplicateEntry, firstFile: { ...duplicateEntry.firstFile, name: 'z/tie.ts' }, lines: 7 },
                { ...duplicateEntry, firstFile: { ...duplicateEntry.firstFile, name: 'a/tie.ts' }, lines: 7 },
            ],
            statistics: { formats: {}, total: baseTotal },
        })

        expect(tieReport.topDuplicates.map((entry) => entry.firstFile.name)).toEqual(['a/tie.ts', 'z/tie.ts'])
        expect(report.topFiles).toEqual([])
    })

    it('sorts top files by duplicated lines, percentage and name', () => {
        const report = normalizeJscpdReport({
            statistics: {
                formats: {
                    typescript: {
                        sources: {
                            'b/file.ts': { clones: 1, duplicatedLines: 10, percentage: 5 },
                            'a/file.ts': { clones: 1, duplicatedLines: 10, percentage: 5 },
                            'c/file.ts': { clones: 1, duplicatedLines: 10, percentage: 9 },
                            'd/file.ts': { clones: 1, duplicatedLines: 20, percentage: 1 },
                        },
                    },
                },
                total: baseTotal,
            },
        })

        expect(report.topFiles.map((file) => file.name)).toEqual([
            'd/file.ts',
            'c/file.ts',
            'a/file.ts',
            'b/file.ts',
        ])
    })

    it('fails closed on malformed reports', () => {
        expect(() => normalizeJscpdReport(null)).toThrow('[duplicate-code-gate] jscpd report 缺失或格式无效')
        expect(() => normalizeJscpdReport({ duplicates: [], statistics: null })).toThrow('[duplicate-code-gate] statistics 缺失或格式无效')
        expect(() => normalizeJscpdReport({ duplicates: [{ firstFile: {} }], statistics: { total: baseTotal } })).toThrow('duplicates[0].secondFile')
    })

    it('keeps warn tolerance pass and marks warning level when exceeded', () => {
        const normalizedReport = normalizeJscpdReport({
            statistics: { formats: {}, total: baseTotal },
        })

        const withinTolerance = evaluateDuplicateCodeGate({
            baseline: { clones: 3, toleranceClones: 0, tolerancePercentage: 1, totalPercentage: 22.9 },
            mode: 'error',
            normalizedReport,
        })
        const exceededInWarn = evaluateDuplicateCodeGate({
            baseline: { clones: 1, toleranceClones: 0, tolerancePercentage: 0, totalPercentage: 10 },
            mode: 'warn',
            normalizedReport,
        })

        expect(withinTolerance).toMatchObject({ exceededBaseline: false, gateConclusion: 'Pass' })
        expect(exceededInWarn).toMatchObject({ exceededBaseline: true, gateConclusion: 'Pass' })
        expect(exceededInWarn.findings[0]).toMatchObject({ level: 'warning' })
    })

    it('trims, collapses and truncates fragment previews', () => {
        expect(previewFragment('  a   b  ')).toBe('a b')
        expect(previewFragment(undefined)).toBe('')
        expect(previewFragment('b'.repeat(300)).endsWith('...')).toBe(true)
    })

    it('marks the gate as Reject in error mode and renders the exceeded baseline section', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'duplicate-code-reject-'))
        const inputPath = join(directory, 'report.json')
        const configPath = join(directory, 'jscpd.json')
        const baselinePath = join(directory, 'baseline.json')
        const scope = `duplicate-code-reject-${Date.now()}`
        const writes = artifactPaths(scope)
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        await writeFile(inputPath, JSON.stringify({
            duplicates: [duplicateEntry],
            statistics: { detectionDate: '2026-11-23T00:00:00.000Z', formats: {}, total: baseTotal },
        }), 'utf8')
        await writeFile(configPath, JSON.stringify({ files: ['**/*.ts'], ignore: [], minLines: 5, minTokens: 40 }), 'utf8')
        await writeFile(baselinePath, JSON.stringify({ clones: 0, toleranceClones: 0, tolerancePercentage: 0, totalPercentage: 1 }), 'utf8')

        process.argv = [
            'node',
            'check-duplicate-code.mjs',
            `--input=${inputPath}`,
            `--config=${configPath}`,
            `--baseline=${baselinePath}`,
            '--mode=error',
            `--scope=${scope}`,
        ]
        process.exitCode = undefined

        try {
            await duplicateCodeMain()

            const markdown = await readFile(writes.markdown, 'utf8')

            expect(process.exitCode).toBe(1)
            expect(markdown).toContain('- 结论: 超过基线容差')
            expect(markdown).toContain('### blocker')
            expect(markdown).toContain('- 无命中重复文件。')
        } finally {
            await rm(directory, { force: true, recursive: true })
            await rm(writes.json, { force: true })
            await rm(writes.markdown, { force: true })
            infoSpy.mockRestore()
        }
    })

    it('runs jscpd through pnpm for a temporary scope and reports missing baseline', { timeout: 120000 }, async () => {
        const directory = await mkdtemp(join(tmpdir(), 'duplicate-code-jscpd-'))
        const configPath = join(directory, 'jscpd.json')
        const scope = `duplicate-code-jscpd-${Date.now()}`
        const writes = artifactPaths(scope)
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        await mkdir(join(directory, 'src'), { recursive: true })
        await writeFile(join(directory, 'src', 'a.ts'), [
            'export function first(items: string[]) {',
            '    return items.filter((item) => item.length > 2).map((item) => item.trim())',
            '}',
        ].join('\n'), 'utf8')
        await writeFile(join(directory, 'src', 'b.ts'), [
            'export function second(entries: string[]) {',
            '    return entries.filter((entry) => entry.length > 2).map((entry) => entry.trim())',
            '}',
        ].join('\n'), 'utf8')
        await writeFile(configPath, JSON.stringify({
            files: ['src/**/*.ts'],
            format: ['typescript'],
            ignore: [],
            minLines: 2,
            minTokens: 20,
            path: [join(directory, 'src')],
            reporters: ['json'],
        }), 'utf8')

        process.argv = [
            'node',
            'check-duplicate-code.mjs',
            `--config=${configPath}`,
            `--baseline=${join(directory, 'missing-baseline.json')}`,
            '--mode=warn',
            `--scope=${scope}`,
        ]
        process.exitCode = undefined

        try {
            await duplicateCodeMain()

            const artifact = JSON.parse(await readFile(writes.json, 'utf8'))

            expect(artifact.report.total.sources).toBeGreaterThan(0)
            expect(artifact.gate.hasBaseline).toBe(false)
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('baseline status: missing'))
        } finally {
            await rm(directory, { force: true, recursive: true })
            await rm(writes.json, { force: true })
            await rm(writes.markdown, { force: true })
            infoSpy.mockRestore()
        }
    })
})
