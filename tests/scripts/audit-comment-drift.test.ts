import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    collectCommentDriftReport,
    extractExportedFunctionCandidates,
    isDriftCandidateComment,
    isRestatementComment,
    isTodoLikeComment,
    parseArgs,
    renderMarkdownReport,
} from '@/scripts/governance/audit-comment-drift.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

describe('audit-comment-drift', () => {
    it('parses CLI args with default roots', () => {
        expect(parseArgs(['node', 'script.mjs'])).toMatchObject({
            output: 'artifacts/governance/comment-drift-latest.json',
        })
    })

    it('detects todo, restatement and drift comment heuristics', () => {
        expect(isTodoLikeComment('TODO: 后续补严谨实现')).toBe(true)
        expect(isRestatementComment('return status', 'return status')).toBe(true)
        expect(isDriftCandidateComment('set enabled to false', 'const enabled = true')).toBe(true)
    })

    it('finds missing comments on complex exported functions and comment candidates', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'comment-drift-'))

        await writeProjectFile(directory, 'utils/example.ts', [
            'export function buildPanel(items: string[]) {',
            '  const result: string[] = []',
            '  for (const item of items) {',
            '    if (item.startsWith("a")) {',
            '      result.push(item)',
            '    }',
            '    if (item.endsWith("z")) {',
            '      result.push(item.toUpperCase())',
            '    }',
            '    if (item.includes("-")) {',
            '      result.push(item.replaceAll("-", "_"))',
            '    }',
            '  }',
            '  return result',
            '}',
            '',
            '// TODO: 临时保留，后续补治理',
            'const todoMarker = true',
            '',
            '// return status',
            'return status',
            '',
            '// set enabled to false',
            'const enabled = true',
        ].join('\n'))

        try {
            const content = await (await import('node:fs/promises')).readFile(resolve(directory, 'utils/example.ts'), 'utf8')
            const exportedCandidates = extractExportedFunctionCandidates(content, 'utils/example.ts')

            expect(exportedCandidates).toHaveLength(1)

            const report = await collectCommentDriftReport({
                projectRoot: directory,
                roots: ['utils'],
            })

            expect(report.summary).toMatchObject({
                driftComments: 1,
                highComplexityMissingComments: 1,
                restatementComments: 1,
                todoComments: 1,
            })
            expect(report.highComplexityMissingComments[0]).toMatchObject({
                filePath: 'utils/example.ts',
                name: 'buildPanel',
            })
            expect(renderMarkdownReport(report)).toContain('Governance Baseline — comment-drift')
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })
})
