import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(__dirname, '../..')
const SCAN_DIRS = ['components', 'composables', 'layouts', 'pages', 'plugins', 'server', 'utils']
const SUBSET_PATH = 'styles/mdi-subset.css'

async function collectSourceFiles(dir: string): Promise<string[]> {
    const entries = await readdir(path.join(repoRoot, dir), { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
        const relative = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...await collectSourceFiles(relative))
            continue
        }
        if (/\.(ts|vue)$/u.test(entry.name) && !entry.name.endsWith('.test.ts')) {
            files.push(relative)
        }
    }

    return files
}

describe('MDI 图标子集', () => {
    it('覆盖源码中静态引用的全部 mdi-* 图标类', async () => {
        const subset = await readFile(path.join(repoRoot, SUBSET_PATH), 'utf8')
        const used = new Set<string>()

        for (const dir of SCAN_DIRS) {
            for (const file of await collectSourceFiles(dir)) {
                const content = await readFile(path.join(repoRoot, file), 'utf8')
                for (const match of content.matchAll(/mdi-[a-z0-9-]+/gu)) {
                    used.add(match[0])
                }
            }
        }

        const defined = new Set([...subset.matchAll(/\.(mdi-[a-z0-9-]+)::before/gu)].map((match) => match[1]))
        expect([...used].sort()).toEqual([...defined].sort())
        expect(subset).toContain('@font-face')
        expect(subset).toContain('.mdi::before')
    })

    it('字形 codepoint 与 @mdi/font 全量 CSS 一致', async () => {
        const subset = await readFile(path.join(repoRoot, SUBSET_PATH), 'utf8')
        const full = await readFile(path.join(repoRoot, 'node_modules/@mdi/font/css/materialdesignicons.css'), 'utf8')
        const subsetRules = [...subset.matchAll(/\.(mdi-[a-z0-9-]+)::before\s*\{\s*content:\s*"(\\[0-9A-F]+)"/gu)]
        const fullRules = new Map(
            [...full.matchAll(/\.(mdi-[a-z0-9-]+)::before\s*\{\s*content:\s*"(\\[0-9A-F]+)"/gu)]
                .map((match) => [match[1], match[2]]),
        )

        expect(subsetRules).toHaveLength(10)
        for (const [, className, codepoint] of subsetRules) {
            expect(fullRules.get(className), className).toBe(codepoint)
        }
    })
})
