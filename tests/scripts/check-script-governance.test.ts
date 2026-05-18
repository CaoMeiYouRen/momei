import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    collectScriptGovernanceReport,
    extractScriptReferences,
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
