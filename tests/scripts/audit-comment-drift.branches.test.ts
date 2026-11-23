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

const BIG_FUNCTION = [
    'export function complexHandler(rows: string[]) {',
    '  const result: string[] = []',
    '  for (const row of rows) {',
    '    if (row) { result.push(row) }',
    '    if (!row) { result.push("") }',
    '    if (row.length > 3) { result.push(row.slice(0, 2)) }',
    '  }',
    '  return result',
    '}',
]

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

describe('audit-comment-drift branches', () => {
    it('appends comma separated roots to the default scan roots', () => {
        const args = parseArgs(['node', 'script.mjs', '--root=utils,server', '--output=artifacts/x.json'])

        expect(args.output).toBe('artifacts/x.json')
        expect(args.roots.slice(-2)).toEqual(['utils', 'server'])
        expect(args.roots).toContain('components')
    })

    it('skips restatement candidates for short, long, test-like, label-like and cjk comments', () => {
        expect(isRestatementComment('return status', 'return status')).toBe(true)
        expect(isRestatementComment('status', 'return status')).toBe(false)
        expect(isRestatementComment('one two three four five six seven eight nine', 'one two three four five six seven eight nine')).toBe(false)
        expect(isRestatementComment('Should render status', 'return status')).toBe(false)
        expect(isRestatementComment('About Content', 'About Content')).toBe(false)
        expect(isRestatementComment('返回状态码 值', '返回状态码 值')).toBe(false)
        expect(isRestatementComment('return status', 'return status', 'utils/example.test.ts')).toBe(false)
        expect(isRestatementComment('return status', 'const other = 1')).toBe(false)
        expect(isRestatementComment('parse token value', '')).toBe(false)
    })

    it('detects drift candidates only for hinted comments with low token overlap', () => {
        expect(isDriftCandidateComment('没有命中任何提示词', 'const enabled = true')).toBe(false)
        expect(isDriftCandidateComment('set enabled to false', '   ')).toBe(false)
        expect(isDriftCandidateComment('设置开关 关闭', 'const enabled = true')).toBe(false)
        expect(isDriftCandidateComment('设置 开关为 false 状态', 'const enabled = true')).toBe(false)
        expect(isDriftCandidateComment('set enabled to false', 'set enabled to false')).toBe(false)
        expect(isDriftCandidateComment('remove legacy cache entry', 'const cacheKey = build()')).toBe(true)
    })

    it('recognises todo-like phrasings', () => {
        expect(isTodoLikeComment(`${['FIX', 'ME'].join('')}: 兼容旧数据`)).toBe(true)
        expect(isTodoLikeComment('待完善：错误分支')).toBe(true)
        expect(isTodoLikeComment('返回缓存值')).toBe(false)
    })

    it('extracts function and arrow candidates and skips short or unbalanced declarations', () => {
        const content = [
            ...BIG_FUNCTION,
            '',
            'export const buildArrow = (value: string) => {',
            '  if (value) { return value }',
            '  if (!value) { return value }',
            '  if (value) { return value }',
            '  return value',
            '}',
            '',
            'export function shortFn() { return 1 }',
            '',
            'export function unbalanced() {',
        ].join('\n')

        const candidates = extractExportedFunctionCandidates(content, 'utils/example.ts')

        expect(candidates.map((candidate) => candidate.name)).toEqual(['complexHandler', 'buildArrow'])
        expect(candidates[0]).toMatchObject({ filePath: 'utils/example.ts', reviewStatus: '待观察' })
        expect(candidates[1]?.complexityScore).toBe(3)
    })

    it('treats a preceding comment line as an existing doc comment', () => {
        const content = [
            '// 已带注释的复杂函数',
            'const prefix = 1',
            '',
            ...BIG_FUNCTION,
        ].join('\n')

        expect(extractExportedFunctionCandidates(content, 'utils/example.ts')).toEqual([])
    })

    it('collects a report over a fixture tree and skips non-source files', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'comment-drift-'))

        await writeProjectFile(directory, 'utils/example.ts', [
            ...BIG_FUNCTION,
            '',
            'export const buildArrow = (value: string) => {',
            '  if (value) { return value }',
            '  if (!value) { return value }',
            '  if (value) { return value }',
            '  return value',
            '}',
            '',
            '// 待完善：后续补错误码映射',
            'const endpoint = "https://example.com/api"',
            '',
            '// remove legacy cache entry',
            'const cacheKey = build()',
        ].join('\n'))
        await writeProjectFile(directory, 'utils/readme.md', 'ignored')

        try {
            const report = await collectCommentDriftReport({ projectRoot: directory, roots: [join(directory, 'utils')] })

            expect(report.summary).toMatchObject({
                driftComments: 1,
                highComplexityMissingComments: 2,
                scannedFiles: 1,
                todoComments: 1,
            })
            expect(report.roots).toEqual(['utils'])
            expect(report.directoryBuckets).toEqual([
                { directory: 'utils', driftComments: 1, highComplexityMissingComments: 2, restatementComments: 0, todoComments: 1 },
            ])
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('recurses into nested directories and ignores empty comments', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'comment-drift-nested-'))

        await writeProjectFile(directory, 'utils/nested/deep.ts', [
            '//',
            '// 待完善：嵌套目录待补',
            'export const deep = true',
        ].join('\n'))
        await writeProjectFile(directory, 'utils/example.ts', [
            '// 待完善：顶层待补',
            'export const top = true',
        ].join('\n'))

        try {
            const report = await collectCommentDriftReport({ projectRoot: directory, roots: [join(directory, 'utils')] })

            expect(report.summary.scannedFiles).toBe(2)
            expect(report.summary.todoComments).toBe(2)
            expect(report.directoryBuckets.map((bucket) => bucket.directory)).toContain('utils/nested')
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('breaks bucket ties by directory name', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'comment-drift-tie-'))

        await writeProjectFile(directory, 'utils/b.ts', ['// 待完善：b 目录待补', 'export const b = true'].join('\n'))
        await writeProjectFile(directory, 'server/a.ts', ['// 待完善：a 目录待补', 'export const a = true'].join('\n'))

        try {
            const report = await collectCommentDriftReport({
                projectRoot: directory,
                roots: [join(directory, 'utils'), join(directory, 'server')],
            })

            expect(report.directoryBuckets.map((bucket) => bucket.directory)).toEqual(['server', 'utils'])
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('accepts a single file as scan root', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'comment-drift-file-'))

        await writeProjectFile(directory, 'utils/example.ts', ['// 待完善：单文件扫描', 'export const flag = true'].join('\n'))

        try {
            const report = await collectCommentDriftReport({
                projectRoot: directory,
                roots: [join(directory, 'utils/example.ts'), join(directory, 'missing')],
            })

            expect(report.summary.scannedFiles).toBe(1)
            expect(report.summary.todoComments).toBe(1)

            const markdownRoot = await collectCommentDriftReport({
                projectRoot: directory,
                roots: [join(directory, 'utils', 'readme.md')],
            })

            expect(markdownRoot.summary.scannedFiles).toBe(0)
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('renders empty sections and optional artifact path', () => {
        const report = {
            directoryBuckets: [],
            driftComments: [],
            generatedAt: '2026-11-23T00:00:00.000Z',
            highComplexityMissingComments: [],
            restatementComments: [],
            reviewStatusOptions: ['待观察'],
            roots: ['utils'],
            summary: {
                driftComments: 0,
                highComplexityMissingComments: 0,
                restatementComments: 0,
                scannedFiles: 0,
                todoComments: 0,
            },
            todoComments: [],
        }

        const withoutArtifact = renderMarkdownReport(report)
        const withArtifact = renderMarkdownReport(report, 'artifacts/governance/comment-drift-latest.md')

        expect(withoutArtifact).not.toContain('产物路径')
        expect(withArtifact).toContain('产物路径: artifacts/governance/comment-drift-latest.md')
        expect(withArtifact).toContain('## Directory Buckets')
        expect(withArtifact.match(/- 无/gu)?.length).toBeGreaterThanOrEqual(5)
    })
})
