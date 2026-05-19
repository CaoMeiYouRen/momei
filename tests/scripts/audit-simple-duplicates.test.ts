import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    buildNearNameSignature,
    collectSimpleDuplicateReport,
    extractDeclarations,
    parseArgs,
    renderMarkdownReport,
} from '@/scripts/governance/audit-simple-duplicates.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

describe('audit-simple-duplicates', () => {
    it('parses CLI args and keeps default roots', () => {
        expect(parseArgs(['node', 'script.mjs']).roots).toEqual(expect.arrayContaining([
            'components',
            'server',
            'utils',
        ]))
    })

    it('extracts declarations from source text', () => {
        const declarations = extractDeclarations([
            'function normalizeStatus() {',
            '  return true',
            '}',
            'const createStatusSummary = () => true',
            'export type PublicPayload = string',
            'interface LocalPayload {',
            '  value: string',
            '}',
        ].join('\n'), 'utils/example.ts')

        expect(declarations.functions).toHaveLength(2)
        expect(declarations.types).toHaveLength(2)
    })

    it('ignores multi-line type imports when extracting declarations', () => {
        const declarations = extractDeclarations([
            'import {',
            '  type ImportedPayload,',
            '  normalizeStatus as normalizeImportedStatus,',
            '} from \'./shared\'',
            'export type PublicPayload = string',
            'interface LocalPayload {',
            '  value: string',
            '}',
        ].join('\n'), 'utils/example.ts')
        const declarationNames = (declarations.types as { name: string }[]).map((item) => item.name)

        expect(declarationNames).toEqual([
            'PublicPayload',
            'LocalPayload',
        ])
    })

    it('ignores multi-line type imports when building same-name type candidates', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'simple-duplicates-imports-'))

        await writeProjectFile(directory, 'utils/one.ts', [
            'import {',
            '  type DistributionMaterialBundle,',
            '} from \'./shared\'',
            'type LocalPayload = { value: string }',
        ].join('\n'))
        await writeProjectFile(directory, 'utils/two.ts', [
            'import {',
            '  type DistributionMaterialBundle,',
            '} from \'./shared\'',
            'interface RemotePayload {',
            '  value: string',
            '}',
        ].join('\n'))

        try {
            const report = await collectSimpleDuplicateReport({
                projectRoot: directory,
                roots: ['utils'],
            })

            expect(report.summary.sameNameTypeCandidates).toBe(0)
            expect(report.sameNameTypes).toEqual([])
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('builds same-name and near-name candidate groups', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'simple-duplicates-'))

        await writeProjectFile(directory, 'app.vue', [
            '<script setup lang="ts">',
            'const resolveStatusSummary = () => true',
            '</script>',
        ].join('\n'))
        await writeProjectFile(directory, 'utils/one.ts', [
            'function normalizeStatus() {',
            '  return true',
            '}',
            'type LocalPayload = { value: string }',
            'function buildStatusSummary() {',
            '  return true',
            '}',
        ].join('\n'))
        await writeProjectFile(directory, 'utils/two.ts', [
            'const normalizeStatus = () => false',
            'interface LocalPayload {',
            '  value: string',
            '}',
            'function createStatusSummary() {',
            '  return false',
            '}',
        ].join('\n'))
        await writeProjectFile(directory, 'server/three.ts', 'export function normalizeStatus() { return true }\n')

        try {
            const report = await collectSimpleDuplicateReport({
                projectRoot: directory,
                roots: ['app.vue', 'utils', 'server'],
            })

            expect(report.summary).toMatchObject({
                nearNameFunctionCandidates: 1,
                sameNameFunctionCandidates: 1,
                sameNameTypeCandidates: 1,
            })
            expect(report.directoryBuckets.some((bucket) => bucket.directory === '.')).toBe(true)
            expect(report.sameNameFunctions[0]).toMatchObject({
                name: 'normalizeStatus',
                reviewStatus: '待观察',
            })
            expect(report.sameNameTypes[0]).toMatchObject({
                name: 'LocalPayload',
            })
            expect(report.nearNameFunctions).toHaveLength(1)
            const firstNearNameGroup = report.nearNameFunctions[0]

            if (!firstNearNameGroup) {
                throw new Error('Expected one near-name function group')
            }

            expect(firstNearNameGroup.names).toEqual(expect.arrayContaining([
                'buildStatusSummary',
                'createStatusSummary',
                'resolveStatusSummary',
            ]))
            expect(buildNearNameSignature('buildStatusSummary')).toBe(buildNearNameSignature('createStatusSummary'))
            expect(renderMarkdownReport(report)).toContain('Governance Baseline — simple-duplicates')
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })
})
