import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runPeriodicRegression } from '@/scripts/regression/run-periodic-regression.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

describe('run-periodic-regression main flow', () => {
    it('runs weekly profile in dry-run mode and writes artifact files', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'periodic-regression-'))

        await writeProjectFile(directory, 'docs/reports/regression/current.md', [
            '# 当前回归窗口',
            '',
            '## 说明',
            '',
            '- 测试窗口。',
        ].join('\n'))

        const result = await runPeriodicRegression({
            dryRun: true,
            mode: 'warn',
            profile: 'weekly',
            projectRoot: directory,
        })

        expect(result.summary.conclusion).toBe('Prepared')
        expect(result.results.every((item) => item.skipped)).toBe(true)
        await expect(access(result.artifacts.artifactMarkdownPath)).resolves.toBeUndefined()
        await expect(access(result.artifacts.artifactJsonPath)).resolves.toBeUndefined()

        const regressionWindow = await readFile(resolve(directory, 'docs/reports/regression/current.md'), 'utf8')
        expect(regressionWindow).toContain('周级周期性回归（自动回填）')
        expect(regressionWindow).toContain('pnpm regression:weekly -- --dry-run')

        await rm(result.artifacts.artifactMarkdownPath, { force: true })
        await rm(result.artifacts.artifactJsonPath, { force: true })
        await rm(directory, { force: true, recursive: true })
    })
})
