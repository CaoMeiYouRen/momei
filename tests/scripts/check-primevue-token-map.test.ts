import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    buildMarkdownTable,
    collectTokens,
    defaultMapPath,
    DOC_TABLE_END,
    DOC_TABLE_START,
    evaluateCoverage,
    extractDocTable,
    loadTokenMap,
    run,
    validateTokenMap,
} from '@/scripts/governance/check-primevue-token-map.mjs'
import { projectRoot } from '@/scripts/governance/count-primevue-usage.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

function createEntry(overrides: Record<string, unknown> = {}) {
    return {
        class: 'semantic',
        disposition: 'map',
        note: '测试条目',
        target: '--caomei-color-text',
        ...overrides,
    }
}

/**
 * 测试 fixture 的 `--p-*` 名字必须拼接生成。
 *
 * 守卫与 `governance:count:primevue-usage` 共用扫描面（含 `tests/**`），字面量 `--p-*` 会被
 * 当成「未登记的新增 token」判红；拼接后既保留 fixture 语义，又不污染真实扫描结果。
 * 口径见 docs/design/governance/2026-11-08-primevue-token-mapping.md。
 */
function fixtureToken(...parts: string[]): string {
    return ['--p', ...parts].join('-')
}

describe('check-primevue-token-map', () => {
    it('validates the committed mapping table structure', async () => {
        const map = await loadTokenMap(defaultMapPath)
        expect(validateTokenMap(map)).toEqual([])
    })

    it('rejects malformed mapping entries', () => {
        const errors = validateTokenMap({
            entries: {
                [fixtureToken('bad-class')]: createEntry({ class: 'unknown' }),
                [fixtureToken('bad-target')]: createEntry({ target: fixtureToken('other') }),
                [fixtureToken('bad-delete')]: createEntry({ disposition: 'delete' }),
                [fixtureToken('bad-note')]: createEntry({ note: '  ' }),
            },
        })

        expect(errors).toEqual(expect.arrayContaining([
            expect.stringContaining(fixtureToken('bad-class')),
            expect.stringContaining(fixtureToken('bad-target')),
            expect.stringContaining(fixtureToken('bad-delete')),
            expect.stringContaining(fixtureToken('bad-note')),
        ]))
    })

    it('reports unmapped tokens and stale entries separately', () => {
        const coverage = evaluateCoverage(
            new Map([
                [fixtureToken('text-color'), { count: 1, files: new Set(['a.vue']) }],
                [fixtureToken('brand-new'), { count: 1, files: new Set(['b.vue']) }],
            ]),
            {
                entries: {
                    [fixtureToken('text-color')]: createEntry(),
                    [fixtureToken('removed-token')]: createEntry(),
                },
            },
        )

        expect(coverage.unknown).toEqual([fixtureToken('brand-new')])
        expect(coverage.mapped).toEqual([fixtureToken('text-color')])
        expect(coverage.stale).toEqual([fixtureToken('removed-token')])
    })

    it('fails the guard when a new --p-* token is introduced (temp file)', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'primevue-token-map-'))

        try {
            await writeProjectFile(directory, 'map.json', JSON.stringify({
                entries: { [fixtureToken('text-color')]: createEntry() },
            }))
            await writeProjectFile(directory, 'components/legacy.vue', `<style>.a { color: var(${fixtureToken('text-color')}); }</style>`)

            const mappedOnly = await run({ map: resolve(directory, 'map.json'), root: directory })
            expect(mappedOnly.errors).toEqual([])
            expect(mappedOnly.ok).toBe(true)

            await writeProjectFile(directory, 'components/added.vue', `<style>.b { color: var(${fixtureToken('brand-new')}); }</style>`)

            const withNewToken = await run({ map: resolve(directory, 'map.json'), root: directory })
            expect(withNewToken.ok).toBe(false)
            expect(withNewToken.errors.join('\n')).toContain(fixtureToken('brand-new'))
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('supports --fail-on-residual for the post-uninstall zero-residual gate', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'primevue-token-map-'))

        try {
            await writeProjectFile(directory, 'map.json', JSON.stringify({
                entries: { [fixtureToken('text-color')]: createEntry() },
            }))
            await writeProjectFile(directory, 'components/legacy.vue', `<style>.a { color: var(${fixtureToken('text-color')}); }</style>`)

            const result = await run({ failOnResidual: true, map: resolve(directory, 'map.json'), root: directory })
            expect(result.ok).toBe(false)
            expect(result.errors.join('\n')).toContain('--fail-on-residual')
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('keeps the committed mapping table in sync with the design document', async () => {
        const map = await loadTokenMap(defaultMapPath)
        const markdown = buildMarkdownTable(map)

        const docContent = await readFile(
            resolve(projectRoot, 'docs/design/governance/2026-11-08-primevue-token-mapping.md'),
            'utf8',
        )

        expect(docContent).toContain(DOC_TABLE_START)
        expect(docContent).toContain(DOC_TABLE_END)
        expect(extractDocTable(docContent)).toBe(markdown)
    })

    it('keeps the repository at zero --p-* tokens after the reverse switch (live guard)', async () => {
        const tokens = await collectTokens(projectRoot)

        expect([...tokens.keys()]).toEqual([])

        const result = await run({ failOnResidual: true })
        expect(result.ok).toBe(true)
    })
})
