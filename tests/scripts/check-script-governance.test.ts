import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
    collectScriptGovernanceReport,
    extractScriptReferences,
    main,
    parseArgs,
    renderMarkdownReport,
} from '@/scripts/governance/check-script-governance.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

describe('check-script-governance', () => {
    it('parses CLI args with warn mode by default', () => {
        expect(parseArgs(['node', 'script.mjs'])).toMatchObject({
            mode: 'warn',
            output: null,
        })
    })

    it('normalizes relative script references without matching tests/scripts paths', () => {
        expect(extractScriptReferences([
            '- `tests/scripts/check-duplicate-code.test.ts`',
            '- `../../../scripts/governance/check-script-governance.mjs`',
            '- `scripts/governance/audit-simple-duplicates.mjs`',
        ].join('\n'))).toEqual([
            'scripts/governance/audit-simple-duplicates.mjs',
            'scripts/governance/check-script-governance.mjs',
        ])
    })

    it('does not treat non-script extensions like .json as script references', () => {
        expect(extractScriptReferences([
            '- `scripts/governance/data/primevue-components.json`',
            '- `scripts/governance/count-primevue-usage.mjs`',
        ].join('\n'))).toEqual([
            'scripts/governance/count-primevue-usage.mjs',
        ])
    })

    it('reports temporary residue, unreferenced scripts and documented missing entries', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'script-governance-'))

        await writeProjectFile(directory, 'package.json', JSON.stringify({
            scripts: {
                'governance:check:scripts': 'node scripts/governance/check-script-governance.mjs',
            },
        }, null, 2))
        await writeProjectFile(directory, 'scripts/governance/check-script-governance.mjs', 'export {}\n')
        await writeProjectFile(directory, 'scripts/manual/doc-only.mjs', 'export {}\n')
        await writeProjectFile(directory, 'scripts/temp/one-off.mjs', 'export {}\n')
        await writeProjectFile(directory, 'scripts/local/orphan.mjs', 'export {}\n')
        await writeProjectFile(directory, 'scripts/README.md', [
            '# Scripts',
            '',
            '- `scripts/manual/doc-only.mjs`',
        ].join('\n'))
        await writeProjectFile(directory, 'docs/guide/test.md', [
            '# Guide',
            '',
            '- `scripts/missing-script.mjs`',
        ].join('\n'))

        try {
            const report = await collectScriptGovernanceReport({
                projectRoot: directory,
                searchRoots: [
                    resolve(directory, 'package.json'),
                    resolve(directory, 'scripts', 'README.md'),
                    resolve(directory, 'docs'),
                ],
                scriptRoot: resolve(directory, 'scripts'),
            })

            expect(report.summary).toMatchObject({
                documentedMissingScripts: 1,
                documentedOnlyScripts: 1,
                scriptsWithStableEntry: 2,
                scriptsWithoutStableEntry: 1,
                temporaryScripts: 1,
                totalScripts: 4,
            })
            expect(report.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining([
                'documented-missing-script',
                'temporary-script-residue',
                'unreferenced-script',
            ]))
            expect(report.documentedMissingScripts[0]).toMatchObject({
                scriptPath: 'scripts/missing-script.mjs',
            })
            expect(report.documentedOnlyScripts[0]).toMatchObject({
                scriptPath: 'scripts/manual/doc-only.mjs',
            })
            expect(renderMarkdownReport(report)).toContain('Governance Baseline — script-governance')
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })
})

describe('check-script-governance 输出面', () => {
    const emptyReport = {
        directoryBuckets: [],
        documentedMissingScripts: [],
        documentedOnlyScripts: [],
        findings: [],
        generatedAt: '2026-11-18T00:00:00.000Z',
        scriptRoot: 'scripts',
        scripts: [],
        searchRoots: ['package.json'],
        summary: {
            documentedMissingScripts: 0,
            documentedOnlyScripts: 0,
            longTermScripts: 0,
            scriptsWithStableEntry: 0,
            scriptsWithoutStableEntry: 0,
            temporaryScripts: 0,
            totalScripts: 0,
        },
        temporaryScripts: [],
        unreferencedScripts: [],
    }

    it('空报告渲染三个「无」分支并可按需带产物路径', () => {
        const markdown = renderMarkdownReport(emptyReport)

        expect(markdown).toContain('## Findings')
        expect(markdown.match(/- 无/gu)).toHaveLength(3)
        expect(markdown).not.toContain('产物路径')

        expect(renderMarkdownReport(emptyReport, 'artifacts/governance/x.md')).toContain('产物路径: artifacts/governance/x.md')
    })

    it('非空报告渲染 findings / 仅文档引用 / 目录分桶', () => {
        const markdown = renderMarkdownReport({
            ...emptyReport,
            directoryBuckets: [{ directory: 'governance', scriptsWithStableEntry: 1, scriptsWithoutStableEntry: 0, temporaryScripts: 0, totalScripts: 1 }],
            documentedOnlyScripts: [{ scriptPath: 'scripts/manual/doc-only.mjs', stableSources: ['docs'] }],
            findings: [{ code: 'unreferenced-script', filePath: 'scripts/local/orphan.mjs', message: 'missing entry' }],
        })

        expect(markdown).toContain('[unreferenced-script] scripts/local/orphan.mjs: missing entry')
        expect(markdown).toContain('- scripts/manual/doc-only.mjs (docs)')
        expect(markdown).toContain('- governance: total=1, stable=1, missing=0, temp=0')
    })

    it('拒绝非法模式', () => {
        expect(() => parseArgs(['node', 'script.mjs', '--mode=strict'])).toThrow(/不支持的模式/u)
    })

    it('main 写出 JSON + Markdown 且 mode=error 只在有 findings 时置失败', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'script-governance-main-'))
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        try {
            const output = resolve(directory, 'report.json')
            const report = await main(['node', 'script.mjs', `--output=${output}`, '--mode=error'])

            expect(report.summary.totalScripts).toBeGreaterThan(0)
            const written = JSON.parse(await readFile(output, 'utf8'))
            expect(written.summary.totalScripts).toBe(report.summary.totalScripts)
            const markdown = await readFile(output.replace(/\.json$/u, '.md'), 'utf8')
            expect(markdown).toContain('Governance Baseline')
            expect(infoSpy).toHaveBeenCalledWith('Summary:')
            expect(process.exitCode).toBe(report.findings.length > 0 ? 1 : undefined)
        } finally {
            infoSpy.mockRestore()
            process.exitCode = originalExitCode
            await rm(directory, { force: true, recursive: true })
        }
    })
})
